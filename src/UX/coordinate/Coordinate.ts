import { mat4, vec4, vec2 } from 'gl-matrix';
import { GraferController } from 'src/mod';

export enum PixelCoordXPosition {
    'CENTER' = 0,
    'LEFT' = -1,
    'RIGHT' = 1,
}
export enum PixelCoordYPosition {
    'CENTER' = 0,
    'TOP' = 1,
    'BOTTOM' = -1,
}
export interface PixelCoordPosition {
    x: PixelCoordXPosition,
    y: PixelCoordYPosition,
}
const kDefaultPixelCoordPosition: PixelCoordPosition = {
    x: PixelCoordXPosition.CENTER,
    y: PixelCoordYPosition.CENTER,
};

export class Coordinate {
    public static worldPointToRelativePixelCoordinate(controller: GraferController, point: vec4, position?: PixelCoordPosition): vec2 {
        position = Object.assign({}, kDefaultPixelCoordPosition, position);
        const camera = controller.viewport.camera;
        const renderMatrix = mat4.mul(mat4.create(), camera.projectionMatrix, camera.viewMatrix);
        mat4.mul(renderMatrix, renderMatrix, controller.viewport.graph.matrix);

        const projected = vec4.set(
            vec4.create(),
            point[0] + position.x*point[3],
            point[1] + position.y*point[3],
            point[2],
            1
        );
        vec4.transformMat4(projected, projected, renderMatrix);

        const size = controller.viewport.size;
        const x = (projected[0] / projected[3]) * size[0] * 0.5 + size[0] * 0.5;
        const y = (projected[1] / projected[3]) * size[1] * 0.5 + size[1] * 0.5;

        return vec2.set(vec2.create(), x, y);
    }
}
