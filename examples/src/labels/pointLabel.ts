import {html, render} from 'lit-html';
import '../../../src/grafer/GraferView';

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
    const nodes = {
        type: 'Circle',
        data: [
            ...createNodePoints(10, 10),
            ...createNodePoints(5, 5),
        ],
    };

    const labels = {
        type: 'PointLabel',
        data: nodes.data,
        options: {
            visibilityThreshold: 50,
            labelPlacement: 1,
            renderBackground: true,
            padding: 6,
        },
    };

    const layers = [
        { nodes, labels },
    ];

    const colors = [
        '#bf616a',
        '#d08770',
        '#ebcb8b',
        '#a3be8c',
        '#b48ead',
    ];

    render(html`<grafer-view class="grafer_container" .colors="${colors}" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}
