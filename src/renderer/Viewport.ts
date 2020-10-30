import {App, PicoGL} from 'picogl';
import {mat4, vec2, vec4} from 'gl-matrix';
import {RenderMode} from './Renderable';
import {Camera} from './Camera';
import {Graph} from '../graph/Graph';
import {Picking} from './Picking';

export class Viewport {
    public readonly element: HTMLElement;
    public readonly canvas: HTMLCanvasElement;
    public readonly context: App;
    public readonly pixelRatio: number;
    public readonly picking: Picking;

    public readonly size: vec2;
    public readonly projection: mat4;
    public readonly camera: Camera;
    public readonly graph: Graph;

    private _clearColor: [number, number, number, number] = vec4.create() as [number, number, number, number];
    public get clearColor(): vec4 {
        return this._clearColor;
    }
    public set clearColor(value: vec4) {
        vec4.copy(this._clearColor, value);
        this.context.clearColor(...this._clearColor);
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
        }

        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.pixelRatio;
        this.canvas.height = rect.height * this.pixelRatio;

        this.context = PicoGL.createApp(this.canvas, {
            antialias: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
        });
        this.clearColor = [0.141176471, 0.160784314, 0.2, 1.0];
        // this.clearColor = [0.18, 0.204, 0.251, 1.0];
        this.context.clearMask(PicoGL.COLOR_BUFFER_BIT | PicoGL.DEPTH_BUFFER_BIT);
        this.context.enable(PicoGL.DEPTH_TEST);
        this.context.depthFunc(PicoGL.LEQUAL);
        this.context.gl.lineWidth(2);

        this.picking = new Picking(this.context);

        this.size = vec2.fromValues(this.canvas.width, this.canvas.height);
        this.projection = mat4.create();
        mat4.perspective(this.projection, Math.PI / 2, this.size[0] / this.size[1], 1, 1000);

        this.camera = new Camera();
        this.graph = new Graph();

        const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]): void => {
            const canvasEntry = entries[0];
            const rect = canvasEntry.contentRect;
            this.context.resize(rect.width * this.pixelRatio, rect.height * this.pixelRatio);
            vec2.set(this.size, this.canvas.width, this.canvas.height);
            mat4.perspective(this.projection, Math.PI / 2, this.size[0] / this.size[1], 1, 1000);
            this.picking.resize(this.context);
            this.render();
        });
        resizeObserver.observe(this.canvas);
    }

    public render(camera: Camera = this.camera): void {
        if (!this.animationFrameID) {
            this.animationFrameID = requestAnimationFrame(() => this._render(camera));
        }
    }

    private _render(camera: Camera): void {
        const uniforms = {
            viewMatrix: camera.matrix,
            sceneMatrix: this.graph.matrix,
            projectionMatrix: this.projection,
            viewportSize: this.size,
            pixelRatio: this.pixelRatio,
            clearColor: this._clearColor,
        };

        this.context.depthMask(true);
        this.context.defaultDrawFramebuffer().clearColor(...this._clearColor).clear();
        this.context.defaultReadFramebuffer();
        if (this.graph.enabled) {
            this.graph.render(this.context, RenderMode.DRAFT, uniforms);
            if (this.picking.enabled) {
                this.picking.prepareContext(this.context);
                this.graph.render(this.context, RenderMode.PICKING, uniforms);
            }
        }
        this.animationFrameID = 0;
    }
}
