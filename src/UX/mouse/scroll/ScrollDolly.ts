import {Viewport} from '../../../renderer/Viewport';
import {MouseState} from '../MouseHandler';
import {mat4, vec2, vec3, vec4} from 'gl-matrix';

export class ScrollDolly {
    public zoomSpeed: number = 4.5;

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

    private viewport: Viewport;
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

    private handleMouse(event: symbol, state: MouseState, delta: number): void {
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
        vec3.scaleAndAdd(position, position, rayWorld, delta * this.zoomSpeed);

        this.viewport.camera.position = position;

        this.viewport.render();
    }
}
