import {App, Texture} from 'picogl';
import {vec2} from 'gl-matrix';

// utility functions to allow textures to be pulled off of gpu asynchronously
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#use_non-blocking_async_data_readback
function clientWaitAsync(gl: WebGL2RenderingContext, sync: WebGLSync, flags: number, interval_ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
        function test(): void {
            const res = gl.clientWaitSync(sync, flags, 0);
            if (res === gl.WAIT_FAILED) {
                reject();
                return;
            }
            if (res === gl.TIMEOUT_EXPIRED) {
                setTimeout(test, interval_ms);
                return;
            }
            resolve();
        }
        test();
    });
}
async function getBufferSubDataAsync(
    gl: WebGL2RenderingContext,
    target: number,
    buffer: WebGLBuffer,
    srcByteOffset: number,
    dstBuffer: ArrayBufferView,
    dstOffset?: number,
    length?: number
): Promise<void> {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();

    await clientWaitAsync(gl, sync, 0, 10);
    gl.deleteSync(sync);

    gl.bindBuffer(target, buffer);
    gl.getBufferSubData(target, srcByteOffset, dstBuffer, dstOffset, length);
    gl.bindBuffer(target, null);
}
async function readPixelsAsync(gl: WebGL2RenderingContext, x: number, y: number, w: number, h: number, format: number, type: number, dest: ArrayBufferView): Promise<void> {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, dest.byteLength, gl.STREAM_READ);
    gl.readPixels(x, y, w, h, format, type, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

    await getBufferSubDataAsync(gl, gl.PIXEL_PACK_BUFFER, buf, 0, dest);

    gl.deleteBuffer(buf);
}

export abstract class DataTexture {
    protected context: App;

    protected _texture: Texture;
    public get texture(): Texture {
        this.update();
        return this._texture;
    }

    public get capacity(): number {
        return this.textureSize[0] * this.textureSize[1];
    }

    protected textureSize: vec2;

    protected constructor(context: App, initialCapacity: number = 1024) {
        this.context = context;
        this.textureSize = vec2.create();
        this.resizeTexture(initialCapacity);
    }

    public abstract get length(): number;
    public abstract update(): void;

    public destroy(): void {
        this._texture.delete();

        this.context = null;
        this.textureSize = null;
        this._texture = null;
    }

    protected createTexture(width: number, height: number): Texture {
        return this.context.createTexture2D(width, height);
    }

    protected resizeTexture(capacity: number): void {
        if (this.capacity < capacity) {
            const textureWidth = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(capacity)))));
            const textureHeight = Math.pow(2, Math.ceil(Math.log2(Math.ceil(capacity / textureWidth))));
            this.textureSize = vec2.fromValues(textureWidth, textureHeight);
            if (this._texture) {
                this._texture.resize(textureWidth, textureHeight);
            } else {
                this._texture = this.createTexture(textureWidth, textureHeight);
            }
        }
    }

    protected readTexture(texture: Texture): Float32Array {
        const gl = texture.gl;
        const [textureWidth, textureHeight] = this.textureSize;
        const fbRead = gl.createFramebuffer();

        // make this the current frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbRead);

        // attach the texture to the framebuffer.
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, texture.texture, 0);
        const canRead = gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE;
        if(canRead) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbRead);
            const buffer = new Float32Array(textureWidth * textureHeight * 4);
            gl.readPixels(0, 0, textureWidth, textureHeight, gl.RGBA, gl.FLOAT, buffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return buffer;
        }

        return new Float32Array();
    }

    protected async readTextureAsync(texture: Texture): Promise<Float32Array> {
        const gl = texture.gl;
        const [textureWidth, textureHeight] = this.textureSize;
        const fbRead = gl.createFramebuffer();

        // make this the current frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbRead);

        // attach the texture to the framebuffer.
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, texture.texture, 0);
        const canRead = gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE;
        if(canRead) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbRead);
            const buffer = new Float32Array(textureWidth * textureHeight * 4);
            await readPixelsAsync(gl as WebGL2RenderingContext, 0, 0, textureWidth, textureHeight, gl.RGBA, gl.FLOAT, buffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return buffer;
        }

        return new Float32Array();
    }
}
