import {Viewport} from '../renderer/Viewport';
import {PointDataMappings} from '../data/GraphPoints';
import {nodes as GraphNodes, edges as GraphEdges, labels as GraphLabels, Graph} from '../graph/mod';
import {Layer} from '../graph/Layer';
import {DragTruck} from '../UX/mouse/drag/DragTruck';
import {DragRotation} from '../UX/mouse/drag/DragRotation';
import {ScrollDolly} from '../UX/mouse/scroll/ScrollDolly';
import {DragPan} from '../UX/mouse/drag/DragPan';
import {GraferInputColor} from '../renderer/ColorRegistry';
import {PickingManager} from '../UX/picking/PickingManager';
import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';
import {GraferContext} from '../renderer/GraferContext';

export type GraferNodesType = keyof typeof GraphNodes.types;
export type GraferEdgesType = keyof typeof GraphEdges.types;
export type GraferLabelsType = keyof typeof GraphLabels.types;

export interface GraferDataInput<T> {
    data: unknown[],
    mappings?: Partial<T>,
}

export type GraferPointsData = GraferDataInput<PointDataMappings>;

export interface GraferElementData<T> extends GraferDataInput<any> {
    type?: T;
    options?: { [key: string]: any };
}

export type GraferNodesData = GraferElementData<GraferNodesType>;
export type GraferEdgesData = GraferElementData<GraferEdgesType>;
export type GraferLabelsData = GraferElementData<GraferLabelsType>;

interface GraferLayerDataBase {
    id?: number | string;
    name?: string;
    nodes?: GraferNodesData;
    edges?: GraferEdgesData;
    labels?: GraferLabelsData;
}

