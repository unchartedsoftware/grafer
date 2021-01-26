import { a as render, h as html } from '../web_modules/lit-html.js';
import { T as Tweakpane } from '../web_modules/tweakpane.js';
import { G as GraferController } from '../web_modules/GraferController.js';
import { D as DataFile } from '../web_modules/@dekkai/data-source.js';
import '../web_modules/_commonjsHelpers.js';
import '../web_modules/picogl.js';
import '../web_modules/gl-matrix.js';
import '../web_modules/@dekkai/event-emitter.js';
import '../web_modules/chroma-js.js';
import '../web_modules/potpack.js';
import '../web_modules/@dekkai/env.js';

async function parseJSONL(input, cb) {
    const file = await DataFile.fromLocalSource(input);
    // load 16MB chunks
    const sizeOf16MB = 16 * 1024 * 1024;
    const byteLength = file.byteLength;
    const decoder = new TextDecoder();
    const lineBreak = '\n'.charCodeAt(0);
    for (let offset = 0; offset <= byteLength; offset += sizeOf16MB) {
        const chunkEnd = Math.min(offset + sizeOf16MB, byteLength);
        const chunk = await file.loadData(offset, chunkEnd);
        const view = new DataView(chunk);
        let start = 0;
        for (let i = 0, n = chunk.byteLength; i < n; ++i) {
            if (view.getUint8(i) === lineBreak || offset + i === byteLength) {
                const statementBuffer = new Uint8Array(chunk, start, i - start);
                start = i + 1;
                const str = decoder.decode(statementBuffer);
                const json = JSON.parse(str);
                cb(json);
            }
        }
        if (start < chunk.byteLength) {
            offset -= chunk.byteLength - start;
        }
        // console.log(`${chunkEnd} / ${byteLength} - ${((chunkEnd/byteLength) * 100).toFixed(2)}%`);
    }
}
function createFileInput(cb) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.addEventListener('change', cb);
    return input;
}
function renderMenu(container, cb) {
    render(html `<div id="menu" class="start_menu"></div>`, container);
    const result = {
        clusters: 'No file selected.',
        clustersFile: null,
        nodes: 'No file selected.',
        nodesFile: null,
        nodeEdges: 'No file selected.',
        nodeEdgesFile: null,
    };
    const menu = new Tweakpane({
        title: 'Grafer Loader',
        container: document.querySelector('#menu'),
    });
    const clustersInput = createFileInput(() => {
        if (clustersInput.files.length) {
            result.clustersFile = clustersInput.files[0];
            result.clusters = result.clustersFile.name;
        }
        else {
            result.clusters = 'No file selected.';
            result.clustersFile = null;
        }
    });
    menu.addMonitor(result, 'clusters');
    menu.addButton({ title: 'browse...' }).on('click', () => clustersInput.click());
    const nodesInput = createFileInput(() => {
        if (nodesInput.files.length) {
            result.nodesFile = nodesInput.files[0];
            result.nodes = result.nodesFile.name;
        }
        else {
            result.nodes = 'No file selected.';
            result.nodesFile = null;
        }
    });
    menu.addMonitor(result, 'nodes');
    menu.addButton({ title: 'browse...' }).on('click', () => nodesInput.click());
    const nodeEdgesInput = createFileInput(() => {
        if (nodeEdgesInput.files.length) {
            result.nodeEdgesFile = nodeEdgesInput.files[0];
            result.nodeEdges = result.nodeEdgesFile.name;
        }
        else {
            result.nodeEdges = 'No file selected.';
            result.nodeEdgesFile = null;
        }
    });
    menu.addMonitor(result, 'nodeEdges');
    menu.addButton({ title: 'browse...' }).on('click', () => nodeEdgesInput.click());
    const loadBtn = menu.addButton({ title: 'load' });
    loadBtn.on('click', () => {
        cb(result);
    });
}
async function loadGraph(container, info) {
    if (info.clustersFile || info.nodesFile) {
        render(html `<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
        const canvas = document.querySelector('.grafer_container');
        const layers = [];
        if (info.clustersFile) {
            const nodes = {
                type: 'Ring',
                data: [],
            };
            await parseJSONL(info.clustersFile, json => {
                nodes.data.push({
                    id: json.id,
                    x: json.x,
                    y: json.y,
                    z: json.z || 0,
                    radius: json.size,
                    color: 0,
                });
            });
            const edges = {
                data: [],
            };
            layers.push({ nodes, edges });
        }
        if (info.nodesFile) {
            const nodes = {
                type: 'Circle',
                data: [],
            };
            await parseJSONL(info.nodesFile, json => {
                nodes.data.push({
                    id: json.id,
                    x: json.x,
                    y: json.y,
                    z: json.z || 0,
                    radius: json.size,
                    color: 2,
                });
            });
            const edges = {
                data: [],
                options: {
                    alpha: 0.75,
                    nearDepth: 0.9,
                },
            };
            if (info.nodeEdgesFile) {
                await parseJSONL(info.nodeEdgesFile, json => {
                    edges.data.push(Object.assign({}, json, {
                        sourceColor: 3,
                        targetColor: 3,
                    }));
                });
            }
            layers.push({ nodes, edges });
        }
        const colors = [
            '#5e81ac',
            '#88c0d0',
            '#d8dee9',
            '#4c566a',
        ];
        new GraferController(canvas, { colors, layers });
    }
}
async function layoutTester(container) {
    renderMenu(container, result => {
        loadGraph(container, result);
    });
}

export { layoutTester };
//# sourceMappingURL=layoutTester.js.map
