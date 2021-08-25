import {vec2, vec3, mat4, quat} from 'gl-matrix';

export type CameraMode = '2D' | '3D';

export interface CameraOptions {
    mode?: CameraMode;
    position?: vec3;
}

const kDefaultOptions: CameraOptions = {
    mode: '2D',
    position: vec3.fromValues(0, 0, -500),
};

export class Camera {
    private _mode: CameraMode;
    public get mode(): CameraMode {
        return this._mode;
    }
    public set mode(value: CameraMode) {
        this._mode = value;
        this.calculateProjectionMatrix();
    }

    private _aovRad: number = 0;
    public get aovRad(): number {
        return this._aovRad;
    }
    public set aovRad(value: number) {
        this._aovRad = value;
        this._aov = value * 57.29577951308232; // 180 / PI
        this.calculateProjectionMatrix();
    }

    private _aov: number = 0;
    public get aov(): number {
        return this._aov;
    }
    public set aov(value: number) {
        this._aov = value;
        this._aovRad = value * 0.017453292519943295; // PI / 180
        this.calculateProjectionMatrix();
    }

    private _nearPlane: number = 1;
    public get nearPlane(): number {
        return this._nearPlane;
    }
    public set nearPlane(value: number) {
        this._nearPlane = value;
        this.calculateProjectionMatrix();
    }

    private _farPlane: number = 1000;
    public get farPlane(): number {
        return this._farPlane;
    }
    public set farPlane(value: number) {
        this._farPlane = value;
        this.calculateProjectionMatrix();
    }

    private _viewportSize: vec2;
    public get viewportSize(): vec2 {
        return this._viewportSize;
    }
    public set viewportSize(value: vec2) {
        vec2.copy(this._viewportSize, value);
        this._aspect = this._viewportSize[0] / this._viewportSize[1];
        this.calculateProjectionMatrix();
    }

    private _position: vec3;
    public get position(): vec3 {
        return this._position;
    }
    public set position(value: vec3) {
        vec3.copy(this._position, value);
    }

    private _rotation: quat;
    public get rotation(): quat {
        return this._rotation;
    }
    public set rotation(value: quat) {
        quat.copy(this._rotation, value);
    }

    private _target: vec3;
    public get target(): vec3 {
        return this._target;
    }
    public set target(value: vec3) {
        vec3.copy(this._target, value);
    }

    private _aspect: number;
    public get aspect(): number {
        return this._aspect;
    }

    private _viewMatrix: mat4;
    public get viewMatrix(): mat4 {
        mat4.fromQuat(this._viewMatrix, this._rotation);
        mat4.translate(this._viewMatrix, this._viewMatrix, this._position);
        return this._viewMatrix;
    }

    private _projectionMatrix: mat4;
    public get projectionMatrix(): mat4 {
        return this._projectionMatrix;
    }

    constructor(viewportSize: vec2, options?: CameraOptions) {
        const _options = Object.assign({}, kDefaultOptions, options);
        this._position = vec3.copy(vec3.create(), _options.position);
        this._mode = _options.mode;

        this._rotation = quat.fromEuler(quat.create(), 0, 0, 0);
        this._viewMatrix = mat4.create();

        this._projectionMatrix = mat4.create();
        this._viewportSize = vec2.copy(vec2.create(), viewportSize);
        this._aspect = this._viewportSize[0] / this._viewportSize[1];
        this.aov = 45;

        this.calculateProjectionMatrix();
    }

    public rotate(rotation: quat): void {
        quat.mul(this._rotation, rotation, this._rotation);
    }

    private calculateProjectionMatrix(): void {
        if (this.mode === '2D') {
            const halfWidth = this._viewportSize[0] * 0.5;
            const halfHeight = this._viewportSize[1] * 0.5;
            mat4.ortho(
                this._projectionMatrix,
                -halfWidth,
                halfWidth,
                -halfHeight,
                halfHeight,
                this._nearPlane,
                this._farPlane
            );
        } else {
            mat4.perspective(
                this._projectionMatrix,
                this._aovRad,
                this._aspect,
                this._nearPlane,
                this._farPlane
            );
        }
    }
}
