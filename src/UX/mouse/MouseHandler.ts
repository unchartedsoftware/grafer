import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';
import {vec2} from 'gl-matrix';

const kEvents = {
    move: Symbol('Grafer::UX::MouseHandler::move'),
    down: Symbol('Grafer::UX::MouseHandler::down'),
    up: Symbol('Grafer::UX::MouseHandler::up'),
    click: Symbol('Grafer::UX::MouseHandler::click'),
    wheel: Symbol('Grafer::UX::MouseHandler::wheel'),
};
Object.freeze(kEvents);

export const kButton2Index = {
    primary: 1,
    secondary: 2,
    auxiliary: 4,
    fourth: 8,
    fifth: 16,
};
Object.freeze(kButton2Index);

export const kIndex2Button = {
    1: 'primary',
    2: 'secondary',
    4: 'auxiliary',
    8: 'fourth',
    16: 'fifth',
};
Object.freeze(kIndex2Button);

interface EventEntry {
    event: symbol;
    args: any[];
}

export interface MouseState {
    valid: boolean;
    clientCoords: vec2;
    canvasCoords: vec2;
    deltaCoords: vec2;
    wheel: number;
    buttons: {
        primary: boolean;
        secondary: boolean;
        auxiliary: boolean;
        fourth: boolean;
        fifth: boolean;
    };
}

export type MouseMoveHandler = (event: symbol, state: MouseState, delta: vec2, canvasCoords: vec2) => void;
export type MouseDownHandler = (event: symbol, state: MouseState, buttonIndex:number, buttonName: string, pressed: boolean) => void;
export type MouseUpHandler = (event: symbol, state: MouseState, buttonIndex: number, buttonName: string, pressed: boolean) => void;
export type MouseClickHandler = (event: symbol, state: MouseState, buttonIndex: number, buttonName: string) => void;
export type MouseWheelHandler = (event: symbol, state: MouseState, wheel: number) => void;
export type MouseCallback = MouseMoveHandler | MouseDownHandler | MouseUpHandler | MouseClickHandler | MouseWheelHandler;

export class MouseHandler extends EventEmitter {
    public static get events(): typeof kEvents {
        return kEvents;
    }

    public get events(): typeof kEvents {
        return kEvents;
    }

    private _enabled: boolean = false;
    public get enabled(): boolean {
        return this._enabled;
    }
    public set enabled(value: boolean) {
        if (value !== this._enabled) {
            this._enabled = value;
            if (this._enabled) {
                this.hookEvents();
            } else {
                this.unhookEvents();
            }
        }
    }

    private canvas: HTMLCanvasElement;
    private rect: DOMRectReadOnly;
    private state: MouseState;
    private newState: MouseState;
    private boundHandler: (e: MouseEvent) => void = this.handleMouseEvent.bind(this);
    private disableContextMenu: (e: Event) => void = (e: Event) => e.preventDefault();

    constructor(canvas: HTMLCanvasElement, rect: DOMRectReadOnly, enabled: boolean = true) {
        super();
        this.canvas = canvas;
        this.rect = rect;

        this.state = {
            valid: false,
            clientCoords: vec2.create(),
            canvasCoords: vec2.create(),
            deltaCoords: vec2.create(),
            wheel: 0,
            buttons: {
                primary: false,
                secondary: false,
                auxiliary: false,
                fourth: false,
                fifth: false,
            },
        };

        this.newState = {
            valid: false,
            clientCoords: vec2.create(),
            canvasCoords: vec2.create(),
            deltaCoords: vec2.create(),
            wheel: 0,
            buttons: {
                primary: false,
                secondary: false,
                auxiliary: false,
                fourth: false,
                fifth: false,
            },
        };

        this.enabled = enabled;
    }

    public on(type: symbol, callback: MouseCallback): void {
        super.on(type, callback);
    }

    public resize(rect: DOMRect): void {
        this.rect = rect;
        this.syntheticUpdate(kEvents.move);
    }

    private hookEvents(): void {
        this.canvas.addEventListener('mouseenter', this.boundHandler);
        this.canvas.addEventListener('mouseleave', this.boundHandler);
        this.canvas.addEventListener('mousemove', this.boundHandler);
        this.canvas.addEventListener('mousedown', this.boundHandler);
        this.canvas.addEventListener('mouseup', this.boundHandler);
        this.canvas.addEventListener('click', this.boundHandler);
        this.canvas.addEventListener('wheel', this.boundHandler);

        this.canvas.addEventListener('contextmenu', this.disableContextMenu);
    }

