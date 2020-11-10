import nodeVS from './Circle.vs.glsl';
import nodeFS from './Circle.fs.glsl';
import pickingFS from './Circle.picking.fs.glsl';
import {Nodes} from '../Nodes';
import {RenderMode, RenderUniforms} from '../../../renderer/Renderable';
import {App, PicoGL} from 'picogl';

export class Circle extends Nodes {
    public constructor(context: App, positions: Float32Array, colors?: Uint8Array, sizes?: Float32Array, pickingColors?: Uint8Array) {
        super(context, positions, colors, sizes, pickingColors);
        const vertices = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));

        const vertexArray = context.createVertexArray()
            .vertexAttributeBuffer(0, vertices)
            .instanceAttributeBuffer(1, this.positions)
            .instanceAttributeBuffer(2, this.colors)
            .instanceAttributeBuffer(3, this.sizes);

        this.program = context.createProgram(nodeVS, nodeFS);
        this.drawCall = context.createDrawCall(this.program, vertexArray)
            .primitive(PicoGL.TRIANGLE_STRIP);

        if (this.pickingColors) {
            const pickingArray = context.createVertexArray()
                .vertexAttributeBuffer(0, vertices)
                .instanceAttributeBuffer(1, this.positions)
                .instanceAttributeBuffer(2, this.pickingColors)
                .instanceAttributeBuffer(3, this.sizes);

            this.pickingProgram = context.createProgram(nodeVS, pickingFS);
            this.pickingDrawCall = context.createDrawCall(this.pickingProgram, pickingArray)
                .primitive(PicoGL.TRIANGLE_STRIP);
        }
    }

    public render(context:App, mode: RenderMode, uniforms: RenderUniforms): void {
        context.disable(PicoGL.BLEND);

        context.depthRange(this._nearDepth, this._farDepth);
        context.depthMask(true);

        switch (mode) {
            case RenderMode.PICKING:
                if (this.pickingDrawCall) {
                    this.setDrawCallUniforms(this.pickingDrawCall, uniforms);
                    this.setDrawCallUniforms(this.pickingDrawCall, this.localUniforms);
                    this.pickingDrawCall.draw();
                }
                break;

            case RenderMode.DRAFT:
            case RenderMode.MEDIUM:
            case RenderMode.HIGH:
                this.setDrawCallUniforms(this.drawCall, uniforms);
                this.setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.draw();
                break;
        }
    }
}