// layers should at least have one of nodes, edges or labels
export type GraferLayerData = GraferLayerDataBase & ({ nodes: GraferNodesData } | { edges: GraferEdgesData } | { labels: GraferLabelsData });

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
    public get context(): GraferContext {
        return this.viewport.context;
    }
    private _hasColors: boolean;
    public get hasColors(): boolean {
        return this._hasColors;
    }
    private _generateIdPrev: number;

    constructor(canvas: HTMLCanvasElement, data?: GraferControllerData) {
        super();
        this._viewport = new Viewport(canvas);
        this._generateIdPrev = 0;

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

    private generateId(): number {
        return this._generateIdPrev++;
    }

    private loadData(data: GraferControllerData): void {
        const pointsRadiusMapping = { radius: (entry: any): number => 'radius' in entry ? entry.radius : 1.0 };

        this.loadColors(data);
        this.loadPoints(data, pointsRadiusMapping);
        this.loadLayers(data, pointsRadiusMapping);

        if (this._viewport.graph) {
            this._viewport.camera.position = [0, 0, -this._viewport.graph.bbCornerLength * 2];
            this._viewport.camera.farPlane = Math.max(this._viewport.graph.bbCornerLength * 4, 1000);
            this._viewport.render();
        }
    }

    public render(): void {
        if (this._viewport.graph) {
            this._viewport.render();
        }
        else {
            throw new Error('No graph found.');
        }
    }

    private concatenateNodesFromLayers(data: GraferControllerData): unknown[][] {
        const nodes = [];
        const layers = data.layers;
        for (let i = 0, n = layers.length; i < n; ++i) {
            const data = layers[i].nodes?.data ?? layers[i].labels?.data;
            for (let ii = 0, nn = data.length; ii < nn; ++ii) {
                (data[ii] as any).point = this.generateId();
            }
            nodes.push(layers[i].nodes.data);
        }
        return nodes;
    }

    private loadLayers(data: GraferControllerData, pointsRadiusMapping: { radius: (entry: any) => number; }): void {
        if (data.layers && data.layers.length) {
            const layers = data.layers;
            this._hasColors = Boolean(data.colors);

            if (!Boolean(this._viewport.graph)) {
                const nodes = this.concatenateNodesFromLayers(data);
                this._viewport.graph = Graph.createGraphFromNodes(this.context, nodes, pointsRadiusMapping);
                this._viewport.graph.picking = new PickingManager(this._viewport.context, this._viewport.mouseHandler);
            }

            for (let i = 0, n = layers.length; i < n; ++i) {
                const name = layers[i].name || `Layer_${i}`;
                this.addLayer(layers[i], name, this.hasColors);
            }
        }
    }

    public addLayer(layer: GraferLayerData, name: string, useColors?: boolean): void {
        if( useColors && !this.hasColors ) {
            throw new Error('No colors found.');
        }
        useColors = useColors ?? this.hasColors;

        const hasPoints = Boolean(this._viewport.graph);
        const graph = this._viewport.graph;

        const nodesData = layer.nodes;
        const nodes = this.addNodes(nodesData, useColors);

        const edgesData = layer.edges;
        if (edgesData && !nodes && !hasPoints) {
            throw new Error('Cannot load an edge-only layer in a graph without points!');
        }
        const edges = this.addEdges(edgesData, nodes, useColors);

        const layersData = layer.labels;
        const labels = this.addLabels(layersData, useColors);

        if (nodes || edges || labels) {
            const layer = new Layer(nodes, edges, labels, name);
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

    private addLabels(labelsData: GraferLabelsData, hasColors: boolean): any {
        const pickingManager = this._viewport.graph.picking;
        const context = this.context;
        const graph = this._viewport.graph;
        let labels = null;

        if (labelsData) {
            const labelsType = labelsData.type ? labelsData.type : 'PointLabel';
            const LabelsClass = GraphLabels.types[labelsType] || GraphLabels.PointLabel;
            const labelsMappings = Object.assign(
                {},
                LabelsClass.defaultMappings,
                labelsData.mappings
            );

            if (!hasColors) {
                const colorMapping = labelsMappings.color;
                labelsMappings.color = (entry: any, i): number => {
                    const value = colorMapping(entry, i);
                    if (typeof value !== 'number') {
                        return this._viewport.colorRegisrty.registerColor(value);
                    }
                    return value;
                };
            }

            labels = new LabelsClass(context, graph, labelsData.data, labelsMappings, pickingManager);
            if ('options' in labelsData) {
                const options = labelsData.options;
                const keys = Object.keys(options);
                for (const key of keys) {
                    if (key in labels) {
                        labels[key] = options[key];
                    }
                }
            }
        }
        return labels;
    }

    private addEdges(edgesData: GraferEdgesData, nodes: any, hasColors: boolean): any {
        const pickingManager = this._viewport.graph.picking;
        const context = this.context;
        const graph = this._viewport.graph;
        const hasPoints = Boolean(this._viewport.graph);
        let edges = null;

        if (edgesData) {
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

            edges = new EdgesClass(context, graph, edgesData.data, edgesMappings, pickingManager);

            if ('options' in edgesData) {
                const options = edgesData.options;
                const keys = Object.keys(options);
                for (const key of keys) {
                    if (key in edges) {
                        edges[key] = options[key];
                    }
                }
            }
        }
        return edges;
    }

    private addNodes(nodesData: GraferNodesData, hasColors: boolean): any {
        const pickingManager = this._viewport.graph.picking;
        const context = this.context;
        const graph = this._viewport.graph;
        let nodes = null;

        if (nodesData) {
            const nodesType = nodesData.type ? nodesData.type : 'Circle';
            const NodesClass = GraphNodes.types[nodesType] || GraphNodes.Circle;
            const nodesMappings = Object.assign(
                {},
                NodesClass.defaultMappings,
                nodesData.mappings
            );

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

            nodes = new NodesClass(context, graph, nodesData.data, nodesMappings, pickingManager);
            if ('options' in nodesData) {
                const options = nodesData.options;
                const keys = Object.keys(options);
                for (const key of keys) {
                    if (key in nodes) {
                        nodes[key] = options[key];
                    }
                }
            }
        }
        return nodes;
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
