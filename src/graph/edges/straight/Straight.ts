import edgeVS from './Straight.vs.glsl';
import edgeFS from './Straight.fs.glsl';
import dataVS from './Straight.data.vs.glsl';
import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {BasicEdgeData, Edges, kBasicEdgeDataTypes} from '../Edges';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings, DataShader} from '../../../data/DataTools';
import {PickingManager} from '../../../UX/picking/PickingManager';
import {GraferContext} from '../../../renderer/GraferContext';
import {
    GLDataTypes,
    RenderableShaders,
    RenderMode,
    RenderUniforms,
    setDrawCallUniforms,
} from '../../../renderer/Renderable';

export const kGLStraightEdgeTypes = {
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
} as const;
export type GLStraightEdgeTypes = typeof kGLStraightEdgeTypes;

export class Straight extends Edges<BasicEdgeData, GLStraightEdgeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected verticesVBO: VertexBuffer;
    protected edgesVAO: VertexArray;

    protected initialize(
        context: GraferContext,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicEdgeData>>,
        pickingManager: PickingManager
    ): void {
        super.initialize(context, points, data, mappings, pickingManager);

        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, 0,
            1, 0,
            -1, 1,
            1, 1,
        ]));

        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);

        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);

        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });

        // printDataGL(context, this.targetVBO, data.length, kGLStraightEdgeTypes);
    }

    public destroy(): void {
        // TODO: Implement destroy method
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        this.configureRenderContext(context, mode);

        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);

        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
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
