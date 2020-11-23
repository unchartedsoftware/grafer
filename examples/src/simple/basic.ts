import {html, render} from 'lit-html';
import '../../../src/grafer/GraferView';

export async function basic(container: HTMLElement): Promise<void> {
    const nodes = {
        data: [
                { x: -10.0, y: 10.0, radius: 1.0 },
                { x: 10.0, y: 10.0, radius: 1.2 },
                { x: 0.0, y: -10.0, radius: 1.4 },
                { x: 0.0, y: 0.0, radius: 1.6 },
        ],
    };

    const ringNodes = {
        type: 'Ring',
        data: [
            { x: -20.0, y: -20.0, radius: 1.8 },
            { x: 20.0, y: -20.0, radius: 2.0 },
            { x: 0.0, y: 20.0, radius: 2.2 },
        ],
    };

    const edges = {
        type: 'Gravity',
        data: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 0 },

            { source: 3, target: 0 },
            { source: 3, target: 1 },
            { source: 3, target: 2 },
        ],
    };

    const ringEdges = {
        data: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 0 },
        ],
    };

    const layers = [
        { nodes, edges },
        { nodes: ringNodes, edges: ringEdges },
    ];

    render(html`<grafer-view class="grafer_container" .layers="${layers}"></grafer-view>`, container);
}
