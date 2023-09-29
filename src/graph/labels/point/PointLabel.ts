import nodeFS from './PointLabel.fs.glsl';
import pickingFS from './PointLabel.picking.fs.glsl';
import nodeVS from './PointLabel.vs.glsl';
import dataVS from './PointLabel.data.vs.glsl';

import {
    GLDataTypes,
    RenderableShaders,
    RenderMode,
    RenderUniforms,
    setDrawCallUniforms,
} from '../../../renderer/Renderable';
import {Nodes} from '../../nodes/Nodes';
import {DataMappings, DataShader} from '../../../data/DataTools';
import PicoGL, {App, DrawCall, Program, VertexArray, VertexBuffer} from 'picogl';
import {GraphPoints} from '../../../data/GraphPoints';
import {PickingColors, PickingEvent, PickingManager} from '../../../UX/picking/PickingManager';
import {MouseCallback} from '../../../UX/mouse/MouseHandler';
import {GLCircleNodeTypes} from '../../nodes/circle/Circle';
import {GraferContext} from '../../../renderer/GraferContext';
import {kLabelMappings, LabelAtlas, LabelData} from '../LabelAtlas';
import {GraferInputColor} from '../../../renderer/colors/ColorRegistry';
import {PixelRatioObserver} from '../../../renderer/PixelRatioObserver';

export interface LabelNodeData extends Omit<LabelData, 'label'> {
    point: number | string;
    color?: GraferInputColor;
    label: string | ImageData | [number, number, number, number];
}

export const kLabelNodeMappings: DataMappings<LabelNodeData> = Object.assign({}, kLabelMappings, {
    point: (entry: LabelNodeData, i) => 'point' in entry ? entry.point : i,
    color: (entry: any) => 'color' in entry ? entry.color : 0, // first registered color
}) as DataMappings<LabelNodeData>;

export const kLabelNodeDataTypes: GLDataTypes<LabelNodeData> = {
    point: PicoGL.UNSIGNED_INT,
    color: PicoGL.UNSIGNED_INT,
    label: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
};

export const kGLLabelNodeTypes = {
    point: PicoGL.UNSIGNED_INT,
    color: PicoGL.UNSIGNED_INT,
    label: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
} as const;
export type GLLabelNodeTypes = typeof kGLLabelNodeTypes;

export enum PointLabelPlacement {
    CENTER,
    TOP,
    BOTTOM,
    LEFT,
    RIGHT,
}

