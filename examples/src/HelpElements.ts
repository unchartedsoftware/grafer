import {css, CSSResult, html, LitElement} from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('mouse-interactions')
export class MouseInteractions extends LitElement {
    static get styles(): CSSResult {
        return css`
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

    protected render(): unknown {
        return html`<div class="container">
            <div><strong>LEFT DRAG:</strong> TRUCK</div>
            <div><strong>RIGHT DRAG:</strong> ROTATE</div>
            <div><strong>MIDDLE DRAG:</strong> PAN</div>
            <div><strong>SCROLL UP/DOWN:</strong> DOLLY</div>
        </div>`;
    }
}
