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
        });
    }

    return result;
}

export async function star(container: HTMLElement): Promise<void> {
    const nodesStar5 = {
        type: 'Star',
        data: createNodePoints(10, 10),
    };

    const nodesStar10 = {
        type: 'Star',
        data: createNodePoints(5, 5),
        options: {
            sides: 10,
            angleDivisor: 2.5,
        },
    };

    const layers = [
        { nodes: nodesStar5 },
        { nodes: nodesStar10 },
    ];

    render(html`<grafer-view class="grafer_container" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}
