import {dataIterator, DataMappings, packData, printDataGL} from '../../data/DataTools';
import {GraferContext} from '../../renderer/GraferContext';
import potpack from 'potpack';
import {GLDataTypes} from '../../renderer/Renderable';
import PicoGL, {App, Texture} from 'picogl';
import testVS from './shaders/LabelAtlas.test.vs.glsl';
import testFS from '../../data/shaders/noop.fs.glsl';

const kImageMargin = 12;
const INF = 1e20;

export interface LabelData {
    id?: number | string;
    label: string | ImageData;
    fontSize?: number;
    padding?: number | [number, number];
}

export interface LabelRenderInfo {
    index: number;
    length: number;
    width: number;
    height: number;
}

export const kLabelMappings: DataMappings<LabelData> = {
    id: (entry: LabelData, i) => 'id' in entry ? entry.id : i,
    label: (entry: LabelData, i) => 'label' in entry ? entry.label : `${i}`,
    fontSize: (entry: LabelData) => 'fontSize' in entry ? entry.fontSize : 18,
    padding: (entry: LabelData) => 'padding' in entry ? entry.padding : [8, 5],
};

export const kCharBoxDataMappings: DataMappings<{ box: [number, number, number, number] }> = {
    box: (entry: any) => [ entry.x + kImageMargin, entry.y + kImageMargin, entry.w - kImageMargin * 2, entry.h - kImageMargin * 2 ],
};

export const kCharBoxDataTypes: GLDataTypes<typeof kCharBoxDataMappings> = {
    box: [PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT],
};

export const kLabelDataTypes: GLDataTypes<DataMappings<{ char: number }>> = {
    char: PicoGL.UNSIGNED_SHORT,
};

export class LabelAtlas {
    protected readonly fontSizeStep: number = 25;
    protected readonly spaceSizeMap: Map<number, number> = new Map();

    public readonly labelPixelRatio: number;
    public readonly characterMap: Map<string, number>;
    public readonly labelMap: Map<number | string, LabelRenderInfo>;

    private _boxesTexture: Texture;
    public get boxesTexture(): Texture {
        return this._boxesTexture;
    }

    private _labelsTexture: Texture;
    public get labelsTexture(): Texture {
        return this._labelsTexture;
    }

    private _charactersTexture: Texture;
    public get charactersTexture(): Texture {
        return this._charactersTexture;
    }

    constructor(context: GraferContext, data: unknown[], mappings: Partial<DataMappings<LabelData>>) {
        this.labelPixelRatio = window.devicePixelRatio;
        this.characterMap = new Map();
        this.labelMap = new Map();

        if (data.length) {
            this.processData(context, data, Object.assign({}, kLabelMappings, mappings));
        } else {
            this._boxesTexture = context.createTexture2D(1, 1);
            this._labelsTexture = context.createTexture2D(1, 1);
            this._charactersTexture = context.createTexture2D(1, 1);
        }
    }

