import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';
import {vec2} from 'gl-matrix';
import {UXModule} from '../UXModule';

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
    pixelRatio: number;
    clientCoords: vec2;
    canvasCoords: vec2;
    glCoords: vec2;
    deltaCoords: vec2;
    clickPositionDelta: vec2;
    clickValid: boolean;
    wheel: number;
    buttons: {
        primary: boolean;
        secondary: boolean;
        auxiliary: boolean;
        fourth: boolean;
        fifth: boolean;
    };
}

export type MouseHandlerEventsMap = { [K in keyof typeof kEvents]: ReturnType<() => { readonly 0: unique symbol }[0]> };
export type MouseHandlerEvent = MouseHandlerEventsMap[keyof MouseHandlerEventsMap];
export type MouseButtonIndex = keyof typeof kIndex2Button & number;
export type MouseButtonName = keyof typeof kButton2Index;
export type MouseMoveHandler = (event: MouseHandlerEvent, state: MouseState, delta: vec2, canvasCoords: vec2) => void;
export type MouseDownHandler = (event: MouseHandlerEvent, state: MouseState, buttonIndex: MouseButtonIndex, buttonName: MouseButtonName, pressed: boolean) => void;
export type MouseUpHandler = (event: MouseHandlerEvent, state: MouseState, buttonIndex: MouseButtonIndex, buttonName: MouseButtonName, pressed: boolean) => void;
export type MouseClickHandler = (event: MouseHandlerEvent, state: MouseState, buttonIndex: MouseButtonIndex, buttonName: MouseButtonName) => void;
export type MouseWheelHandler = (event: MouseHandlerEvent, state: MouseState, wheel: number) => void;
export type MouseCallback = MouseMoveHandler | MouseDownHandler | MouseUpHandler | MouseClickHandler | MouseWheelHandler;

export class MouseHandler extends EventEmitter.mixin(UXModule) {
    public static get events(): MouseHandlerEventsMap {
        return kEvents as MouseHandlerEventsMap;
    }

    private canvas: HTMLCanvasElement;
    private rect: DOMRectReadOnly;
    private pixelRatio: number;
    private state: MouseState;
    private newState: MouseState;
    private boundHandler: (e: MouseEvent) => void = this.handleMouseEvent.bind(this);
    private disableContextMenu: (e: Event) => void = (e: Event) => e.preventDefault();

    public clickDragThreshold: number = 10;

