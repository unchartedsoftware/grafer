import {Renderable} from '../../renderer/Renderable';
import {App, VertexBuffer} from 'picogl';

export abstract class Edges extends Renderable {
    public alpha: number = 0.3;

    protected positions: VertexBuffer;
    protected colors: VertexBuffer;

    protected constructor(context: App, positions: Float32Array, colors?: Uint8Array) {
        super();

        this.positions = context.createInterleavedBuffer(24, positions);

        if (colors) {
            this.colors = context.createInterleavedBuffer(8, colors);
        } else {
            const colorsArray = new Uint8Array((positions.length / 6) * 8);
            colorsArray.fill(128);
            this.colors = context.createInterleavedBuffer(8, colorsArray);
        }
    }
}
