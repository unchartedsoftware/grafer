import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';
import {OffscreenBuffer} from '../../renderer/OffscreenBuffer';
import {UXModule} from '../UXModule';
import {App} from 'picogl';
import {
    MouseCallback,
    MouseHandler,
    MouseMoveHandler,
    MouseState,
} from '../mouse/MouseHandler';

const kEvents  = {
    hoverOn: Symbol('Grafer::UX::PickingManager::hover::on'),
    hoverOff: Symbol('Grafer::UX::PickingManager::hover::off'),
    click: Symbol('Grafer::UX::PickingManager::click'),
};
Object.freeze(kEvents);

export type PickingEventsMap = { [K in keyof typeof kEvents]: ReturnType<() => { readonly 0: unique symbol }[0]> };
export type PickingEvent = PickingEventsMap[keyof PickingEventsMap];

export interface PickingIndexRange {
    start: number;
    end: number;
}

export interface PickingColors {
    colors: Uint8Array;
    ranges: PickingIndexRange[];
    map: Map<number, number>;
}

export class PickingManager extends EventEmitter.mixin(UXModule) {
    public static get events(): PickingEventsMap {
        return kEvents as PickingEventsMap;
    }

    private _offscreenBuffer: OffscreenBuffer;
    public get offscreenBuffer(): OffscreenBuffer {
        return this._offscreenBuffer;
    }

    private mouseHandler: MouseHandler;
    private boundMouseHandler: MouseMoveHandler = this.handleMouse.bind(this);

    private colorBuffer: ArrayBuffer = new ArrayBuffer(4);
    private colorBufferUint8: Uint8Array = new Uint8Array(this.colorBuffer);
    private colorBufferView: DataView = new DataView(this.colorBuffer);
    private colorHoverID: number = 0;

    private availableIndices: PickingIndexRange[];

    constructor(context: App, mouseHandler: MouseHandler, enabled: boolean = true) {
        super();
        this._offscreenBuffer = new OffscreenBuffer(context);
        this.mouseHandler = mouseHandler;
        this.availableIndices = [{
            start: 0,
            end: 0xefffffff,
        }];

        this.enabled = enabled;
    }

    public on(type: PickingEvent, callback: MouseCallback): void {
        super.on(type, callback);
    }

    public off(type: PickingEvent, callback: MouseCallback): void {
        super.off(type, callback);
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

    protected hookEvents(): void {
        this.mouseHandler.on(MouseHandler.events.move, this.boundMouseHandler);
        this.mouseHandler.on(MouseHandler.events.click, this.boundMouseHandler);
    }

    protected unhookEvents(): void {
        this.mouseHandler.off(MouseHandler.events.move, this.boundMouseHandler);
        this.mouseHandler.off(MouseHandler.events.click, this.boundMouseHandler);
    }

    private handleMouse(event: symbol, state: MouseState): void {
        const glCoords = state.glCoords;
        this._offscreenBuffer.readPixel(glCoords[0], glCoords[1], this.colorBufferUint8);
        const colorID = this.colorBufferView.getUint32(0);

        switch (event) {
            case MouseHandler.events.move:
                if (colorID !== this.colorHoverID) {
                    if (this.colorHoverID !== 0) {
                        this.emit(kEvents.hoverOff, this.colorHoverID >> 1);
                    }
                    this.colorHoverID = colorID;
                    if (this.colorHoverID !== 0) {
                        this.emit(kEvents.hoverOn, this.colorHoverID >> 1);
                    }
                }
                break;

            case MouseHandler.events.click:
                if (colorID !== 0) {
                    this.emit(kEvents.click, colorID >> 1);
                }
                break;
        }
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
}
