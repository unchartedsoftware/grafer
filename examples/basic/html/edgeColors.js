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

async function edgeColors(container) {
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
            { source: 0, target: 1, sourceColor: '#5e81ac', targetColor: '#b48ead' },
            { source: 1, target: 2, sourceColor: '#b48ead', targetColor: '#88c0d0' },
            { source: 2, target: 0, sourceColor: '#88c0d0', targetColor: '#5e81ac' },
            { source: 3, target: 0, sourceColor: 'orange', targetColor: '#5e81ac' },
            { source: 3, target: 1, sourceColor: 'orange', targetColor: '#b48ead' },
            { source: 3, target: 2, sourceColor: 'orange', targetColor: '#88c0d0' },
        ],
    };
    const layers = [
        { nodes, edges },
    ];
    render(html `<grafer-view class="grafer_container" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}

export { edgeColors };
//# sourceMappingURL=edgeColors.js.map
