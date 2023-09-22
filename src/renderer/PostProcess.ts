import PicoGL, { App, DrawCall, Framebuffer, Texture } from "picogl";
import PPVS from './shaders/postprocess/postProcess.vs.glsl';
import BlurFS from './shaders/postprocess/blur.fs.glsl';
import BlendFS from './shaders/postprocess/blend.fs.glsl';
import ResampleFS from './shaders/postprocess/resample.fs.glsl';
import { setDrawCallUniforms } from "./Renderable";

export class PostProcess {
    private context: App;

    drawCallBlur: DrawCall;
    drawCallDownsample: DrawCall;
    drawCallBlend: DrawCall;

    outputBuffer1: Framebuffer;
    outputBuffer2: Framebuffer;
    outputTexture1: Texture;
    outputTexture2: Texture;

    viewportSize: [number, number];

    _drawBuffer: Framebuffer;
    _targetTexture: Texture;

    get drawBuffer(): Framebuffer {
        return this._drawBuffer;
    }
    get targetTexture(): Texture {
        return this._targetTexture;
    }

    constructor(context: App) {
        this.context = context;
        const verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));
        const verticesVAO = context.createVertexArray()
            .vertexAttributeBuffer(0, verticesVBO);

        const programBlur = context.createProgram(PPVS, BlurFS);
        const drawCallBlur = context.createDrawCall(programBlur, verticesVAO)
        .primitive(PicoGL.TRIANGLE_STRIP);
        this.drawCallBlur = drawCallBlur;

        const programResample = context.createProgram(PPVS, ResampleFS);
        const drawCallDownsample = context.createDrawCall(programResample, verticesVAO)
            .primitive(PicoGL.TRIANGLE_STRIP);
        this.drawCallDownsample = drawCallDownsample;

        const programBlend = context.createProgram(PPVS, BlendFS);
        const drawCallBlend = context.createDrawCall(programBlend, verticesVAO)
            .primitive(PicoGL.TRIANGLE_STRIP);
        this.drawCallBlend = drawCallBlend;

        const textureSize: [number, number] = [context.width, context.height];
        const textureOptions = { minFilter: PicoGL.LINEAR, magFilter: PicoGL.LINEAR, wrapT: PicoGL.CLAMP_TO_EDGE, wrapS: PicoGL.CLAMP_TO_EDGE };
        this.outputTexture1 = context.createTexture2D(...textureSize, textureOptions);
        this.outputBuffer1 = context.createFramebuffer()
            .colorTarget(0, this.outputTexture1);
        this.outputTexture2 = context.createTexture2D(...textureSize, textureOptions);
        this.outputBuffer2 = context.createFramebuffer()
            .colorTarget(0, this.outputTexture2);
    }

    public resample(viewportSize: [number, number], sourceTexture: Texture): void {
        this.context.viewport(0, 0, ...viewportSize);
        setDrawCallUniforms(this.drawCallDownsample, {
            uFrameTexture: sourceTexture,
        });
        this.drawCallDownsample.draw();
    }

    public blur(sourceTexture: Texture, isHorizontal: boolean): void {
        setDrawCallUniforms(this.drawCallBlur, {
            uFrameTexture: sourceTexture,
            uDirection: isHorizontal ? [1, 0] : [0, 1],
        });
        this.drawCallBlur.draw();
    }

    public blend(frameTexture: Texture, uGlowTexture: Texture): void {
        const { context } = this;
        setDrawCallUniforms(this.drawCallBlend, {
            uFrameTexture: frameTexture,
            uGlowTexture: uGlowTexture,
        });
        context.enable(PicoGL.BLEND);
        context.blendFuncSeparate(PicoGL.ONE, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);
        this.drawCallBlend.draw();
    }
}
