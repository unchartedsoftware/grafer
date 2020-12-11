import {dataIterator, DataMappings, packData, printDataGL} from '../../data/DataTools';
import {GraferContext} from '../../renderer/GraferContext';
import potpack from 'potpack';
import {GLDataTypes} from '../../renderer/Renderable';
import PicoGL, {App, Texture} from 'picogl';
import testVS from './shaders/LabelAtlas.test.vs.glsl';
import testFS from '../../data/shaders/noop.fs.glsl';

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
    fontSize: (entry: LabelData) => 'fontSize' in entry ? entry.fontSize : 12,
    padding: (entry: LabelData) => 'padding' in entry ? entry.padding : [8, 5],
    background: (entry: LabelData) => 'background' in entry ? entry.background : true,
};

export const kLabelBoxDataMappings: DataMappings<{ box: [number, number, number, number] }> = {
    box: (entry: any) => [ entry.x, entry.y, entry.w, entry.h ],
}

export const kLabelBoxDataTypes: GLDataTypes<typeof kLabelBoxDataMappings> = {
    box: [PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT],
}

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

    protected processData(context: GraferContext, data: unknown[], mappings: DataMappings<LabelData>) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const images = [];
        const boxes = [];
        for (const [, entry] of dataIterator(data, mappings)) {
            const image = this.renderLabelTexture(entry, ctx, canvas);
            this.labelMap.set(entry.id, images.length);
            images.push(image);
            boxes.push({ w: image.width + 2, h: image.height + 2 });
        }

        const pack = potpack(boxes);
        canvas.width = pack.w;
        canvas.height = pack.h;

        const buffer = packData(boxes, kLabelBoxDataMappings, kLabelBoxDataTypes, true, ((i, entry) => {
            ctx.putImageData(images[i], entry.box[0] + 1, canvas.height - entry.box[1] - entry.box[3] + 1); // maybe will break here because of alpha pre-multiplication
        }));

        this._labelsTexture = context.createTexture2D(canvas as unknown as HTMLImageElement, {
            flipY: true,
            premultiplyAlpha: true,
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
            const outlineWidth = 1;

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

            canvas.width = context.measureText(entry.label).width + horizontalPadding * 2 * pixelRatio;
            canvas.height = entry.fontSize * pixelRatio + verticalPadding * 2 * pixelRatio;

            context.font = `${entry.fontSize * pixelRatio}px ${entry.font}`;

            if (entry.background) {
                context.fillStyle = '#666666';
                context.lineWidth = outlineWidth;
                context.strokeStyle = '#cccccc';
                this.roundRect(
                    context,
                    outlineWidth,
                    outlineWidth,
                    canvas.width - outlineWidth * 2,
                    canvas.height - outlineWidth * 2,
                    Math.min(10, canvas.height * 0.25, canvas.width * 0.25),
                    true,
                );
            }

            context.fillStyle = '#ffffff';
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
    ) {
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