    private unhookEvents(): void {
        this.canvas.removeEventListener('mouseenter', this.boundHandler);
        this.canvas.removeEventListener('mouseleave', this.boundHandler);
        this.canvas.removeEventListener('mousemove', this.boundHandler);
        this.canvas.removeEventListener('mousedown', this.boundHandler);
        this.canvas.removeEventListener('mouseup', this.boundHandler);
        this.canvas.removeEventListener('click', this.boundHandler);
        this.canvas.removeEventListener('wheel', this.boundHandler);

        this.canvas.removeEventListener('contextmenu', this.disableContextMenu);
    }

    public syntheticUpdate(event: symbol, buttonIndex?: number): void {
        switch (event) {
            case kEvents.up:
            case kEvents.down:
            case kEvents.click:
                this.emitEvents([{
                    event,
                    args: [buttonIndex, kIndex2Button[buttonIndex]],
                }]);
                break;

            case kEvents.move:
                this.emitEvents([{
                    event,
                    args: [vec2.fromValues(0, 0), this.state.canvasCoords],
                }]);
                break;

            default:
                break;
        }
    }

    private update(state: MouseState): void {
        const events: EventEntry[] = [];
        if (state.valid !== this.state.valid) {
            this.state.valid = state.valid;
            vec2.copy(this.state.clientCoords, state.clientCoords);
            vec2.copy(this.state.canvasCoords, state.canvasCoords);
        }
        vec2.copy(this.state.deltaCoords, state.deltaCoords);
        vec2.copy(this.state.clientCoords, state.clientCoords);
        vec2.copy(this.state.canvasCoords, state.canvasCoords);

        if (this.state.deltaCoords[0] !== 0 || this.state.deltaCoords[1] !== 0) {
            if (this.state.valid) {
                events.push({
                    event: kEvents.move,
                    args: [this.state.deltaCoords, this.state.canvasCoords],
                });
            }
        }

        const buttonKeys = Object.keys(state.buttons);
        for (let i = 0, n = buttonKeys.length; i < n; ++i) {
            const key = buttonKeys[i];
            const pressed = this.state.valid && state.buttons[key];
            if (this.state.buttons[key] !== pressed) {
                this.state.buttons[key] = pressed;
                events.push({
                    event: pressed ? kEvents.down : kEvents.up,
                    args: [kButton2Index[key], key, pressed],
                });
            }
        }

        this.emitEvents(events);
    }

    private emitEvents(entries: EventEntry[]): void {
        for (let i = 0, n = entries.length; i < n; ++i) {
            this.emit(entries[i].event, this.state, ...entries[i].args);
        }
    }

    private setMouseState(state: MouseState): void {
        this.state.valid = state.valid;
        vec2.copy(this.state.clientCoords, state.clientCoords);
        vec2.copy(this.state.canvasCoords, state.canvasCoords);
        vec2.copy(this.state.deltaCoords, state.deltaCoords);
        this.state.wheel = state.wheel;
        Object.assign(this.state.buttons, state.buttons);
    }

    private handleClickEvent(e: MouseEvent, state: MouseState): void {
        this.setMouseState(state);
        this.emitEvents([{
            event: kEvents.click,
            args: [e.button, kIndex2Button[e.button]],
        }]);
    }

    private handleWheelEvent(e: WheelEvent, state: MouseState): void {
        this.setMouseState(state);

        let delta;
        if ('wheelDeltaY' in e) {
            delta = -(e as any).wheelDeltaY / 120;
        } else {
            delta = (e.deltaY < 1) ? -1 : 1;
        }

        this.emitEvents([{
            event: kEvents.wheel,
            args: [delta],
        }]);
    }

    private handleMouseEvent(e: MouseEvent): void {
        const client = this.newState.clientCoords;
        const canvas = this.newState.canvasCoords;
        const delta = this.newState.deltaCoords;
        const rect = this.rect;

        vec2.set(client, e.clientX, e.clientY);
        vec2.set(canvas, e.clientX - rect.left, e.clientY - rect.top);

        if (e.type === 'mousemove') {
            vec2.set(delta, e.movementX, e.movementY);
        } else {
            vec2.set(delta, 0, 0);
        }

        this.newState.valid = Boolean(
            canvas[0] >= rect.left && canvas[0] <= rect.right &&
            canvas[1] >= rect.top && canvas[1] <= rect.bottom
        );

        this.newState.buttons.primary = Boolean(e.buttons & 1);
        this.newState.buttons.secondary = Boolean(e.buttons & 2);
        this.newState.buttons.auxiliary = Boolean(e.buttons & 4);
        this.newState.buttons.fourth = Boolean(e.buttons & 8);
        this.newState.buttons.fifth = Boolean(e.buttons & 16);

        switch (e.type) {
            case 'click':
                this.handleClickEvent(e, this.newState);
                break;

            case 'wheel':
                this.handleWheelEvent(e as WheelEvent, this.newState);
                break;

            case 'mouseleave':
                this.newState.valid = false;
                /* fallthrough */
            default:
                this.update(this.newState);
                break;
        }
    }
}
