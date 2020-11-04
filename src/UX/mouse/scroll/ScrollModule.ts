import {Viewport} from '../../../renderer/Viewport';
import {MouseState} from '../MouseHandler';
import {UXModule} from '../../UXModule';

export abstract class ScrollModule extends UXModule {
    public speed: number = 4.5;

    protected viewport: Viewport;
    private boundHandler: (arg1: symbol, arg2: MouseState, arg3: number) => void = this.handleMouse.bind(this);

    constructor(viewport: Viewport, enabled: boolean = false) {
        super();
        this.viewport = viewport;
        this.enabled = enabled;
    }

    protected hookEvents(): void {
        this.viewport.mouseHandler.on(this.viewport.mouseHandler.events.wheel, this.boundHandler);
    }

    protected unhookEvents(): void {
        this.viewport.mouseHandler.off(this.viewport.mouseHandler.events.wheel, this.boundHandler);
    }

    protected abstract handleMouse(event: symbol, state: MouseState, delta: number): void;
}

