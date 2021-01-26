import { a as render, h as html } from '../../../web_modules/lit-html.js';
import '../../../web_modules/GraferView.js';
import { G as GraferController } from '../../../web_modules/GraferController.js';
import '../../../web_modules/tslib.js';
import '../../../web_modules/lit-element.js';
import '../../../web_modules/@dekkai/event-emitter.js';
import '../../../web_modules/picogl.js';
import '../../../web_modules/gl-matrix.js';
import '../../../web_modules/chroma-js.js';
import '../../../web_modules/_commonjsHelpers.js';
import '../../../web_modules/potpack.js';

async function nodeRadius(container) {
    render(html `<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
    const canvas = document.querySelector('.grafer_container');
    const nodes = {
        data: [
            { x: -8.6, y: 5.0 },
            { x: 8.6, y: 5.0 },
            { x: 0.0, y: -10.0 },
            { x: 0.0, y: 0.0, color: 'red', radius: 2.5 },
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
    new GraferController(canvas, { layers });
}

export { nodeRadius };
//# sourceMappingURL=nodeRadius.js.map
