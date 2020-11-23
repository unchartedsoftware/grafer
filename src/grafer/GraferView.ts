import {LitElement, customElement, html, query, PropertyValues, css, CSSResult} from 'lit-element';
import {GraferController, GraferLayerData, GraferPointsData} from './GraferController';

@customElement('grafer-view') // is this a good enough name?
export class GraferView extends LitElement {
    public static get styles(): CSSResult {
        return css`
            :host {
                display: flex;
                align-items: stretch;
            }
            #grafer_canvas {
                flex-grow: 1;
            }
        `;
    }

    public static get properties(): any {
        return {
            points: {type: Object},
            layers: {type: Object},
        };
    }

    private points: GraferPointsData;
    private layers: GraferLayerData[];

    @query('#grafer_canvas', true)
    private canvas: HTMLCanvasElement;

    private _controller: GraferController = null;
    public get controller(): GraferController {
        return this._controller;
    }

    public connectedCallback(): void {
        super.connectedCallback();
    }

    protected firstUpdated(_changedProperties: PropertyValues): void {
        super.firstUpdated(_changedProperties);
        this._controller = new GraferController(this.canvas, {
            points: this.points,
            layers: this.layers,
        });
    }

    protected render(): unknown {
        return html`<canvas id="grafer_canvas"></canvas>`;
    }
}
