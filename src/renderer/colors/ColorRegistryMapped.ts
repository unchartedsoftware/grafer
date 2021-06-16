import {ColorRegistry, GraferInputColor} from './ColorRegistry';
import chroma from 'chroma-js';
import {App} from 'picogl';

export class ColorRegistryMapped extends ColorRegistry {
    private colorMap: Map<string, number>;

    public get length(): number {
        return this.colorMap.size;
    }

    constructor(context: App, initialCapacity: number = 1024) {
        super(context, initialCapacity);
        this.colorMap = new Map();
    }

    public update(): void {
        if (this.dirty) {
            if (this.colorMap.size > this.capacity) {
                this.resizeTexture(this.colorMap.size);
            }

            const buffer = new Uint8Array(this.capacity * 4);
            let offset = 0;

            for (const color of this.colorMap.keys()) {
                const rgba = chroma.hex(color).rgba();
                buffer[offset++] = rgba[0];
                buffer[offset++] = rgba[1];
                buffer[offset++] = rgba[2];
                buffer[offset++] = Math.round(rgba[3] * 255); // alpha is always [0, 1] and we need it to be [0, 255]
            }

            this._texture.data(buffer);
        }
        this.dirty = false;
    }

    public registerColor(color: GraferInputColor): number {
        const hex = chroma(color as any).hex(); // dumb chroma typings
        if (!this.colorMap.has(hex)) {
            this.colorMap.set(hex, this.colorMap.size);
            this.dirty = true;
        }
        return this.colorMap.get(hex);
    }
}
