import {App, PicoGL} from 'picogl';
import {vec2, vec4} from 'gl-matrix';
import {RenderMode} from './Renderable';
import {Camera} from './Camera';
import {Graph} from '../graph/Graph';
import {Picking} from './Picking';
import {MouseHandler} from '../UX/mouse/MouseHandler';

export class Viewport {
    public readonly element: HTMLElement;
    public readonly canvas: HTMLCanvasElement;
    public readonly context: App;
    public readonly pixelRatio: number;
    public readonly picking: Picking;
    public readonly mouseHandler: MouseHandler;
    public rect: DOMRectReadOnly;

    public readonly size: vec2;
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
        this.pixelRatio = window.devicePixelRatio;

        if (this.element instanceof HTMLCanvasElement) {
            this.canvas = this.element;
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.element.appendChild(this.canvas);
        }

        this.rect = this.canvas.getBoundingClientRect();
        this.canvas.width = this.rect.width * this.pixelRatio;
        this.canvas.height = this.rect.height * this.pixelRatio;

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
        this.mouseHandler = new MouseHandler(this.canvas, this.rect);

        this.size = vec2.fromValues(this.canvas.width, this.canvas.height);

        this.camera = new Camera(this.size);
        this.graph = new Graph();

        const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]): void => {
            const canvasEntry = entries[0];
            this.rect = canvasEntry.contentRect;
            this.context.resize(this.rect.width * this.pixelRatio, this.rect.height * this.pixelRatio);
            vec2.set(this.size, this.canvas.width, this.canvas.height);
            this.camera.viewportSize = this.size;
            this.picking.resize(this.context);
            this.mouseHandler.resize(this.rect);
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
            viewMatrix: camera.viewMatrix,
            sceneMatrix: this.graph.matrix,
            projectionMatrix: this.camera.projectionMatrix,
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
