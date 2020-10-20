import {Viewport} from '/js/renderer/mod.js';
import {loadNodesLocalCSV, loadNodesLocalJSONL} from '/js/loaders/mod.js';
import {DragRotation, ScrollZoom} from '/js/UX/mod.js';

export async function basic(container) {
    const nodesInput = document.createElement('input');
    nodesInput.setAttribute('type', 'file');
    nodesInput.setAttribute('name', 'nodesFile');
    container.appendChild(nodesInput);

    const edgesInput = document.createElement('input');
    edgesInput.setAttribute('type', 'file');
    edgesInput.setAttribute('name', 'edgesFile');
    container.appendChild(edgesInput);

    const submitButton = document.createElement('button');
    submitButton.innerText = 'Submit';
    submitButton.disabled = true;
    container.appendChild(submitButton);

    nodesInput.addEventListener('change', () => {
       if (edgesInput.files.length) {
           submitButton.disabled = false;
       }
    });

    edgesInput.addEventListener('change', () => {
        if (nodesInput.files.length) {
            submitButton.disabled = false;
        }
    });

    submitButton.addEventListener('click', async e => {
        e.preventDefault();
        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        const menu = document.createElement('div');
        container.appendChild(menu);

        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.id = "pixel_sizing";
        checkbox.checked = false;

        const label = document.createElement('label')
        label.htmlFor = "pixel_sizing";
        label.appendChild(document.createTextNode('Use Pixel Sizing:'));

        const size = document.createElement("input");
        size.setAttribute('type', 'text');
        size.setAttribute('value', '1.0');

        menu.appendChild(label);
        menu.appendChild(checkbox);
        menu.appendChild(size);

        const content = document.createElement('div');
        content.style.flexGrow = '1';
        container.appendChild(content);

        // container.innerHTML = 'Hello Basic!';
        const viewport = new Viewport(content);
        const file = nodesInput.files[0];
        const extension = file.name.split('.').pop();
        let nodes;
        let edges = null;
        if (extension === 'csv') {
            nodes = await loadNodesLocalCSV(viewport, nodesInput.files[0], edgesInput.files[0]);
        } else if (extension === 'jsonl') {
            const result = await loadNodesLocalJSONL(viewport, nodesInput.files[0], edgesInput.files[0]);
            nodes = result.nodes;
            edges = result.edges;
        }

        viewport.graph.renderables.push(nodes);
        if (edges) {
            viewport.graph.renderables.push(edges);
        }

        checkbox.addEventListener('change', () => {
            nodes.pixelSizing = checkbox.checked;
            viewport.render();
        });

        size.addEventListener('change', () => {
            const value = parseFloat(size.value);
            if (isNaN(value)) {
                size.value = nodes.nodeSize;
            } else {
                nodes.nodeSize = value;
            }
            viewport.render();
        });

        const rotation = new DragRotation(viewport);
        rotation.start();

        const zoom = new ScrollZoom(viewport);
        zoom.start();

        viewport.render();
    });
}
