import {dataIterator, DataMappings, packData, printDataGL} from '../../data/DataTools';
import {GraferContext} from '../../renderer/GraferContext';
import potpack from 'potpack';
import {GLDataTypes} from '../../renderer/Renderable';
import PicoGL, {App, Texture} from 'picogl';
import testVS from './shaders/LabelAtlas.test.vs.glsl';
import testFS from '../../data/shaders/noop.fs.glsl';

const kImageMargin = 2;
const INF = 1e20;

export interface LabelData {
    id?: number | string;
    label: string | ImageData;
    font?: string;
    fontSize?: number;
    padding?: number | [number, number];
    background?: boolean;
}

export const kLabelMappings: DataMappings<LabelData> = {
    id: (entry: LabelData, i) => 'id' in entry ? entry.id : i,
    label: (entry: LabelData, i) => 'label' in entry ? entry.label : `${i}`,
    font: (entry: LabelData) => 'font' in entry ? entry.font : 'monospace',
    fontSize: (entry: LabelData) => 'fontSize' in entry ? entry.fontSize : 18,
    padding: (entry: LabelData) => 'padding' in entry ? entry.padding : [8, 5],
    background: (entry: LabelData) => 'background' in entry ? entry.background : false,
};

export const kLabelBoxDataMappings: DataMappings<{ box: [number, number, number, number] }> = {
    box: (entry: any) => [ entry.x, entry.y, entry.w, entry.h ],
};

export const kLabelBoxDataTypes: GLDataTypes<typeof kLabelBoxDataMappings> = {
    box: [PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT],
};

export class LabelAtlas {
    public readonly labelPixelRatio: number;
    public readonly labelMap: Map<number | string, number>;

    private _dataTexture: Texture;
    public get dataTexture(): Texture {
        return this._dataTexture;
    }

    private _labelsTexture: Texture;
    public get labelsTexture(): Texture {
        return this._labelsTexture;
    }

    constructor(context: GraferContext, data: unknown[], mappings: Partial<DataMappings<LabelData>>) {
        this.labelPixelRatio = window.devicePixelRatio;
        this.labelMap = new Map();

        this.processData(context, data, Object.assign({}, kLabelMappings, mappings));
    }

    protected processData(context: GraferContext, data: unknown[], mappings: DataMappings<LabelData>): void {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('style', 'font-smooth: never;-webkit-font-smoothing : none;');

        const ctx = canvas.getContext('2d');
        const boxes = [];
        for (const [, entry] of dataIterator(data, mappings)) {
            const image = this.computeDistanceField(this.renderLabelTexture(entry, ctx, canvas), entry.fontSize);
            boxes.push({ id: entry.id, w: image.width + kImageMargin * 2, h: image.height + kImageMargin * 2, image });
        }

        const pack = potpack(boxes);
        const finalImage = ctx.createImageData(pack.w, pack.h);

        const buffer = packData(boxes, kLabelBoxDataMappings, kLabelBoxDataTypes, true, ((i) => {
            const box = boxes[i];
            this.labelMap.set(box.id, i);
            this.blitImageData(box.image, finalImage, box.x + kImageMargin, finalImage.height - box.y - box.h + kImageMargin);
        }));

        this._labelsTexture = context.createTexture2D(finalImage as unknown as HTMLImageElement, {
            flipY: true,
            // premultiplyAlpha: true,
            // magFilter: PicoGL.NEAREST,
            // minFilter: PicoGL.NEAREST,
        });

        const uint16 = new Uint16Array(buffer);
        const textureWidth = Math.pow(2 , Math.ceil(Math.log2(Math.ceil(Math.sqrt(data.length)))));
        const textureHeight = Math.pow(2 , Math.ceil(Math.log2(Math.ceil(data.length / textureWidth))));
        this._dataTexture = context.createTexture2D(textureWidth, textureHeight, {
            internalFormat: PicoGL.RGBA16UI,
        });
        this._dataTexture.data(uint16);

        // this.testFeedback(context);
    }

    protected renderLabelTexture(entry: LabelData, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): ImageData {
        if (typeof entry.label === 'string') {
            const pixelRatio = this.labelPixelRatio;
            const outlineWidth = 3;

            let horizontalPadding;
            let verticalPadding;
            if (Array.isArray(entry.padding)) {
                horizontalPadding = entry.padding[0];
                verticalPadding = entry.padding.length > 1 ? entry.padding[1] : entry.padding[0];
            } else {
                horizontalPadding = entry.padding;
                verticalPadding = entry.padding;
            }

            context.font = `${entry.fontSize * pixelRatio}px ${entry.font}`;
            context.imageSmoothingEnabled = false;

            canvas.width = context.measureText(entry.label).width + horizontalPadding * 2 * pixelRatio;
            canvas.height = entry.fontSize * pixelRatio + verticalPadding * 2 * pixelRatio;

            context.fillStyle = '#ff0000';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.font = `${entry.fontSize * pixelRatio}px ${entry.font}`;

            if (entry.background) {
                context.fillStyle = '#00ff66';
                context.lineWidth = outlineWidth;
                context.strokeStyle = '#00ffcc';
                this.roundRect(
                    context,
                    outlineWidth,
                    outlineWidth,
                    canvas.width - outlineWidth * 2,
                    canvas.height - outlineWidth * 2,
                    Math.min(10, canvas.height * 0.25, canvas.width * 0.25),
                    true
                );
            }

            context.fillStyle = '#00ffff';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(entry.label, canvas.width * 0.5, canvas.height * 0.5);

            return context.getImageData(0, 0, canvas.width, canvas.height);
        }

        return entry.label;
    }

    private roundRect(
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius = 5,
        fill = true,
        stroke = true
    ): void {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();

        if (stroke) {
            context.stroke();
        }

        if (fill) {
            context.fill();
        }
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

        for (let i = 0; i < dataLength; ++i) {
            const a = imageData.data[i * 4 + 1] / 255; // alpha value from green channel
            gridOuter[i] = a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
            gridInner[i] = a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
        }

        this.edt(gridOuter, imageData.width, imageData.height, f, v, z);
        this.edt(gridInner, imageData.width, imageData.height, f, v, z);

        const radius = fontSize / 3;
        const data = imageData.data;
        for (let i = 0; i < dataLength; ++i) {
            const d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i]);
            const p = i * 4;

            const a = data[p + 3] / 255;
            // de-multiply the alpha
            const gray = Math.min(255, (data[p] + data[p + 2]) / a); // the sum between the red and blue channels
            data[p] = gray;
            data[p + 1] = gray;
            data[p + 2] = gray;
            data[p + 3] = Math.round(255 - 255 * (d / radius + 0.5));
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
        drawCall.texture('uDataTexture', this._dataTexture);
        context.enable(PicoGL.RASTERIZER_DISCARD);
        drawCall.draw();
        context.disable(PicoGL.RASTERIZER_DISCARD);

        printDataGL(context, pointsTarget, 6, {
            box: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
        });
    }
}


