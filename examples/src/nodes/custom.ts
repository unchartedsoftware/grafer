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
            texture: Math.random() > 0.5 ? 1 : 0,
            color: Math.round(Math.random() * 6),
        });
    }

    return result;
}

export async function custom(container: HTMLElement): Promise<void> {
    const nodes: GraferNodesData = {
        type: 'Custom',
        data: [
            ...createNodePoints(10, 10),
            ...createNodePoints(5, 5),
        ],
    };

    const layers: GraferLayerData[] = [
        { nodes },
    ];

    const colors = [
        'white',
        '#bf616a',
        '#d08770',
        '#ebcb8b',
        '#a3be8c',
        '#b48ead',
    ];

    const textures = [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Tokugawa_family_crest.svg/1920px-Tokugawa_family_crest.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Take_ni_Suzume.svg/2560px-Take_ni_Suzume.svg.png',
    ];

    render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    new GraferController(canvas, { textures, colors, layers });
}
