import { a as render, h as html } from '../../web_modules/lit-html.js';
import '../../web_modules/GraferView.js';
import '../../web_modules/tslib.js';
import '../../web_modules/lit-element.js';
import '../../web_modules/GraferController.js';
import '../../web_modules/picogl.js';
import '../../web_modules/gl-matrix.js';
import '../../web_modules/@dekkai/event-emitter.js';
import '../../web_modules/chroma-js.js';
import '../../web_modules/_commonjsHelpers.js';
import '../../web_modules/potpack.js';

async function separateNodesEdges(container) {
    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'top-left', x: -8.6, y: 5.0, radius: 0 },
            { id: 'top-right', x: 8.6, y: 5.0, radius: 0 },
            { id: 'top-center', x: 0.0, y: 10.0 },
            { id: 'bottom-left', x: -8.6, y: -5.0 },
            { id: 'bottom-right', x: 8.6, y: -5.0 },
            { id: 'bottom-center', x: 0.0, y: -10.0, radius: 0 },
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
    render(html `<grafer-view class="grafer_container" .points="${points}" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}

export { separateNodesEdges };
//# sourceMappingURL=separateNodesEdges.js.map
