import { T as Tweakpane } from './tweakpane.js';
import { a as Gravity, k as kButton2Index } from './GraferController.js';

class DebugMenu {
    constructor(viewport) {
        this.viewport = viewport;
        const layers = viewport.graph.layers;
        this.pane = new Tweakpane({ title: 'Debug Menu', expanded: false });
        for (let i = 0, n = layers.length; i < n; ++i) {
            const layer = layers[i];
            const layerFolder = this.pane.addFolder({ title: layer.name, expanded: false });
            this.addLayerOptions(layerFolder, layer);
        }
        this.uxFolder = null;
        this.pane.on('change', () => {
            this.viewport.render();
        });
    }
    registerUX(ux) {
        if (!this.uxFolder) {
            this.uxFolder = this.pane.addFolder({ title: 'UX', expanded: false });
        }
        const folder = this.uxFolder.addFolder({ title: ux.constructor.name, expanded: false });
        folder.addInput(ux, 'enabled');
        if ('button' in ux) {
            const keys = Object.keys(kButton2Index);
            const options = {};
            for (let i = 0, n = keys.length; i < n; ++i) {
                options[keys[i]] = keys[i];
            }
            folder.addInput(ux, 'button', { options });
        }
        if ('speed' in ux) {
            folder.addInput(ux, 'speed', { min: -100, max: 100 });
        }
    }
    addLayerOptions(folder, layer) {
        folder.addInput(layer, 'enabled');
        folder.addInput(layer, 'nearDepth', { min: 0, max: 1, label: 'near' });
        folder.addInput(layer, 'farDepth', { min: 0, max: 1, label: 'far' });
        if (layer.nodes) {
            const nodesFolder = folder.addFolder({ title: 'Nodes', expanded: false });
            this.addNodesOptions(nodesFolder, layer);
        }
        if (layer.edges) {
            const edgesFolder = folder.addFolder({ title: 'Edges', expanded: false });
            this.addEdgesOptions(edgesFolder, layer);
        }
    }
    addNodesOptions(folder, layer) {
        const nodes = layer.nodes;
        folder.addInput(nodes, 'enabled');
        folder.addInput(nodes, 'pixelSizing', { label: 'pixel sizing ' });
        folder.addInput(nodes, 'billboard', { label: 'billboarding' });
        folder.addInput(nodes, 'minSize', { label: 'min size' });
        folder.addInput(nodes, 'maxSize', { label: 'max size' });
        folder.addInput(layer, 'nodesNearDepth', { min: 0, max: 1, label: 'near' });
        folder.addInput(layer, 'nodesFarDepth', { min: 0, max: 1, label: 'far' });
    }
    addEdgesOptions(folder, layer) {
        const edges = layer.edges;
        folder.addInput(edges, 'enabled');
        folder.addInput(edges, 'alpha', { min: 0, max: 1 });
        folder.addInput(layer, 'edgesNearDepth', { min: 0, max: 1, label: 'near' });
        folder.addInput(layer, 'edgesFarDepth', { min: 0, max: 1, label: 'far' });
        if (edges instanceof Gravity) {
            folder.addInput(edges, 'gravity', { min: -2, max: 2 });
        }
    }
}

export { DebugMenu as D };
//# sourceMappingURL=DebugMenu.js.map
