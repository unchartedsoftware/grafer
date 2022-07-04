import {dataIterator, DataMappings} from '../../data/DataTools';
import {GraferContext} from '../../renderer/GraferContext';
import {TextureAtlas, kImageMargin} from '../../../src/renderer/TextureAtlas';

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

export class LabelAtlas extends TextureAtlas {
    protected readonly fontSizeStep: number = 25;
    protected readonly spaceSizeMap: Map<number, number> = new Map();
    public readonly labelMap: Map<number | string, LabelRenderInfo>;

    constructor(context: GraferContext, data: unknown[], mappings: Partial<DataMappings<LabelData>>, font: string, bold: boolean = false) {
        super(context);
        this.labelMap = new Map();

        if (data.length) {
            this.processData(context, data, Object.assign({}, kLabelMappings, mappings), font, bold);
        }
    }

    protected async processData(context: GraferContext, data: unknown[], mappings: DataMappings<LabelData>, font: string, bold: boolean): Promise<void> {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('style', 'font-smooth: never;-webkit-font-smoothing : none;');

        const ctx = canvas.getContext('2d');
        const boxMap = new Map<string, any>();
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
                    if (!this.textureKeyMap.has(charKey)) {
                        // const image = this.renderCharTexture(char, renderSize, ctx, canvas);
                        const image = TextureAtlas.computeDistanceField(
                            this.renderCharTexture(char, renderSize, ctx, canvas, font, bold),
                            renderSize
                        );
                        const box = { id: charKey, w: image.width, h: image.height, image };
                        boxMap.set(charKey, box);
                        this.addTexture(charKey, box);
                    }
                    const box = boxMap.get(charKey);
                    labelInfo.width += (box.image.width - kImageMargin * 2) * renderScale;
                    labelInfo.height = Math.max(labelInfo.height, (box.image.height - kImageMargin * 2) * renderScale);

                    labels.push(charKey);
                }
            }
        }

        this.exportTextures(labels);
        // this.testFeedback(context);
    }

    protected renderCharTexture(char: string, size: number, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, font: string, bold: boolean): ImageData {
        const pixelRatio = this.labelPixelRatio;
        const fontString = `${bold ? 'bold ' : ''}${size * pixelRatio}px ${font}`;

        if (!this.spaceSizeMap.has(size)) {
            context.font = fontString;
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

        context.font = fontString;
        context.imageSmoothingEnabled = false;

        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(char, canvas.width * 0.5, canvas.height * 0.5);

        return context.getImageData(0, 0, canvas.width, canvas.height);
    }
}


