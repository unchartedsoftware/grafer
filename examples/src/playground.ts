import {html, render} from 'lit-html';

// import {Viewport} from '../../../src/renderer/Viewport';
import {ScrollDolly} from '../../src/UX/mouse/scroll/ScrollDolly';
import {DragTruck} from '../../src/UX/mouse/drag/DragTruck';
import {DragRotation} from '../../src/UX/mouse/drag/DragRotation';
import {DragPan} from '../../src/UX/mouse/drag/DragPan';

import Tweakpane from 'tweakpane';
import {LocalJSONL} from '../../src/loaders/LocalJSONL';
import {
    GraferLoaderNodes,
    GraferLoaderEdges,
    normalizeNodeLayers,
    GraferLoaderNodesStats,
} from '../../src/loaders/GraferLoader';
import '../../src/grafer/GraferView';
import {GraferController} from '../../src/grafer/GraferController';
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
            const pointsData = [];
            const pointsMap = new Map();
            loaded.layers.map((layer, layerInd) => {
                const {nodesMapping, edgesMapping} = layersFile[layerInd];
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
            });

            const points = {
                data: pointsData,
            };

            const grafer = new GraferController(canvas, { points, layers });
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
