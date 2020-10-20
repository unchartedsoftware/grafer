import nodeVS from './Circular.vs.glsl';
import nodeFS from './Circular.fs.glsl';
import {Renderable, RenderMode, RenderUniforms} from '../../../renderer/Renderable';
import {PicoGL, App, Program, DrawCall, VertexBuffer} from 'picogl';

export class Circular implements Renderable {
    private program: Program;
    private positions: VertexBuffer;
    private colors: VertexBuffer;
    private sizes: VertexBuffer;
    private drawCall: DrawCall;

    public pixelSizing: boolean = false;
    public nodeSize: number = 1.0;

    public constructor(context: App, positions: Float32Array, colors?: Uint8Array, sizes?: Float32Array) {
        const vertices = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));

        this.positions = context.createVertexBuffer(PicoGL.FLOAT, 3, positions);

        if (colors) {
            this.colors = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, colors);
        } else {
            const colorsArray = new Uint8Array((positions.length / 3) * 4);
            colorsArray.fill(128);
            this.colors = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, colorsArray);
        }

        if (sizes) {
            this.sizes = context.createVertexBuffer(PicoGL.FLOAT, 1, sizes);
        } else {
            const sizesArray = new Float32Array(positions.length / 3);
            sizesArray.fill(1.0);
            this.sizes = context.createVertexBuffer(PicoGL.FLOAT, 1, sizesArray);
        }

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
        this.drawCall.uniform('uSize', this.nodeSize);
        this.drawCall.uniform('uPixelSizing', this.pixelSizing);

        // blending is not being used for now
        context.disable(PicoGL.BLEND);
        // context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);

        context.depthRange(0, 1.0);
        // context.depthMask(true);

        this.drawCall.draw();
    }
}
