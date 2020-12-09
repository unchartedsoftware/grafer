import {html, render} from 'lit-html';

// import {Viewport} from '../../../src/renderer/Viewport';
import {ScrollDolly} from '../../src/UX/mouse/scroll/ScrollDolly';
import {DragTruck} from '../../src/UX/mouse/drag/DragTruck';
import {DragRotation} from '../../src/UX/mouse/drag/DragRotation';
import {DragPan} from '../../src/UX/mouse/drag/DragPan';

import Tweakpane from 'tweakpane';
import {FolderApi} from 'tweakpane/dist/types/api/folder';
import {LocalJSONL} from '../../src/loaders/LocalJSONL';
import {
    GraferLoaderNodes,
    GraferLoaderEdges,
    normalizeNodeLayers,
    GraferLoaderNodesStats,
} from '../../src/loaders/GraferLoader';
import '../../src/grafer/GraferView';
import {GraferController} from '../../src/grafer/GraferController';
import {GraferInputColor} from '../../src/renderer/ColorRegistry';
import {DebugMenu} from '../../src/UX/debug/DebugMenu';

interface FilesSelector {
    name: string;
    ready: boolean;
    nodes: string;
    nodesFile: File | null;
    edges: string;
    edgesFile: File | null;
    meta: string;
    metaFile: File | null;
}

interface LoadedLayer {
    nodes: GraferLoaderNodes;
    edges: GraferLoaderEdges;
    meta: any[];
}

interface LoadLayersResult {
    layers: LoadedLayer[];
    stats: GraferLoaderNodesStats;
}

interface LoaderColor {
    r: number;
    g: number;
    b: number;
}

const kPolarNight: LoaderColor[] = [
    { r: 59, g: 66, b: 82 },
    { r: 67, g: 76, b: 94 },
    { r: 76, g: 86, b: 106 },
];

const kSnowStorm: LoaderColor[] = [
    { r: 216, g: 222, b: 233 },
    { r: 229, g: 233, b: 240 },
    { r: 236, g: 239, b: 244 },
];

const kFrost: LoaderColor[] = [
    { r: 143, g: 188, b: 187 },
    { r: 136, g: 192, b: 208 },
    { r: 129, g: 161, b: 193 },
    { r: 94, g: 129, b: 172 },
];

const kAurora: LoaderColor[] = [
    { r: 191, g: 97, b: 106 },
    { r: 208, g: 135, b: 112 },
    { r: 235, g: 203, b: 139 },
    { r: 163, g: 190, b: 140 },
    { r: 180, g: 142, b: 173 },
];

const kGradient: LoaderColor[] = [
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

const colorsRgbToArr = (colors): GraferInputColor[] =>
    colors.map(val => Object.values(val));

function createColorsSelector(folder: FolderApi, colors: LoaderColor[]): void {
    const dummy = { preset: 0 };
    const presetOptions: {[key: string]: number} = {};
    for (let i = 0, n = kColorPresets.length; i < n; ++i) {
        presetOptions[kColorPresets[i].name] = i;
    }
    const preset = folder.addInput(dummy, 'preset', { options: presetOptions });
    const remove = folder.addButton({ title: 'remove color' });

    preset.on('change', (value: number): void => {
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

    folder.addButton( { title: 'add color' }).on('click', () => {
        const lastColor: LoaderColor = colors[colors.length - 1];
        const color: LoaderColor = { r: lastColor.r, g: lastColor.g, b: lastColor.b };
        colors.push(color);
        folder.addInput(colors, `${colors.length -1}`, { index: colors.length });
        remove.hidden = colors.length <= 1;
        dummy.preset = 0;
        preset.refresh();
    });
}

function createFileInput(cb: () => void): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.addEventListener('change', cb);
    return input;
}

let gLayerCount = 0;
function createFilesSelector(pane: Tweakpane, layers,  updateLoadBtn: () => void): FilesSelector {
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
        colors:[...kAurora],
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
        } else {
            result.nodes = 'No file selected.';
            result.nodesFile = null;
            result.ready = false;
        }
        updateLoadBtn();
    });
    folder.addMonitor(result, 'nodes');
    folder.addButton({ title: 'browse...' }).on('click', () => nodesInput.click());
    folder.addInput({nodesMapping: result.nodesMapping}, 'nodesMapping').on('change', stringVal => {
        layers[layersInd].nodesMapping = stringVal;
    });

    folder.addSeparator();

    const edgesInput = createFileInput(() => {
        if (edgesInput.files.length) {
            result.edgesFile = edgesInput.files[0];
            result.edges = result.edgesFile.name;
        } else {
            result.edges = 'No file selected.';
            result.edgesFile = null;
        }
    });
    folder.addMonitor(result, 'edges');
    folder.addButton({ title: 'browse...' }).on('click', () => edgesInput.click());
    folder.addInput({edgesMapping: result.edgesMapping}, 'edgesMapping').on('change', stringVal => {
        layers[layersInd].edgesMapping = stringVal;
    });

    folder.addSeparator();

    const metaInput = createFileInput(() => {
        if (metaInput.files.length) {
            result.metaFile = metaInput.files[0];
            result.meta = result.metaFile.name;
        } else {
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
    misc.addButton({ title: 'remove layer'}).on('click', () => {
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

async function loadLayers(layers): Promise<LoadLayersResult> {
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

export async function playground(container: HTMLElement): Promise<void> {
    render(html`<div id="menu" class="start_menu"></div>`, container);

    const menu = new Tweakpane({
        title: 'Grafer Loader',
        container: document.querySelector('#menu'),
    });

    const layersFile = [];

    const addBtn = menu.addButton({ title: 'add layer' });
    const loadBtn = menu.addButton({ title: 'load' });
    const updateLoadBtn = (): void => {
        if (layersFile.length) {
            for (let i = 0, n = layersFile.length; i < n; ++i) {
                if (!layersFile[i].ready) {
                    loadBtn.hidden = true;
                    return;
                }
            }
            loadBtn.hidden = false;
        } else {
            loadBtn.hidden = true;
        }
    };

    loadBtn.hidden = true;
    addBtn.on('click', () => {
        layersFile.push(createFilesSelector(menu, layersFile, updateLoadBtn));
        updateLoadBtn();
    });

    loadBtn.on('click', async (): Promise<void> => {
        menu.dispose();
        const loading = new Tweakpane({
            title: 'loading...',
            container: document.querySelector('#menu'),
        });

        try {
            render(html`<canvas class="grafer_container"></canvas><mouse-interactions></mouse-interactions>`, container);
            const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;

            const loaded = await loadLayers(layersFile);

            const layers = [];
            const colorsArr = [];
            const pointsData = [];
            const pointsMap = new Map();
            loaded.layers.map((layer, layerInd) => {
                const {nodesMapping, edgesMapping, colors} = layersFile[layerInd];
                layers.push({
                    nodes: {
                        data: layer.nodes.nodes,
                        mappings: nodesMapping
                            ? eval(`(${nodesMapping})`)
                            : {},
                    },
                    edges: {
                        data: layer.edges ? layer.edges.edges : [],
                        mappings: edgesMapping
                            ? eval(`(${edgesMapping})`)
                            : {},
                    },
                });
                layer.nodes.points.map((point, pointInd) => {
                    if(!pointsMap.has(point.id)) {
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
            const {viewport} = grafer;

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
        } catch (e) {
            loading.addMonitor({ error: e.toString() }, 'error');
            throw e;
        }

        loading.dispose();
    });
}
