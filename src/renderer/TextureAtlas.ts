import {DataMappings, packData, printDataGL} from '../data/DataTools';
import {GraferContext} from './GraferContext';
import potpack from 'potpack';
import {GLDataTypes} from './Renderable';
import PicoGL, {App, Texture} from 'picogl';
import testVS from './shaders/LabelAtlas.test.vs.glsl';
import testFS from './shaders/noop.fs.glsl';

export const kImageMargin = 12;
const INF = 1e20;

export interface BoxObject {
    id: string,
    w: number,
    h: number,
    image: ImageData
}

export const kCharBoxDataMappings: DataMappings<{ box: [number, number, number, number] }> = {
    box: (entry: any) => [ entry.x + kImageMargin, entry.y + kImageMargin, entry.w - kImageMargin * 2, entry.h - kImageMargin * 2 ],
};

export const kCharBoxDataTypes: GLDataTypes<typeof kCharBoxDataMappings> = {
    box: [PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT],
};

export const kLabelDataTypes: GLDataTypes<DataMappings<{ texture: number }>> = {
    texture: PicoGL.UNSIGNED_SHORT,
};

export class TextureAtlas {
    private dirty = false;
    private context: GraferContext;
    public readonly labelPixelRatio: number = window.devicePixelRatio;
    public readonly textureKeyMap: Map<string, number> = new Map();
    public readonly boxes = [];

    constructor(context: GraferContext) {
        this.context = context;
        this._boxesTexture = context.createTexture2D(1, 1);
        this._indicesTexture = context.createTexture2D(1, 1);
        this._atlasTexture = context.createTexture2D(1, 1);
    }

    private _numTextures: number = 0;
    public get numTextures(): number {
        return this._numTextures;
    }

    private _boxesTexture: Texture;
    public get boxesTexture(): Texture {
        return this._boxesTexture;
    }

    private _indicesTexture: Texture;
    public get indicesTexture(): Texture {
        return this._indicesTexture;
    }

    private _atlasTexture: Texture;
    public get atlasTexture(): Texture {
        return this._atlasTexture;
    }

    protected exportTextures(keyList: string[]): Promise<void> {
        if(!this.dirty) {
            return;
        }
        this.dirty = false;

        const canvas = document.createElement('canvas');
        canvas.setAttribute('style', 'font-smooth: never;-webkit-font-smoothing : none;');

        const ctx = canvas.getContext('2d');

        const pack = potpack(this.boxes);
        const finalImage = ctx.createImageData(pack.w, pack.h);

        const boxesBuffer = packData(this.boxes, kCharBoxDataMappings, kCharBoxDataTypes, true, ((i) => {
            const box = this.boxes[i];
            this.textureKeyMap.set(box.id, i);
            TextureAtlas.blitImageData(box.image, finalImage, box.x, finalImage.height - box.y - box.h);
        }));
        this._boxesTexture = this.createTextureForBuffer(this.context, new Uint16Array(boxesBuffer), this.boxes.length, PicoGL.RGBA16UI);
        this._atlasTexture = this.context.createTexture2D(finalImage as unknown as HTMLImageElement, {
            flipY: true,
            // premultiplyAlpha: true,
            // magFilter: PicoGL.NEAREST,
            // minFilter: PicoGL.NEAREST,
        });

        const labelDataMappings: DataMappings<{ texture: number }> = {
            texture: (entry: any) => this.textureKeyMap.get(entry),
        };

        if(keyList) {
            const labelBuffer = packData(keyList, labelDataMappings, kLabelDataTypes, true);
            this._indicesTexture = this.createTextureForBuffer(this.context, new Uint16Array(labelBuffer), keyList.length, PicoGL.R16UI);
        }
        // this.testFeedback(context);
    }

    protected addTexture(charKey: string, box: BoxObject): void {
        // const image = this.renderCharTexture(char, renderSize, ctx, canvas);
        this.dirty = true;
        this.boxes.push(box);
        this.textureKeyMap.set(charKey, 0);
        this._numTextures++;
    }

    protected createTextureForBuffer(context: GraferContext, data: ArrayBufferView, dataLength:number, format: GLenum): Texture {
        const textureWidth = Math.pow(2 , Math.ceil(Math.log2(Math.ceil(Math.sqrt(dataLength)))));
        const textureHeight = Math.pow(2 , Math.ceil(Math.log2(Math.ceil(dataLength / textureWidth))));
        const texture = context.createTexture2D(textureWidth, textureHeight, {
            internalFormat: format,
        });
        texture.data(data);
        return texture;
    }

