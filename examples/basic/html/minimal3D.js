import { a as render, h as html } from '../../../web_modules/lit-html.js';
import '../../../web_modules/GraferView.js';
import '../../../web_modules/tslib.js';
import '../../../web_modules/lit-element.js';
import '../../../web_modules/GraferController.js';
import '../../../web_modules/picogl.js';
import '../../../web_modules/gl-matrix.js';
import '../../../web_modules/@dekkai/event-emitter.js';
import '../../../web_modules/chroma-js.js';
import '../../../web_modules/_commonjsHelpers.js';
import '../../../web_modules/potpack.js';

async function minimal3D(container) {
    const nodes = {
        data: [
            { x: -8.6, y: 5.0, z: 5.0 },
            { x: 8.6, y: 5.0, z: 5.0 },
            { x: 0.0, y: -10.0, z: 0.0 },
            { x: 0.0, y: 5.0, z: -8.6 },
            { x: 0.0, y: 0.0, z: 0.0 },
        ],
    };
    const edges = {
        data: [
            { source: 0, target: 1 },
            { source: 0, target: 2 },
            { source: 0, target: 3 },
            { source: 1, target: 2 },
            { source: 1, target: 3 },
            { source: 2, target: 3 },
            { source: 4, target: 0 },
            { source: 4, target: 1 },
            { source: 4, target: 2 },
            { source: 4, target: 3 },
        ],
    };
    const layers = [
        { nodes, edges },
    ];
    render(html `<grafer-view class="grafer_container" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}

export { minimal3D };
//# sourceMappingURL=minimal3D.js.map
