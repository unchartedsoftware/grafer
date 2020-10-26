import nodeVS from './Circular.vs.glsl';
import nodeFS from './Circular.fs.glsl';
import {Nodes} from '../Nodes';
import {RenderMode, RenderUniforms} from '../../../renderer/Renderable';
import {PicoGL, App} from 'picogl';

export class Circular extends Nodes {
    public pixelSizing: boolean = false;
    public nodeMinSize: number = 1.0;
    public nodeMaxSize: number = 4.0;

    public constructor(context: App, positions: Float32Array, colors?: Uint8Array, sizes?: Float32Array) {
        super(context, positions, colors, sizes);
        const vertices = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));

        const triangleArray = context.createVertexArray()
            .vertexAttributeBuffer(0, vertices)
            .instanceAttributeBuffer(1, this.positions)
            .instanceAttributeBuffer(2, this.colors)
            .instanceAttributeBuffer(3, this.sizes);

        this.program = context.createProgram(nodeVS, nodeFS);
        this.drawCall = context.createDrawCall(this.program, triangleArray)
            .primitive(PicoGL.TRIANGLE_STRIP);
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        this.drawCall.uniform('uViewMatrix', uniforms.viewMatrix);
        this.drawCall.uniform('uSceneMatrix', uniforms.sceneMatrix);
        this.drawCall.uniform('uProjectionMatrix', uniforms.projectionMatrix);
        this.drawCall.uniform('uViewportSize', uniforms.viewportSize);
        this.drawCall.uniform('uPixelRatio', uniforms.pixelRatio);

        this.drawCall.uniform('uMinSize', this.nodeMinSize);
        this.drawCall.uniform('uMaxSize', this.nodeMaxSize);
        this.drawCall.uniform('uPixelSizing', this.pixelSizing);

        // blending is not being used for now
        context.disable(PicoGL.BLEND);
        // context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);

        context.depthRange(this._nearDepth, this._farDepth);
        context.depthMask(true);

        this.drawCall.draw();
    }
}
