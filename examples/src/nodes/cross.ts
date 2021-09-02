import {html, render} from 'lit-html';
import {GraferController, GraferLayerData, GraferNodesData} from '../../../src/grafer/GraferController';

function createNodePoints(count: number, radius: number = 10.0): any[] {
    const PI2 = Math.PI * 2;
    const degStep = (PI2) / count;
    const result = [];

    for (let angle = 0, i = 0; angle < PI2; angle += degStep, ++i) {
        const pX = Math.cos(angle) * radius;
        const pY = Math.sin(angle) * radius;
        result.push({
            id: `p${i}-${radius}`,
            x: pX,
            y: pY,
        });
    }

    return result;
}

export async function cross(container: HTMLElement): Promise<void> {
    const nodes: GraferNodesData = {
        type: 'Cross',
        data: [
            ...createNodePoints(10, 10),
            ...createNodePoints(5, 5),
        ],
    };

    const layers: GraferLayerData[] = [
        { nodes },
    ];

    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    new GraferController(canvas, { layers });
}
