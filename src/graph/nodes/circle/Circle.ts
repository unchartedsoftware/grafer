import nodeVS from './Circle.vs.glsl';
import nodeFS from './Circle.fs.glsl';
import dataVS from './Circle.data.vs.glsl';
import pickingFS from './Circle.picking.fs.glsl';

import {BasicNodeData, kBasicNodeDataTypes, kBasicNodeMappings, Nodes} from '../Nodes';
import {
    GLDataTypes,
    RenderableShaders,
    RenderMode,
    RenderUniforms,
    setDrawCallUniforms
} from '../../../renderer/Renderable';
import {App, DrawCall, PicoGL, Program, VertexArray, VertexBuffer} from 'picogl';
import {GraphPoints} from '../../../data/GraphPoints';
import {DataMappings, DataShader, printDataGL} from '../../../data/DataTools';
import {PickingManager} from '../../../UX/picking/PickingManager';

export const kGLCircleNodeTypes = {
    // TODO: maybe use points indices?
    position: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    // TODO: maybe skip and use vertex indices when point radius is used.
    radius: PicoGL.FLOAT,
    // TODO: Create a color texture and use indices here.
    color: [PicoGL.UNSIGNED_BYTE, PicoGL.UNSIGNED_BYTE, PicoGL.UNSIGNED_BYTE, PicoGL.UNSIGNED_BYTE],
} as const;
export type GLCircleNodeTypes = typeof kGLCircleNodeTypes;

export class Circle extends Nodes<BasicNodeData, GLCircleNodeTypes> {
    protected program: Program;
    protected drawCall: DrawCall;

    protected verticesVBO: VertexBuffer;
    protected nodesVAO: VertexArray;

    protected usePointRadius: boolean;

    constructor(
        context: App,
        points: GraphPoints,
        data: unknown[],
        mappings: Partial<DataMappings<BasicNodeData>>,
        pickingManager: PickingManager
    ) {
        super(context, points, data, mappings, pickingManager);

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

        const computedMappings = this.computeMappings(mappings);
        this.usePointRadius = computedMappings.radius === null;

        this.compute(context, {
            uGraphPoints: this.dataTexture,
            uUsePointRadius: this.usePointRadius,
        });

        // printDataGL(context, this.targetVBO, data.length, kGLCircleNodeTypes);
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        context.disable(PicoGL.BLEND);

        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(true);

        switch (mode) {
            case RenderMode.PICKING:
                // TODO: Re-enable picking
                // if (this.pickingDrawCall) {
                //     this.setDrawCallUniforms(this.pickingDrawCall, uniforms);
                //     this.setDrawCallUniforms(this.pickingDrawCall, this.localUniforms);
                //     this.pickingDrawCall.draw();
                // }
                break;

            case RenderMode.DRAFT:
            case RenderMode.MEDIUM:
            case RenderMode.HIGH:
                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.draw();
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

    protected computeMappings(mappings: Partial<DataMappings<BasicNodeData>>): DataMappings<BasicNodeData> {
        return Object.assign({}, kBasicNodeMappings, mappings);
    }

    protected getGLSourceTypes(): GLDataTypes<BasicNodeData> {
        return kBasicNodeDataTypes;
    }

    protected getGLTargetTypes(): GLDataTypes<GLCircleNodeTypes> {
        return kGLCircleNodeTypes;
    }

    protected getDataShader(): DataShader {
        return {
            vs: dataVS,
            varyings: [ 'vPosition', 'vRadius', 'vColor' ],
        }
    }
}
