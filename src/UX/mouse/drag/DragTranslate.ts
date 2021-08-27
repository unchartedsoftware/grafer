import {DragModule} from './DragModule';
import {MouseState} from '../MouseHandler';
import {vec2} from 'gl-matrix';

export class DragTranslate extends DragModule {
    protected handleMouse(event: symbol, state: MouseState, delta: vec2): void {
        if (state.buttons[this.button]) {
            this.viewport.graph.translate([delta[0], -delta[1], 0]);

            this.viewport.render();
        }
    }
}