export class PointLabel extends Nodes<LabelNodeData, GLLabelNodeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected pickingProgram: Program;
    protected pickingDrawCall: DrawCall;
    protected pickingColors: PickingColors;
    protected pickingVBO: VertexBuffer;
    protected pickingHandler: MouseCallback;

    protected verticesVBO: VertexBuffer;
    protected nodesVAO: VertexArray;

    protected labelAtlas: LabelAtlas;

    protected _labelPlacement: unknown = PointLabelPlacement.CENTER;

    public get labelPlacement(): PointLabelPlacement | unknown {
        return this._labelPlacement;
    }
    public set labelPlacement(value: PointLabelPlacement | unknown) {
        this._labelPlacement = value;
        switch (this._labelPlacement) {
            case PointLabelPlacement.CENTER:
                this.localUniforms.uLabelPlacement = [0 ,0];
                break;

            case PointLabelPlacement.BOTTOM:
                this.localUniforms.uLabelPlacement = [0, -1];
                break;

            case PointLabelPlacement.TOP:
                this.localUniforms.uLabelPlacement = [0, 1];
                break;

            case PointLabelPlacement.LEFT:
                this.localUniforms.uLabelPlacement = [-1, 0];
                break;

            case PointLabelPlacement.RIGHT:
                this.localUniforms.uLabelPlacement = [1, 0];
                break;
        }
    }

    public get renderBackground(): boolean {
        return this.localUniforms.uBackground as boolean;
    }
    public set renderBackground(value: boolean) {
        this.localUniforms.uBackground = value;
    }

    public get visibilityThreshold(): number {
        return this.localUniforms.uVisibilityThreshold as number;
    }
    public set visibilityThreshold(value: number) {
        this.localUniforms.uVisibilityThreshold = value;
    }

    public get padding(): number {
        return this.localUniforms.uPadding as number;
    }
    public set padding(value: number) {
        this.localUniforms.uPadding = value;
    }

    public get halo(): number {
        return this.localUniforms.uHalo as number;
    }
    public set halo(value: number) {
        this.localUniforms.uHalo = Math.min(1, Math.max(0, value));
    }

    constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<LabelNodeData>>,
        pickingManager: PickingManager,
        font?: string,
        bold?: boolean,
        charSpacing?: number,
        labelAtlas?: LabelAtlas
    );
    constructor(...args: any[]) {
        super(...args);
    }

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<LabelNodeData>>,
        pickingManager: PickingManager,
        font: string = 'monospace',
        bold: boolean = false,
        charSpacing: number = 0,
        labelAtlas?: LabelAtlas
    ): void {
        if (labelAtlas) {
            this.labelAtlas = labelAtlas;
        } else {
            this.labelAtlas = new LabelAtlas(context, data, mappings as Partial<DataMappings<LabelData>>, font, bold, charSpacing);
            new PixelRatioObserver(() => {
                this.labelAtlas = new LabelAtlas(context, data, mappings as Partial<DataMappings<LabelData>>, font, bold, charSpacing);
                super.initialize(context, points, data, mappings, pickingManager);

                this.nodesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
                this.configureTargetVAO(this.nodesVAO);

                this.drawCall = context.createDrawCall(this.program, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);

                this.compute(context, {
                    uGraphPoints: this.dataTexture,
                });

                this.localUniforms.uLabelIndices = this.labelAtlas.indicesTexture;
                this.localUniforms.uCharBoxes = this.labelAtlas.boxesTexture;
                this.localUniforms.uCharTexture = this.labelAtlas.atlasTexture;
                this.localUniforms.uLabelOffsets = this.labelAtlas.offsetsTexture;
            });
        }

        super.initialize(context, points, data, mappings, pickingManager);

        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));

        this.pickingHandler = this.handlePickingEvent.bind(this);
        this.pickingColors = this.pickingManager.allocatePickingColors(data.length);
        this.pickingVBO = context.createVertexBuffer(PicoGL.FLOAT, 4, new Float32Array(this.pickingColors.colors));

        this.nodesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.nodesVAO);
        this.nodesVAO.instanceAttributeBuffer(4, this.pickingVBO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        const pickingShaders = this.getPickingShaders();
        this.pickingProgram = context.createProgram(pickingShaders.vs, pickingShaders.fs);
        this.pickingDrawCall = context.createDrawCall(this.pickingProgram, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        this.pickingManager.on(PickingManager.events.hoverOn, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.hoverOff, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.click, this.pickingHandler);

        this.localUniforms.uBackground = false;
        this.localUniforms.uLabelIndices = this.labelAtlas.indicesTexture;
        this.localUniforms.uCharBoxes = this.labelAtlas.boxesTexture;
        this.localUniforms.uCharTexture = this.labelAtlas.atlasTexture;
        this.localUniforms.uLabelOffsets = this.labelAtlas.offsetsTexture;
        this.localUniforms.uVisibilityThreshold = 15;
        this.localUniforms.uLabelPlacement = [0, 0];
        this.localUniforms.uPadding = 4.0;
    }

    public destroy(): void {
        //
    }

    public render(context: App, mode: RenderMode, uniforms: RenderUniforms): void {
        super.render(context, mode, uniforms);

        switch (mode) {
            case RenderMode.PICKING:
                if (this.picking) {
                    setDrawCallUniforms(this.pickingDrawCall, uniforms);
                    setDrawCallUniforms(this.pickingDrawCall, this.localUniforms);
                    this.pickingDrawCall.uniform('uPicking', true);
                    this.pickingDrawCall.draw();
                }
                break;
            case RenderMode.DRAFT:
            case RenderMode.MEDIUM:
            case RenderMode.HIGH_PASS_1:
                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.uniform('uPicking', false);
                this.drawCall.draw();
                break;

            case RenderMode.HIGH_PASS_2:
                // context.depthFunc(PicoGL.LEQUAL);

                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.uniform('uPicking', false);
                this.drawCall.draw();

                // context.depthFunc(PicoGL.LESS);
                break;

            default:
                break;
        }
    }

    protected getDrawShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: nodeFS,
        };
    }

    protected getPickingShaders(): RenderableShaders {
        return {
            vs: nodeVS,
            fs: pickingFS,
        };
    }

    protected getGLSourceTypes(): GLDataTypes<LabelNodeData> {
        return kLabelNodeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLCircleNodeTypes> {
        return kGLLabelNodeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'fPoint', 'fColor', 'fLabel' ],
        };
    }

    protected computeMappings(mappings: Partial<DataMappings<LabelNodeData>>): DataMappings<LabelNodeData> {
        const dataMappings = Object.assign({}, kLabelNodeMappings, super.computeMappings(mappings));
        const idMapping = dataMappings.id;
        dataMappings.label = (entry: any, i): [number, number, number, number] => {
            const labelInfo = this.labelAtlas.labelMap.get(idMapping(entry, i));
            return [
                labelInfo.index,
                labelInfo.length,
                labelInfo.width,
                labelInfo.height,
            ];
        };

        return dataMappings;
    }

    protected handlePickingEvent(event: PickingEvent, colorID: number): void {
        if (this.picking && this.pickingColors.map.has(colorID)) {
            const id = this.idArray[this.pickingColors.map.get(colorID)];
            this.emit(event, id);
        }
    }
}
