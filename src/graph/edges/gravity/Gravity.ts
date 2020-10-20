import edgeVS from './Gravity.vs.glsl';
import edgeFS from './Gravity.fs.glsl';
import {Renderable, RenderMode, RenderUniforms} from '../../../renderer/Renderable';
import {App, DrawCall, PicoGL, Program, VertexBuffer} from 'picogl';

export class Gravity implements Renderable {
    private program: Program;
    private positions: VertexBuffer;
    private colors: VertexBuffer;
    private drawCall: DrawCall;

    public constructor(context: App, positions: Float32Array, colors?: Uint8Array, segments: number = 16) {
        const segmentVertices = [];
        for (let i = 0; i <= segments; ++i) {
            segmentVertices.push(i / segments, 0);
        }

        const vertices = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(segmentVertices));

        this.positions = context.createInterleavedBuffer(24, positions);

        if (colors) {
            this.colors = context.createInterleavedBuffer(8, colors);
        } else {
            const colorsArray = new Uint8Array((positions.length / 6) * 8);
            colorsArray.fill(128);
            this.colors = context.createInterleavedBuffer(8, colorsArray);
        }

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
            .primitive(PicoGL.LINE_STRIP);
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        this.drawCall.uniform('uViewMatrix', uniforms.viewMatrix);
        this.drawCall.uniform('uSceneMatrix', uniforms.sceneMatrix);
        this.drawCall.uniform('uProjectionMatrix', uniforms.projectionMatrix);
        this.drawCall.uniform('uViewportSize', uniforms.viewportSize);
        this.drawCall.uniform('uPixelRatio', uniforms.pixelRatio);

        context.enable(PicoGL.BLEND);
        context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);

        context.depthRange(0.0, 1.0);

        this.drawCall.draw();
    }
}
