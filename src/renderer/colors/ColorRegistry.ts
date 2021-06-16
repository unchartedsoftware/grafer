import {App, Texture} from 'picogl';
import {vec2} from 'gl-matrix';

export type GraferInputColor = [number, number, number] | string | number;

export enum ColorRegistryType {
    mapped = 'mapped',
    indexed = 'indexed',
}

export abstract class ColorRegistry {
    protected context: App;
    protected dirty: boolean = false;

    protected _texture: Texture;
    public get texture(): Texture {
        this.update();
        return this._texture;
    }

    public get capacity(): number {
        return this.textureSize[0] * this.textureSize[1];
    }

    protected textureSize: vec2;

    protected constructor(context: App, initialCapacity: number = 1024) {
        this.context = context;
        this.textureSize = vec2.create();
        this.resizeTexture(initialCapacity);
    }

    public abstract get length(): number;
    public abstract update(): void;
    public abstract registerColor(color: GraferInputColor): number;

    protected resizeTexture(capacity: number): void {
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
