import {html, render} from 'lit-html';
import {CameraMode} from '../../../src/renderer/mod';
import {GraferController} from '../../../src/mod';

export async function nodeColors(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const nodes = {
        data: [
            { x: -8.6, y: 5.0, z: 5.0, color: 'limegreen' },
            { x: 8.6, y: 5.0, z: 5.0, color: '#af3a6f' },
            { x: 0.0, y: -10.0, z: 0.0, color: [128, 230, 255] },
            { x: 0.0, y: 5.0, z: -8.6, color: 'rgb(40, 40, 189)' },
            { x: 0.0, y: 0.0, z: 0.0, color: 'yellow' },
        ],
    };

    const edges = {
        data: [
            { source: 0, target: 1 },
            { source: 0, target: 2 },
            { source: 0, target: 3 },

            { source: 1, target: 2 },
            { source: 1, target: 3 },

            { source: 2, target: 3 },

            { source: 4, target: 0 },
            { source: 4, target: 1 },
            { source: 4, target: 2 },
            { source: 4, target: 3 },
        ],
    };

    const layers = [
        { nodes, edges },
    ];

    new GraferController(canvas, { layers }, {
        viewport: {
            camera: {
                mode: CameraMode['3D'],
            },
        },
    });
}
