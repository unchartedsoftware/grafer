import edgeVS from './Gravity.vs.glsl';
import edgeFS from './Gravity.fs.glsl';
import dataVS from './Gravity.data.vs.glsl';

import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {BasicEdgeData, Edges, kBasicEdgeDataTypes} from '../Edges';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings, DataShader} from '../../../data/DataTools';
import {PickingManager} from '../../../UX/picking/PickingManager';
import {GLStraightEdgeTypes, kGLStraightEdgeTypes} from '../straight/Straight';
import {
    GLDataTypes,
    RenderableShaders,
    RenderMode,
    RenderUniforms,
    setDrawCallUniforms,
} from '../../../renderer/Renderable';

export const kGLGravityEdgeTypes = {
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
} as const;
export type GLGravityEdgeTypes = typeof kGLGravityEdgeTypes;

export class Gravity extends Edges<BasicEdgeData, GLGravityEdgeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected verticesVBO: VertexBuffer;
    protected edgesVAO: VertexArray;

    public get gravity(): number {
        return this.localUniforms.uGravity as number;
    }
    public set gravity(value: number) {
        this.localUniforms.uGravity = value;
    }

    constructor(context: App,
                points: GraphPoints,
                data: unknown[],
                mappings: Partial<DataMappings<BasicEdgeData>>,
                pickingManager: PickingManager,
                segments: number = 16
    ) {
        super(context, points, data, mappings, pickingManager);

        this.localUniforms.uGravity = -0.2;

        const segmentVertices = [];
        for (let i = 0; i <= segments; ++i) {
            segmentVertices.push(i / segments, 0);
        }

        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(segmentVertices));
        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.LINE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        // printDataGL(context, this.targetVBO, data.length, kGLStraightEdgeTypes);
    }

    public destroy(): void {
        // TODO: Implement destroy method
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);

        context.enable(PicoGL.BLEND);
        context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);

        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(false);

        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
                break;

            case RenderMode.HIGH_PASS_2:
                break;

            default:
                this.drawCall.draw();
                break;
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
            fs: null, // pickingFS,
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
            varyings: [ 'vSource', 'vTarget', 'vSourceColor', 'vTargetColor' ],
        };
    }
}
