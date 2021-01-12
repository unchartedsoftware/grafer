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
import {PickingManager} from '../UX/picking/PickingManager';
import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';

export type GraferNodesType = keyof typeof GraphNodes.types;
export type GraferEdgesType = keyof typeof GraphEdges.types;

export interface GraferDataInput<T> {
    data: unknown[],
    mappings?: Partial<T>,
}

export type GraferPointsData = GraferDataInput<PointDataMappings>;

export interface GraferNodesData extends GraferDataInput<any> {
    type?: GraferNodesType;
    options?: { [key: string]: any };
}

export interface GraferEdgesData extends GraferDataInput<any> {
    type?: GraferEdgesType;
    options?: { [key: string]: any };
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

export class GraferController extends EventEmitter {
    private _viewport: Viewport;
    public get viewport(): Viewport {
        return this._viewport;
    }
    public get context(): App {
        return this.viewport.context;
    }

    constructor(canvas: HTMLCanvasElement, data?: GraferControllerData) {
        super();
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
        this.loadColors(data);

        const pointsRadiusMapping = { radius: (entry: any): number => 'radius' in entry ? entry.radius : 1.0 };
        this.loadPoints(data, pointsRadiusMapping);
        this.loadLayers(data, pointsRadiusMapping);

        this.renderGraph();
    }

    public renderGraph(): void {
        if (this._viewport.graph) {
            this._viewport.camera.position = [0, 0, -this._viewport.graph.bbCornerLength * 2];
            this._viewport.camera.farPlane = this._viewport.graph.bbCornerLength * 3;
            this._viewport.render();
        }
    }

    private loadLayers(data: GraferControllerData, pointsRadiusMapping: { radius: (entry: any) => number; }): void {
        if (data.layers && data.layers.length) {
            const layers = data.layers;
            const hasColors = Boolean(data.colors);

            let vertexIndex = 0;
            const nodesPointMapping = this.mapPointsToNodes(data, pointsRadiusMapping) ?
                (): number => vertexIndex++
                : null;

            for (let i = 0, n = layers.length; i < n; ++i) {
                const layer = layers[i];
                const name = layer.name || `Layer_${i}`;
                this.addLayer(layer, name, nodesPointMapping, hasColors);
            }
        }
    }

    public addLayer(layer: GraferLayerData, name: string, nodesPointMapping: () => number, hasColors: boolean): void {
        const graph = this._viewport.graph;

        const nodesData = layer.nodes;
        const nodes = this.addNode(nodesData, nodesPointMapping, hasColors) ?? null;

        const edgesData = layer.edges;
        const edges = this.addEdge(edgesData, nodes, hasColors) ?? null;

        if (nodes || edges) {
            const layer = new Layer(nodes, edges, name);
            graph.layers.push(layer);
            layer.on(EventEmitter.omniEvent, (...args) => this.emit(...args));
        }
    }

    public removeLayerByName(name: string): void {
        const {layers} = this._viewport.graph;
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.name === name) {
                this.removeLayerByIndex(i);
                i--;
            }
        }
    }

    public removeLayerByIndex(index: number): void {
        const {layers} = this._viewport.graph;
        if (index >= 0 && index < layers.length) {
            layers.splice(index, 1);
        }
    }

    private addEdge(edgesData: GraferEdgesData, nodes: any, hasColors: boolean): any {
        if (edgesData) {
            const hasPoints = Boolean(this._viewport.graph);
            if (!nodes && !hasPoints) {
                throw 'Cannot load an edge-only layer in a graph without points!';
            }

            const edgesType = edgesData.type ? edgesData.type : 'Straight';
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

            const edges = new EdgesClass(this.context, this._viewport.graph, edgesData.data, edgesMappings, this._viewport.graph.picking);

            if ('options' in edgesData) {
                const options = edgesData.options;
                const keys = Object.keys(options);
                for (const key of keys) {
                    if (key in edges) {
                        edges[key] = options[key];
                    }
                }
            }

            return edges;
        }
    }

    private addNode(nodesData: GraferNodesData, nodesPointMapping: () => number, hasColors: boolean): any {
        if (nodesData) {
            const nodesType = nodesData.type ? nodesData.type : 'Circle';
            const NodesClass = GraphNodes.types[nodesType] || GraphNodes.Circle;
            const nodesMappings = Object.assign(
                {},
                NodesClass.defaultMappings,
                nodesData.mappings
            );
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

            const nodes = new NodesClass(this.context, this._viewport.graph, nodesData.data, nodesMappings, this._viewport.graph.picking);
            if ('options' in nodesData) {
                const options = nodesData.options;
                const keys = Object.keys(options);
                for (const key of keys) {
                    if (key in nodes) {
                        nodes[key] = options[key];
                    }
                }
            }
            return nodes;
        }
    }

    private mapPointsToNodes(data: GraferControllerData, pointsRadiusMapping: { radius: (entry: any) => number; }): boolean {
        if (!Boolean(this._viewport.graph)) {
            const nodes = [];
            const layers = data.layers;
            for (let i = 0, n = layers.length; i < n; ++i) {
                nodes.push(layers[i].nodes.data);
            }
            this._viewport.graph = Graph.fromNodesArray(this.context, nodes, pointsRadiusMapping);
            this._viewport.graph.picking = new PickingManager(this._viewport.context, this._viewport.mouseHandler);
            return true;
        }
        return false;
    }

    private loadPoints(data: GraferControllerData, pointsRadiusMapping: { radius: (entry: any) => number; }): void {
        if (data.points) {
            const mappings = Object.assign({}, pointsRadiusMapping, data.points.mappings);
            this._viewport.graph = new Graph(this._viewport.context, data.points.data, mappings);
            this._viewport.graph.picking = new PickingManager(this._viewport.context, this._viewport.mouseHandler);
        }
    }

    private loadColors(data: GraferControllerData): void {
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
    }
}
