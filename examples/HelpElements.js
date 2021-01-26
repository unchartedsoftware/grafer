import { _ as __decorate } from '../web_modules/tslib.js';
import { L as LitElement, c as css, a as customElement } from '../web_modules/lit-element.js';
import { h as html } from '../web_modules/lit-html.js';

let MouseInteractions = class MouseInteractions extends LitElement {
    static get styles() {
        return css `
            :host {
                position: absolute;
                top: 0;
                right: 0;
            }

            .container {
                padding: 15px;
                color: #d8dee9;
                font-family: helvetica;
                font-size: 10px;
            }
        `;
    }
    render() {
        return html `<div class="container">
            <div><strong>LEFT DRAG:</strong> TRUCK</div>
            <div><strong>RIGHT DRAG:</strong> ROTATE</div>
            <div><strong>MIDDLE DRAG:</strong> PAN</div>
            <div><strong>SCROLL UP/DOWN:</strong> DOLLY</div>
        </div>`;
    }
};
MouseInteractions = __decorate([
    customElement('mouse-interactions')
], MouseInteractions);

export { MouseInteractions };
//# sourceMappingURL=HelpElements.js.map
