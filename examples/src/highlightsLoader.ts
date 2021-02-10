import {html, render} from 'lit-html';
import Tweakpane from 'tweakpane';
import {GraferController} from '../../src/grafer/GraferController';
import {DataFile} from '@dekkai/data-source/build/lib/file/DataFile';
import {DebugMenu} from '../../src/UX/debug/DebugMenu';
import {PointLabelPlacement} from '../../src/graph/labels/point/PointLabel';

interface LayoutInfo {
    points: string;
    pointsFile: File;
    clusters: string;
    clustersFile: File;
    clusterEdges: string;
    clusterEdgesFile: File;
    nodes: string;
    nodesFile: File;
    nodeEdges: string;
    nodeEdgesFile: File;

    highlightsNodes: string;
    highlightsNodesFile: File;
    highlightsEdges: string;
    highlightsEdgesFile: File;
    highlightsParents: string;
    highlightsParentsFile: File;
    highlightsAncestors: string;
    highlightsAncestorsFile: File;
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

function createDefaultFileInput(menu: Tweakpane, result: LayoutInfo, key: string) {
    const input = createFileInput(() => {
        if (input.files.length) {
            result[`${key}File`] = input.files[0];
            result[key] = result[`${key}File`].name;
        } else {
            result[key] = 'No file selected.';
            result[`${key}File`] = null;
        }
    });
    menu.addMonitor(result, key);
    menu.addButton({ title: 'browse...' }).on('click', () => input.click());
}

function renderMenu(container: HTMLElement, cb: (result: LayoutInfo) => void): void {
    render(html`<div id="menu" class="start_menu"></div>`, container);

    const result: LayoutInfo = {
        points: 'No file selected.',
        pointsFile: null,
        clusters: 'No file selected.',
        clustersFile: null,
        clusterEdges: 'No file selected.',
        clusterEdgesFile: null,
        nodes: 'No file selected.',
        nodesFile: null,
        nodeEdges: 'No file selected.',
        nodeEdgesFile: null,

        highlightsNodes: 'No file selected.',
        highlightsNodesFile: null,
        highlightsEdges: 'No file selected.',
        highlightsEdgesFile: null,
        highlightsParents: 'No file selected.',
        highlightsParentsFile: null,
        highlightsAncestors: 'No file selected.',
        highlightsAncestorsFile: null,
    };

    const menu = new Tweakpane({
        title: 'Grafer Loader',
        container: document.querySelector('#menu'),
    });

    createDefaultFileInput(menu, result, 'points');

    menu.addSeparator();

    createDefaultFileInput(menu, result, 'clusters');
    createDefaultFileInput(menu, result, 'clusterEdges');

    menu.addSeparator();

    createDefaultFileInput(menu, result, 'nodes');
    createDefaultFileInput(menu, result, 'nodeEdges');

    menu.addSeparator();

    createDefaultFileInput(menu, result, 'highlightsNodes');
    createDefaultFileInput(menu, result, 'highlightsEdges');
    createDefaultFileInput(menu, result, 'highlightsParents');
    createDefaultFileInput(menu, result, 'highlightsAncestors');

    menu.addSeparator();

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

        const edges = {
            type: 'ClusterBundle',
            data: [],
            options: {
                alpha: 0.04,
                nearDepth: 0.9,
            },
        };

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
                    labelPlacement: PointLabelPlacement.TOP,
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

        const highlightNodesLayer = {
            name: 'Highlights',
            nodes: {
                type: 'Circle',
                data: [],
            },
            edges: {
                type: 'ClusterBundle',
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
                    labelPlacement: PointLabelPlacement.TOP,
                },
            },
        };
        layers.unshift(highlightNodesLayer);

        if (info.highlightsNodesFile) {
            await parseJSONL(info.highlightsNodesFile, json => {
                highlightNodesLayer.nodes.data.push(Object.assign({}, json, {
                    color: 1,
                }));
            });
            highlightNodesLayer.labels.data = highlightNodesLayer.nodes.data;
        }

        if (info.highlightsEdgesFile) {
            await parseJSONL(info.highlightsEdgesFile, json => {
                highlightNodesLayer.edges.data.push(Object.assign({}, json, {
                    sourceColor: 0,
                    targetColor: 0,
                }));
            });
        }

        const highlightParentsLayer = {
            name: 'Highlight Parents',
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
        };
        layers.unshift(highlightParentsLayer);

        if (info.highlightsParentsFile) {
            const nodes = highlightParentsLayer.labels;
            await parseJSONL(info.highlightsParentsFile, json => {
                nodes.data.push(Object.assign({}, json, {
                    color: 3,
                }));
            });
        }

        const highlightAncestorsLayer = {
            name: 'Highlight Ancestors',
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
        };
        layers.unshift(highlightAncestorsLayer);

        if (info.highlightsAncestorsFile) {
            const nodes = highlightAncestorsLayer.labels;
            await parseJSONL(info.highlightsAncestorsFile, json => {
                nodes.data.push(Object.assign({}, json, {
                    color: 3,
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

export async function highlightsLoader(container: HTMLElement): Promise<void> {
    renderMenu(container, result => {
        loadGraph(container, result);
    });
}
