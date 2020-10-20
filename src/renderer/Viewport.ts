import {App, PicoGL} from 'picogl';
import {mat4, vec2} from 'gl-matrix';
import {RenderMode} from './Renderable';
import {Camera} from './Camera';
import {Graph} from '../graph/Graph';

export class Viewport {
    public readonly element: HTMLElement;
    public readonly canvas: HTMLCanvasElement;
    public readonly context: App;
    public readonly pixelRatio: number;

    private _size: vec2;
    public get size(): vec2 {
        return this._size;
    }

    private _projection: mat4;
    public get projection(): mat4 {
        return this._projection;
    }

    private _camera: Camera;
    public get camera(): Camera {
        return this._camera;
    }

    private _graph: Graph;
    public get graph(): Graph {
        return this._graph;
    }

    private animationFrameID: number = 0;

    constructor(element: HTMLElement) {
        this.element = element;
        this.pixelRatio = 1.0; // window.devicePixelRatio;

        if (this.element instanceof HTMLCanvasElement) {
            this.canvas = this.element;
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.element.appendChild(this.canvas);

            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * this.pixelRatio;
            this.canvas.height = rect.height * this.pixelRatio;
        }

        this.context = PicoGL.createApp(this.canvas)
            .clearColor(0.298, 0.337, 0.416, 1.0)
            .clearMask(PicoGL.COLOR_BUFFER_BIT | PicoGL.DEPTH_BUFFER_BIT);

        this.context.enable(PicoGL.DEPTH_TEST);
        this.context.depthFunc(PicoGL.LEQUAL);
        this.context.gl.lineWidth(2);

        this._size = vec2.fromValues(this.canvas.width, this.canvas.height);
        this._projection = mat4.create();
        mat4.perspective(this.projection, Math.PI / 2, this.size[0] / this.size[1], 1, 1000);

        window.addEventListener('resize', () => {
            const rect = this.canvas.getBoundingClientRect();
            this.context.resize(rect.width * this.pixelRatio, rect.height * this.pixelRatio);
            vec2.set(this.size, this.canvas.width, this.canvas.height);
            mat4.perspective(this.projection, Math.PI / 2, this.size[0] / this.size[1], 1, 1000);
            this.render();
        });

        this._camera = new Camera();
        this._graph = new Graph();
    }

    public render(camera: Camera = this._camera): void {
        if (!this.animationFrameID) {
            this.animationFrameID = requestAnimationFrame(() => this._render(camera));
        }
    }

    private _render(camera: Camera): void {
        const uniforms = {
            viewMatrix: camera.matrix,
            sceneMatrix: this._graph.matrix,
            projectionMatrix: this._projection,
            viewportSize: this._size,
            pixelRatio: this.pixelRatio,
        };

        this.context.clear();
        this._graph.render(this.context, RenderMode.DRAFT, uniforms);
        this.animationFrameID = 0;
    }
}
