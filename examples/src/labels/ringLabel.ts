import {html, render} from 'lit';
import {GraferController, GraferLabelsData, GraferLayerData} from '../../../src/grafer/GraferController';

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
            background: false,
            fontSize: 12,
            padding: 0,
        });
    }

    return result;
}

export async function ringLabel(container: HTMLElement): Promise<void> {
    const nodes = {
        type: 'Circle',
        data: [
            ...createNodePoints(10, 16),
            ...createNodePoints(5, 8),
        ],
    };

    const labels: GraferLabelsData = {
        type: 'RingLabel',
        data: nodes.data,
        options: {
            visibilityThreshold: 100,
            repeatLabel: 5,
            repeatGap: 15,
        },
    };

    const layers: GraferLayerData[] = [
        { labels },
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
