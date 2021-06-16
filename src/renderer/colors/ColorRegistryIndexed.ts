import {ColorRegistry, GraferInputColor} from './ColorRegistry';
import chroma from 'chroma-js';
import {App} from 'picogl';

const kCapacityIncreaseStep = 1024;

export class ColorRegistryIndexed extends ColorRegistry {
    private colorBuffer: ArrayBuffer;
    private colors: Uint8Array;
    private _length:  number;

    public get length(): number {
        return this._length;
    }

    constructor(context: App, initialCapacity: number = kCapacityIncreaseStep) {
        super(context, initialCapacity);
        this.colorBuffer = new ArrayBuffer(this.capacity * 4);
        this.colors = new Uint8Array(this.colorBuffer);
        this._length = 0;
    }

    public update(): void {
        if (this.dirty) {
            this._texture.data(this.colors);
        }
        this.dirty = false;
    }

    public registerColor(color: GraferInputColor): number {
        this.resizeBuffer(this._length * 4 + 4);
        const rgba = chroma(color as any).rgba(); // dumb chroma typings
        let i = this._length * 4;
        this.colors[i++] = rgba[0];
        this.colors[i++] = rgba[1];
        this.colors[i++] = rgba[2];
        this.colors[i++] = Math.round(rgba[3] * 255);
        this.dirty = true;

        return this._length++;
    }

    public updateColor(index: number, color: GraferInputColor): void {
        const rgba = chroma(color as any).rgba(); // dumb chroma typings
        let i = index * 4;
        this.colors[i++] = rgba[0];
        this.colors[i++] = rgba[1];
        this.colors[i++] = rgba[2];
        this.colors[i++] = Math.round(rgba[3] * 255);
        this.dirty = true;
    }

    private resizeBuffer(byteCapacity: number): void {
        if (this.colorBuffer.byteLength < byteCapacity) {
            const increase = Math.max(kCapacityIncreaseStep * 4, byteCapacity - this.colorBuffer.byteLength);
            this.resizeTexture((this.colorBuffer.byteLength + increase) / 4);
            const newBuffer = new ArrayBuffer(this.capacity * 4);
            const newView = new Uint8Array(newBuffer);
            newView.set(this.colors);

            this.colorBuffer = newBuffer;
            this.colors = newView;
        }
    }
}
