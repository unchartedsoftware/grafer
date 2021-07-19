import {html, render} from 'lit-html';
import Tweakpane from 'tweakpane';
import {DataFile} from '@dekkai/data-source/build/lib/file/DataFile';
import {DebugMenu} from '../../../src/UX/debug/DebugMenu';
import {GraferController, graph} from '../../../src/mod.js';

interface LayoutInfo {
    points: string;
    pointsFile: File;
    clusters: string;
    clustersFile: File;
    clusterEdgesMode: 'bundle' | 'straight' | 'curved',
    clusterEdges: string;
    clusterEdgesFile: File;
    nodes: string;
    nodesFile: File;
    nodeEdges: string;
    nodeEdgesFile: File;
}

async function parseJSONL(input, cb): Promise<void> {
    const file = await DataFile.fromLocalSource(input);

    // load 16MB chunks
    const sizeOf16MB = 16 * 1024 * 1024;
    const byteLength = await file.byteLength;
    const decoder = new TextDecoder();
    const lineBreak = '\n'.charCodeAt(0);

    for(let offset = 0; offset <= byteLength; offset += sizeOf16MB) {
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

function createFileInput(cb: () => void): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.addEventListener('change', cb);
    return input;
}

function renderMenu(container: HTMLElement, cb: (result: LayoutInfo) => void): void {
    render(html`<div id="menu" class="start_menu"></div>`, container);

    const result: LayoutInfo = {
        points: 'No file selected.',
        pointsFile: null,
        clusters: 'No file selected.',
        clustersFile: null,
        clusterEdgesMode: 'curved',
        clusterEdges: 'No file selected.',
        clusterEdgesFile: null,
        nodes: 'No file selected.',
        nodesFile: null,
        nodeEdges: 'No file selected.',
        nodeEdgesFile: null,
    };

    const menu = new Tweakpane({
        title: 'Grafer Loader',
        container: document.querySelector('#menu'),
    });

    const pointsInput = createFileInput(() => {
        if (pointsInput.files.length) {
            result.pointsFile = pointsInput.files[0];
            result.points = result.pointsFile.name;
        } else {
            result.points = 'No file selected.';
            result.pointsFile = null;
        }
    });
    menu.addMonitor(result, 'points');
    menu.addButton({ title: 'browse...' }).on('click', () => pointsInput.click());

    menu.addSeparator();

    const clustersInput = createFileInput(() => {
        if (clustersInput.files.length) {
            result.clustersFile = clustersInput.files[0];
            result.clusters = result.clustersFile.name;
        } else {
            result.clusters = 'No file selected.';
            result.clustersFile = null;
        }
    });
    menu.addMonitor(result, 'clusters');
    menu.addButton({ title: 'browse...' }).on('click', () => clustersInput.click());

    menu.addInput(result, 'clusterEdgesMode', {
        options: {
            bundle: 'bundle',
            straight: 'straight',
            curved: 'curved',
        },
    });

    const clusterEdgesInput = createFileInput(() => {
        if (clusterEdgesInput.files.length) {
            result.clusterEdgesFile = clusterEdgesInput.files[0];
            result.clusterEdges = result.clusterEdgesFile.name;
        } else {
            result.clusterEdges = 'No file selected.';
            result.clusterEdgesFile = null;
        }
    });
    menu.addMonitor(result, 'clusterEdges');
    menu.addButton({ title: 'browse...' }).on('click', () => clusterEdgesInput.click());

    menu.addSeparator();

    const nodesInput = createFileInput(() => {
        if (nodesInput.files.length) {
            result.nodesFile = nodesInput.files[0];
            result.nodes = result.nodesFile.name;
        } else {
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
        } else {
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

async function loadGraph(container: HTMLElement, info: LayoutInfo): Promise<void> {
    if (info.pointsFile) {
        render(html`<canvas class="grafer_container"></canvas>`, container);

        const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
        const layers = [];

        const points = {
            data: [],
        };

        await parseJSONL(info.pointsFile, json => {
            points.data.push(json);
        });

        const clusterBundleEdges = {
            type: 'ClusterBundle',
            data: [],
            options: {
                alpha: 0.04,
                nearDepth: 0.9,
            },
        };

        const clusterStraightEdges = {
            type: 'Straight',
            data: [],
            options: {
                alpha: 0.04,
                nearDepth: 0.9,
            },
            mappings: {
                source: (entry): number => 'sourceCluster' in entry ? entry.sourceCluster : entry.source,
                target: (entry): number => 'targetCluster' in entry ? entry.targetCluster : entry.target,
            },
        };

        const clusterCurvedEdges = {
            type: 'CurvedPath',
            data: [],
            options: {
                alpha: 0.04,
                nearDepth: 0.9,
            },
        };

        let edges;
        if (info.clusterEdgesMode === 'bundle') {
            edges = clusterBundleEdges;
        } else if (info.clusterEdgesMode === 'curved') {
            edges = clusterCurvedEdges;
        } else {
            edges = clusterStraightEdges;
        }

        const clusterLayer = {
            name: 'Clusters',
            labels: {
                type: 'RingLabel',
                data: [],
                mappings: {
                    background: (): boolean => false,
                    fontSize: (): number => 14,
                    padding: (): number => 0,
                },
                options: {
                    visibilityThreshold: 160,
                    repeatLabel: -1,
                    repeatGap: 64,
                },
            },
            edges,
        };
        layers.push(clusterLayer);

        if (info.clustersFile) {
            const nodes = clusterLayer.labels;
            await parseJSONL(info.clustersFile, json => {
                nodes.data.push(Object.assign({}, json, {
                    color: 3,
                }));
            });
        }

        if (info.clusterEdgesFile) {
            const edges = clusterLayer.edges;
            await parseJSONL(info.clusterEdgesFile, json => {
                edges.data.push(Object.assign({}, json, {
                    sourceColor: 0,
                    targetColor: 0,
                }));
            });
        }

        const nodeLayer = {
            name: 'Nodes',
            nodes: {
                type: 'Circle',
                data: [],
            },
            edges: {
                data: [],
                options: {
                    alpha: 0.55,
                    nearDepth: 0.9,
                },
            },
            labels: {
                type: 'PointLabel',
                data: [],
                mappings: {
                    background: (): boolean => true,
                    fontSize: (): number => 12,
                    padding: (): [number, number] => [8, 5],
                },
                options: {
                    visibilityThreshold: 8,
                    labelPlacement: graph.labels.PointLabelPlacement.TOP,
                    renderBackground: true,
                },
            },
        };
        layers.unshift(nodeLayer);

        if (info.nodesFile) {
            const nodes = nodeLayer.nodes;
            await parseJSONL(info.nodesFile, json => {
                nodes.data.push(Object.assign({}, json, {
                    color: 1,
                }));
            });
            nodeLayer.labels.data = nodes.data;
        }


        if (info.nodeEdgesFile) {
            const edges = nodeLayer.edges;
            await parseJSONL(info.nodeEdgesFile, json => {
                edges.data.push(Object.assign({}, json, {
                    sourceColor: 2,
                    targetColor: 2,
                }));
            });
        }

        const colors = [
            '#5e81ac',
            '#d08770',
            '#ebcb8b',
            '#81a1c1',
        ];

        const controller = new GraferController(canvas, { points, colors, layers });
        /* const debug = */ new DebugMenu(controller.viewport);
        // debug.registerUX(dolly);
        // debug.registerUX(truck);
        // debug.registerUX(rotation);
        // debug.registerUX(pan);
    }
}

export async function bundledEdgesLoader(container: HTMLElement): Promise<void> {
    renderMenu(container, result => {
        loadGraph(container, result);
    });
}
