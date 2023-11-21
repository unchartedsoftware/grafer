import {html, render} from 'lit';
import {GraferController} from '../../../src/mod';

function generateRandomPointData(startIndex: number, count: number): unknown[] {
    const data = [];
    for (let i = 0; i < count; ++i) {
        data.push({
            id: `p_${startIndex + i}`,
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            radius: 1.0,
        });
    }
    return data;
}

let gPointCount = 0;
function addNewPoints(controller: GraferController): void {
    const data = generateRandomPointData(gPointCount, 50);
    controller.viewport.graph.addPoints(data);

    const nodeData = data.map(p => ({ point: (p as any).id }));
    const layer = {
        nodes: {
            data: nodeData,
        },
    };
    controller.addLayer(layer, `newNodes_${gPointCount}`);
    controller.render();

    gPointCount += 50;
}

export async function addPoints(container: HTMLElement): Promise<void> {

    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'tl', x: -100, y: -100, radius: 4 },
            { id: 'tr', x: 100, y: -100, radius: 4 },
            { id: 'bl', x: -100, y: 100, radius: 4 },
            { id: 'br', x: 100, y: 100, radius: 4 },
        ],
    };

    // nodes reference points
    const nodes = {
        data: [
            { point: 'tl' },
            { point: 'tr' },
            { point: 'bl' },
            { point: 'br' },
        ],
    };

    // edges also reference points
    const edges = {
        data: [
            { source: 'tl', target: 'tr' },
            { source: 'tr', target: 'br' },
            { source: 'br', target: 'bl' },
            { source: 'bl', target: 'tl' },
        ],
    };

    const layers = [
        { nodes, edges },
    ];

    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

    const controller = new GraferController(canvas, { points, layers });
    addNewPoints(controller);
    setInterval(() => addNewPoints(controller), 5000);
}
