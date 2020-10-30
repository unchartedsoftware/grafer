import {Renderable} from '../../renderer/Renderable';
import {App, PicoGL, VertexBuffer} from 'picogl';

export abstract class Nodes extends Renderable {
    protected positions: VertexBuffer;
    protected colors: VertexBuffer;
    protected sizes: VertexBuffer;

    protected constructor(context: App, positions: Float32Array, colors?: Uint8Array, sizes?: Float32Array, pickingColors?: Uint8Array) {
        super();
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
            sizesArray.fill(0.0);
            this.sizes = context.createVertexBuffer(PicoGL.FLOAT, 1, sizesArray);
        }

        if (pickingColors) {
            this.pickingColors = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, pickingColors);
        }
    }
}
