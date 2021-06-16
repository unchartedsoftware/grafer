import {html, render} from 'lit-html';
import Tweakpane from 'tweakpane';
import {GraferController, GraferLayerData, GraferNodesType} from '../../../src/grafer/GraferController';
import {DataFile} from '@dekkai/data-source/build/lib/file/DataFile';
import {DebugMenu} from '../../../src/UX/debug/DebugMenu';
import {PointLabelPlacement} from '../../../src/graph/labels/point/PointLabel';
import {ColorRegistryType} from '../../../src/renderer/colors/ColorRegistry';
import chroma from 'chroma-js';

interface LayoutInfo {
    points: string;
    pointsFile: File;
    nodes: string;
    nodesFile: File;
    centroids: string;
    centroidsFile: File;
    colors: string,
    colorsFile: File,
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
        nodes: 'No file selected.',
        nodesFile: null,
        centroids: 'No file selected.',
        centroidsFile: null,
        colors: 'No file selected.',
        colorsFile: null,
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

    menu.addSeparator();

    const centroidsInput = createFileInput(() => {
        if (centroidsInput.files.length) {
            result.centroidsFile = centroidsInput.files[0];
            result.centroids = result.centroidsFile.name;
        } else {
            result.centroids = 'No file selected.';
            result.centroidsFile = null;
        }
    });
    menu.addMonitor(result, 'centroids');
    menu.addButton({ title: 'browse...' }).on('click', () => centroidsInput.click());

    menu.addSeparator();

    const colorsInput = createFileInput(() => {
        if (colorsInput.files.length) {
            result.colorsFile = colorsInput.files[0];
            result.colors = result.colorsFile.name;
        } else {
            result.colors = 'No file selected.';
            result.colorsFile = null;
        }
    });
    menu.addMonitor(result, 'colors');
    menu.addButton({ title: 'browse...' }).on('click', () => colorsInput.click());

    menu.addSeparator();

    const loadBtn = menu.addButton({ title: 'load' });
    loadBtn.on('click', () => {
        cb(result);
    });
}

function getBasicLayer(name: string, nodeType: GraferNodesType, visibilityThreshold: number, pixelSizing: boolean = true): GraferLayerData {
    const data = [];
    return {
        name,
        nodes: {
            type: nodeType,
            data,
            mappings: {
                radius: (): number => 100,
            },
            options: {
                pixelSizing,
                nearDepth: 0.26,
                farDepth: 0.5,
            },
        },
        labels: {
            type: 'PointLabel',
            data,
            mappings: {
                background: (): boolean => true,
                fontSize: (): number => 12,
                padding: (): [number, number] => [8, 5],
            },
            options: {
                visibilityThreshold,
                labelPlacement: PointLabelPlacement.CENTER,
                renderBackground: true,
                nearDepth: 0.0,
                farDepth: 0.25,
            },
        },
    }
}

async function makeCentroidLayers(layers: GraferLayerData[], file: File, levels: number = 4): Promise<Map<number, any>> {
    const centroidLayersTop = [];
    const centroidLayers = [];
    for (let i = 0; i < levels; ++i) {
        centroidLayersTop.push(getBasicLayer(`Centroids_top_${i}`, 'Ring', 0.01));
        centroidLayers.push(getBasicLayer(`Centroids_${i}`, 'Ring', 0.1));
    }

    const centroidMap = new Map();
    await parseJSONL(file, json => {
        const nodes = json.top ? centroidLayersTop[json.level].nodes : centroidLayers[json.level].nodes;
        nodes.data.push(json);
        centroidMap.set(json.id, json);
    });

    layers.push(...centroidLayersTop, ...centroidLayers);

    return centroidMap;
}

function computeColors(colors, colorMap, colorLevels, centroidMap): void {
    // do level 0 for now
    const level = colorLevels.get(2);
    const topStep = Math.floor(360 / level.top.length);
    const lowStep = Math.floor(topStep / Math.ceil(level.low.length / level.top.length + 1));

    for (let i = 0, n = level.top.length; i < n; ++i) {
        const info = level.top[i];
        const color = chroma.hsl(topStep * i, 1, 0.5).hex();
        const centroid = centroidMap.get(info.id);
        colors[centroid.color] = color;
        colors[info.primary] = color;
        for (const childID of info.inherited) {
            colors[childID] = color;
        }
    }

    for (let i = 0, n = level.low.length; i < n; ++i) {
        const info = level.low[i];
        const color = chroma.hsl(lowStep * (i + 1), 1, 0.5).hex();
        const centroid = centroidMap.get(info.id);
        colors[centroid.color] = color;
        colors[info.primary] = color;
        for (const childID of info.inherited) {
            colors[childID] = color;
        }
    }

    const gray = '#a0a0a0';
    for (let i = 0, n = colors.length; i < n; ++i) {
        if (colors[i] === null) {
            colors[i] = gray;
        }
    }
}

async function loadGraph(container: HTMLElement, info: LayoutInfo): Promise<void> {
    if (info.pointsFile) {
        render(html`<canvas class="grafer_container"></canvas>`, container);

        const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
        const layers = [];

        const colors = [];
        const colorMap = new Map();
        const colorLevels = new Map();
        if (info.colorsFile) {
            await parseJSONL(info.colorsFile, json => {
                if (colors.length <= json.primary) {
                    for (let i = colors.length; i <= json.primary; ++i) {
                        colors.push(null);
                    }
                }
                colorMap.set(json.id, json);
                let colorLevel = colorLevels.get(json.level);
                if (!colorLevel) {
                    colorLevel = {
                        top: [],
                        low: [],
                    };
                    colorLevels.set(json.level, colorLevel);
                }
                if (json.top) {
                    colorLevel.top.push(json);
                } else {
                    colorLevel.low.push(json);
                }

            });
        } else {
            colors.push(
                '#5e81ac',
                '#d08770',
                '#ebcb8b',
                '#81a1c1',
            );
        }

        const points = {
            data: [],
        };

        await parseJSONL(info.pointsFile, json => {
            points.data.push(json);
        });

        const nodeLayer = {
            name: 'Nodes',
            nodes: {
                type: 'Circle',
                data: [],
                options: {
                    pixelSizing: true,
                },
            },
            edges: {
                data: [],
                options: {
                    alpha: 0.55,
                    nearDepth: 0.9,
                },
            },
        };
        layers.push(nodeLayer);

        if (info.nodesFile) {
            const nodes = nodeLayer.nodes;
            await parseJSONL(info.nodesFile, json => {
                nodes.data.push(json);
            });
        }

        if (info.centroidsFile) {
            const centroidMap = await makeCentroidLayers(layers, info.centroidsFile);
            if (colorMap.size) {
                computeColors(colors, colorMap, colorLevels, centroidMap);
            }
        }

        const controller = new GraferController(canvas, { points, colors, layers }, {
            viewport: {
                colorRegistryType: ColorRegistryType.indexed,
                colorRegistryCapacity: colors.length,
            }
        });
        /* const debug = */ new DebugMenu(controller.viewport);
        // debug.registerUX(dolly);
        // debug.registerUX(truck);
        // debug.registerUX(rotation);
        // debug.registerUX(pan);
    }
}

export async function knowledgeViewLoader(container: HTMLElement): Promise<void> {
    renderMenu(container, result => {
        loadGraph(container, result);
    });
}
