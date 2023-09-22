import {vec4} from "gl-matrix";
import {App, Framebuffer, PicoGL, Renderbuffer, Texture} from 'picogl';

export class OffscreenBuffer {
    private _clearColor: [number, number, number, number] = vec4.create() as [number, number, number, number];
    public get clearColor(): vec4 {
        return this._clearColor;
    }
    public set clearColor(value: vec4) {
        vec4.copy(this._clearColor, value);
    }

    private context: App;
    public colorTarget: Texture;
    private depthTarget: Renderbuffer;
    private frameBuffer: Framebuffer;

    constructor(context: App) {
        this.context = context;
        this.resize(context);
    }

    public resize(context: App): void {
        if (this.frameBuffer) {
            this.frameBuffer.delete();
        }

        if (this.colorTarget) {
            this.colorTarget.delete();
        }

        if (this.depthTarget) {
            this.depthTarget.delete();
        }

        this.colorTarget = context.createTexture2D(context.width, context.height);
        this.depthTarget = context.createRenderbuffer(context.width, context.height, PicoGL.DEPTH_COMPONENT16);
        this.frameBuffer = context.createFramebuffer()
            .colorTarget(0, this.colorTarget)
            .depthTarget(this.depthTarget);
    }

    public prepareContext(context: App): void {
        context.readFramebuffer(this.frameBuffer);
        context.drawFramebuffer(this.frameBuffer)
            .clearMask(PicoGL.COLOR_BUFFER_BIT | PicoGL.DEPTH_BUFFER_BIT)
            .clearColor(...this._clearColor)
            .clear()
            .depthMask(true);
    }

    public blitToBuffer(context: App, target: OffscreenBuffer, mask: GLenum = PicoGL.COLOR_BUFFER_BIT): void {
        context.drawFramebuffer(target.frameBuffer);
        context.readFramebuffer(this.frameBuffer);
        context.blitFramebuffer(mask);
    }

    public blitToScreen(context: App, mask: GLenum = PicoGL.COLOR_BUFFER_BIT): void {
        context.defaultDrawFramebuffer();
        context.readFramebuffer(this.frameBuffer);
        context.blitFramebuffer(mask);
    }

    public readPixel(x: number, y: number, buffer: Uint8Array): void {
        this.context.defaultDrawFramebuffer()
            .readFramebuffer(this.frameBuffer)
            .readPixel(x, y, buffer);
    }
}
