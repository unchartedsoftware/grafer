import {html, render} from 'lit-html';
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
            label: `NODE P${i}-R${radius}`,
            color: Math.round(Math.random() * 4) + 1,
            background: true,
            fontSize: 16,
        });
    }

    return result;
}

export async function circularLabel(container: HTMLElement): Promise<void> {
    const nodes: GraferNodesData = {
        type: 'Circle',
        data: [
            ...createNodePoints(10, 16),
            ...createNodePoints(5, 8),
        ],
    };

    const labels: GraferLabelsData = {
        type: 'CircularLabel',
        data: nodes.data,
        options: {
            visibilityThreshold: 40,
            repeatLabel: -1,
            placementMargin: 5,
            renderBackground: true,
            mirror: false,
            padding: 6,
            repeatGap: 25,
        },
    };

    const layers: GraferLayerData[] = [
        { nodes, labels },
    ];

    const colors = [
        'white',
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
