import {html, render} from 'lit-html';
import '../../../src/grafer/GraferView';

export async function separateNodesEdges(container: HTMLElement): Promise<void> {

    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'top-left', x: -8.6, y: 5.0 },
            { id: 'top-right', x: 8.6, y: 5.0 },
            { id: 'top-center', x: 0.0, y: 10.0 },

            { id: 'bottom-left', x: -8.6, y: -5.0 },
            { id: 'bottom-right', x: 8.6, y: -5.0 },
            { id: 'bottom-center', x: 0.0, y: -10.0 },

            { id: 'origin', x: 0.0, y: 0.0 },
        ],
    };

    // nodes reference points
    const nodes = {
        data: [
            { point: 'bottom-left' },
            { point: 'bottom-right' },
            { point: 'top-center' },
            { point: 'origin' },
        ],
    };

    // edges also reference points
    const edges = {
        data: [
            { source: 'top-left', target: 'top-right' },
            { source: 'top-right', target: 'bottom-center' },
            { source: 'bottom-center', target: 'top-left' },

            { source: 'origin', target: 'top-left' },
            { source: 'origin', target: 'top-right' },
            { source: 'origin', target: 'bottom-center' },
        ],
    };

    const layers = [
        // a layer can have only nodes
        { nodes },
        //or only edges
        { edges },
    ];

    // pass the points to grafer
    render(html`<grafer-view class="grafer_container" .points="${points}" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}
