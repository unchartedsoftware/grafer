import {PicoGL, App, Renderbuffer, Framebuffer, Texture} from 'picogl';
import {EventEmitter} from '@dekkai/event-emitter';

const kHoverOnEvent = Symbol('Grafer::renderer::Picking::hover::on');
const kHoverOffEvent = Symbol('Grafer::renderer::Picking::hover::off');
const kClickEvent = Symbol('Grafer::renderer::Picking::click');

export interface PickingIndexRange {
    start: number;
    end: number;
}

export interface PickingColors {
    colors: Uint8Array;
    ranges: PickingIndexRange[];
    map: Map<number, number>;
}

export class Picking extends EventEmitter {
    private context: App;
    private colorTarget: Texture;
    private depthTarget: Renderbuffer;
    private frameBuffer: Framebuffer;

    private availableIndices: PickingIndexRange[];
    private boundMouseHandler: (MouseEvent) => void = this.handleMouseEvent.bind(this);

    private colorBuffer: ArrayBuffer = new ArrayBuffer(4);
    private colorBufferUint8: Uint8Array = new Uint8Array(this.colorBuffer);
    private colorBufferView: DataView = new DataView(this.colorBuffer);
    private colorHoverID: number = 0;

    private _enabled: boolean = false;
    public get enabled(): boolean {
        return this._enabled;
    }
    public set enabled(value: boolean) {
        if (value !== this._enabled) {
            this._enabled = value;
            if (this._enabled) {
                this.context.canvas.addEventListener('mousemove', this.boundMouseHandler);
            } else {
                this.context.canvas.removeEventListener('mousemove', this.boundMouseHandler);
            }
        }
    }

    public get hoverOnEvent(): symbol {
        return kHoverOnEvent;
    }

    public get hoverOffEvent(): symbol {
        return kHoverOffEvent;
    }

    public get clickEvent(): symbol {
        return kClickEvent;
    }

    constructor(context: App) {
        super();
        this.context = context;
        this.resize(context);
    }

    public resize(context: App): void {
        if (this.frameBuffer) {
            this.frameBuffer.delete();
        }

        if (this.colorTarget) {
            this.colorTarget.delete();
        }

        if (this.depthTarget) {
            this.depthTarget.delete();
        }

        this.colorTarget = context.createTexture2D(context.width, context.height);
        this.depthTarget = context.createRenderbuffer(context.width, context.height, PicoGL.DEPTH_COMPONENT16);
        this.frameBuffer = context.createFramebuffer()
            .colorTarget(0, this.colorTarget)
            .depthTarget(this.depthTarget);

        this.availableIndices = [{
            start: 0,
            end: 0xefffffff,
        }];
    }

    public allocatePickingColors(count: number): PickingColors {
        const colors = new Uint8Array(count * 4);
        const ranges: PickingIndexRange[] = [];
        const map: Map<number, number> = new Map();

        let offset = 0;
        let left = count;
        for (let i = 0, n = this.availableIndices.length; i < n && left > 0; ++i) {
            const availableRange = this.availableIndices[i];
            const rangeLength = availableRange.end - availableRange.start;
            if (rangeLength > left) {
                const range = { start: availableRange.start, end: availableRange.start + left };
                offset = this.pickingColorsForIndices(colors, offset, range);
                this.mapPickingColorIDs(map, count - left, range);
                ranges.push(range);

                availableRange.start += left;
                left = 0;
            } else {
                offset = this.pickingColorsForIndices(colors, offset, availableRange);
                this.mapPickingColorIDs(map, count - left, availableRange);
                ranges.push(availableRange);
                left -= rangeLength;
                this.availableIndices.splice(i--, 1);
            }
        }

        return {
            colors,
            ranges,
            map,
        };
    }

    public deallocatePickingColors(colors: PickingColors): void {
        for (let i = 0, n = colors.ranges.length; i < n; ++i) {
            this.deallocatePickingRange(colors.ranges[i]);
        }
        colors.colors = new Uint8Array([]);
        colors.ranges.length = 0;
        colors.map.clear();
    }

    public prepareContext(context: App): void {
        context.depthMask(true);
        context.readFramebuffer(this.frameBuffer);
        context.drawFramebuffer(this.frameBuffer)
            .clearMask(PicoGL.COLOR_BUFFER_BIT | PicoGL.DEPTH_BUFFER_BIT)
            .clearColor(0, 0, 0, 0)
            .clear();
        context.depthMask(true);
    }

    private deallocatePickingRange(range: PickingIndexRange): void {
        for (let i = 0, n = this.availableIndices.length; i < n; ++i) {
            const availableRange = this.availableIndices[i];
            if (availableRange.start > range.start) {
                if (availableRange.start === range.end) {
                    availableRange.start = range.start;
                } else {
                    this.availableIndices.splice(i, 0, {
                        start: range.start,
                        end: range.end,
                    });
                }
                break;
            }
        }
    }

    private mapPickingColorIDs(out: Map<number, number>, idStart: number, range: PickingIndexRange): void {
        for (let i = 0, n = range.end - range.start; i < n; ++i) {
            out.set(range.start + i, idStart + i);
        }
    }

    private pickingColorsForIndices(out:Uint8Array, offset:number, range: PickingIndexRange): number {
        for (let i = range.start; i < range.end; ++i) {
            const color = this.pickingColorForNumber(i);
            out[offset++] = color[0];
            out[offset++] = color[1];
            out[offset++] = color[2];
            out[offset++] = color[3];
        }
        return offset;
    }

    private pickingColorForNumber(num: number): Uint8Array {
        // offset the number so alpha is never 0
        const pickingNumber = (num << 1) | 1;
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint32(0, pickingNumber);
        return new Uint8Array(buffer);
    }

    private handleMouseEvent(event: MouseEvent): void {
        const rect = this.context.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = rect.bottom - event.clientY;
        this.context.defaultDrawFramebuffer()
            .readFramebuffer(this.frameBuffer)
            .readPixel(mouseX, mouseY, this.colorBufferUint8);

        const colorID = this.colorBufferView.getUint32(0);

        const type = event.type;
        switch (type) {
            case 'mousemove':
                if (colorID !== this.colorHoverID) {
                    if (this.colorHoverID !== 0) {
                        this.emit(kHoverOffEvent, this.colorHoverID >> 1);
                    }
                    this.colorHoverID = colorID;
                    if (this.colorHoverID !== 0) {
                        this.emit(kHoverOnEvent, this.colorHoverID >> 1);
                    }
                }
                break;

            case 'click':
                if (colorID !== 0) {
                    this.emit(kClickEvent, colorID >> 1);
                }
                break;
        }
    }
}
