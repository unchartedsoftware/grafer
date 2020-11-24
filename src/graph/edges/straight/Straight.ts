import edgeVS from './Straight.vs.glsl';
import edgeFS from './Straight.fs.glsl';
import dataVS from './Straight.data.vs.glsl';
import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {BasicEdgeData, Edges, kBasicEdgeDataTypes, kBasicEdgeMappings} from '../Edges';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings, DataShader, printDataGL} from '../../../data/DataTools';
import {PickingManager} from '../../../UX/picking/PickingManager';
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

    constructor(context: App,
                          points: GraphPoints,
                          data: unknown[],
                          mappings: Partial<DataMappings<BasicEdgeData>>,
                          pickingManager: PickingManager
    ) {
        super(context, points, data, mappings, pickingManager);
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            0, 0,
            1, 0,
        ]));

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

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
                break;

            case RenderMode.DRAFT:
            case RenderMode.MEDIUM:
            case RenderMode.HIGH:
                context.enable(PicoGL.BLEND);
                context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);

                context.depthRange(this.nearDepth, this.farDepth);
                context.depthMask(false);

                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, {
                    uAlpha: this.alpha,
                });

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

    protected computeMappings(mappings: Partial<DataMappings<BasicEdgeData>>): DataMappings<BasicEdgeData> {
        return Object.assign({}, kBasicEdgeMappings, mappings);
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
