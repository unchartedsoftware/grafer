import {DragModule} from './DragModule';
import {MouseState} from '../MouseHandler';
import {quat, vec2, vec3} from 'gl-matrix';

export class DragTruck extends DragModule {
    protected handleMouse(event: symbol, state: MouseState, delta: vec2): void {
        if (state.buttons[this.button]) {
            const position = this.viewport.camera.position;
            const rotated = vec3.transformQuat(vec3.create(), position, this.viewport.camera.rotation);
            const distance = Math.abs(rotated[2]); // vec3.length(position); // use the rotated z distance instead
            const vertical = this.viewport.camera.aovRad * distance; // good enough approximation
            const pixelToWorld = vertical / this.viewport.rect.height;

            const delta3 = vec3.fromValues(delta[0] * pixelToWorld, delta[1] * -pixelToWorld, 0);
            const inverse = quat.invert(quat.create(), this.viewport.camera.rotation);
            vec3.transformQuat(delta3, delta3, inverse);

            vec3.add(position, position, delta3);
            this.viewport.camera.position = position;

            this.viewport.render();
        }
    }
}
