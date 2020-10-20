import {Viewport} from '../renderer/Viewport';

export class DragRotation {
    private viewport: Viewport;
    private boundHandler: (evt: MouseEvent) => void = this.handleMouse.bind(this);

    private dragging: boolean = false;

    constructor(viewport: Viewport) {
        this.viewport = viewport;
    }

    public start(): void {
        this.viewport.canvas.addEventListener('mousedown', this.boundHandler);
        this.viewport.canvas.addEventListener('mouseup', this.boundHandler);
        this.viewport.canvas.addEventListener('mouseout', this.boundHandler);
        this.viewport.canvas.addEventListener('mousemove', this.boundHandler);
    }

    public stop(): void {
        this.viewport.canvas.removeEventListener('mousedown', this.boundHandler);
        this.viewport.canvas.removeEventListener('mouseup', this.boundHandler);
        this.viewport.canvas.removeEventListener('mouseout', this.boundHandler);
        this.viewport.canvas.removeEventListener('mousemove', this.boundHandler);
    }

    private handleMouse(evt: MouseEvent): void {
        switch (evt.type) {
            case 'mousedown':
                this.dragging = true;
                break;

            case 'mouseup':
            case 'mouseout':
                this.dragging = false;
                break;

            case 'mousemove':
                if (this.dragging) {
                    const side = Math.min(this.viewport.size[0], this.viewport.size[1]);
                    this.viewport.graph.rotate((evt.movementY / side) * 90, (evt.movementX / side) * 90, 0);
                    this.viewport.render();
                }
                break;
        }
    }
}
