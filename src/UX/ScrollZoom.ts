import {Viewport} from '../renderer/Viewport';

export class ScrollZoom {
    private viewport: Viewport;
    private boundHandler: (evt: WheelEvent) => void = this.handleMouse.bind(this);

    constructor(viewport: Viewport) {
        this.viewport = viewport;
    }

    public start(): void {
        this.viewport.canvas.addEventListener('wheel', this.boundHandler);
    }

    public stop(): void {
        this.viewport.canvas.removeEventListener('wheel', this.boundHandler);
    }

    private handleMouse(evt: WheelEvent): void {
        const position = this.viewport.camera.position;
        position[2] = Math.max(0.0, position[2] + evt.deltaY * 0.1);
        this.viewport.camera.position = position;
        this.viewport.render();
    }
}
