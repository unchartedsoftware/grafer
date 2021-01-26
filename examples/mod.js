import { renderMenu } from './renderMenu.js';
import { playground } from './playground.js';
import { layoutTester } from './layoutTester.js';
import { bundledEdgesLoader } from './bundledEdgesLoader.js';
import { b as basic } from '../_basic_mod.js';
import { d as data } from '../_data_mod.js';
import { n as nodes } from '../_nodes_mod.js';
import { e as edges } from '../_edges_mod.js';
import { l as labels } from '../_labels_mod.js';
import './HelpElements.js';
import '../web_modules/lit-html.js';
import '../web_modules/GraferController.js';
import '../web_modules/picogl.js';
import '../web_modules/gl-matrix.js';
import '../web_modules/@dekkai/event-emitter.js';
import '../web_modules/chroma-js.js';
import '../web_modules/_commonjsHelpers.js';
import '../web_modules/potpack.js';
import '../web_modules/tweakpane.js';
import '../web_modules/@dekkai/data-source.js';
import '../web_modules/@dekkai/env.js';
import '../web_modules/GraferView.js';
import '../web_modules/tslib.js';
import '../web_modules/lit-element.js';
import '../web_modules/DebugMenu.js';
import '../_basic_html_mod.js';
import './basic/html/minimal.js';
import './basic/html/minimal3D.js';
import './basic/html/nodeColors.js';
import './basic/html/edgeColors.js';
import './basic/html/nodeRadius.js';
import './basic/html/nodeID.js';
import './basic/html/picking.js';
import '../_basic_js_mod.js';
import './basic/js/minimal.js';
import './basic/js/minimal3D.js';
import './basic/js/nodeColors.js';
import './basic/js/edgeColors.js';
import './basic/js/nodeRadius.js';
import './basic/js/nodeID.js';
import './basic/js/picking.js';
import './data/points.js';
import './data/separateNodesEdges.js';
import './data/colors.js';
import './data/mappings.js';
import './nodes/circle.js';
import './nodes/ring.js';
import './nodes/triangle.js';
import './nodes/pentagon.js';
import './nodes/octagon.js';
import './nodes/star.js';
import './nodes/cross.js';
import './nodes/plus.js';
import './edges/dashed.js';
import './edges/curvedPaths.js';
import './edges/circuitBoard.js';
import './edges/bundling.js';
import './labels/pointLabel.js';
import './labels/circularLabel.js';
import './labels/ringLabel.js';

const examples = {
    basic,
    data,
    nodes,
    edges,
    labels,
    playground,
    layoutTester,
    bundledEdgesLoader,
};
function getExample(examples, path) {
    let obj = examples;
    for (let i = 0, n = path.length; i < n; ++i) {
        if (Object.prototype.hasOwnProperty.call(obj, path[i])) {
            obj = obj[path[i]];
        }
        else {
            return null;
        }
    }
    if (typeof obj === 'function') {
        return obj;
    }
    return null;
}
async function main() {
    const pathName = window.location.pathname;
    const pathComponents = pathName.split('/').filter(v => Boolean(v));
    const example = getExample(examples, pathComponents);
    if (example) {
        await example(document.body);
    }
    else {
        renderMenu(document.body, examples, pathComponents);
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    await main();
});
//# sourceMappingURL=mod.js.map
