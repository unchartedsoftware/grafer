import {html, render} from 'lit';
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

export async function star(container: HTMLElement): Promise<void> {
    const nodesStar5: GraferNodesData = {
        type: 'Star',
        data: createNodePoints(10, 10),
    };

    const nodesStar10: GraferNodesData = {
        type: 'Star',
        data: createNodePoints(5, 5),
        options: {
            sides: 10,
            angleDivisor: 2.5,
        },
    };

    const layers: GraferLayerData[] = [
        { nodes: nodesStar5 },
        { nodes: nodesStar10 },
    ];

    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    new GraferController(canvas, { layers });
}