    static blitImageData(src: ImageData, dst: ImageData, x: number, y: number): void {
        for (let yy = 0; yy < src.height; ++yy) {
            const srcStart = src.width * yy * 4;
            const srcEnd = srcStart + src.width * 4;
            const dstOff = dst.width * (yy + y) * 4 + x * 4;
            dst.data.set(src.data.subarray(srcStart, srcEnd), dstOff);
        }
    }

    /* implementation based on: https://github.com/mapbox/tiny-sdf */
    static computeDistanceField(imageData: ImageData, fontSize: number): ImageData {
        const dataLength = imageData.width * imageData.height;

        // temporary arrays for the distance transform
        const maxDimension = Math.max(imageData.width, imageData.height);
        const gridOuter = new Float64Array(dataLength);
        const gridInner = new Float64Array(dataLength);
        const f = new Float64Array(maxDimension);
        const z = new Float64Array(maxDimension + 1);
        const v = new Uint16Array(maxDimension);

        gridOuter.fill(INF, 0, dataLength);
        gridInner.fill(0, 0, dataLength);

        for (let i = 0; i < dataLength; ++i) {
            const a = imageData.data[i * 4 + 3] / 255; // alpha value
            gridOuter[i] = a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
            gridInner[i] = a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
        }

        this.edt(gridOuter, imageData.width, imageData.height, f, v, z);
        this.edt(gridInner, imageData.width, imageData.height, f, v, z);

        const radius = fontSize / 8;
        const data = imageData.data;
        for (let i = 0; i < dataLength; ++i) {
            const d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i]);
            const p = i * 4;
            const a = Math.round(255 - 255 * (d / radius + 0.5));
            data[p] = 255;
            data[p + 1] = 255;
            data[p + 2] = 255;
            data[p + 3] = a;
        }

        return imageData;
    }

    // 2D Euclidean squared distance transform by Felzenszwalb & Huttenlocher https://cs.brown.edu/~pff/papers/dt-final.pdf
    static edt(data: Float64Array, width: number, height: number, f: Float64Array, v: Uint16Array, z: Float64Array): void {
        for (let x = 0; x < width; ++x) {
            this.edt1d(data, x, width, height, f, v, z);
        }

        for (let y = 0; y < height; ++y) {
            this.edt1d(data, y * width, 1, width, f, v, z);
        }
    }

    // 1D squared distance transform
    static edt1d(grid: Float64Array, offset: number, stride: number, length: number, f: Float64Array, v: Uint16Array, z: Float64Array): void {
        let q, k, s, r;

        v[0] = 0;
        z[0] = -INF;
        z[1] = INF;

        for (q = 0; q < length; ++q) {
            f[q] = grid[offset + q * stride];
        }

        for (q = 1, k = 0, s = 0; q < length; ++q) {
            do {
                r = v[k];
                s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
            } while (s <= z[k] && --k > -1);

            ++k;
            v[k] = q;
            z[k] = s;
            z[k + 1] = INF;
        }

        for (q = 0, k = 0; q < length; ++q) {
            while (z[k + 1] < q) {
                ++k;
            }
            r = v[k];
            grid[offset + q * stride] = f[r] + (q - r) * (q - r);
        }
    }

    // private testFeedback(context: App): void {
    //     const program = context.createProgram(testVS, testFS, { transformFeedbackVaryings: [ 'vBox' ], transformFeedbackMode: PicoGL.INTERLEAVED_ATTRIBS });
    //     const pointsTarget = context.createVertexBuffer(PicoGL.FLOAT, 4, 40);
    //     const pointsIndices = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 1, new Uint8Array([
    //         0,
    //         1,
    //         2,
    //         3,
    //         4,
    //         5,
    //     ]));

    //     const transformFeedback = context.createTransformFeedback().feedbackBuffer(0, pointsTarget);
    //     const vertexArray = context.createVertexArray().vertexAttributeBuffer(0, pointsIndices);

    //     const drawCall = context.createDrawCall(program, vertexArray).transformFeedback(transformFeedback);
    //     drawCall.primitive(PicoGL.POINTS);
    //     drawCall.texture('uDataTexture', this._boxesTexture);
    //     context.enable(PicoGL.RASTERIZER_DISCARD);
    //     drawCall.draw();
    //     context.disable(PicoGL.RASTERIZER_DISCARD);

    //     printDataGL(context, pointsTarget, 6, {
    //         box: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    //     });
    // }
}


