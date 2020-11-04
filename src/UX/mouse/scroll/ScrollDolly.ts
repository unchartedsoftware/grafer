import {MouseState} from '../MouseHandler';
import {mat4, vec2, vec3, vec4} from 'gl-matrix';
import {ScrollModule} from './ScrollModule';

export class ScrollDolly extends ScrollModule {
    protected handleMouse(event: symbol, state: MouseState, delta: number): void {
        const invProjection = mat4.invert(mat4.create(), this.viewport.camera.projectionMatrix);
        const invView = mat4.invert(mat4.create(), this.viewport.camera.viewMatrix);

        const viewportCoords = vec2.fromValues(
            state.canvasCoords[0] * this.viewport.pixelRatio,
            state.canvasCoords[1] * this.viewport.pixelRatio
        );
        const worldCoords = vec2.fromValues(
            (2.0 * viewportCoords[0]) / this.viewport.size[0] - 1.0,
            1.0 - (2.0 * viewportCoords[1]) / this.viewport.size[1]
        );
        const rayClip = vec4.fromValues(worldCoords[0], worldCoords[1], -1, 1);

        const rayEye = vec4.transformMat4(vec4.create(), rayClip, invProjection);
        rayEye[2] = -1.0;
        rayEye[3] = 0.0;

        const rayWorld4 = vec4.transformMat4(vec4.create(), rayEye, invView);
        const rayWorld = vec3.fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
        vec3.normalize(rayWorld, rayWorld);

        const position = this.viewport.camera.position;
        vec3.scaleAndAdd(position, position, rayWorld, delta * this.speed);

        this.viewport.camera.position = position;

        this.viewport.render();
    }
}