    constructor(canvas: HTMLCanvasElement, rect: DOMRectReadOnly, pixelRatio: number, enabled: boolean = true) {
        super();
        this.canvas = canvas;
        this.rect = rect;
        this.pixelRatio = pixelRatio;

        this.state = {
            valid: false,
            pixelRatio: this.pixelRatio,
            clientCoords: vec2.create(),
            canvasCoords: vec2.create(),
            glCoords: vec2.create(),
            deltaCoords: vec2.create(),
            clickPositionDelta: vec2.create(),
            clickValid: false,
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
            pixelRatio: this.pixelRatio,
            clientCoords: vec2.create(),
            canvasCoords: vec2.create(),
            glCoords: vec2.create(),
            deltaCoords: vec2.create(),
            clickPositionDelta: vec2.create(),
            clickValid: false,
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

    public on(type: MouseHandlerEvent, callback: MouseCallback): void {
        super.on(type, callback);
    }

    public off(type: MouseHandlerEvent, callback: MouseCallback): void {
        super.off(type, callback);
    }

    public resize(rect: DOMRect, pixelRatio: number): void {
        this.rect = rect;
        this.pixelRatio = pixelRatio;
        this.state.pixelRatio = this.pixelRatio;
        this.newState.pixelRatio = this.pixelRatio;
        this.syntheticUpdate(kEvents.move);
    }

    protected hookEvents(): void {
        this.canvas.addEventListener('mouseenter', this.boundHandler);
        this.canvas.addEventListener('mouseleave', this.boundHandler);
        this.canvas.addEventListener('mousemove', this.boundHandler);
        this.canvas.addEventListener('mousedown', this.boundHandler);
        this.canvas.addEventListener('mouseup', this.boundHandler);
        // click needs to be emulated because it triggers even after dragging for a long distance
        // this.canvas.addEventListener('click', this.boundHandler);
        this.canvas.addEventListener('wheel', this.boundHandler);

        this.canvas.addEventListener('contextmenu', this.disableContextMenu);
    }

    protected unhookEvents(): void {
        this.canvas.removeEventListener('mouseenter', this.boundHandler);
        this.canvas.removeEventListener('mouseleave', this.boundHandler);
        this.canvas.removeEventListener('mousemove', this.boundHandler);
        this.canvas.removeEventListener('mousedown', this.boundHandler);
        this.canvas.removeEventListener('mouseup', this.boundHandler);
        // this.canvas.removeEventListener('click', this.boundHandler);
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
        if (state.deltaCoords[0] !== 0 || state.deltaCoords[1] !== 0) {
            if (state.valid) {
                events.push({
                    event: kEvents.move,
                    args: [state.deltaCoords, state.canvasCoords],
                });
            }
        }

        const buttonKeys = Object.keys(state.buttons);
        for (let i = 0, n = buttonKeys.length; i < n; ++i) {
            const key = buttonKeys[i];
            const pressed = state.valid && state.buttons[key];
            if (this.state.buttons[key] !== pressed) {
                this.state.buttons[key] = pressed;
                events.push({
                    event: pressed ? kEvents.down : kEvents.up,
                    args: [kButton2Index[key], key, pressed],
                });
            }
        }
        this.setMouseState(state);
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
        vec2.copy(this.state.glCoords, state.glCoords);
        vec2.copy(this.state.deltaCoords, state.deltaCoords);
        vec2.copy(this.state.clickPositionDelta, state.clickPositionDelta);
        this.state.clickValid = state.clickValid;
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

        if (e.deltaY) {
            const sign = e.deltaY / Math.abs(e.deltaY);

            const delta = sign * Math.min(Math.abs(e.deltaY), 10) / 10;

            this.emitEvents([{
                event: kEvents.wheel,
                args: [delta],
            }]);
        }
    }

    private handleMouseEvent(e: MouseEvent): void {
        const client = this.newState.clientCoords;
        const canvas = this.newState.canvasCoords;
        const gl = this.newState.glCoords;
        const delta = this.newState.deltaCoords;
        const rect = this.rect;

        vec2.set(client, e.clientX, e.clientY);
        vec2.set(canvas, e.clientX - rect.left, e.clientY - rect.top);
        vec2.set(gl, (e.clientX - rect.left) * this.pixelRatio, (rect.bottom - e.clientY) * this.pixelRatio);

        if (e.type === 'mousemove') {
            vec2.set(delta, e.movementX, e.movementY);
            if (this.state.clickValid) {
                vec2.add(this.newState.clickPositionDelta, this.state.clickPositionDelta, delta);
                if (vec2.length(this.newState.clickPositionDelta) > this.clickDragThreshold) {
                    this.newState.clickValid = false;
                }
            }
        } else {
            vec2.set(delta, 0, 0);
        }

        this.newState.valid = Boolean(
            canvas[0] >= 0 && canvas[0] <= rect.width &&
            canvas[1] >= 0 && canvas[1] <= rect.height
        );

        this.newState.buttons.primary = Boolean(e.buttons & 1);
        this.newState.buttons.secondary = Boolean(e.buttons & 2);
        this.newState.buttons.auxiliary = Boolean(e.buttons & 4);
        this.newState.buttons.fourth = Boolean(e.buttons & 8);
        this.newState.buttons.fifth = Boolean(e.buttons & 16);

        switch (e.type) {
            case 'mousedown':
                if (this.newState.buttons.primary) {
                    this.newState.clickValid = true;
                    vec2.set(this.newState.clickPositionDelta, 0, 0);
                }
                this.update(this.newState);
                break;

            case 'mouseup':
                if (this.state.clickValid) {
                    this.handleClickEvent(e, this.newState);
                }
                this.update(this.newState);
                break;

            // click has to be simulated because it triggers on the canvas even after dragging
            // case 'click':
            //     this.handleClickEvent(e, this.newState);
            //     break;

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
