import {html, render} from 'lit-html';
import {GraferController} from '../../../src/mod';

export async function hierarchy(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const points = {
        data: [
            { id: 0, x: 0, y: 0 },
            { id: 1, x: 2, y: 0, parentId: 0 },
            { id: 2, x: 2, y: 0, parentId: 1 },
        ],
    };
    const nodes = {
        ...points,
        mappings: {
            point: (d: any): number => d.id,
        },
    };

    new GraferController(canvas, { points, layers: [{nodes}] });
}
