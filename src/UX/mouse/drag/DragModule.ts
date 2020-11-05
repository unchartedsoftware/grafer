import {Viewport} from '../../../renderer/Viewport';
import {MouseState, MouseButtonName} from '../MouseHandler';
import {vec2} from 'gl-matrix';
import {UXModule} from '../../UXModule';

export abstract class DragModule extends UXModule {
    public button: MouseButtonName = 'primary';

    protected viewport: Viewport;
    private boundHandler: (arg1: symbol, arg2: MouseState, arg3: vec2) => void = this.handleMouse.bind(this);

    constructor(viewport: Viewport, enabled: boolean = false) {
        super();
        this.viewport = viewport;
        this.enabled = enabled;
    }

    protected hookEvents(): void {
        this.viewport.mouseHandler.on(this.viewport.mouseHandler.events.move, this.boundHandler);
    }

    protected unhookEvents(): void {
        this.viewport.mouseHandler.off(this.viewport.mouseHandler.events.move, this.boundHandler);
    }

    protected abstract handleMouse(event: symbol, state: MouseState, delta: vec2): void;
}
