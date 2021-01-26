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

async function curvedPaths(container) {
    // create an array od colors to be used
    const colors = [
        /* 0 */ 'red',
        /* 1 */ 'limegreen',
        /* 2 */ [0, 0, 255],
        /* 3 */ '#88c0d0',
    ];
    // create a 'points' data structure to hold all positional data
    const points = {
        data: [
            { id: 'left', x: -8.6, y: 5.0 },
            { id: 'right', x: 8.6, y: 5.0 },
            { id: 'bottom', x: 0.0, y: -10.0, z: -5.0 },
            { id: 'center', x: 0.0, y: 0.0, z: 5.0 },
        ],
    };
    // nodes reference points
    const nodes = {
        data: [
            { point: 'left', color: 3 },
            { point: 'right', color: 1 },
            { point: 'bottom', radius: 0.2 },
            { point: 'center', radius: 0.2 },
        ],
        mappings: {
            radius: (entry) => entry.radius || 1,
        },
    };
    // edges also reference points
    const edges = {
        type: 'CurvedPath',
        data: [
            { source: 'left', target: 'right', control: ['center', 'bottom'], sourceColor: 3, targetColor: 1 },
        ],
    };
    const edgesDashed = {
        type: 'Dashed',
        data: [
            { source: 'left', target: 'center' },
            { source: 'center', target: 'bottom' },
            { source: 'bottom', target: 'right' },
        ],
    };
    const layers = [
        { nodes, edges },
        { edges: edgesDashed },
    ];
    // pass the points to grafer
    render(html `<grafer-view class="grafer_container" .colors="${colors}" .points="${points}" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}

export { curvedPaths };
//# sourceMappingURL=curvedPaths.js.map
