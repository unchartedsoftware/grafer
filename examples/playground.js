import { a as render, h as html } from '../web_modules/lit-html.js';
import { G as GraferController, S as ScrollDolly, D as DragTruck, b as DragRotation, c as DragPan } from '../web_modules/GraferController.js';
import { T as Tweakpane } from '../web_modules/tweakpane.js';
import { D as DataFile } from '../web_modules/@dekkai/data-source.js';
import { f as fromValues, C as len } from '../web_modules/gl-matrix.js';
import '../web_modules/GraferView.js';
import { D as DebugMenu } from '../web_modules/DebugMenu.js';
import '../web_modules/picogl.js';
import '../web_modules/@dekkai/event-emitter.js';
import '../web_modules/chroma-js.js';
import '../web_modules/_commonjsHelpers.js';
import '../web_modules/potpack.js';
import '../web_modules/@dekkai/env.js';
import '../web_modules/tslib.js';
import '../web_modules/lit-element.js';

function createGraferLoaderVec3(x = 0, y = 0, z = 0) {
    return { x, y, z };
}
function createGraferLoaderDomain(min = Number.MAX_SAFE_INTEGER, max = Number.MIN_SAFE_INTEGER) {
    return { min, max };
}
function setGraferLoaderDomain(value, domain = createGraferLoaderDomain()) {
    domain.min = Math.min(domain.min, value);
    domain.max = Math.max(domain.max, value);
    return domain;
}
function mergeGraferLoaderDomain(a, b, out = a) {
    out.min = Math.min(a.min, b.min);
    out.max = Math.max(a.max, b.max);
    return out;
}
function normalizeNodeLayers(layers, reCenter = false, reSize = false) {
    const center = createGraferLoaderVec3();
    const sizeDomain = createGraferLoaderDomain();
    const coordsDomain = {
        x: createGraferLoaderDomain(),
        y: createGraferLoaderDomain(),
        z: createGraferLoaderDomain(),
    };
    let count = 0;
    for (let i = 0, n = layers.length; i < n; ++i) {
        center.x += layers[i].cumulative.x;
        center.y += layers[i].cumulative.y;
        center.z += layers[i].cumulative.z;
        count += layers[i].count;
        mergeGraferLoaderDomain(sizeDomain, layers[i].sizeDomain);
        mergeGraferLoaderDomain(coordsDomain.x, layers[i].coordsDomain.x);
        mergeGraferLoaderDomain(coordsDomain.y, layers[i].coordsDomain.y);
        mergeGraferLoaderDomain(coordsDomain.z, layers[i].coordsDomain.z);
    }
    if (reCenter) {
        center.x /= count;
        center.y /= count;
        center.z /= count;
        coordsDomain.x.min -= center.x;
        coordsDomain.x.max -= center.x;
        coordsDomain.y.min -= center.y;
        coordsDomain.y.max -= center.y;
        coordsDomain.z.min -= center.z;
        coordsDomain.z.max -= center.z;
    }
    else {
        center.x = 0;
        center.y = 0;
        center.z = 0;
    }
    const bbCorners = fromValues(Math.max(Math.abs(coordsDomain.x.min), Math.abs(coordsDomain.x.max)), Math.max(Math.abs(coordsDomain.y.min), Math.abs(coordsDomain.y.max)), Math.max(Math.abs(coordsDomain.z.min), Math.abs(coordsDomain.z.max)));
    const cornerLength = len(bbCorners);
    // resize the coordinates so the corner length is always 300 (because it looks nice)
    // sorry future Dario, you'll have to explain this one out and then deal with it :(
    const positionMult = reSize ? 300 / cornerLength : 1;
    // scale the coordinates domain
    coordsDomain.x.min *= positionMult;
    coordsDomain.x.max *= positionMult;
    coordsDomain.y.min *= positionMult;
    coordsDomain.y.max *= positionMult;
    coordsDomain.z.min *= positionMult;
    coordsDomain.z.max *= positionMult;
    // iterate through all the layers and apply the changes
    for (let i = 0, n = layers.length; i < n; ++i) {
        const layer = layers[i];
        const positions = layer.positions;
        const sizes = layer.sizes;
        // iterate through all the nodes in each layer
        for (let ii = 0, pi = 0, nn = layer.count; ii < nn; ++ii, pi += 3) {
            // move the position to the center and then scale it
            positions[pi] = (positions[pi] - center.x) * positionMult;
            positions[pi + 1] = (positions[pi + 1] - center.y) * positionMult;
            positions[pi + 2] = (positions[pi + 2] - center.z) * positionMult;
            // normalize the sizes
            if (sizeDomain.min !== sizeDomain.max) {
                sizes[ii] = (sizes[ii] - sizeDomain.min) / (sizeDomain.max - sizeDomain.min);
            }
            else {
                sizes[ii] = 1;
            }
        }
    }
    return {
        center,
        sizeDomain,
        coordsDomain,
        count,
        cornerLength: cornerLength * positionMult,
    };
}

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
async function loadNodes(file, palette = []) {
    const colorMap = new Map();
    const map = new Map();
    const raw = [];
    const points = [];
    const nodes = [];
    const positions = [];
    const sizes = [];
    const colors = [];
    const cumulative = createGraferLoaderVec3();
    const sizeDomain = createGraferLoaderDomain();
    const coordsDomain = {
        x: createGraferLoaderDomain(),
        y: createGraferLoaderDomain(),
        z: createGraferLoaderDomain(),
    };
    let count = 0;
    await parseJSONL(file, (json) => {
        raw.push(json);
        json.z = json.hasOwnProperty('z') ? json.z : 0.0;
        const { x, y, z, id, ...node } = json;
        points.push({
            id,
            x,
            y,
            z,
        });
        nodes.push({
            point: id,
            ...node,
        });
        positions.push(x, y, z);
        map.set(json.id, count);
        setGraferLoaderDomain(x, coordsDomain.x);
        setGraferLoaderDomain(y, coordsDomain.y);
        setGraferLoaderDomain(z, coordsDomain.z);
        cumulative.x += x;
        cumulative.y += y;
        cumulative.z += z;
        ++count;
        const group = (json.group ?? json.clusterID ?? [0])[0];
        if (group < palette.length) {
            colors.push(...palette[group], 255);
        }
        else {
            if (!colorMap.has(group)) {
                colorMap.set(group, [
                    Math.round(Math.random() * 127 + 128),
                    Math.round(Math.random() * 127 + 128),
                    Math.round(Math.random() * 127 + 128),
                ]);
            }
            colors.push(...colorMap.get(group), 255);
        }
        sizes.push(json.size);
        setGraferLoaderDomain(json.size, sizeDomain);
    });
    return {
        map,
        raw,
        points,
        nodes,
        positions: new Float32Array(positions),
        sizes: new Float32Array(sizes),
        colors: new Uint8Array(colors),
        cumulative,
        sizeDomain,
        coordsDomain,
        count,
    };
}
async function loadEdges(file, nodes) {
    const raw = [];
    const positions = [];
    const colors = [];
    await parseJSONL(file, json => {
        if (nodes.map.has(json.source) && nodes.map.has(json.target)) {
            raw.push(json);
            const sourceIndex = nodes.map.get(json.source);
            const targetIndex = nodes.map.get(json.target);
            positions.push(nodes.positions[sourceIndex * 3], nodes.positions[sourceIndex * 3 + 1], nodes.positions[sourceIndex * 3 + 2]);
            positions.push(nodes.positions[targetIndex * 3], nodes.positions[targetIndex * 3 + 1], nodes.positions[targetIndex * 3 + 2]);
            colors.push(nodes.colors[sourceIndex * 4], nodes.colors[sourceIndex * 4 + 1], nodes.colors[sourceIndex * 4 + 2], nodes.colors[sourceIndex * 4 + 3]);
            colors.push(nodes.colors[targetIndex * 4], nodes.colors[targetIndex * 4 + 1], nodes.colors[targetIndex * 4 + 2], nodes.colors[targetIndex * 4 + 3]);
        }
    });
    return {
        raw,
        edges: raw,
        positions: new Float32Array(positions),
        colors: new Uint8Array(colors),
    };
}
async function loadMeta(file) {
    const result = [];
    await parseJSONL(file, json => {
        result.push(json);
    });
    return result;
}
const LocalJSONL = {
    loadNodes,
    loadEdges,
    loadMeta,
};

