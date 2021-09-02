import {html, render} from 'lit-html';
import {GraferController} from '../../../src/grafer/GraferController';
import {GraferInputColor} from '../../../src/renderer/colors/ColorRegistry';

export async function colors(container: HTMLElement): Promise<void> {

    // create an array od colors to be used
    const colors: GraferInputColor[] = [
        /* 0 */ 'red',
        /* 1 */ 'limegreen',
        /* 2 */ [0, 0, 255],
        /* 3 */ '#88c0d0',
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

    // nodes reference points and colors by their index
    const nodes = {
        data: [
            { point: 'left', color: 0 },
            { point: 'right', color: 1 },
            { point: 'bottom', color: 2 },
            { point: 'center', color: 3 },
        ],
    };

    // edges also reference points and colors by their index
    const edges = {
        data: [
            { source: 'left', target: 'right', sourceColor: 0, targetColor: 1 },
            { source: 'right', target: 'bottom', sourceColor: 1, targetColor: 2 },
            { source: 'bottom', target: 'left', sourceColor: 2, targetColor: 0 },

            { source: 'center', target: 'left', sourceColor: 3, targetColor: 0 },
            { source: 'center', target: 'right', sourceColor: 3, targetColor: 1 },
            { source: 'center', target: 'bottom', sourceColor: 3, targetColor: 2 },
        ],
    };

    const layers = [
        { nodes, edges },
    ];

    // pass the points, colors and layers to grafer
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    new GraferController(canvas, { colors, points, layers });
}
