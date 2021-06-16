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
            label: `NODE P${i}-R${radius}`,
            color: Math.round(Math.random() * 4) + 1,
            background: true,
            fontSize: 16,
        });
    }

    return result;
}

export async function circularLabel(container: HTMLElement): Promise<void> {
    const nodes = {
        type: 'Circle',
        data: [
            ...createNodePoints(10, 16),
            ...createNodePoints(5, 8),
        ],
    };

    const labels = {
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

    const layers = [
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

    render(html`
        <grafer-view class="grafer_container" .colors="${colors}" .layers="${layers}"></grafer-view>
        <canvas id="debug_canvas" class="grafer_container"></canvas>
        <mouse-interactions></mouse-interactions>
    `, container);
}
