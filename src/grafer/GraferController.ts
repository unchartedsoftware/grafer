import {Viewport} from '../renderer/Viewport';
import {App} from 'picogl';
import {PointDataMappings} from '../data/GraphPoints';
import {nodes as GraphNodes, edges as GraphEdges, Graph} from '../graph/mod';
import {Layer} from '../graph/Layer';
import {DragTruck} from '../UX/mouse/drag/DragTruck';
import {DragRotation} from '../UX/mouse/drag/DragRotation';
import {ScrollDolly} from '../UX/mouse/scroll/ScrollDolly';
import {DragPan} from '../UX/mouse/drag/DragPan';
import {GraferInputColor} from '../renderer/ColorRegistry';

export type GraferNodesType = keyof typeof GraphNodes.types;
export type GraferEdgesType = keyof typeof GraphEdges.types;

export interface GraferDataInput<T> {
    data: unknown[],
    mappings?: Partial<T>,
}

export type GraferPointsData = GraferDataInput<PointDataMappings>;

export interface GraferNodesData extends GraferDataInput<any> {
    type?: GraferNodesType;
}

export interface GraferEdgesData extends GraferDataInput<any> {
    type?: GraferEdgesType;
}

export interface GraferLayerData {
    id?: number | string;
    name?: string;
    nodes: GraferNodesData;
    edges: GraferEdgesData;
}

export interface GraferControllerData {
    colors?: GraferInputColor[];
    points?: GraferPointsData;
    layers?: GraferLayerData[];
}

export class GraferController {
    private _viewport: Viewport;
    public get viewport(): Viewport {
        return this._viewport;
    }
    public get context(): App {
        return this.viewport.context;
    }

    constructor(canvas: HTMLCanvasElement, data?: GraferControllerData) {
        this._viewport = new Viewport(canvas);

        const dolly = new ScrollDolly(this._viewport);
        dolly.enabled = true;

        const truck = new DragTruck(this._viewport);
        truck.button = 'primary';
        truck.enabled = true;

        const rotation = new DragRotation(this._viewport);
        rotation.button = 'secondary';
        rotation.enabled = true;

        const pan = new DragPan(this._viewport);
        pan.button = 'auxiliary';
        pan.enabled = true;

        if (data) {
            this.loadData(data);
        }
    }

    private loadData(data: GraferControllerData): void {
        if (data.colors) {
            const colors = data.colors;
            const colorRegisrty = this._viewport.colorRegisrty;
            for (let i = 0, n = colors.length; i < n; ++i) {
                colorRegisrty.registerColor(colors[i]);
            }
        } else {
            // add at least one color in case the data does not have colors either
            this._viewport.colorRegisrty.registerColor('#d8dee9');
        }

        if (data.points) {
            const mappings = data.points.mappings ? data.points.mappings : {};
            this._viewport.graph = new Graph(this._viewport.context, data.points.data, mappings);
        }

        if (data.layers && data.layers.length) {
            const context = this.context;
            const layers = data.layers;
            const hasPoints = Boolean(this._viewport.graph);
            const hasColors = Boolean(data.colors);
            let nodesPointMapping: () => number = null;

            if (!hasPoints) {
                const nodes = [];
                for (let i = 0, n = layers.length; i < n; ++i) {
                    nodes.push(layers[i].nodes.data);
                }
                this._viewport.graph = Graph.fromNodesArray(context, nodes);

                let vertexIndex = 0;
                nodesPointMapping = (): number => vertexIndex++;
            }

            for (let i = 0, n = layers.length; i < n; ++i) {
                const name = layers[i].name || `Layer_${i}`;
                const graph = this._viewport.graph;

                let nodes = null;
                let edges = null;

                if (layers[i].nodes) {
                    const nodesData = layers[i].nodes;
                    const nodesType = layers[i].nodes.type ? layers[i].nodes.type : 'Circle';
                    const NodesClass = GraphNodes.types[nodesType] || GraphNodes.Circle;
                    const nodesMappings = Object.assign({}, NodesClass.defaultMappings, nodesData.mappings);
                    if (nodesPointMapping) {
                        nodesMappings.point = nodesPointMapping;
                    }

                    if (!hasColors) {
                        const colorMapping = nodesMappings.color;
                        nodesMappings.color = (entry: any, i): number => {
                            const value = colorMapping(entry, i);
                            if (typeof value !== 'number') {
                                return this._viewport.colorRegisrty.registerColor(value);
                            }
                            return value;
                        };
                    }

                    nodes = new NodesClass(context, graph, nodesData.data, nodesMappings, null);
                }

                if (layers[i].edges) {
                    if (!nodes && !hasPoints) {
                        throw 'Cannot load an edge-only layer in a graph without points!';
                    }

                    const edgesData = layers[i].edges;
                    const edgesType = layers[i].edges.type ? layers[i].edges.type : 'Straight';
                    const EdgesClass = GraphEdges.types[edgesType] || GraphEdges.Straight;
                    const edgesMappings = Object.assign({}, EdgesClass.defaultMappings, edgesData.mappings);

                    if (!hasPoints) {
                        const sourceMapping = edgesMappings.source;
                        edgesMappings.source = (entry, i): number => {
                            return nodes.getEntryPointID(sourceMapping(entry, i));
                        };

                        const targetMapping = edgesMappings.target;
                        edgesMappings.target = (entry, i): number => {
                            return nodes.getEntryPointID(targetMapping(entry, i));
                        };
                    }

                    if (!hasColors) {
                        const sourceColorMapping = edgesMappings.sourceColor;
                        edgesMappings.sourceColor = (entry: any, i): number => {
                            const value = sourceColorMapping(entry, i);
                            if (typeof value !== 'number') {
                                return this._viewport.colorRegisrty.registerColor(value);
                            }
                            return value;
                        };

                        const targetColorMapping = edgesMappings.targetColor;
                        edgesMappings.targetColor = (entry: any, i): number => {
                            const value = targetColorMapping(entry, i);
                            if (typeof value !== 'number') {
                                return this._viewport.colorRegisrty.registerColor(value);
                            }
                            return value;
                        };
                    }

                    edges = new EdgesClass(context, graph, edgesData.data, edgesMappings, null);
                }

                if (nodes || edges) {
                    const layer = new Layer(nodes, edges, name);
                    graph.layers.push(layer);
                }
            }
        }

        if (this._viewport.graph) {
            this._viewport.camera.position = [0, 0, - this._viewport.graph.bbCornerLength * 2];
            this._viewport.render();
        }
    }
}
