import {RenderMode, RenderUniforms} from '../renderer/Renderable';
import {App} from 'picogl';
import {Nodes} from './nodes/Nodes';
import {Edges} from './edges/Edges';
import {GraphRenderable} from './GraphRenderable';
import {EventEmitter} from '@dekkai/event-emitter/build/lib/EventEmitter';

export class Layer extends EventEmitter implements GraphRenderable {
    private _nodes: Nodes<any, any>;
    public get nodes(): Nodes<any, any> {
        return this._nodes;
    }

    private _edges: Edges<any, any> | null;
    public get edges(): Edges<any, any> | null {
        return this._edges;
    }

    private _nearDepth: number = 0.0;
    public get nearDepth(): number {
        return this._nearDepth;
    }
    public set nearDepth(value: number) {
        this._nearDepth = value;
        this.updateNodesDepths();
        this.updateEdgesDepths();
    }

    private _farDepth: number = 1.0;
    public get farDepth(): number {
        return this._farDepth;
    }
    public set farDepth(value: number) {
        this._farDepth = value;
        this.updateNodesDepths();
        this.updateEdgesDepths();
    }

    private _nodesNearDepth: number = 0;
    public get nodesNearDepth(): number {
        return this._nodesNearDepth;
    }
    public set nodesNearDepth(value: number) {
        this._nodesNearDepth = value;
        this.updateNodesDepths();
    }

    private _nodesFarDepth: number = 1;
    public get nodesFarDepth(): number {
        return this._nodesFarDepth;
    }
    public set nodesFarDepth(value: number) {
        this._nodesFarDepth = value;
        this.updateNodesDepths();
    }

    private _edgesNearDepth: number = 0;
    public get edgesNearDepth(): number {
        return this._edgesNearDepth;
    }
    public set edgesNearDepth(value: number) {
        this._edgesNearDepth = value;
        this.updateEdgesDepths();
    }

    private _edgesFarDepth: number = 1;
    public get edgesFarDepth(): number {
        return this._edgesFarDepth;
    }
    public set edgesFarDepth(value: number) {
        this._edgesFarDepth = value;
        this.updateEdgesDepths();
    }

    public enabled: boolean = true;
    public name: string;

    public constructor(nodes: Nodes<any, any>, edges: Edges<any, any>, name = 'Layer') {
        super();
        this._nodes = nodes;
        this._edges = edges;
        this.name = name;

        if (this._nodes) {
            this._nodes.on(EventEmitter.omniEvent, (event, id: string | number): void => {
                this.emit(event, {
                    layer: this.name,
                    type: 'node',
                    id,
                });
            });
        }

        if (this._edges) {
            this._edges.on(EventEmitter.omniEvent, (event, id: string | number): void => {
                this.emit(event, {
                    layer: this.name,
                    type: 'edge',
                    id,
                });
            });
        }
    }

    public render(context: App, mode: RenderMode, uniforms: RenderUniforms): void {
        if (this._nodes.enabled) {
            this._nodes.render(context, mode, uniforms);
        }

        if (this._edges && this._edges.enabled) {
            this.edges.render(context, mode, uniforms);
        }
    }

    public renderNodes(context: App, mode: RenderMode, uniforms: RenderUniforms): void {
        if (this._nodes && this._nodes.enabled) {
            this._nodes.render(context, mode, uniforms);
        }
    }

    public renderEdges(context: App, mode: RenderMode, uniforms: RenderUniforms): void {
        if (this._edges && this._edges.enabled) {
            this._edges.render(context, mode, uniforms);
        }
    }

    private updateNodesDepths(): void {
        const depthRange = this._farDepth - this._nearDepth;
        this._nodes.nearDepth = this._nearDepth + depthRange * this._nodesNearDepth;
        this._nodes.farDepth = this._nearDepth + depthRange * this._nodesFarDepth;
    }

    private updateEdgesDepths(): void {
        if (this._edges) {
            const depthRange = this._farDepth - this._nearDepth;
            this._edges.nearDepth = this._nearDepth + depthRange * this._edgesNearDepth;
            this._edges.farDepth = this._nearDepth + depthRange * this._edgesFarDepth;
        }
    }
}
