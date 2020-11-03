import {DragBase} from './DragBase';
import {MouseState} from '../MouseHandler';
import {vec2, vec3} from 'gl-matrix';

export class DragTruck extends DragBase {
    protected handleMouse(event: symbol, state: MouseState, delta: vec2): void {
        if (state.buttons[this.button]) {
            const position = this.viewport.camera.position;
            const distance = vec3.length(position);
            const vertical = this.viewport.camera.aovRad * distance; // Math.sin(this.viewport.camera.aovRad) * distance;
            const mult = vertical / this.viewport.rect.height;

            position[0] += delta[0] * mult;
            position[1] -= delta[1] * mult;
            this.viewport.camera.position = position;

            this.viewport.render();
        }
    }
}
