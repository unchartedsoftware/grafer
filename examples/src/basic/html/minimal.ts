import {html, render} from 'lit-html';
import '../../../../src/grafer/GraferView';

export async function minimal(container: HTMLElement): Promise<void> {
    const nodes = {
        data: [
                { x: -8.6, y: 5.0 },
                { x: 8.6, y: 5.0 },
                { x: 0.0, y: -10.0 },
                { x: 0.0, y: 0.0 },
        ],
    };

    const edges = {
        data: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 0 },

            { source: 3, target: 0 },
            { source: 3, target: 1 },
            { source: 3, target: 2 },
        ],
    };

    const layers = [
        { nodes, edges },
    ];

    render(html`<grafer-view class="grafer_container" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}
