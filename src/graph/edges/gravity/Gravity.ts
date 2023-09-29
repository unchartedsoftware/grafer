import edgeVS from './Gravity.vs.glsl';
import edgeFS from './Gravity.fs.glsl';
import pickingFS from './Gravity.picking.fs.glsl';
import dataVS from './Gravity.data.vs.glsl';

import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {BasicEdgeData, Edges, kBasicEdgeDataTypes} from '../Edges';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings, DataShader} from '../../../data/DataTools';
import {PickingColors, PickingEvent, PickingManager} from '../../../UX/picking/PickingManager';
import {GLStraightEdgeTypes, kGLStraightEdgeTypes} from '../straight/Straight';
import {
    GLDataTypes,
    RenderableShaders,
    RenderMode,
    RenderUniforms,
    setDrawCallUniforms,
} from '../../../renderer/Renderable';
import {MouseCallback} from '../../../UX/mouse/MouseHandler';
import {GraferContext} from '../../../renderer/GraferContext';

export const kGLGravityEdgeTypes = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    width: PicoGL.FLOAT,
} as const;
export type GLGravityEdgeTypes = typeof kGLGravityEdgeTypes;

export class Gravity extends Edges<BasicEdgeData, GLGravityEdgeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected pickingProgram: Program;
    protected pickingDrawCall: DrawCall;
    protected pickingColors: PickingColors;
    protected pickingVBO: VertexBuffer;
    protected pickingHandler: MouseCallback;

    protected verticesVBO: VertexBuffer;
    protected edgesVAO: VertexArray;

    public get gravity(): number {
        return this.localUniforms.uGravity as number;
    }
    public set gravity(value: number) {
        this.localUniforms.uGravity = value;
    }

    constructor(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicEdgeData>>,
        pickingManager: PickingManager,
        segments: number = 16
    ) {
        super(context, points, data, mappings, pickingManager, segments);
    }

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicEdgeData>>,
        pickingManager: PickingManager,
        segments: number
    ): void {
        super.initialize(context, points, data, mappings, pickingManager);

        this.localUniforms.uGravity = -0.2;

        const segmentVertices = [];
        for (let i = 0; i <= segments; ++i) {
            segmentVertices.push(i / segments, 0);
        }

        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(segmentVertices));

        this.pickingHandler = this.handlePickingEvent.bind(this);
        this.pickingColors = this.pickingManager.allocatePickingColors(data.length);
        this.pickingVBO = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, this.pickingColors.colors);

        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);
        this.edgesVAO.instanceAttributeBuffer(6, this.pickingVBO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.LINE_STRIP);

        const pickingShaders = this.getPickingShaders();
        this.pickingProgram = context.createProgram(pickingShaders.vs, pickingShaders.fs);
        this.pickingDrawCall = context.createDrawCall(this.pickingProgram, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        this.compute(context, {});

        this.pickingManager.on(PickingManager.events.hoverOn, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.hoverOff, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.click, this.pickingHandler);

        // printDataGL(context, this.targetVBO, data.length, kGLStraightEdgeTypes);
    }

    public destroy(): void {
        // TODO: Implement destroy method
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        super.render(context, mode, uniforms);

        switch (mode) {
            case RenderMode.PICKING:
                setDrawCallUniforms(this.pickingDrawCall, uniforms);
                setDrawCallUniforms(this.pickingDrawCall, this.localUniforms);
                this.pickingDrawCall.uniform('uPicking', true);
                this.pickingDrawCall.draw();
                break;

            default:
                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.uniform('uPicking', false);
                this.drawCall.draw();
        }
    }

    protected getDrawShaders(): RenderableShaders {
        return {
            vs: edgeVS,
            fs: edgeFS,
        };
    }

    protected getPickingShaders(): RenderableShaders {
        return {
            vs: edgeVS,
            fs: pickingFS,
        };
    }

    protected getGLSourceTypes(): GLDataTypes<BasicEdgeData> {
        return kBasicEdgeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLStraightEdgeTypes> {
        return kGLStraightEdgeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'fSource', 'fTarget', 'fSourceColor', 'fTargetColor', 'fWidth' ],
        };
    }

    protected handlePickingEvent(event: PickingEvent, colorID: number): void {
        if (this.picking && this.pickingColors.map.has(colorID)) {
            const id = this.idArray[this.pickingColors.map.get(colorID)];
            this.emit(event, id);
        }
    }
}
