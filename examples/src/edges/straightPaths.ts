import {html, render} from 'lit-html';
import {GraferController, GraferEdgesData} from '../../../src/grafer/GraferController';
import {GraferInputColor} from '../../../src/renderer/colors/ColorRegistry';

export async function straightPaths(container: HTMLElement): Promise<void> {

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
            { id: 'left', x: -15, y: 0.0 },
            { id: 'right', x: 15, y: 0.0 },

            { id: 'p0', x: -13, y: 0.0 },
            { id: 'p1', x: -12, y: -5.0 },
            { id: 'p2', x: -11, y: 5.0 },
            { id: 'p3', x: -10, y: 0.0 },

            { id: 'p4', x: -2, y: 0.0 },
            { id: 'p5', x: -1, y: -5.0 },
            { id: 'p6', x: 0, y: 5.0 },
            { id: 'p7', x: 1, y: 0.0 },

            { id: 'p8', x: 9, y: 0.0 },
            { id: 'p9', x: 10, y: -5.0 },
            { id: 'p10', x: 11, y: 5.0 },
            { id: 'p11', x: 12, y: 0.0 },
        ],
    };

    // nodes reference points
    const nodes = {
        data: [
            { point: 'left', color: 3 },
            { point: 'right', color: 1 },
        ],
        mappings: {
            radius: (entry): number => entry.radius || 1,
        },
    };

    const controls = [];
    for (let i = 0; i < 12; ++i) {
        controls.push(`p${i}`);
    }

    // edges also reference points
    const edges: GraferEdgesData = {
        type: 'StraightPath',
        data: [
            { source: 'left', target: 'right', control: controls, sourceColor: 3, targetColor: 1 },
        ],
    };

    const layers = [
        { nodes, edges },
    ];

    // pass the points to grafer
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    new GraferController(canvas, { colors, points, layers });
}
