import {html, render} from 'lit';
import {
    GraferController,
    GraferLabelsData,
    GraferLayerData,
    GraferNodesData,
} from '../../../src/grafer/GraferController';

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
            radius: 2,
            label: `Node p${i}-r${radius}`,
            color: Math.round(Math.random() * 4),
            fontSize: 16,
        });
    }

    return result;
}

export async function pointLabel(container: HTMLElement): Promise<void> {
    const nodes: GraferNodesData = {
        type: 'Circle',
        data: [
            ...createNodePoints(10, 10),
            ...createNodePoints(5, 5),
        ],
    };

    const labels: GraferLabelsData = {
        type: 'PointLabel',
        data: nodes.data,
        options: {
            visibilityThreshold: 50,
            labelPlacement: 1,
            renderBackground: true,
            padding: 6,
        },
    };

    const layers: GraferLayerData[] = [
        { nodes, labels },
    ];

    const colors = [
        '#bf616a',
        '#d08770',
        '#ebcb8b',
        '#a3be8c',
        '#b48ead',
    ];

    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    new GraferController(canvas, { colors, layers });
}
