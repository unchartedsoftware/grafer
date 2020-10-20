import {vec3, mat4} from 'gl-matrix';

export class Camera {
    private _position: vec3;
    public get position(): vec3 {
        return this._position;
    }
    public set position(value: vec3) {
        vec3.copy(this._position, value);
        this._workingDistance = vec3.dist(this._position, this._target);
        this.computeMatrix();
    }

    private _target: vec3;
    public get target(): vec3 {
        return this._target;
    }
    public set target(value: vec3) {
        vec3.copy(this._target, value);
        this._workingDistance = vec3.dist(this._position, this._target);
        this.computeMatrix();
    }

    private _workingDistance: number;
    public get workingDistance(): number {
        return this._workingDistance;
    }

    private _matrix: mat4;
    public get matrix(): mat4 {
        return this._matrix;
    }

    constructor(position: vec3 = vec3.fromValues(0, 0, 1), target: vec3 = vec3.fromValues(0, 0, 0)) {
        this._position = vec3.create();
        vec3.copy(this._position, position);

        this._target = vec3.create();
        vec3.copy(this._target, target);

        this._workingDistance = vec3.dist(this._position, this._target);

        this._matrix = mat4.create();
        this.computeMatrix();
    }

    private computeMatrix(): void {
        mat4.lookAt(this._matrix, this._position, this._target, vec3.fromValues(0, 1, 0));
    }
}
