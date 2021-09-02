import {html, render} from 'lit-html';
import {GraferController} from '../../../src/grafer/GraferController';
import {GraferInputColor} from '../../../src/renderer/colors/ColorRegistry';

export async function mappings(container: HTMLElement): Promise<void> {

    const colors: GraferInputColor[] = [
        /* 0 */ 'red',
        /* 1 */ 'limegreen',
        /* 2 */ [0, 0, 255],
        /* 3 */ '#88c0d0',
        /* 4 */ [255, 255, 0],
        /* 5 */ [0, 255, 255],
        /* 6 */ [255, 0, 255],
        /* 7 */ 'white',
    ];

    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'left', x: -8.6, y: 5.0 },
            { id: 'right', x: 8.6, y: 5.0 },
            { id: 'bottom', x: 0.0, y: -10.0 },
            { id: 'center', x: 0.0, y: 0.0 },
        ],
    };

    // nodes reference points
    const nodes = {
        data: [
            { point: 'left', color: 0 },
            { point: 'right', color: 1 },
            { point: 'bottom', color: 2 },
            { point: 'center', color: 3 },
        ],
    };

    // edges also reference points
    const edges = {
        data: [
            { source: 'left', target: 'right', color: 4 },
            { source: 'right', target: 'bottom', color: 5 },
            { source: 'bottom', target: 'left', color: 6 },

            { source: 'center', target: 'left', color: 7 },
            { source: 'center', target: 'right', color: 7 },
            { source: 'center', target: 'bottom', color: 7 },
        ],
        // using mappings we can compute properties
        mappings: {
            sourceColor: (entry): number => entry.color,
            targetColor: (entry): number => entry.color,
        },
    };

    const layers = [
        { nodes, edges },
    ];

    // pass the points, colors and layers to grafer
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    new GraferController(canvas, { colors, points, layers });
}