const kPolarNight = [
    { r: 59, g: 66, b: 82 },
    { r: 67, g: 76, b: 94 },
    { r: 76, g: 86, b: 106 },
];
const kSnowStorm = [
    { r: 216, g: 222, b: 233 },
    { r: 229, g: 233, b: 240 },
    { r: 236, g: 239, b: 244 },
];
const kFrost = [
    { r: 143, g: 188, b: 187 },
    { r: 136, g: 192, b: 208 },
    { r: 129, g: 161, b: 193 },
    { r: 94, g: 129, b: 172 },
];
const kAurora = [
    { r: 191, g: 97, b: 106 },
    { r: 208, g: 135, b: 112 },
    { r: 235, g: 203, b: 139 },
    { r: 163, g: 190, b: 140 },
    { r: 180, g: 142, b: 173 },
];
const kGradient = [
    { r: 76, g: 86, b: 106 },
    { r: 85, g: 95, b: 115 },
    { r: 93, g: 103, b: 124 },
    { r: 102, g: 112, b: 133 },
    { r: 111, g: 121, b: 143 },
    { r: 120, g: 130, b: 152 },
    { r: 130, g: 140, b: 162 },
    { r: 139, g: 149, b: 171 },
    { r: 148, g: 159, b: 181 },
    { r: 158, g: 168, b: 191 },
    { r: 168, g: 178, b: 201 },
    { r: 177, g: 188, b: 211 },
    { r: 187, g: 198, b: 221 },
    { r: 197, g: 208, b: 231 },
    { r: 207, g: 218, b: 241 },
    { r: 217, g: 228, b: 252 },
    { r: 228, g: 238, b: 255 },
    { r: 238, g: 248, b: 255 },
    { r: 248, g: 255, b: 255 },
    { r: 255, g: 255, b: 255 },
];
const kColorPresets = [
    { name: 'none', colors: null },
    { name: 'polar night', colors: kPolarNight },
    { name: 'snow storm', colors: kSnowStorm },
    { name: 'frost', colors: kFrost },
    { name: 'aurora', colors: kAurora },
    { name: 'gradient', colors: kGradient },
];
const colorsRgbToArr = (colors) => colors.map(val => Object.values(val));
function createColorsSelector(folder, colors) {
    const dummy = { preset: 0 };
    const presetOptions = {};
    for (let i = 0, n = kColorPresets.length; i < n; ++i) {
        presetOptions[kColorPresets[i].name] = i;
    }
    const preset = folder.addInput(dummy, 'preset', { options: presetOptions });
    const remove = folder.addButton({ title: 'remove color' });
    preset.on('change', (value) => {
        if (value > 0) {
            colors.length = 0;
            colors.push(...kColorPresets[value].colors);
            const items = folder.controller.uiContainer.items;
            while (items.length > 3) {
                items[items.length - 3].viewModel.dispose();
            }
            for (let i = 0, n = colors.length; i < n; ++i) {
                folder.addInput(colors, `${i}`, { index: i + 1 });
            }
            remove.hidden = colors.length <= 1;
        }
    });
    for (let i = 0, n = colors.length; i < n; ++i) {
        folder.addInput(colors, `${i}`, { index: i + 1 });
    }
    remove.hidden = colors.length <= 1;
    remove.on('click', () => {
        colors.pop();
        const items = folder.controller.uiContainer.items;
        items[items.length - 3].viewModel.dispose();
        remove.hidden = colors.length <= 1;
        dummy.preset = 0;
        preset.refresh();
    });
    folder.addButton({ title: 'add color' }).on('click', () => {
        const lastColor = colors[colors.length - 1];
        const color = { r: lastColor.r, g: lastColor.g, b: lastColor.b };
        colors.push(color);
        folder.addInput(colors, `${colors.length - 1}`, { index: colors.length });
        remove.hidden = colors.length <= 1;
        dummy.preset = 0;
        preset.refresh();
    });
}
function createFileInput(cb) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.addEventListener('change', cb);
    return input;
}
let gLayerCount = 0;
function createFilesSelector(pane, layers, updateLoadBtn) {
    const result = {
        name: `layer_${gLayerCount++}`,
        ready: false,
        nodes: 'No file selected.',
        nodesFile: null,
        nodesMapping: '',
        edges: 'No file selected.',
        edgesFile: null,
        edgesMapping: '',
        meta: 'No file selected.',
        metaFile: null,
        colors: [...kAurora],
    };
    const layersInd = layers.length;
    const folder = pane.addFolder({
        title: result.name,
        index: layersInd,
    });
    folder.addInput(result, 'name');
    folder.addSeparator();
    // createTypeSelector(folder, kNodeTypes, result, 'nodesType');
    const nodesInput = createFileInput(() => {
        if (nodesInput.files.length) {
            result.nodesFile = nodesInput.files[0];
            result.nodes = result.nodesFile.name;
            result.ready = true;
        }
        else {
            result.nodes = 'No file selected.';
            result.nodesFile = null;
            result.ready = false;
        }
        updateLoadBtn();
    });
    folder.addMonitor(result, 'nodes');
    folder.addButton({ title: 'browse...' }).on('click', () => nodesInput.click());
    folder.addInput({ nodesMapping: result.nodesMapping }, 'nodesMapping').on('change', stringVal => {
        layers[layersInd].nodesMapping = stringVal;
    });
    folder.addSeparator();
    const edgesInput = createFileInput(() => {
        if (edgesInput.files.length) {
            result.edgesFile = edgesInput.files[0];
            result.edges = result.edgesFile.name;
        }
        else {
            result.edges = 'No file selected.';
            result.edgesFile = null;
        }
    });
    folder.addMonitor(result, 'edges');
    folder.addButton({ title: 'browse...' }).on('click', () => edgesInput.click());
    folder.addInput({ edgesMapping: result.edgesMapping }, 'edgesMapping').on('change', stringVal => {
        layers[layersInd].edgesMapping = stringVal;
    });
    folder.addSeparator();
    const metaInput = createFileInput(() => {
        if (metaInput.files.length) {
            result.metaFile = metaInput.files[0];
            result.meta = result.metaFile.name;
        }
        else {
            result.meta = 'No file selected.';
            result.metaFile = null;
        }
    });
    folder.addMonitor(result, 'meta');
    folder.addButton({ title: 'browse...' }).on('click', () => metaInput.click());
    folder.addSeparator();
    const colors = folder.addFolder({ title: 'colors', expanded: false });
    createColorsSelector(colors, result.colors);
    folder.addSeparator();
    const misc = folder.addFolder({ title: 'misc', expanded: false });
    misc.addMonitor(result, 'ready');
    misc.addButton({ title: 'remove layer' }).on('click', () => {
        const i = layers.indexOf(result);
        if (i !== -1) {
            layers.splice(i, 1);
            folder.dispose();
            updateLoadBtn();
        }
    });
    folder.addSeparator();
    return result;
}
async function loadLayers(layers) {
    const loadedLayers = [];
    for (let i = 0, n = layers.length; i < n; ++i) {
        loadedLayers.push({
            nodes: await LocalJSONL.loadNodes(layers[i].nodesFile, []),
            edges: null,
            meta: null,
        });
    }
    const stats = normalizeNodeLayers(loadedLayers.map(layer => layer.nodes));
    for (let i = 0, n = layers.length; i < n; ++i) {
        if (layers[i].edgesFile) {
            loadedLayers[i].edges = await LocalJSONL.loadEdges(layers[i].edgesFile, loadedLayers[i].nodes);
        }
        if (layers[i].metaFile) {
            loadedLayers[i].meta = await LocalJSONL.loadMeta(layers[i].metaFile);
        }
    }
    return {
        layers: loadedLayers,
        stats,
    };
}
async function playground(container) {
    render(html `<div id="menu" class="start_menu"></div>`, container);
    const menu = new Tweakpane({
        title: 'Grafer Loader',
        container: document.querySelector('#menu'),
    });
    const layersFile = [];
    const addBtn = menu.addButton({ title: 'add layer' });
    const loadBtn = menu.addButton({ title: 'load' });
    const updateLoadBtn = () => {
        if (layersFile.length) {
            for (let i = 0, n = layersFile.length; i < n; ++i) {
                if (!layersFile[i].ready) {
                    loadBtn.hidden = true;
                    return;
                }
            }
            loadBtn.hidden = false;
        }
        else {
            loadBtn.hidden = true;
        }
    };
    loadBtn.hidden = true;
    addBtn.on('click', () => {
        layersFile.push(createFilesSelector(menu, layersFile, updateLoadBtn));
        updateLoadBtn();
    });
    loadBtn.on('click', async () => {
        menu.dispose();
        const loading = new Tweakpane({
            title: 'loading...',
            container: document.querySelector('#menu'),
        });
        try {
            render(html `<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
            const canvas = document.querySelector('.grafer_container');
            const loaded = await loadLayers(layersFile);
            const layers = [];
            const colorsArr = [];
            const pointsData = [];
            const pointsMap = new Map();
            loaded.layers.map((layer, layerInd) => {
                const { nodesMapping, edgesMapping, colors } = layersFile[layerInd];
                layers.push({
                    nodes: {
                        data: layer.nodes.nodes,
                        mappings: nodesMapping
                            ? (new Function(`return (${nodesMapping})`))()
                            : {},
                    },
                    edges: {
                        data: layer.edges ? layer.edges.edges : [],
                        mappings: edgesMapping
                            ? (new Function(`return (${edgesMapping})`))()
                            : {},
                    },
                });
                layer.nodes.points.map((point, pointInd) => {
                    if (!pointsMap.has(point.id)) {
                        pointsData.push(point);
                        pointsMap.set(point.id, [layerInd, pointInd]);
                    }
                });
                colorsArr.push(...colorsRgbToArr(colors));
            });
            const points = {
                data: pointsData,
            };
            const grafer = new GraferController(canvas, { points, layers, colors: colorsArr });
            const { viewport } = grafer;
            const dolly = new ScrollDolly(viewport);
            dolly.enabled = true;
            const truck = new DragTruck(viewport);
            truck.button = 'primary';
            truck.enabled = true;
            const rotation = new DragRotation(viewport);
            rotation.button = 'secondary';
            rotation.enabled = true;
            const pan = new DragPan(viewport);
            pan.button = 'auxiliary';
            pan.enabled = true;
            const debug = new DebugMenu(viewport);
            debug.registerUX(dolly);
            debug.registerUX(truck);
            debug.registerUX(rotation);
            debug.registerUX(pan);
        }
        catch (e) {
            loading.addMonitor({ error: e.toString() }, 'error');
            throw e;
        }
        loading.dispose();
    });
}

export { playground };
//# sourceMappingURL=playground.js.map
