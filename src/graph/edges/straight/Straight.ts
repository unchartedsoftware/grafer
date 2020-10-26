import edgeVS from './Straight.vs.glsl';
import edgeFS from './Straight.fs.glsl';
import {RenderMode, RenderUniforms} from '../../../renderer/Renderable';
import {App, PicoGL} from 'picogl';
import {Edges} from '../Edges';

export class Straight extends Edges {
    public constructor(context: App, positions: Float32Array, colors?: Uint8Array) {
        super(context, positions, colors);

        const vertices = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            0, 0,
            1, 0,
        ]));

        this.positions = context.createInterleavedBuffer(24, positions);

        const vertexArray = context.createVertexArray()
            .vertexAttributeBuffer(0, vertices)
            .instanceAttributeBuffer(1, this.positions, {
                type: PicoGL.FLOAT,
                size: 3,
                stride: 24,
                offset: 0,
            })
            .instanceAttributeBuffer(2, this.positions, {
                type: PicoGL.FLOAT,
                size: 3,
                stride: 24,
                offset: 12,
            })
            .instanceAttributeBuffer(3, this.colors, {
                type: PicoGL.UNSIGNED_BYTE,
                size: 4,
                stride: 8,
                offset: 0,
                integer: 1,
            })
            .instanceAttributeBuffer(4, this.colors, {
                type: PicoGL.UNSIGNED_BYTE,
                size: 4,
                stride: 8,
                offset: 4,
                integer: 1,
            });

        this.program = context.createProgram(edgeVS, edgeFS);
        this.drawCall = context.createDrawCall(this.program, vertexArray)
            .primitive(PicoGL.LINES);
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        this.drawCall.uniform('uViewMatrix', uniforms.viewMatrix);
        this.drawCall.uniform('uSceneMatrix', uniforms.sceneMatrix);
        this.drawCall.uniform('uProjectionMatrix', uniforms.projectionMatrix);
        this.drawCall.uniform('uViewportSize', uniforms.viewportSize);
        this.drawCall.uniform('uPixelRatio', uniforms.pixelRatio);

        this.drawCall.uniform('uAlpha', this.alpha);

        context.enable(PicoGL.BLEND);
        context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);

        context.depthRange(this._nearDepth, this._farDepth);
        context.depthMask(false);

        this.drawCall.draw();
    }
}
