import {html, render} from 'lit';
import {GraferController, GraferEdgesData, GraferLayerData} from '../../../src/grafer/GraferController';

export async function circuitBoard(container: HTMLElement): Promise<void> {

    // create an array od colors to be used
    const colors = [
        /* 0 */ '#d08770',
        /* 1 */ '#88c0d0',
    ];

    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'p1-p1', x: -10.0, y: -5.0 },
            { id: 'p1-c1', x: 8.0, y: -5.0 },
            { id: 'p1-c2', x: 10.0, y: -5.0 },
            { id: 'p1-c3', x: 10.0, y: -3.0 },
            { id: 'p1-p2', x: 10.0, y: 11.0 },

            { id: 'p2-p1', x: -10.0, y: -8.0 },
            { id: 'p2-c1', x: 10.0, y: -8.0 },
            { id: 'p2-c2', x: 13.0, y: -8.0 },
            { id: 'p2-c3', x: 13.0, y: -5.0 },
            { id: 'p2-p2', x: 13.0, y: 11.0 },

            { id: 'p3-p1', x: -10.0, y: -11.0 },
            { id: 'p3-c1', x: 12.0, y: -11.0 },
            { id: 'p3-c2', x: 16.0, y: -11.0 },
            { id: 'p3-c3', x: 16.0, y: -7.0 },
            { id: 'p3-p2', x: 16.0, y: 11.0 },

            { id: 'origin', x: 0.0, y: 5.0, radius: 8.0 },
        ],
    };

    // nodes reference points
    const nodes = {
        data: [
            { point: 'p1-p1' },
            { point: 'p1-p2' },
            { point: 'p2-p1' },
            { point: 'p2-p2' },
            { point: 'p3-p1' },
            { point: 'p3-p2' },
            { point: 'origin', color: 1 },
        ],
    };

    const edges: GraferEdgesData = {
        type: 'CurvedPath',
        data: [
            { source: 'p1-p1', target: 'p1-p2', control: ['p1-c1', 'p1-c2', 'p1-c3'] },
            { source: 'p2-p1', target: 'p2-p2', control: ['p2-c1', 'p2-c2', 'p2-c3'] },
            { source: 'p3-p1', target: 'p3-p2', control: ['p3-c1', 'p3-c2', 'p3-c3'] },
        ],
    };

    const layers: GraferLayerData[] = [
        { nodes, edges },
    ];

    // pass the points to grafer
    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    new GraferController(canvas, { colors, points, layers });
}
