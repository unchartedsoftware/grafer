import {Circular} from '../graph/nodes/circular/Circular';
import dekkai from 'dekkai';
import {Viewport} from '../renderer/Viewport';

export async function loadNodesLocalCSV(viewport: Viewport, file: File): Promise<Circular> {
    await dekkai.init(6);

    const positions = [];
    const colors = [];

    let max = 0;

    const table = await dekkai.tableFromLocalFile(file);
    await table.forEach(row => {
        const x = row.valueByNameTyped('x');
        const y = row.valueByNameTyped('y');
        const z = row.valueByNameTyped('z');

        max = Math.max(max, Math.abs(x) + z, Math.abs(y) + z);

        positions.push(x, y, z);
        colors.push(
            Math.round(Math.random() * 127 + 128),
            Math.round(Math.random() * 127 + 128),
            Math.round(Math.random() * 127 + 128),
            1.0,
        );
    });

    dekkai.terminate();

    viewport.camera.position = [0, 0, Math.ceil(max)];
    return new Circular(viewport.context, new Float32Array(positions), new Uint8Array(colors));
}
