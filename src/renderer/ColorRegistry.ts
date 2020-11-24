import {App, Texture} from 'picogl';
import {vec2} from 'gl-matrix';
import chroma from 'chroma-js';

export type GraferInputColor = [number, number, number] | string | number;

export class ColorRegistry {
    private context: App;
    private dirty: boolean = false;

    private _texture: Texture;
    public get texture(): Texture {
        this.update();
        return this._texture;
    }

    public get capacity(): number {
        return this.textureSize[0] * this.textureSize[1];
    }

    public get length(): number {
        return this.colorMap.size;
    }

    private textureSize: vec2;
    private colorMap: Map<string, number>;

    constructor(context: App, initialCapacity: number = 1024) {
        this.context = context;
        this.colorMap = new Map();
        this.textureSize = vec2.create();
        this.resizeTexture(initialCapacity);
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
                buffer[offset] = rgba[0];
                ++offset;
                buffer[offset] = rgba[1];
                ++offset;
                buffer[offset] = rgba[2];
                ++offset;
                buffer[offset] = Math.round(rgba[3] * 255); // alpha is always [0, 1] and we need it to be [0, 255]
                ++offset;
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

    private resizeTexture(capacity: number): void {
        if (this.capacity < capacity) {
            const textureWidth = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(capacity)))));
            const textureHeight = Math.pow(2, Math.ceil(Math.log2(Math.ceil(capacity / textureWidth))));
            this.textureSize = vec2.fromValues(textureWidth, textureHeight);
            if (this._texture) {
                this._texture.resize(textureWidth, textureHeight);
            } else {
                this._texture = this.context.createTexture2D(textureWidth, textureHeight);
            }
        }
    }
}
