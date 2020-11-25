import {App, PicoGL} from 'picogl';
import {vec2, vec4} from 'gl-matrix';
import {RenderMode, RenderUniforms} from './Renderable';
import {Camera} from './Camera';
import {Graph} from '../graph/Graph';
import {MouseHandler} from '../UX/mouse/MouseHandler';
import {ColorRegistry} from './ColorRegistry';

export class Viewport {
    public readonly element: HTMLElement;
    public readonly canvas: HTMLCanvasElement;
    public readonly context: App;
    public readonly pixelRatio: number;
    public readonly mouseHandler: MouseHandler;
    public readonly colorRegisrty: ColorRegistry;
    public rect: DOMRectReadOnly;

    public readonly size: vec2;
    public readonly camera: Camera;

    public graph: Graph;

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

        this.mouseHandler = new MouseHandler(this.canvas, this.rect, this.pixelRatio);

        this.size = vec2.fromValues(this.canvas.width, this.canvas.height);

        this.camera = new Camera(this.size);

        const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]): void => {
            const canvasEntry = entries[0];
            this.rect = canvasEntry.contentRect;
            this.context.resize(this.rect.width * this.pixelRatio, this.rect.height * this.pixelRatio);
            vec2.set(this.size, this.canvas.width, this.canvas.height);
            this.camera.viewportSize = this.size;
            this.mouseHandler.resize(this.rect, this.pixelRatio);
            this.graph.resize(this.context);
            this.render();
        });
        resizeObserver.observe(this.canvas);

        this.colorRegisrty = new ColorRegistry(this.context);
    }

    public resetContextFlags(): void {
        this.context.defaultDrawFramebuffer();
        this.context.defaultReadFramebuffer();
        this.context.disable(PicoGL.BLEND);
        this.context.enable(PicoGL.DEPTH_TEST);
        this.context.depthMask(true);
        this.context.depthRange(0.0, 1.0);
        this.context.clearColor(...this._clearColor);
    }

    public render(camera: Camera = this.camera): void {
        if (!this.animationFrameID) {
            this.animationFrameID = requestAnimationFrame(() => this._render(camera));
        }
    }

    private _render(camera: Camera): void {
        const uniforms: RenderUniforms = {
            uViewMatrix: camera.viewMatrix,
            uSceneMatrix: this.graph.matrix,
            uProjectionMatrix: this.camera.projectionMatrix,
            uViewportSize: this.size,
            uPixelRatio: this.pixelRatio,
            uClearColor: this._clearColor,
            uColorPalette: this.colorRegisrty.texture,
        };

        this.resetContextFlags();
        this.context.clear();
        if (this.graph && this.graph.enabled) {
            this.graph.render(this.context, RenderMode.DRAFT, uniforms);
            this.graph.render(this.context, RenderMode.PICKING, uniforms);
        }
        this.animationFrameID = 0;
    }
}
