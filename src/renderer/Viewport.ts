import {PicoGL} from 'picogl';
import {GraferContext} from './GraferContext';
import {vec2, vec4} from 'gl-matrix';
import {RenderMode, RenderUniforms} from './Renderable';
import {Camera, CameraOptions} from './Camera';
import {Graph} from '../graph/Graph';
import {MouseHandler} from '../UX/mouse/MouseHandler';
import {ColorRegistry, ColorRegistryType} from './colors/ColorRegistry';
import {ColorRegistryIndexed} from './colors/ColorRegistryIndexed';
import RectObserver from './RectObserver';
import {ColorRegistryMapped} from './colors/ColorRegistryMapped';
import {TextureRegistry} from './textures/TextureRegistry';
import {PixelRatioObserver} from './PixelRatioObserver';

export interface ViewportOptions {
    colorRegistryType?: ColorRegistryType;
    colorRegistryCapacity?: number;
    camera?: CameraOptions;
}

const kDefaultOptions: ViewportOptions = {
    colorRegistryType: ColorRegistryType.mapped,
    colorRegistryCapacity: 1024,
};

export class Viewport {
    public readonly element: HTMLElement;
    public readonly canvas: HTMLCanvasElement;
    public readonly context: GraferContext;
    public readonly mouseHandler: MouseHandler;
    public readonly colorRegistry: ColorRegistry;
    public readonly textureRegistry: TextureRegistry;
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

    public get pixelRatio(): number {
        return this.context.pixelRatio;
    }

    private animationFrameID: number = 0;
    private timeoutID: number = 0;
    private renderMode: RenderMode;
    private boundDelayedRender: () => void = this.delayedRender.bind(this);

    constructor(element: HTMLElement, options?: ViewportOptions) {
        const pixelRatio = window.devicePixelRatio;
        const opts = Object.assign({}, kDefaultOptions, options);
        this.element = element;

        if (this.element instanceof HTMLCanvasElement) {
            this.canvas = this.element;
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.element.appendChild(this.canvas);
        }

        this.rect = this.canvas.getBoundingClientRect();
        this.canvas.width = this.rect.width * pixelRatio;
        this.canvas.height = this.rect.height * pixelRatio;

        this.context = PicoGL.createApp(this.canvas, {
            antialias: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
        }) as GraferContext;
        this.clearColor = [0.141176471, 0.160784314, 0.2, 1.0];
        // this.clearColor = [0.18, 0.204, 0.251, 1.0];
        this.context.clearMask(PicoGL.COLOR_BUFFER_BIT | PicoGL.DEPTH_BUFFER_BIT);
        this.context.enable(PicoGL.DEPTH_TEST);
        this.context.enable(PicoGL.POLYGON_OFFSET_FILL);
        this.context.depthFunc(PicoGL.LESS);
        this.context.pixelRatio = pixelRatio;
        new PixelRatioObserver(pixelRatio => {
            this.context.pixelRatio = pixelRatio;
        });

        this.mouseHandler = new MouseHandler(this.canvas, this.rect, this.pixelRatio);

        this.size = vec2.fromValues(this.canvas.width, this.canvas.height);

        this.camera = new Camera(this.size, opts.camera);

        const resizeObserver = new RectObserver((rect): void => {
            this.rect = rect;
            this.context.resize(this.rect.width * this.pixelRatio, this.rect.height * this.pixelRatio);
            vec2.set(this.size, this.canvas.width, this.canvas.height);
            this.camera.viewportSize = this.size;
            this.mouseHandler.resize(this.rect, this.pixelRatio);
            this.graph.resize(this.context);
            this.render();
        });
        resizeObserver.observe(this.canvas);

        if (opts.colorRegistryType === ColorRegistryType.mapped) {
            this.colorRegistry = new ColorRegistryMapped(this.context, opts.colorRegistryCapacity);
        } else {
            this.colorRegistry = new ColorRegistryIndexed(this.context, opts.colorRegistryCapacity);
        }

        this.textureRegistry = new TextureRegistry(this.context);
    }

    public resetContextFlags(): void {
        this.context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);
        this.context.defaultDrawFramebuffer();
        this.context.defaultReadFramebuffer();
        this.context.disable(PicoGL.BLEND);
        this.context.enable(PicoGL.DEPTH_TEST);
        this.context.depthFunc(PicoGL.LESS);
        this.context.depthMask(true);
        this.context.depthRange(0.0, 1.0);
        this.context.clearColor(...this._clearColor);
    }

    public render(): void {
        if (!this.animationFrameID) {
            this.renderMode = RenderMode.DRAFT;
            if (this.timeoutID) {
                clearTimeout(this.timeoutID);
                this.timeoutID = 0;
            }
            this.animationFrameID = requestAnimationFrame(() => this._render());
        }
    }

    private scheduleRender(delay: number): void {
        if (this.timeoutID) {
            clearTimeout(this.timeoutID);
        }
        this.timeoutID = window.setTimeout(this.boundDelayedRender, delay);
    }

    private delayedRender(): void {
        this.timeoutID = 0;
        this._render();
    }

    private _render(): void {
        this.textureRegistry.exportTextures();
        const uniforms: RenderUniforms = {
            uViewMatrix: this.camera.viewMatrix,
            uSceneMatrix: this.graph.matrix,
            uProjectionMatrix: this.camera.projectionMatrix,
            uViewportSize: this.size,
            uPixelRatio: this.pixelRatio,
            uClearColor: this._clearColor,
            uColorPalette: this.colorRegistry.texture,
            uTexBoxes: this.textureRegistry.boxesTexture,
            uTexAtlas: this.textureRegistry.atlasTexture,
            uRenderMode: this.renderMode,
            uCameraMode: this.camera.mode,
        };

        this.resetContextFlags();
        this.context.clear();
        if (this.graph && this.graph.enabled) {
            this.graph.render(this.context, this.renderMode, uniforms);

            switch (this.renderMode) {
                case RenderMode.DRAFT:
                    uniforms.uRenderMode = RenderMode.PICKING;
                    this.graph.render(this.context, RenderMode.PICKING, uniforms);
                    this.renderMode = RenderMode.MEDIUM;
                    this.scheduleRender(85);
                    break;

                case RenderMode.MEDIUM:
                    this.renderMode = RenderMode.HIGH;
                    this.scheduleRender(120);
                    break;
            }
        }
        this.animationFrameID = 0;
    }
}
