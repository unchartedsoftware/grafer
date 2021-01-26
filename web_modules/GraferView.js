import { _ as __decorate } from './tslib.js';
import { q as query, a as customElement, L as LitElement, c as css } from './lit-element.js';
import { G as GraferController } from './GraferController.js';
import { E as EventEmitter } from './@dekkai/event-emitter.js';
import { h as html } from './lit-html.js';

let GraferView = class GraferView extends LitElement {
    constructor() {
        super(...arguments);
        this._controller = null;
    }
    static get styles() {
        return css `
            :host {
                display: flex;
                align-items: stretch;
            }
            #grafer_canvas {
                flex-grow: 1;
                max-width: 100%;
                max-height: 100%;
            }
        `;
    }
    static get properties() {
        return {
            points: { type: Object },
            colors: { type: Object },
            layers: { type: Object },
        };
    }
    get controller() {
        return this._controller;
    }
    connectedCallback() {
        super.connectedCallback();
    }
    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        this._controller = new GraferController(this.canvas, {
            points: this.points,
            colors: this.colors,
            layers: this.layers,
        });
        this._controller.on(EventEmitter.omniEvent, (event, ...args) => {
            const eventName = typeof event === 'symbol' ? event.description : event;
            this.dispatchEvent(new CustomEvent(eventName, { detail: args }));
        });
    }
    render() {
        return html `<canvas id="grafer_canvas"></canvas>`;
    }
};
__decorate([
    query('#grafer_canvas', true)
], GraferView.prototype, "canvas", void 0);
GraferView = __decorate([
    customElement('grafer-view') // is this a good enough name?
], GraferView);
//# sourceMappingURL=GraferView.js.map
