import {MouseState} from '../MouseHandler';
import {vec2, quat} from 'gl-matrix';
import {DragBase} from './DragBase';

export class DragPan extends DragBase {
    protected handleMouse(event: symbol, state: MouseState, delta: vec2): void {
        if (state.buttons[this.button]) {
            const aspect = this.viewport.size[0] / this.viewport.size[1];

            const aov = this.viewport.camera.aov;
            const rotationX = -aov * (delta[1] / this.viewport.rect.height);
            const rotationY = -aov * (delta[0] / this.viewport.rect.width) * aspect;

            const r = quat.fromEuler(quat.create(), rotationX, rotationY, 0);
            this.viewport.camera.rotate(r);

            this.viewport.render();
        }
    }
}
