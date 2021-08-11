import {html, render} from 'lit-html';
import Tweakpane from 'tweakpane';
import {
    convertDataToGraferV4,
    GroupCentroid,
    GroupHullEdge,
    KnowledgeNodeData,
    LayoutInfo,
} from './convertDataToGraferV4';

import {GraferController, GraferLayerData, GraferNodesType} from '../../../src/grafer/GraferController';
import {DebugMenu} from '../../../src/UX/debug/DebugMenu';
import {renderer, graph} from '../../../src/mod.js';
import chroma from 'chroma-js';

function createFileInput(cb: () => void): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.addEventListener('change', cb);
    return input;
}

function createFileMenu(menu: Tweakpane, result: LayoutInfo, key: string): void {
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
        nodes: 'No file selected.',
        nodesFile: null,
        nodeAtts: 'No file selected.',
        nodeAttsFile: null,
        nodeLayout: 'No file selected.',
        nodeLayoutFile: null,
        groups: 'No file selected.',
        groupsFile: null,
        alpha: 18,
        level: 0,
        levelCount: 3,
        maxLabelLength: 25,
        topGroupThreshold: 500,
        pointRadius: 20,
        positionScale: 50000,
    };

    const menu = new Tweakpane({
        title: 'Grafer Loader',
        container: document.querySelector('#menu'),
    });

    createFileMenu(menu, result, 'nodes');
    menu.addSeparator();
    createFileMenu(menu, result, 'nodeAtts');
    menu.addSeparator();
    createFileMenu(menu, result, 'nodeLayout');
    menu.addSeparator();
    createFileMenu(menu, result, 'groups');
    menu.addSeparator();

    menu.addInput(result, 'alpha');
    menu.addSeparator();
    menu.addInput(result, 'level');
    menu.addSeparator();
    menu.addInput(result, 'levelCount');
    menu.addSeparator();
    menu.addInput(result, 'maxLabelLength');
    menu.addSeparator();
    menu.addInput(result, 'topGroupThreshold');
    menu.addSeparator();
    menu.addInput(result, 'pointRadius');
    menu.addSeparator();
    menu.addInput(result, 'positionScale');
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
                labelPlacement: graph.labels.PointLabelPlacement.CENTER,
                renderBackground: true,
                nearDepth: 0.0,
                farDepth: 0.25,
            },
        },
    };
}

function makeCentroidLayers(layers: GraferLayerData[], data: GroupCentroid[], levels: number = 4): Map<number, any> {
    const centroidLayersTop = [];
    const centroidLayers = [];
    for (let i = 0; i < levels; ++i) {
        centroidLayersTop.push(getBasicLayer(`Centroids_top_${i}`, 'Ring', 0.01));
        centroidLayers.push(getBasicLayer(`Centroids_${i}`, 'Ring', 0.1));
    }

    const centroidMap = new Map();
    for (const centroid of data) {
        const nodes = centroid.top ? centroidLayersTop[centroid.level].nodes : centroidLayers[centroid.level].nodes;
        nodes.data.push(centroid);
        centroidMap.set(centroid.id, centroid);
    }

    layers.push(...centroidLayersTop, ...centroidLayers);

    return centroidMap;
}

function computeColors(colors, colorMap, colorLevels, centroidMap, levelNumber = 0): void {
    const level = colorLevels.get(levelNumber);
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

function loadLevelLayers(nodes: KnowledgeNodeData[], shapes: GroupHullEdge[]): IterableIterator<any> {
    const levelMap = new Map();

    for (const node of nodes) {
        if (!levelMap.has(node.level)) {
            levelMap.set(node.level, {
                name: `Level_${node.level === -1 ? 'noise' : node.level}`,
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
            });
        }

        levelMap.get(node.level).nodes.data.push(node);
    }

    for (const shape of shapes) {
        if (!levelMap.has(shape.level)) {
            levelMap.set(shape.level, {
                name: `Level_${shape.level === -1 ? 'noise' : shape.level}`,
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
            });
        }

        levelMap.get(shape.level).edges.data.push(shape);
    }

    return levelMap.values();
}

async function loadGraph(container: HTMLElement, info: LayoutInfo): Promise<void> {
    if (!info.nodesFile || !info.nodeAttsFile || !info.nodeLayoutFile || !info.groupsFile) {
        return;
    }

    const data = await convertDataToGraferV4(info);
    render(html`<canvas class="grafer_container"></canvas>`, container);

    const canvas = document.querySelector('.grafer_container') as HTMLCanvasElement;
    const layers = [];

    const colors = [];
    const colorMap = new Map();
    const colorLevels = new Map();

    for (const color of data.colors) {
        if (colors.length <= color.primary) {
            for (let i = colors.length; i <= color.primary; ++i) {
                colors.push(null);
            }
        }
        colorMap.set(color.id, color);
        let colorLevel = colorLevels.get(color.level);
        if (!colorLevel) {
            colorLevel = {
                top: [],
                low: [],
            };
            colorLevels.set(color.level, colorLevel);
        }
        if (color.top) {
            colorLevel.top.push(color);
        } else {
            colorLevel.low.push(color);
        }

    }

    const points = {
        data: data.points,
    };

    // const nodeLayer = {
    //     name: 'Nodes',
    //     nodes: {
    //         type: 'Circle',
    //         data: data.nodes,
    //         options: {
    //             pixelSizing: true,
    //         },
    //     },
    //     edges: {
    //         data: data.shapes,
    //         options: {
    //             alpha: 0.55,
    //             nearDepth: 0.9,
    //         },
    //     },
    // };
    layers.push(...loadLevelLayers(data.nodes, data.shapes));

    const centroidMap = makeCentroidLayers(layers, data.centroids, info.levelCount);
    if (colorMap.size) {
        computeColors(colors, colorMap, colorLevels, centroidMap, info.level);
    }

    const controller = new GraferController(canvas, { points, colors, layers }, {
        viewport: {
            colorRegistryType: renderer.colors.ColorRegistryType.indexed,
            colorRegistryCapacity: colors.length,
        },
    });

    // disable all centroid layers of levels other than the selected one
    const graphLayers = controller.viewport.graph.layers;
    for (const layer of graphLayers) {
        const components = layer.name.split('_');
        if (components[0] === 'Centroids') {
            const level = parseInt(components[components.length - 1]);
            if (level !== info.level) {
                layer.enabled = false;
            }
        }
    }

    /* const debug = */ new DebugMenu(controller.viewport);
    // debug.registerUX(dolly);
    // debug.registerUX(truck);
    // debug.registerUX(rotation);
    // debug.registerUX(pan);
}

export async function knowledgeViewLoader(container: HTMLElement): Promise<void> {
    renderMenu(container, result => {
        loadGraph(container, result);
    });
}
