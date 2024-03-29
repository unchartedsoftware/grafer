import {html, render} from 'lit';
import {CameraMode} from '../../../src/renderer/mod';
import {GraferController} from '../../../src/mod';

export async function minimal3D(container: HTMLElement): Promise<void> {
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const nodes = {
        data: [
            { x: -8.6, y: 5.0, z: 5.0 },
            { x: 8.6, y: 5.0, z: 5.0 },
            { x: 0.0, y: -10.0, z: 0.0 },
            { x: 0.0, y: 5.0, z: -8.6 },
            { x: 0.0, y: 0.0, z: 0.0 },
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
