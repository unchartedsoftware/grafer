import PicoGL, {Texture} from 'picogl';

import {applyArabicShaping, processBidirectionalText} from './rtlText.js';
import {packData, dataIterator, DataMappings} from '../../data/DataTools';
import {GraferContext} from '../../renderer/GraferContext';
import {TextureAtlas, kImageMargin} from '../../../src/renderer/TextureAtlas';
import { GLDataTypes } from '../../../src/renderer/Renderable';

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

export const kOffsetDataTypes: GLDataTypes<DataMappings<{ offset: number }>> = {
    offset: PicoGL.UNSIGNED_SHORT,
};

export class LabelAtlas extends TextureAtlas {
    protected readonly letterSpacing = 5;
    protected readonly fontSizeStep: number = 25;
    protected readonly spaceSizeMap: Map<string, number> = new Map();
    public readonly labelMap: Map<number | string, LabelRenderInfo>;

    private _offsetsTexture: Texture;
    public get offsetsTexture(): Texture {
        return this._offsetsTexture;
    }

    constructor(context: GraferContext, data: unknown[], mappings: Partial<DataMappings<LabelData>>, font: string, bold: boolean = false, charSpacing: number = 0) {
        super(context);
        this.labelMap = new Map();

        if (data.length) {
            this.processData(context, data, Object.assign({}, kLabelMappings, mappings), font, bold, charSpacing);
        }
    }

    protected processRtlText(str: string): string {
        return processBidirectionalText(
            applyArabicShaping(str),
            []
        ).join(' ');
    }

    protected async processData(context: GraferContext, data: unknown[], mappings: DataMappings<LabelData>, font: string, bold: boolean, charSpacing: number): Promise<void> {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('style', 'font-smooth: never;-webkit-font-smoothing : none;');

        const ctx = canvas.getContext('2d');
        const boxMap = new Map<string, any>();
        const labels = [];
        const offsets = [];
        const charNegMargin = (1 - charSpacing) * this.letterSpacing;

        for (const [, entry] of dataIterator(data, mappings)) {
            if (typeof entry.label === 'string') {
                const renderSize = Math.max(entry.fontSize, Math.floor(entry.fontSize / this.fontSizeStep) * this.fontSizeStep);
                const renderScale = entry.fontSize / renderSize;

                const labelInfo: LabelRenderInfo = {
                    index: labels.length,
                    length: 0,
                    width: 0,
                    height: 0,
                };
                this.labelMap.set(entry.id, labelInfo);
                let rtlProcessed = false;
                let labelString = entry.label;
                for (let i = 0, n = labelString.length; i < n; ++i) {
                    let char;
                    const charCode = labelString.charCodeAt(i);
                    if(charCode >= 1425 && !rtlProcessed) {
                        // if charcode contains unusual chars, process label string for RTL text
                        labelString = this.processRtlText(entry.label);
                        rtlProcessed = true;
                    }

                    if(charCode >= 55296 && charCode <= 56319) {
                        // check if next char has surrogate and handle accordingly
                        char = labelString.charAt(i++) + labelString.charAt(i);
                    } else if(charCode >= 65136 && charCode <= 65151) {
                        // check for and filter out arabic diacritics
                        continue;
                    } else {
                        char = labelString.charAt(i);
                    }

                    const charKey = `${char}-${renderSize}`;
                    if (!this.textureKeyMap.has(charKey)) {
                        // const image = this.renderCharTexture(char, renderSize, ctx, canvas);
                        const image = TextureAtlas.computeDistanceField(
                            this.renderCharTexture(char, renderSize, ctx, canvas, font, bold),
                            renderSize * this.labelPixelRatio
                        );
                        const box = { id: charKey, w: image.width, h: image.height, image };
                        boxMap.set(charKey, box);
                        this.addTexture(charKey, box);
                    }
                    const box = boxMap.get(charKey);
                    offsets.push(labelInfo.width);
                    const margin = kImageMargin * 2 + charNegMargin * 2;
                    labelInfo.width += (box.w - margin) * renderScale;
                    labelInfo.height = Math.max(labelInfo.height, (box.h - margin) * renderScale);
                    labelInfo.length++;

                    labels.push(charKey);
                }
            }
        }

        this.exportTextures(labels, charNegMargin, charNegMargin);
        const offsetDataMappings: DataMappings<{ offset: number }> = {
            offset: (offset: any) => offset,
        };

        // create buffer specifying offset from string start of each character in string
        const offsetBuffer = packData(offsets, offsetDataMappings, kOffsetDataTypes, true);
        this._offsetsTexture = this.createTextureForBuffer(context, new Uint16Array(offsetBuffer), offsets.length, PicoGL.R16UI);

        // this.testFeedback(context);
    }

    protected renderCharTexture(char: string, size: number, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, font: string, bold: boolean): ImageData {
        const pixelRatio = this.labelPixelRatio;
        const fontString = `${bold ? 'bold ' : ''}${size * pixelRatio}px ${font}`;

        if (!this.spaceSizeMap.has(size + char)) {
            context.font = fontString;
            context.imageSmoothingEnabled = false;

            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            const spaceMetrics = context.measureText(char);
            this.spaceSizeMap.set(String(size) + char,  Math.abs(spaceMetrics.actualBoundingBoxLeft) + Math.abs(spaceMetrics.actualBoundingBoxRight));
        }
        const textWidth = this.spaceSizeMap.get(size + char);
        const textHeight = size * pixelRatio;
        const textPadding = Math.min(textWidth, textHeight) * 0.15;

        canvas.width = Math.ceil(textWidth + textPadding + this.letterSpacing * 2 + kImageMargin * 2);
        canvas.height = size * pixelRatio + textPadding + this.letterSpacing * 2 + kImageMargin * 2;

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


