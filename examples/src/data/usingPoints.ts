import {html, render} from 'lit-html';
import '../../../src/grafer/GraferView';

export async function usingPoints(container: HTMLElement): Promise<void> {

    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'left', x: -8.6, y: 5.0 },
            { id: 'right', x: 8.6, y: 5.0 },
            { id: 'bottom', x: 0.0, y: -10.0 },
            { id: 'center', x: 0.0, y: 0.0 },
        ],
    };

    // nodes reference points
    const nodes = {
        data: [
            { point: 'left' },
            { point: 'right' },
            { point: 'bottom' },
            { point: 'center' },
        ],
    };

    // edges also reference points
    const edges = {
        data: [
            { source: 'left', target: 'right' },
            { source: 'right', target: 'bottom' },
            { source: 'bottom', target: 'left' },

            { source: 'center', target: 'left' },
            { source: 'center', target: 'right' },
            { source: 'center', target: 'bottom' },
        ],
    };

    const layers = [
        { nodes, edges },
    ];

    // pass the points to grafer
    render(html`<grafer-view class="grafer_container" .points="${points}" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}
