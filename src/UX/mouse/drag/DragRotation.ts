import {MouseState, MouseButtonName} from '../MouseHandler';
import {quat, vec2} from 'gl-matrix';
import {DragModule} from './DragModule';

export class DragRotation extends DragModule {
    public button: MouseButtonName = 'secondary';

    protected handleMouse(event: symbol, state: MouseState, delta: vec2): void {
        if (state.buttons[this.button]) {
            const side = Math.min(this.viewport.size[0], this.viewport.size[1]);
            const rawRotation = quat.fromEuler(quat.create(), (delta[1] / side) * 90, (delta[0] / side) * 90, 0);
            const camInverse = quat.invert(quat.create(), this.viewport.camera.rotation);
            const rotation = quat.mul(quat.create(), camInverse, rawRotation);
            quat.mul(rotation, rotation, this.viewport.camera.rotation);
            this.viewport.graph.rotate(rotation);
            this.viewport.render();
        }
    }
}
