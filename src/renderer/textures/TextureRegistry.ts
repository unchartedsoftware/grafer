import { GraferContext } from '../GraferContext';
import {TextureAtlas, kImageMargin} from '../TextureAtlas';

export class TextureRegistry extends TextureAtlas {
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;

    constructor(context: GraferContext) {
        super(context);
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    public registerTexture(src: string): Promise<void> {
        const charKey = src;
        if (!this.textureKeyMap.has(charKey)) {
            // add placeholder image to registry
            this.addTexture(charKey, {id: charKey, w: 1, h: 1, image: new ImageData(1, 1)});

            // replace placeholder image with real image
            return this.renderTexture(src).then(image =>
                this.addTexture(charKey, { id: charKey, w: image.width, h: image.height, image }));
        }
    }

    protected renderTexture(src: string): Promise<ImageData> {
        const {canvas, ctx} = this;
        const img = new Image();
        return new Promise((resolve) => {
            img.crossOrigin = "Anonymous";
            img.src = src;
            img.onload = (): void => {
                canvas.width  = img.width + 2 * kImageMargin;
                canvas.height = img.height + 2 * kImageMargin;

                ctx.drawImage(img, kImageMargin, kImageMargin);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
            };
        });
    }
}
