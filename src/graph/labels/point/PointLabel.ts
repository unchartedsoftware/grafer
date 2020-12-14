import nodeFS from './PointLabel.fs.glsl';
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
import {PickingManager} from '../../../UX/picking/PickingManager';
import {GLCircleNodeTypes} from '../../nodes/circle/Circle';
import {GraferContext} from '../../../renderer/GraferContext';
import {kLabelMappings, LabelAtlas, LabelData} from '../LabelAtlas';
import {GraferInputColor} from '../../../renderer/ColorRegistry';

export interface LabelNodeData extends Omit<LabelData, 'label'> {
    point: number | string;
    color?: GraferInputColor;
    label: string | ImageData | number;
}

export const kLabelNodeMappings: DataMappings<LabelNodeData> = Object.assign({}, kLabelMappings, {
    point: (entry: LabelNodeData, i) => 'point' in entry ? entry.point : i,
    color: (entry: any) => 'color' in entry ? entry.color : 0, // first registered color
}) as DataMappings<LabelNodeData>;

export const kLabelNodeDataTypes: GLDataTypes<LabelNodeData> = {
    point: PicoGL.UNSIGNED_INT,
    color: PicoGL.UNSIGNED_INT,
    label: PicoGL.UNSIGNED_INT,
};

export const kGLLabelNodeTypes = {
    // TODO: maybe use points indices?
    position: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    // TODO: maybe skip and use vertex indices when point radius is used.
    radius: PicoGL.FLOAT,
    // TODO: Create a color texture and use indices here.
    color: PicoGL.UNSIGNED_INT,

    box: PicoGL.UNSIGNED_INT,
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

    public get visibilityThreshold(): number {
        return this.localUniforms.uVisibilityThreshold as number;
    }
    public set visibilityThreshold(value: number) {
        this.localUniforms.uVisibilityThreshold = value;
    }

    constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<LabelNodeData>>,
        pickingManager: PickingManager,
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
        labelAtlas?: LabelAtlas
    ): void {
        if (labelAtlas) {
            this.labelAtlas = labelAtlas;
        } else {
            this.labelAtlas = new LabelAtlas(context, data, mappings as Partial<DataMappings<LabelData>>);
        }

        super.initialize(context, points, data, mappings, pickingManager);

        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));

        this.nodesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.nodesVAO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        this.localUniforms.uLabelBoxes = this.labelAtlas.dataTexture;
        this.localUniforms.uLabelTexture = this.labelAtlas.labelsTexture;
        this.localUniforms.uVisibilityThreshold = 15;
        this.localUniforms.uLabelPlacement = [0, 0];
    }

    public destroy(): void {
        //
    }

    public render(context: App, mode: RenderMode, uniforms: RenderUniforms): void {
        context.depthRange(this.nearDepth, this.farDepth);

        switch (mode) {
            case RenderMode.DRAFT:
            case RenderMode.MEDIUM:
            case RenderMode.HIGH_PASS_1:
                context.disable(PicoGL.BLEND);
                context.depthMask(true);

                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.draw();
                break;

            case RenderMode.HIGH_PASS_2:
                context.enable(PicoGL.BLEND);
                // context.blendFuncSeparate(PicoGL.ONE, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE_MINUS_SRC_ALPHA);
                context.depthMask(false);
                // context.depthFunc(PicoGL.LEQUAL);

                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
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

    protected getGLSourceTypes(): GLDataTypes<LabelNodeData> {
        return kLabelNodeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLCircleNodeTypes> {
        return kGLLabelNodeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'vPosition', 'vRadius', 'vColor', 'vBox' ],
        };
    }

    protected computeMappings(mappings: Partial<DataMappings<LabelNodeData>>): DataMappings<LabelNodeData> {
        const dataMappings = Object.assign({}, kLabelNodeMappings, mappings);
        const idMapping = dataMappings.id;
        dataMappings.label = (entry: any, i): number => this.labelAtlas.labelMap.get(idMapping(entry, i));

        return dataMappings;
    }
}
