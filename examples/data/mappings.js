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

async function mappings(container) {
    const colors = [
        /* 0 */ 'red',
        /* 1 */ 'limegreen',
        /* 2 */ [0, 0, 255],
        /* 3 */ '#88c0d0',
        /* 4 */ [255, 255, 0],
        /* 5 */ [0, 255, 255],
        /* 6 */ [255, 0, 255],
        /* 7 */ 'white',
    ];
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
            { point: 'left', color: 0 },
            { point: 'right', color: 1 },
            { point: 'bottom', color: 2 },
            { point: 'center', color: 3 },
        ],
    };
    // edges also reference points
    const edges = {
        data: [
            { source: 'left', target: 'right', color: 4 },
            { source: 'right', target: 'bottom', color: 5 },
            { source: 'bottom', target: 'left', color: 6 },
            { source: 'center', target: 'left', color: 7 },
            { source: 'center', target: 'right', color: 7 },
            { source: 'center', target: 'bottom', color: 7 },
        ],
        // using mappings we can compute properties
        mappings: {
            sourceColor: (entry) => entry.color,
            targetColor: (entry) => entry.color,
        },
    };
    const layers = [
        { nodes, edges },
    ];
    // pass the points, colors and layers to grafer
    render(html `<grafer-view class="grafer_container" .colors="${colors}" .points="${points}" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}

export { mappings };
//# sourceMappingURL=mappings.js.map
