import {Viewport} from '../../../renderer/Viewport';
import {MouseState, kButton2Index} from '../MouseHandler';
import {vec2} from 'gl-matrix';

export abstract class DragBase {
    public button: keyof typeof kButton2Index = 'primary';

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

    protected viewport: Viewport;
    private boundHandler: (arg1: symbol, arg2: MouseState, arg3: vec2) => void = this.handleMouse.bind(this);

    constructor(viewport: Viewport, enabled: boolean = false) {
        this.viewport = viewport;
        this.enabled = enabled;
    }

    private hookEvents(): void {
        this.viewport.mouseHandler.on(this.viewport.mouseHandler.events.move, this.boundHandler);
    }

    private unhookEvents(): void {
        this.viewport.mouseHandler.off(this.viewport.mouseHandler.events.move, this.boundHandler);
    }

    protected abstract handleMouse(event: symbol, state: MouseState, delta: vec2): void;
}
