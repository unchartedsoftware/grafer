import {MouseState} from '../MouseHandler';
import {vec2, vec3} from 'gl-matrix';
import {ScrollModule} from './ScrollModule';

export class ScrollScale extends ScrollModule {
    protected handleMouse(event: symbol, state: MouseState, delta: number): void {
        const speed = Math.max(1.001, this.speed * Math.abs(delta) * 0.25);
        const oldScale = this.viewport.graph.scale;

        if (delta > 0) {
            this.viewport.graph.scale = this.viewport.graph.scale / speed;
        } else {
            this.viewport.graph.scale = this.viewport.graph.scale * speed;
        }

        const coords = vec2.fromValues(state.glCoords[0] - this.viewport.size[0] * 0.5, state.glCoords[1] - this.viewport.size[1] * 0.5);
        const distance = vec2.fromValues(coords[0] - this.viewport.graph.translation[0], coords[1] - this.viewport.graph.translation[1]);
        const scale = this.viewport.graph.scale / oldScale;
        const scaled = vec2.fromValues(distance[0] * scale, distance[1] * scale);
        const offset = vec2.sub(vec2.create(), scaled, distance);
        this.viewport.graph.translate(vec3.fromValues(-offset[0], -offset[1], 0));

        this.viewport.render();
    }
}
