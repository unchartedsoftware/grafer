import {Viewport} from '../../../renderer/Viewport';
import {MouseState} from '../MouseHandler';

export abstract class ScrollBase {
    public speed: number = 4.5;

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
    private boundHandler: (arg1: symbol, arg2: MouseState, arg3: number) => void = this.handleMouse.bind(this);

    constructor(viewport: Viewport, enabled: boolean = false) {
        this.viewport = viewport;
        this.enabled = enabled;
    }

    private hookEvents(): void {
        this.viewport.mouseHandler.on(this.viewport.mouseHandler.events.wheel, this.boundHandler);
    }

    private unhookEvents(): void {
        this.viewport.mouseHandler.off(this.viewport.mouseHandler.events.wheel, this.boundHandler);
    }

    protected abstract handleMouse(event: symbol, state: MouseState, delta: number): void;
}

