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

function createNodePoints(count, radius = 10.0) {
    const PI2 = Math.PI * 2;
    const degStep = (PI2) / count;
    const result = [];
    for (let angle = 0, i = 0; angle < PI2; angle += degStep, ++i) {
        const pX = Math.cos(angle) * radius;
        const pY = Math.sin(angle) * radius;
        result.push({
            id: `p${i}-${radius}`,
            x: pX,
            y: pY,
            radius: 2,
            label: `Node p${i}-r${radius}`,
            color: Math.round(Math.random() * 4),
            background: true,
        });
    }
    return result;
}
async function pointLabel(container) {
    const nodes = {
        type: 'Circle',
        data: [
            ...createNodePoints(10, 10),
            ...createNodePoints(5, 5),
        ],
    };
    const labels = {
        type: 'PointLabel',
        data: nodes.data,
        options: {
            visibilityThreshold: 50,
            labelPlacement: 1,
        },
    };
    const layers = [
        { nodes, labels },
    ];
    const colors = [
        '#bf616a',
        '#d08770',
        '#ebcb8b',
        '#a3be8c',
        '#b48ead',
    ];
    render(html `<grafer-view class="grafer_container" .colors="${colors}" .layers="${layers}"></grafer-view><mouse-interactions></mouse-interactions>`, container);
}

export { pointLabel };
//# sourceMappingURL=pointLabel.js.map