    protected processData(context: GraferContext, data: unknown[], mappings: DataMappings<LabelData>): void {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('style', 'font-smooth: never;-webkit-font-smoothing : none;');

        const ctx = canvas.getContext('2d');
        const boxMap = new Map<string, any>();
        const boxes = [];
        const labels = [];

        for (const [, entry] of dataIterator(data, mappings)) {
            if (typeof entry.label === 'string') {
                const renderSize = Math.max(entry.fontSize, Math.floor(entry.fontSize / this.fontSizeStep) * this.fontSizeStep);
                const renderScale = entry.fontSize / renderSize;

                const labelInfo: LabelRenderInfo = {
                    index: labels.length,
                    length: entry.label.length,
                    width: 0,
                    height: 0,
                };
                this.labelMap.set(entry.id, labelInfo);

                for (let i = 0, n = entry.label.length; i < n; ++i) {
                    const char = entry.label.charAt(i);
                    const charKey = `${char}-${renderSize}`;
                    if (!this.characterMap.has(charKey)) {
                        // const image = this.renderCharTexture(char, renderSize, ctx, canvas);
                        const image = this.computeDistanceField(this.renderCharTexture(char, renderSize, ctx, canvas), renderSize);
                        const box = { id: charKey, w: image.width, h: image.height, image };
                        boxMap.set(charKey, box);
                        boxes.push(box);
                        this.characterMap.set(charKey, 0);
                    }
                    const box = boxMap.get(charKey);
                    labelInfo.width += (box.image.width - kImageMargin * 2) * renderScale;
                    labelInfo.height = Math.max(labelInfo.height, (box.image.height - kImageMargin * 2) * renderScale);

                    labels.push(charKey);
                }
            }
        }

        const pack = potpack(boxes);
        const finalImage = ctx.createImageData(pack.w, pack.h);

        const boxesBuffer = packData(boxes, kCharBoxDataMappings, kCharBoxDataTypes, true, ((i) => {
            const box = boxes[i];
            this.characterMap.set(box.id, i);
            this.blitImageData(box.image, finalImage, box.x, finalImage.height - box.y - box.h);
        }));

        this._charactersTexture = context.createTexture2D(finalImage as unknown as HTMLImageElement, {
            flipY: true,
            // premultiplyAlpha: true,
            // magFilter: PicoGL.NEAREST,
            // minFilter: PicoGL.NEAREST,
        });

        this._boxesTexture = this.createTextureForBuffer(context, new Uint16Array(boxesBuffer), boxes.length, PicoGL.RGBA16UI);
        console.log(boxesBuffer);

        const labelDataMappings: DataMappings<{ char: number }> = {
            char: (entry: any) => this.characterMap.get(entry),
        };

        const labelBuffer = packData(labels, labelDataMappings, kLabelDataTypes, true);
        this._labelsTexture = this.createTextureForBuffer(context, new Uint16Array(labelBuffer), labels.length, PicoGL.R16UI)

        // this.testFeedback(context);
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

    protected renderCharTexture(char: string, size: number, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): ImageData {
        const pixelRatio = this.labelPixelRatio;

        if (!this.spaceSizeMap.has(size)) {
            context.font = `${size * pixelRatio}px monospace`;
            context.imageSmoothingEnabled = false;

            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            const spaceMetrics = context.measureText(' ');
            this.spaceSizeMap.set(size,  Math.abs(spaceMetrics.actualBoundingBoxLeft) + Math.abs(spaceMetrics.actualBoundingBoxRight));
        }

        const textWidth = this.spaceSizeMap.get(size);
        const textHeight = size * pixelRatio;
        const textPadding = Math.min(textWidth, textHeight) * 0.15;

        canvas.width = textWidth + textPadding + kImageMargin * 2;
        canvas.height = size * pixelRatio + textPadding + kImageMargin * 2;

        // context.fillStyle = `rgb(255,0,0)`;
        // context.fillRect(0, 0, canvas.width, canvas.height);
        //
        // context.fillStyle = `rgb(0,255,0)`;
        // context.fillRect(canvas.width * 0.5 - textWidth * 0.5, 0, textWidth, canvas.height);

        context.font = `${size * pixelRatio}px monospace`;
        context.imageSmoothingEnabled = false;

        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(char, canvas.width * 0.5, canvas.height * 0.5);

        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    private blitImageData(src: ImageData, dst: ImageData, x: number, y: number): void {
        for (let yy = 0; yy < src.height; ++yy) {
            const srcStart = src.width * yy * 4;
            const srcEnd = srcStart + src.width * 4;
            const dstOff = dst.width * (yy + y) * 4 + x * 4;
            dst.data.set(src.data.subarray(srcStart, srcEnd), dstOff);
        }
    }

    /* implementation based on: https://github.com/mapbox/tiny-sdf */
    private computeDistanceField(imageData: ImageData, fontSize: number): ImageData {
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
    private edt(data: Float64Array, width: number, height: number, f: Float64Array, v: Uint16Array, z: Float64Array): void {
        for (let x = 0; x < width; ++x) {
            this.edt1d(data, x, width, height, f, v, z);
        }

        for (let y = 0; y < height; ++y) {
            this.edt1d(data, y * width, 1, width, f, v, z);
        }
    }

    // 1D squared distance transform
    private edt1d(grid: Float64Array, offset: number, stride: number, length: number, f: Float64Array, v: Uint16Array, z: Float64Array): void {
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

    private testFeedback(context: App): void {
        const program = context.createProgram(testVS, testFS, { transformFeedbackVaryings: [ 'vBox' ], transformFeedbackMode: PicoGL.INTERLEAVED_ATTRIBS });
        const pointsTarget = context.createVertexBuffer(PicoGL.FLOAT, 4, 40);
        const pointsIndices = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 1, new Uint8Array([
            0,
            1,
            2,
            3,
            4,
            5,
        ]));

        const transformFeedback = context.createTransformFeedback().feedbackBuffer(0, pointsTarget);
        const vertexArray = context.createVertexArray().vertexAttributeBuffer(0, pointsIndices);

        const drawCall = context.createDrawCall(program, vertexArray).transformFeedback(transformFeedback);
        drawCall.primitive(PicoGL.POINTS);
        drawCall.texture('uDataTexture', this._boxesTexture);
        context.enable(PicoGL.RASTERIZER_DISCARD);
        drawCall.draw();
        context.disable(PicoGL.RASTERIZER_DISCARD);

        printDataGL(context, pointsTarget, 6, {
            box: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
        });
    }
}


