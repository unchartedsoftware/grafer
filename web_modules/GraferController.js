import { P as PicoGL } from './picogl.js';
import { f as fromValues, c as create, a as copy, b as fromEuler, d as create$1, e as create$2, g as copy$1, h as create$3, i as copy$2, j as fromQuat, t as translate, m as mul, p as perspective, k as fromValues$1, s as set, l as create$4, n as copy$3, o as length, q as fromRotationTranslation, r as transformQuat, u as invert, v as add, w as invert$1, x as fromValues$2, y as transformMat4, z as normalize, A as distance, B as scaleAndAdd } from './gl-matrix.js';
import { E as EventEmitter } from './@dekkai/event-emitter.js';
import { c as chroma } from './chroma-js.js';
import { p as potpack } from './potpack.js';

var RenderMode;
(function (RenderMode) {
    RenderMode[RenderMode["DRAFT"] = 0] = "DRAFT";
    RenderMode[RenderMode["MEDIUM"] = 1] = "MEDIUM";
    RenderMode[RenderMode["HIGH_PASS_1"] = 2] = "HIGH_PASS_1";
    RenderMode[RenderMode["HIGH_PASS_2"] = 3] = "HIGH_PASS_2";
    RenderMode[RenderMode["PICKING"] = 4] = "PICKING";
})(RenderMode || (RenderMode = {}));
/* TOOLS */
const GL_TYPE_SIZE = {
    [PicoGL.BYTE]: 1,
    [PicoGL.UNSIGNED_BYTE]: 1,
    [PicoGL.SHORT]: 2,
    [PicoGL.UNSIGNED_SHORT]: 2,
    [PicoGL.INT]: 4,
    [PicoGL.UNSIGNED_INT]: 4,
    [PicoGL.FLOAT]: 4,
};
const GL_TYPE_GETTER = {
    [PicoGL.BYTE]: (view, offset) => view.getInt8(offset),
    [PicoGL.UNSIGNED_BYTE]: (view, offset) => view.getUint8(offset),
    [PicoGL.SHORT]: (view, offset) => view.getInt16(offset, true),
    [PicoGL.UNSIGNED_SHORT]: (view, offset) => view.getUint16(offset, true),
    [PicoGL.INT]: (view, offset) => view.getInt32(offset, true),
    [PicoGL.UNSIGNED_INT]: (view, offset) => view.getUint32(offset, true),
    [PicoGL.FLOAT]: (view, offset) => view.getFloat32(offset, true),
};
const GL_TYPE_SETTER = {
    [PicoGL.BYTE]: (view, offset, value) => view.setInt8(offset, value),
    [PicoGL.UNSIGNED_BYTE]: (view, offset, value) => view.setUint8(offset, value),
    [PicoGL.SHORT]: (view, offset, value) => view.setInt16(offset, value, true),
    [PicoGL.UNSIGNED_SHORT]: (view, offset, value) => view.setUint16(offset, value, true),
    [PicoGL.INT]: (view, offset, value) => view.setInt32(offset, value, true),
    [PicoGL.UNSIGNED_INT]: (view, offset, value) => view.setUint32(offset, value, true),
    [PicoGL.FLOAT]: (view, offset, value) => view.setFloat32(offset, value, true),
};
function glDataTypeSize(type) {
    return Array.isArray(type) ? GL_TYPE_SIZE[type[0]] * type.length : GL_TYPE_SIZE[type];
}
function glIntegerType(type) {
    return type === PicoGL.FLOAT ? 0 : 1;
}
function glDataTypesInfo(types) {
    const mappingsKeys = Object.keys(types);
    const keys = [];
    let stride = 0;
    for (let i = 0, n = mappingsKeys.length; i < n; ++i) {
        if (types[mappingsKeys[i]]) {
            stride += glDataTypeSize(types[mappingsKeys[i]]);
            keys.push(mappingsKeys[i]);
        }
    }
    return {
        keys,
        stride,
    };
}
function setDrawCallUniforms(drawCall, uniforms) {
    for (const [key, value] of Object.entries(uniforms)) {
        if (value.texture) {
            drawCall.texture(key, value);
        }
        else {
            drawCall.uniform(key, value);
        }
    }
}
function configureVAO(vao, vbo, types, typesInfo, attrIndex = 0, instanced = false) {
    const functionKey = instanced ? 'instanceAttributeBuffer' : 'vertexAttributeBuffer';
    const stride = typesInfo.stride;
    let offset = 0;
    for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
        const type = types[typesInfo.keys[i]];
        const glType = Array.isArray(type) ? type[0] : type;
        const size = Array.isArray(type) ? type.length : 1;
        vao[functionKey](attrIndex + i, vbo, {
            type: glType,
            integer: glIntegerType(glType),
            size,
            stride,
            offset,
        });
        offset += glDataTypeSize(type);
    }
}

class Camera {
    constructor(viewportSize, position = fromValues(0, 0, -1)) {
        this._aovRad = 0;
        this._aov = 0;
        this._nearPlane = 1;
        this._farPlane = 1000;
        this._position = create();
        copy(this._position, position);
        this._rotation = fromEuler(create$1(), 0, 0, 0);
        this._viewMatrix = create$2();
        this._projectionMatrix = create$2();
        this._viewportSize = copy$1(create$3(), viewportSize);
        this._aspect = this._viewportSize[0] / this._viewportSize[1];
        this.aov = 45;
        this.calculateProjectionMatrix();
    }
    get aovRad() {
        return this._aovRad;
    }
    set aovRad(value) {
        this._aovRad = value;
        this._aov = value * 57.29577951308232; // 180 / PI
        this.calculateProjectionMatrix();
    }
    get aov() {
        return this._aov;
    }
    set aov(value) {
        this._aov = value;
        this._aovRad = value * 0.017453292519943295; // PI / 180
        this.calculateProjectionMatrix();
    }
    get nearPlane() {
        return this._nearPlane;
    }
    set nearPlane(value) {
        this._nearPlane = value;
        this.calculateProjectionMatrix();
    }
    get farPlane() {
        return this._farPlane;
    }
    set farPlane(value) {
        this._farPlane = value;
        this.calculateProjectionMatrix();
    }
    get viewportSize() {
        return this._viewportSize;
    }
    set viewportSize(value) {
        copy$1(this._viewportSize, value);
        this._aspect = this._viewportSize[0] / this._viewportSize[1];
        this.calculateProjectionMatrix();
    }
    get position() {
        return this._position;
    }
    set position(value) {
        copy(this._position, value);
    }
    get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        copy$2(this._rotation, value);
    }
    get target() {
        return this._target;
    }
    set target(value) {
        copy(this._target, value);
    }
    get aspect() {
        return this._aspect;
    }
    get viewMatrix() {
        fromQuat(this._viewMatrix, this._rotation);
        translate(this._viewMatrix, this._viewMatrix, this._position);
        return this._viewMatrix;
    }
    get projectionMatrix() {
        return this._projectionMatrix;
    }
    rotate(rotation) {
        mul(this._rotation, rotation, this._rotation);
    }
    calculateProjectionMatrix() {
        perspective(this._projectionMatrix, this._aovRad, this._aspect, this._nearPlane, this._farPlane);
    }
}

class UXModule {
    constructor() {
        this._enabled = false;
    }
    get enabled() {
        return this._enabled;
    }
    set enabled(value) {
        if (value !== this._enabled) {
            this._enabled = value;
            if (this._enabled) {
                this.hookEvents();
            }
            else {
                this.unhookEvents();
            }
        }
    }
}

const kEvents = {
    move: Symbol('Grafer::UX::MouseHandler::move'),
    down: Symbol('Grafer::UX::MouseHandler::down'),
    up: Symbol('Grafer::UX::MouseHandler::up'),
    click: Symbol('Grafer::UX::MouseHandler::click'),
    wheel: Symbol('Grafer::UX::MouseHandler::wheel'),
};
Object.freeze(kEvents);
const kButton2Index = {
    primary: 1,
    secondary: 2,
    auxiliary: 4,
    fourth: 8,
    fifth: 16,
};
Object.freeze(kButton2Index);
const kIndex2Button = {
    1: 'primary',
    2: 'secondary',
    4: 'auxiliary',
    8: 'fourth',
    16: 'fifth',
};
Object.freeze(kIndex2Button);
class MouseHandler extends EventEmitter.mixin(UXModule) {
    constructor(canvas, rect, pixelRatio, enabled = true) {
        super();
        this.boundHandler = this.handleMouseEvent.bind(this);
        this.disableContextMenu = (e) => e.preventDefault();
        this.canvas = canvas;
        this.rect = rect;
        this.pixelRatio = pixelRatio;
        this.state = {
            valid: false,
            clientCoords: create$3(),
            canvasCoords: create$3(),
            glCoords: create$3(),
            deltaCoords: create$3(),
            wheel: 0,
            buttons: {
                primary: false,
                secondary: false,
                auxiliary: false,
                fourth: false,
                fifth: false,
            },
        };
        this.newState = {
            valid: false,
            clientCoords: create$3(),
            canvasCoords: create$3(),
            glCoords: create$3(),
            deltaCoords: create$3(),
            wheel: 0,
            buttons: {
                primary: false,
                secondary: false,
                auxiliary: false,
                fourth: false,
                fifth: false,
            },
        };
        this.enabled = enabled;
    }
    static get events() {
        return kEvents;
    }
    on(type, callback) {
        super.on(type, callback);
    }
    off(type, callback) {
        super.off(type, callback);
    }
    resize(rect, pixelRatio) {
        this.rect = rect;
        this.pixelRatio = pixelRatio;
        this.syntheticUpdate(kEvents.move);
    }
    hookEvents() {
        this.canvas.addEventListener('mouseenter', this.boundHandler);
        this.canvas.addEventListener('mouseleave', this.boundHandler);
        this.canvas.addEventListener('mousemove', this.boundHandler);
        this.canvas.addEventListener('mousedown', this.boundHandler);
        this.canvas.addEventListener('mouseup', this.boundHandler);
        this.canvas.addEventListener('click', this.boundHandler);
        this.canvas.addEventListener('wheel', this.boundHandler);
        this.canvas.addEventListener('contextmenu', this.disableContextMenu);
    }
    unhookEvents() {
        this.canvas.removeEventListener('mouseenter', this.boundHandler);
        this.canvas.removeEventListener('mouseleave', this.boundHandler);
        this.canvas.removeEventListener('mousemove', this.boundHandler);
        this.canvas.removeEventListener('mousedown', this.boundHandler);
        this.canvas.removeEventListener('mouseup', this.boundHandler);
        this.canvas.removeEventListener('click', this.boundHandler);
        this.canvas.removeEventListener('wheel', this.boundHandler);
        this.canvas.removeEventListener('contextmenu', this.disableContextMenu);
    }
    syntheticUpdate(event, buttonIndex) {
        switch (event) {
            case kEvents.up:
            case kEvents.down:
            case kEvents.click:
                this.emitEvents([{
                        event,
                        args: [buttonIndex, kIndex2Button[buttonIndex]],
                    }]);
                break;
            case kEvents.move:
                this.emitEvents([{
                        event,
                        args: [fromValues$1(0, 0), this.state.canvasCoords],
                    }]);
                break;
        }
    }
    update(state) {
        const events = [];
        if (state.deltaCoords[0] !== 0 || state.deltaCoords[1] !== 0) {
            if (state.valid) {
                events.push({
                    event: kEvents.move,
                    args: [state.deltaCoords, state.canvasCoords],
                });
            }
        }
        const buttonKeys = Object.keys(state.buttons);
        for (let i = 0, n = buttonKeys.length; i < n; ++i) {
            const key = buttonKeys[i];
            const pressed = state.valid && state.buttons[key];
            if (this.state.buttons[key] !== pressed) {
                this.state.buttons[key] = pressed;
                events.push({
                    event: pressed ? kEvents.down : kEvents.up,
                    args: [kButton2Index[key], key, pressed],
                });
            }
        }
        this.setMouseState(state);
        this.emitEvents(events);
    }
    emitEvents(entries) {
        for (let i = 0, n = entries.length; i < n; ++i) {
            this.emit(entries[i].event, this.state, ...entries[i].args);
        }
    }
    setMouseState(state) {
        this.state.valid = state.valid;
        copy$1(this.state.clientCoords, state.clientCoords);
        copy$1(this.state.canvasCoords, state.canvasCoords);
        copy$1(this.state.glCoords, state.glCoords);
        copy$1(this.state.deltaCoords, state.deltaCoords);
        this.state.wheel = state.wheel;
        Object.assign(this.state.buttons, state.buttons);
    }
    handleClickEvent(e, state) {
        this.setMouseState(state);
        this.emitEvents([{
                event: kEvents.click,
                args: [e.button, kIndex2Button[e.button]],
            }]);
    }
    handleWheelEvent(e, state) {
        this.setMouseState(state);
        let delta;
        if ('wheelDeltaY' in e) {
            delta = -e.wheelDeltaY / 120;
        }
        else {
            delta = (e.deltaY < 1) ? -1 : 1;
        }
        this.emitEvents([{
                event: kEvents.wheel,
                args: [delta],
            }]);
    }
    handleMouseEvent(e) {
        const client = this.newState.clientCoords;
        const canvas = this.newState.canvasCoords;
        const gl = this.newState.glCoords;
        const delta = this.newState.deltaCoords;
        const rect = this.rect;
        set(client, e.clientX, e.clientY);
        set(canvas, e.clientX - rect.left, e.clientY - rect.top);
        set(gl, (e.clientX - rect.left) * this.pixelRatio, (rect.bottom - e.clientY) * this.pixelRatio);
        if (e.type === 'mousemove') {
            set(delta, e.movementX, e.movementY);
        }
        else {
            set(delta, 0, 0);
        }
        this.newState.valid = Boolean(canvas[0] >= rect.left && canvas[0] <= rect.right &&
            canvas[1] >= 0 && canvas[1] <= rect.height);
        this.newState.buttons.primary = Boolean(e.buttons & 1);
        this.newState.buttons.secondary = Boolean(e.buttons & 2);
        this.newState.buttons.auxiliary = Boolean(e.buttons & 4);
        this.newState.buttons.fourth = Boolean(e.buttons & 8);
        this.newState.buttons.fifth = Boolean(e.buttons & 16);
        switch (e.type) {
            case 'click':
                this.handleClickEvent(e, this.newState);
                break;
            case 'wheel':
                this.handleWheelEvent(e, this.newState);
                break;
            case 'mouseleave':
                this.newState.valid = false;
            /* fallthrough */
            default:
                this.update(this.newState);
                break;
        }
    }
}

class ColorRegistry {
    constructor(context, initialCapacity = 1024) {
        this.dirty = false;
        this.context = context;
        this.colorMap = new Map();
        this.textureSize = create$3();
        this.resizeTexture(initialCapacity);
    }
    get texture() {
        this.update();
        return this._texture;
    }
    get capacity() {
        return this.textureSize[0] * this.textureSize[1];
    }
    get length() {
        return this.colorMap.size;
    }
    update() {
        if (this.dirty) {
            if (this.colorMap.size > this.capacity) {
                this.resizeTexture(this.colorMap.size);
            }
            const buffer = new Uint8Array(this.capacity * 4);
            let offset = 0;
            for (const color of this.colorMap.keys()) {
                const rgba = chroma.hex(color).rgba();
                buffer[offset] = rgba[0];
                ++offset;
                buffer[offset] = rgba[1];
                ++offset;
                buffer[offset] = rgba[2];
                ++offset;
                buffer[offset] = Math.round(rgba[3] * 255); // alpha is always [0, 1] and we need it to be [0, 255]
                ++offset;
            }
            this._texture.data(buffer);
        }
        this.dirty = false;
    }
    registerColor(color) {
        const hex = chroma(color).hex(); // dumb chroma typings
        if (!this.colorMap.has(hex)) {
            this.colorMap.set(hex, this.colorMap.size);
            this.dirty = true;
        }
        return this.colorMap.get(hex);
    }
    resizeTexture(capacity) {
        if (this.capacity < capacity) {
            const textureWidth = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(capacity)))));
            const textureHeight = Math.pow(2, Math.ceil(Math.log2(Math.ceil(capacity / textureWidth))));
            this.textureSize = fromValues$1(textureWidth, textureHeight);
            if (this._texture) {
                this._texture.resize(textureWidth, textureHeight);
            }
            else {
                this._texture = this.context.createTexture2D(textureWidth, textureHeight);
            }
        }
    }
}

const POLLING_RATE = 400; // ms
class RectObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe(element) {
        this.elementTarget = element;
        this.elementTarget.addEventListener("mouseenter", this.handleMouseEnter.bind(this), false);
        this.elementTarget.addEventListener("mouseleave", this.handleMouseLeave.bind(this), false);
        this.rect = this.elementTarget.getBoundingClientRect();
    }
    disconnect() {
        clearInterval(this.poll);
        this.elementTarget.removeEventListener("mouseenter", this.handleMouseEnter.bind(this), false);
        this.elementTarget.removeEventListener("mouseleave", this.handleMouseLeave.bind(this), false);
    }
    handleMouseEnter() {
        this.pollElement();
        this.poll = setInterval(this.pollElement.bind(this), POLLING_RATE);
    }
    pollElement() {
        const rect = this.elementTarget.getBoundingClientRect();
        if (!this.rectEqual(this.rect, rect)) {
            this.rect = rect;
            this.callback(this.rect);
        }
    }
    handleMouseLeave() {
        this.pollElement();
        clearInterval(this.poll);
    }
    rectEqual(prev, curr) {
        return prev.width === curr.width &&
            prev.height === curr.height &&
            prev.top === curr.top &&
            prev.left === curr.left;
    }
}

class Viewport {
    constructor(element) {
        this._clearColor = create$4();
        this.animationFrameID = 0;
        this.timeoutID = 0;
        this.boundDelayedRender = this.delayedRender.bind(this);
        const pixelRatio = window.devicePixelRatio;
        this.element = element;
        if (this.element instanceof HTMLCanvasElement) {
            this.canvas = this.element;
        }
        else {
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.element.appendChild(this.canvas);
        }
        this.rect = this.canvas.getBoundingClientRect();
        this.canvas.width = this.rect.width * pixelRatio;
        this.canvas.height = this.rect.height * pixelRatio;
        this.context = PicoGL.createApp(this.canvas, {
            antialias: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
        });
        this.clearColor = [0.141176471, 0.160784314, 0.2, 1.0];
        // this.clearColor = [0.18, 0.204, 0.251, 1.0];
        this.context.clearMask(PicoGL.COLOR_BUFFER_BIT | PicoGL.DEPTH_BUFFER_BIT);
        this.context.enable(PicoGL.DEPTH_TEST);
        this.context.depthFunc(PicoGL.LESS);
        this.context.pixelRatio = pixelRatio;
        this.mouseHandler = new MouseHandler(this.canvas, this.rect, this.pixelRatio);
        this.size = fromValues$1(this.canvas.width, this.canvas.height);
        this.camera = new Camera(this.size);
        const resizeObserver = new RectObserver((rect) => {
            this.rect = rect;
            this.context.resize(this.rect.width * this.pixelRatio, this.rect.height * this.pixelRatio);
            set(this.size, this.canvas.width, this.canvas.height);
            this.camera.viewportSize = this.size;
            this.mouseHandler.resize(this.rect, this.pixelRatio);
            this.graph.resize(this.context);
            this.render();
        });
        resizeObserver.observe(this.canvas);
        this.colorRegisrty = new ColorRegistry(this.context);
    }
    get clearColor() {
        return this._clearColor;
    }
    set clearColor(value) {
        copy$3(this._clearColor, value);
        this.context.clearColor(...this._clearColor);
    }
    get pixelRatio() {
        return this.context.pixelRatio;
    }
    resetContextFlags() {
        this.context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);
        this.context.defaultDrawFramebuffer();
        this.context.defaultReadFramebuffer();
        this.context.disable(PicoGL.BLEND);
        this.context.enable(PicoGL.DEPTH_TEST);
        this.context.depthFunc(PicoGL.LESS);
        this.context.depthMask(true);
        this.context.depthRange(0.0, 1.0);
        this.context.clearColor(...this._clearColor);
    }
    render() {
        if (!this.animationFrameID) {
            this.renderMode = RenderMode.DRAFT;
            if (this.timeoutID) {
                clearTimeout(this.timeoutID);
                this.timeoutID = 0;
            }
            this.animationFrameID = requestAnimationFrame(() => this._render());
        }
    }
    scheduleRender(delay) {
        if (this.timeoutID) {
            clearTimeout(this.timeoutID);
        }
        this.timeoutID = window.setTimeout(this.boundDelayedRender, delay);
    }
    delayedRender() {
        this.timeoutID = 0;
        this._render();
    }
    _render() {
        const uniforms = {
            uViewMatrix: this.camera.viewMatrix,
            uSceneMatrix: this.graph.matrix,
            uProjectionMatrix: this.camera.projectionMatrix,
            uViewportSize: this.size,
            uPixelRatio: this.pixelRatio,
            uClearColor: this._clearColor,
            uColorPalette: this.colorRegisrty.texture,
            uRenderMode: this.renderMode,
        };
        this.resetContextFlags();
        this.context.clear();
        if (this.graph && this.graph.enabled) {
            this.graph.render(this.context, this.renderMode, uniforms);
            switch (this.renderMode) {
                case RenderMode.DRAFT:
                    uniforms.uRenderMode = RenderMode.PICKING;
                    this.graph.render(this.context, RenderMode.PICKING, uniforms);
                    this.renderMode = RenderMode.MEDIUM;
                    this.scheduleRender(85);
                    break;
                case RenderMode.MEDIUM:
                    this.renderMode = RenderMode.HIGH_PASS_1;
                    this.scheduleRender(120);
                    break;
                case RenderMode.HIGH_PASS_1:
                    uniforms.uRenderMode = RenderMode.HIGH_PASS_2;
                    this.graph.render(this.context, RenderMode.HIGH_PASS_2, uniforms);
                    break;
            }
        }
        this.animationFrameID = 0;
    }
}

var testVS = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in uint aIndex;uniform sampler2D uDataTexture;flat out vec3 vPosition;flat out float vRadius;flat out float vYolo;vec4 getValueByIndexFromTexture(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){vec4 value=getValueByIndexFromTexture(uDataTexture,int(aIndex));vPosition=value.xyz;vRadius=value.w;vYolo=value.w/10.0;}"; // eslint-disable-line

var testFS = "#version 300 es\n#define GLSLIFY 1\nvoid main(){}"; // eslint-disable-line

const kDataMappingFlatten = Symbol('graffer:data::mapping::flatten::key');
const kDataEntryNeedsFlatten = Symbol('graffer:data::tools::needs::flatten');
function* dataIterator(data, mappings) {
    const keys = Reflect.ownKeys(mappings);
    for (let i = 0, n = data.length; i < n; ++i) {
        const entry = {};
        for (const key of keys) {
            if (mappings[key] !== null) {
                entry[key] = mappings[key](data[i], i);
            }
        }
        yield [i, entry];
    }
}
function concatenateData(data, mappings) {
    const result = [];
    for (let i = 0, n = data.length; i < n; ++i) {
        for (const [, entry] of dataIterator(data[i], mappings)) {
            result.push(entry);
        }
    }
    return result;
}
function computeDataTypes(types, mappings) {
    const keys = Object.keys(types);
    const result = {};
    for (let i = 0, n = keys.length; i < n; ++i) {
        if (keys[i] in mappings && mappings[keys[i]] !== null) {
            result[keys[i]] = types[keys[i]];
        }
    }
    return result;
}
function writeValueToDataView(view, value, type, offset) {
    if (Array.isArray(value)) {
        let writeOffset = 0;
        for (let i = 0, n = value.length; i < n; ++i) {
            GL_TYPE_SETTER[type[i]](view, offset + writeOffset, value[i]);
            writeOffset += GL_TYPE_SIZE[type[i]];
        }
        return writeOffset;
    }
    GL_TYPE_SETTER[type](view, offset, value);
    return GL_TYPE_SIZE[type];
}
function flattenEntry(entry, types, typesInfo, mappings, view, offset) {
    // build an internal mappings object to flatten the values
    const flatMappings = {};
    let flattenLength = 0;
    for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
        const key = typesInfo.keys[i];
        if (entry[kDataEntryNeedsFlatten].has(key)) {
            flatMappings[key] = mappings[key][kDataMappingFlatten] ?? ((entry, i) => entry[key][i]);
            // all values to flatten should have the same length
            flattenLength = entry[key].length;
        }
        else {
            flatMappings[key] = mappings[key][kDataMappingFlatten] ?? ((entry) => entry[key]);
        }
    }
    let flatOffset = 0;
    for (let i = 0; i < flattenLength; ++i) {
        for (let ii = 0, n = typesInfo.keys.length; ii < n; ++ii) {
            const key = typesInfo.keys[ii];
            flatOffset += writeValueToDataView(view, flatMappings[key](entry, i, flattenLength), types[key], offset + flatOffset);
        }
    }
    return flatOffset;
}
function packData(data, mappings, types, potLength, cb) {
    const typesInfo = glDataTypesInfo(computeDataTypes(types, mappings));
    const entries = [];
    let dataLength = 0;
    const cb1 = Array.isArray(cb) ? cb[0] : cb;
    const cb2 = Array.isArray(cb) ? cb[1] : null;
    // go over the data once to compute the data byte length. Sorry future Dario :(
    // TODO: Investigate a better way to do this in one iteration
    for (const [index, entry] of dataIterator(data, mappings)) {
        let entryLength = 1;
        for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
            const value = entry[typesInfo.keys[i]];
            if (Array.isArray(value) && (!Array.isArray(types[typesInfo.keys[i]]) || mappings[typesInfo.keys[i]][kDataMappingFlatten])) {
                if (!entry[kDataEntryNeedsFlatten]) {
                    entry[kDataEntryNeedsFlatten] = new Set();
                }
                entry[kDataEntryNeedsFlatten].add(typesInfo.keys[i]);
                entryLength = Math.max(entryLength, value.length);
            }
        }
        entries.push(entry);
        dataLength += entryLength;
        // call the first callback with the entries
        if (cb1) {
            cb1(index, entry);
        }
    }
    dataLength = potLength ? Math.pow(2, Math.ceil(Math.log2(dataLength))) : dataLength;
    const buffer = new ArrayBuffer(typesInfo.stride * dataLength);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0, n = entries.length; i < n; ++i) {
        const entry = entries[i];
        // give the caller a last chance to modify the entries
        if (cb2) {
            cb2(i, entry);
        }
        if (entry[kDataEntryNeedsFlatten]) {
            offset += flattenEntry(entry, types, typesInfo, mappings, view, offset);
        }
        else {
            for (let i = 0, n = typesInfo.keys.length; i < n; ++i) {
                offset += writeValueToDataView(view, entry[typesInfo.keys[i]], types[typesInfo.keys[i]], offset);
            }
        }
    }
    return buffer;
}
function printDataGL(context, vbo, count, types) {
    const gl = context.gl;
    const typesInfo = glDataTypesInfo(types);
    const result = new ArrayBuffer(typesInfo.stride * count);
    const view = new DataView(result);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo.buffer);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, view);
    let off = 0;
    for (let i = 0; i < count; ++i) {
        for (let ii = 0, nn = typesInfo.keys.length; ii < nn; ++ii) {
            const type = Array.isArray(types[typesInfo.keys[ii]]) ? types[typesInfo.keys[ii]] : [types[typesInfo.keys[ii]]];
            const values = [];
            for (let iii = 0, nnn = type.length; iii < nnn; ++iii) {
                values.push(GL_TYPE_GETTER[type[iii]](view, off));
                off += GL_TYPE_SIZE[type[iii]];
            }
            // eslint-disable-next-line
            console.log(`ELEMENT[${i}] ATTR[${ii}]: ${values}`);
        }
    }
}

const kDefaultMappings = {
    id: (entry, i) => 'id' in entry ? entry.id : i,
    x: (entry) => entry.x,
    y: (entry) => entry.y,
    z: (entry) => 'z' in entry ? entry.z : 0.0,
    radius: (entry) => 'radius' in entry ? entry.radius : 0.0,
};
const kGLTypes = {
    x: PicoGL.FLOAT,
    y: PicoGL.FLOAT,
    z: PicoGL.FLOAT,
    radius: PicoGL.FLOAT,
};
class GraphPoints {
    constructor(context, data, mappings = {}) {
        this.map = new Map();
        this.bb = {
            min: fromValues(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
            max: fromValues(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER),
        };
        this.bbCorner = fromValues(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
        const dataMappings = Object.assign({}, kDefaultMappings, mappings);
        this._dataBuffer = packData(data, dataMappings, kGLTypes, true, (i, entry) => {
            this.map.set(entry.id, i);
            this.bb.min[0] = Math.min(this.bb.min[0], entry.x);
            this.bb.min[1] = Math.min(this.bb.min[1], entry.y);
            this.bb.min[2] = Math.min(this.bb.min[2], entry.z);
            this.bb.max[0] = Math.max(this.bb.max[0], entry.x);
            this.bb.max[1] = Math.max(this.bb.max[1], entry.y);
            this.bb.max[2] = Math.max(this.bb.max[2], entry.z);
            this.bbCorner[0] = Math.max(this.bbCorner[0], Math.abs(entry.x));
            this.bbCorner[1] = Math.max(this.bbCorner[1], Math.abs(entry.y));
            this.bbCorner[2] = Math.max(this.bbCorner[2], Math.abs(entry.z));
        });
        this._dataView = new DataView(this._dataBuffer);
        this.bbCornerLength = length(this.bbCorner);
        // calculate the smallest texture rectangle with POT sides, is this optimization needed? - probably not
        const textureWidth = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(data.length)))));
        const textureHeight = Math.pow(2, Math.ceil(Math.log2(Math.ceil(data.length / textureWidth))));
        this._dataTexture = context.createTexture2D(textureWidth, textureHeight, {
            internalFormat: PicoGL.RGBA32F,
        });
        const float32 = new Float32Array(this._dataBuffer);
        this._dataTexture.data(float32);
        // this.testFeedback(context);
    }
    static createGraphFromNodes(context, nodes, mappings = {}) {
        let pointIndex = 0;
        const dataMappings = Object.assign({}, kDefaultMappings, {
            id: () => pointIndex++,
        }, mappings);
        const points = concatenateData(nodes, dataMappings);
        return (new this(context, points));
    }
    get dataTexture() {
        return this._dataTexture;
    }
    get dataBuffer() {
        return this._dataBuffer;
    }
    get dataView() {
        return this._dataView;
    }
    destroy() {
        this._dataTexture.delete();
        this.map.clear();
        this._dataTexture = null;
        this._dataBuffer = null;
        this.map = null;
    }
    getPointIndex(id) {
        return this.map.get(id);
    }
    testFeedback(context) {
        const program = context.createProgram(testVS, testFS, { transformFeedbackVaryings: ['vPosition', 'vRadius', 'vYolo'], transformFeedbackMode: PicoGL.INTERLEAVED_ATTRIBS });
        const pointsTarget = context.createVertexBuffer(PicoGL.FLOAT, 4, 40);
        const pointsIndices = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 1, new Uint8Array([
            0,
            1,
            2,
            3,
            4,
            5,
        ]));
        const transformFeedback = context.createTransformFeedback().feedbackBuffer(0, pointsTarget);
        const vertexArray = context.createVertexArray().vertexAttributeBuffer(0, pointsIndices);
        const drawCall = context.createDrawCall(program, vertexArray).transformFeedback(transformFeedback);
        drawCall.primitive(PicoGL.POINTS);
        drawCall.texture('uDataTexture', this._dataTexture);
        context.enable(PicoGL.RASTERIZER_DISCARD);
        drawCall.draw();
        context.disable(PicoGL.RASTERIZER_DISCARD);
        printDataGL(context, pointsTarget, 6, {
            position: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
            radius: PicoGL.FLOAT,
            yolo: PicoGL.FLOAT,
        });
    }
}

class Graph extends GraphPoints {
    constructor(context, data, mappings = {}) {
        super(context, data, mappings);
        this.enabled = true;
        this._layers = [];
        this._rotation = create$1();
        this._translation = create();
        this._matrix = create$2();
    }
    get matrix() {
        fromRotationTranslation(this._matrix, this._rotation, this._translation);
        return this._matrix;
    }
    get layers() {
        return this._layers;
    }
    get rotation() {
        return this._rotation;
    }
    get translation() {
        return this._translation;
    }
    render(context, mode, uniforms) {
        if (mode === RenderMode.PICKING && this.picking && this.picking.enabled) {
            this.picking.offscreenBuffer.prepareContext(context);
        }
        // render labels
        for (let i = 0, n = this._layers.length; i < n; ++i) {
            if (this._layers[i].enabled) {
                context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);
                this._layers[i].renderLabels(context, mode, uniforms);
            }
        }
        // render nodes
        for (let i = 0, n = this._layers.length; i < n; ++i) {
            if (this._layers[i].enabled) {
                context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);
                this._layers[i].renderNodes(context, mode, uniforms);
            }
        }
        // render edges
        for (let i = 0, n = this._layers.length; i < n; ++i) {
            if (this._layers[i].enabled) {
                context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE);
                this._layers[i].renderEdges(context, mode, uniforms);
            }
        }
        // if (this.picking) {
        //     this.picking.offscreenBuffer.blitToScreen(context);
        // }
    }
    resize(context) {
        if (this.picking) {
            this.picking.offscreenBuffer.resize(context);
        }
    }
    rotate(rotation) {
        mul(this._rotation, rotation, this._rotation);
    }
    addLayer(layer) {
        this._layers.push(layer);
    }
    addLayerAt(layer, index) {
        if (index >= 0 && index <= this._layers.length) {
            this._layers.splice(index, 0, layer);
        }
    }
    removeLayer(layer) {
        const i = this._layers.indexOf(layer);
        if (i !== -1) {
            this._layers.splice(i, 1);
        }
    }
    removeLayerAt(index) {
        if (index >= 0 && index < this._layers.length) {
            this._layers.splice(index, 1);
        }
    }
}

var nodeVS = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iPosition;layout(location=2)in float iRadius;layout(location=3)in uint iColor;layout(location=4)in uvec4 iPickingColor;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform sampler2D uColorPalette;uniform float uMinSize;uniform float uMaxSize;uniform bool uPixelSizing;uniform bool uBillboard;uniform bool uPicking;flat out vec4 fColor;flat out float fPixelLength;out vec2 vFromCenter;vec4 getColorByIndexFromTexture(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){mat4 offsetMatrix=mat4(1.0);offsetMatrix[3]=vec4(iPosition,1.0);mat4 modelMatrix=uViewMatrix*uSceneMatrix*offsetMatrix;mat4 lookAtMatrix=mat4(modelMatrix);lookAtMatrix[0]=vec4(1.0,0.0,0.0,lookAtMatrix[0][3]);lookAtMatrix[1]=vec4(0.0,1.0,0.0,lookAtMatrix[1][3]);lookAtMatrix[2]=vec4(0.0,0.0,1.0,lookAtMatrix[2][3]);vec4 quadCenter=uProjectionMatrix*lookAtMatrix*vec4(0.0,0.0,0.0,1.0);vec2 screenQuadCenter=quadCenter.xy/quadCenter.w;vec4 quadSide=uProjectionMatrix*lookAtMatrix*vec4(iRadius,0.0,0.0,1.0);vec2 screenQuadSide=quadSide.xy/quadSide.w;float pixelRadius=max(1.0,length((screenQuadSide-screenQuadCenter)*uViewportSize*0.5));float desiredPixelRadius=(uPixelSizing ? iRadius : pixelRadius);float pixelRadiusMult=desiredPixelRadius/pixelRadius;mat4 renderMatrix=uBillboard ? uProjectionMatrix*lookAtMatrix : uProjectionMatrix*modelMatrix;vec4 worldVertex=renderMatrix*vec4(aVertex*iRadius*pixelRadiusMult,1.0);fColor=uPicking ? vec4(iPickingColor)/255.0 : getColorByIndexFromTexture(uColorPalette,int(iColor));fPixelLength=1.0/desiredPixelRadius;vFromCenter=aVertex.xy;gl_Position=worldVertex;}"; // eslint-disable-line

var nodeFS = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform uint uRenderMode;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float antialias=fPixelLength*1.5;float sd=sdCircle(vFromCenter,1.0);float outline=opOnion(sd,min(0.15,fPixelLength*6.0*uPixelRatio));float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float distance=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(sd>distance){discard;}vec3 color=fColor.rgb*(1.0-0.25*smoothstep(antialias,0.0,outline));if(uRenderMode==MODE_HIGH_PASS_2){if(sd<-antialias){discard;}fragColor=vec4(color,smoothstep(0.0,antialias,abs(sd)));}else{fragColor=vec4(color,1.0);}}"; // eslint-disable-line

var dataVS = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in uint aPositionIndex;layout(location=1)in uint aColor;layout(location=2)in float aRadius;uniform sampler2D uGraphPoints;uniform bool uUsePointRadius;out vec3 vPosition;out float vRadius;flat out uint vColor;vec4 getValueByIndexFromTexture(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){vec4 value=getValueByIndexFromTexture(uGraphPoints,int(aPositionIndex));vPosition=value.xyz;if(uUsePointRadius){vRadius=value.w;}else{vRadius=aRadius;}vColor=aColor;}"; // eslint-disable-line

var pickingFS = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\nflat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float fromCenter=length(vFromCenter);if(fromCenter>1.0){discard;}fragColor=fColor;}"; // eslint-disable-line

class PointsReader {
    constructor(...args) {
        this.initialize(...args);
    }
    get dataTexture() {
        return this.points.dataTexture;
    }
    initialize(context, points, data, mappings) {
        this.points = points;
        this.ingestData(context, data, mappings);
        this.initializeTargetBuffers(context, this.dataBuffer.byteLength / this.dataStride);
        this.initializeDataDrawCall(context);
    }
    ingestData(context, data, mappings) {
        // compute the data mappings for this instance
        const dataMappings = this.computeMappings(mappings);
        // get the GL data types for this instance
        const types = computeDataTypes(this.getGLSourceTypes(), dataMappings);
        this.dataBuffer = packData(data, dataMappings, types, false, this.packDataCB());
        this.dataView = new DataView(this.dataBuffer);
        // initialize the data WebGL objects
        const typesInfo = glDataTypesInfo(types);
        this.dataStride = typesInfo.stride;
        this.sourceVBO = context.createInterleavedBuffer(this.dataStride, this.dataView);
        this.sourceVAO = context.createVertexArray();
        configureVAO(this.sourceVAO, this.sourceVBO, types, typesInfo);
    }
    initializeTargetBuffers(context, dataLength) {
        const targetTypes = this.getGLTargetTypes();
        const stride = glDataTypesInfo(targetTypes).stride;
        this.targetVBO = context.createInterleavedBuffer(stride, dataLength * stride);
        this.targetTFO = context.createTransformFeedback().feedbackBuffer(0, this.targetVBO);
    }
    initializeDataDrawCall(context) {
        const dataShader = this.getDataShader();
        this.dataProgram = context.createProgram(dataShader.vs, testFS, {
            transformFeedbackVaryings: dataShader.varyings,
            transformFeedbackMode: PicoGL.INTERLEAVED_ATTRIBS,
        });
        this.dataDrawCall = context.createDrawCall(this.dataProgram, this.sourceVAO).transformFeedback(this.targetTFO);
        this.dataDrawCall.primitive(PicoGL.POINTS);
    }
    compute(context, uniforms) {
        setDrawCallUniforms(this.dataDrawCall, uniforms);
        context.enable(PicoGL.RASTERIZER_DISCARD);
        this.dataDrawCall.draw();
        context.disable(PicoGL.RASTERIZER_DISCARD);
    }
    configureTargetVAO(vao, attrIndex = 1) {
        const types = this.getGLTargetTypes();
        const typesInfo = glDataTypesInfo(types);
        configureVAO(vao, this.targetVBO, types, typesInfo, attrIndex, true);
    }
    packDataCB() {
        return () => null;
    }
}

const PointsReaderEmitter = EventEmitter.mixin(PointsReader);
class LayerRenderable extends PointsReaderEmitter {
    constructor(...args) {
        super(...args);
        this.enabled = true;
        this.nearDepth = 0.0;
        this.farDepth = 1.0;
    }
    static get defaultMappings() {
        return undefined;
    }
    initialize(context, points, data, mappings, pickingManager) {
        this.pickingManager = pickingManager;
        this.picking = true;
        super.initialize(context, points, data, mappings);
    }
}

const kBasicNodeMappings = {
    id: (entry, i) => 'id' in entry ? entry.id : i,
    point: (entry, i) => 'point' in entry ? entry.point : i,
    color: (entry) => 'color' in entry ? entry.color : 0,
    radius: null,
};
const kBasicNodeDataTypes = {
    point: PicoGL.UNSIGNED_INT,
    color: PicoGL.UNSIGNED_INT,
    radius: PicoGL.FLOAT,
};
class Nodes extends LayerRenderable {
    static get defaultMappings() {
        return kBasicNodeMappings;
    }
    get constraintSize() {
        return this.localUniforms.uConstraintSize;
    }
    set constraintSize(value) {
        this.localUniforms.uConstraintSize = value;
    }
    get minSize() {
        return this.localUniforms.uMinSize;
    }
    set minSize(value) {
        this.localUniforms.uMinSize = value;
    }
    get maxSize() {
        return this.localUniforms.uMaxSize;
    }
    set maxSize(value) {
        this.localUniforms.uMaxSize = value;
    }
    get pixelSizing() {
        return this.localUniforms.uPixelSizing;
    }
    set pixelSizing(value) {
        this.localUniforms.uPixelSizing = value;
    }
    get billboard() {
        return this.localUniforms.uBillboard;
    }
    set billboard(value) {
        this.localUniforms.uBillboard = value;
    }
    initialize(...args) {
        this.localUniforms = {
            uConstraintSize: true,
            uMinSize: 1.0,
            uMaxSize: 4.0,
            uPixelSizing: false,
            uBillboard: true,
        };
        super.initialize(...args);
    }
    computeMappings(mappings) {
        const nodesMappings = Object.assign({}, kBasicNodeMappings, mappings);
        // patches the mappings to get the points index from their IDs
        const pointMapping = nodesMappings.point;
        nodesMappings.point = (entry, i) => {
            return this.points.getPointIndex(pointMapping(entry, i));
        };
        return nodesMappings;
    }
    ingestData(context, data, mappings) {
        this.map = new Map();
        this.idArray = [];
        super.ingestData(context, data, mappings);
    }
    packDataCB() {
        return (i, entry) => {
            this.map.set(entry.id, entry.point);
            this.idArray.push(entry.id);
        };
    }
    getEntryPointID(id) {
        return this.map.get(id);
    }
}

class OffscreenBuffer {
    constructor(context) {
        this._clearColor = create$4();
        this.context = context;
        this.resize(context);
    }
    get clearColor() {
        return this._clearColor;
    }
    set clearColor(value) {
        copy$3(this._clearColor, value);
    }
    resize(context) {
        if (this.frameBuffer) {
            this.frameBuffer.delete();
        }
        if (this.colorTarget) {
            this.colorTarget.delete();
        }
        if (this.depthTarget) {
            this.depthTarget.delete();
        }
        this.colorTarget = context.createTexture2D(context.width, context.height);
        this.depthTarget = context.createRenderbuffer(context.width, context.height, PicoGL.DEPTH_COMPONENT16);
        this.frameBuffer = context.createFramebuffer()
            .colorTarget(0, this.colorTarget)
            .depthTarget(this.depthTarget);
    }
    prepareContext(context) {
        context.depthMask(true);
        context.readFramebuffer(this.frameBuffer);
        context.drawFramebuffer(this.frameBuffer)
            .clearMask(PicoGL.COLOR_BUFFER_BIT | PicoGL.DEPTH_BUFFER_BIT)
            .clearColor(...this._clearColor)
            .clear()
            .depthMask(true);
    }
    blitToBuffer(context, target, mask = PicoGL.COLOR_BUFFER_BIT) {
        context.drawFramebuffer(target.frameBuffer);
        context.readFramebuffer(this.frameBuffer);
        context.blitFramebuffer(mask);
    }
    blitToScreen(context, mask = PicoGL.COLOR_BUFFER_BIT) {
        context.defaultDrawFramebuffer();
        context.readFramebuffer(this.frameBuffer);
        context.blitFramebuffer(mask);
    }
    readPixel(x, y, buffer) {
        this.context.defaultDrawFramebuffer()
            .readFramebuffer(this.frameBuffer)
            .readPixel(x, y, buffer);
    }
}

const kEvents$1 = {
    hoverOn: Symbol('grafer_hover_on'),
    hoverOff: Symbol('grafer_hover_off'),
    click: Symbol('grafer_click'),
};
Object.freeze(kEvents$1);
class PickingManager extends EventEmitter.mixin(UXModule) {
    constructor(context, mouseHandler, enabled = true) {
        super();
        this.boundMouseHandler = this.handleMouse.bind(this);
        this.colorBuffer = new ArrayBuffer(4);
        this.colorBufferUint8 = new Uint8Array(this.colorBuffer);
        this.colorBufferView = new DataView(this.colorBuffer);
        this.colorHoverID = 0;
        this._offscreenBuffer = new OffscreenBuffer(context);
        this.mouseHandler = mouseHandler;
        this.availableIndices = [{
                start: 0,
                end: 0xefffffff,
            }];
        this.enabled = enabled;
    }
    static get events() {
        return kEvents$1;
    }
    get offscreenBuffer() {
        return this._offscreenBuffer;
    }
    on(type, callback) {
        super.on(type, callback);
    }
    off(type, callback) {
        super.off(type, callback);
    }
    allocatePickingColors(count) {
        const colors = new Uint8Array(count * 4);
        const ranges = [];
        const map = new Map();
        let offset = 0;
        let left = count;
        for (let i = 0, n = this.availableIndices.length; i < n && left > 0; ++i) {
            const availableRange = this.availableIndices[i];
            const rangeLength = availableRange.end - availableRange.start;
            if (rangeLength > left) {
                const range = { start: availableRange.start, end: availableRange.start + left };
                offset = this.pickingColorsForIndices(colors, offset, range);
                this.mapPickingColorIDs(map, count - left, range);
                ranges.push(range);
                availableRange.start += left;
                left = 0;
            }
            else {
                offset = this.pickingColorsForIndices(colors, offset, availableRange);
                this.mapPickingColorIDs(map, count - left, availableRange);
                ranges.push(availableRange);
                left -= rangeLength;
                this.availableIndices.splice(i--, 1);
            }
        }
        return {
            colors,
            ranges,
            map,
        };
    }
    deallocatePickingColors(colors) {
        for (let i = 0, n = colors.ranges.length; i < n; ++i) {
            this.deallocatePickingRange(colors.ranges[i]);
        }
        colors.colors = new Uint8Array([]);
        colors.ranges.length = 0;
        colors.map.clear();
    }
    hookEvents() {
        this.mouseHandler.on(MouseHandler.events.move, this.boundMouseHandler);
        this.mouseHandler.on(MouseHandler.events.click, this.boundMouseHandler);
    }
    unhookEvents() {
        this.mouseHandler.off(MouseHandler.events.move, this.boundMouseHandler);
        this.mouseHandler.off(MouseHandler.events.click, this.boundMouseHandler);
    }
    handleMouse(event, state) {
        const glCoords = state.glCoords;
        this._offscreenBuffer.readPixel(glCoords[0], glCoords[1], this.colorBufferUint8);
        const colorID = this.colorBufferView.getUint32(0);
        switch (event) {
            case MouseHandler.events.move:
                if (colorID !== this.colorHoverID) {
                    if (this.colorHoverID !== 0) {
                        this.emit(kEvents$1.hoverOff, this.colorHoverID >> 1);
                    }
                    this.colorHoverID = colorID;
                    if (this.colorHoverID !== 0) {
                        this.emit(kEvents$1.hoverOn, this.colorHoverID >> 1);
                    }
                }
                break;
            case MouseHandler.events.click:
                if (colorID !== 0) {
                    this.emit(kEvents$1.click, colorID >> 1);
                }
                break;
        }
    }
    deallocatePickingRange(range) {
        for (let i = 0, n = this.availableIndices.length; i < n; ++i) {
            const availableRange = this.availableIndices[i];
            if (availableRange.start > range.start) {
                if (availableRange.start === range.end) {
                    availableRange.start = range.start;
                }
                else {
                    this.availableIndices.splice(i, 0, {
                        start: range.start,
                        end: range.end,
                    });
                }
                break;
            }
        }
    }
    mapPickingColorIDs(out, idStart, range) {
        for (let i = 0, n = range.end - range.start; i < n; ++i) {
            out.set(range.start + i, idStart + i);
        }
    }
    pickingColorsForIndices(out, offset, range) {
        for (let i = range.start; i < range.end; ++i) {
            const color = this.pickingColorForNumber(i);
            out[offset++] = color[0];
            out[offset++] = color[1];
            out[offset++] = color[2];
            out[offset++] = color[3];
        }
        return offset;
    }
    pickingColorForNumber(num) {
        // offset the number so alpha is never 0
        const pickingNumber = (num << 1) | 1;
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint32(0, pickingNumber);
        return new Uint8Array(buffer);
    }
}

const kGLCircleNodeTypes = {
    // TODO: maybe use points indices?
    position: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    // TODO: maybe skip and use vertex indices when point radius is used.
    radius: PicoGL.FLOAT,
    // TODO: Create a color texture and use indices here.
    color: PicoGL.UNSIGNED_INT,
};
class Circle extends Nodes {
    constructor(...args) {
        super(...args);
    }
    initialize(context, points, data, mappings, pickingManager) {
        super.initialize(context, points, data, mappings, pickingManager);
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));
        this.pickingHandler = this.handlePickingEvent.bind(this);
        this.pickingColors = this.pickingManager.allocatePickingColors(data.length);
        this.pickingVBO = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 4, this.pickingColors.colors);
        this.nodesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.nodesVAO);
        this.nodesVAO.instanceAttributeBuffer(4, this.pickingVBO);
        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);
        const pickingShaders = this.getPickingShaders();
        this.pickingProgram = context.createProgram(pickingShaders.vs, pickingShaders.fs);
        this.pickingDrawCall = context.createDrawCall(this.pickingProgram, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);
        const computedMappings = this.computeMappings(mappings);
        this.usePointRadius = computedMappings.radius === null;
        this.compute(context, {
            uGraphPoints: this.dataTexture,
            uUsePointRadius: this.usePointRadius,
        });
        this.pickingManager.on(PickingManager.events.hoverOn, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.hoverOff, this.pickingHandler);
        this.pickingManager.on(PickingManager.events.click, this.pickingHandler);
        // printDataGL(context, this.targetVBO, data.length, kGLCircleNodeTypes);
    }
    destroy() {
        // TODO: Implement destroy method
    }
    render(context, mode, uniforms) {
        context.disable(PicoGL.BLEND);
        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(true);
        switch (mode) {
            case RenderMode.PICKING:
                if (this.picking) {
                    setDrawCallUniforms(this.pickingDrawCall, uniforms);
                    setDrawCallUniforms(this.pickingDrawCall, this.localUniforms);
                    this.pickingDrawCall.uniform('uPicking', true);
                    this.pickingDrawCall.draw();
                }
                break;
            case RenderMode.HIGH_PASS_2:
                context.depthMask(false);
                context.enable(PicoGL.BLEND);
            /* fallthrough */
            default:
                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.uniform('uPicking', false);
                this.drawCall.draw();
                break;
        }
    }
    getDrawShaders() {
        return {
            vs: nodeVS,
            fs: nodeFS,
        };
    }
    getPickingShaders() {
        return {
            vs: nodeVS,
            fs: pickingFS,
        };
    }
    getGLSourceTypes() {
        return kBasicNodeDataTypes;
    }
    getGLTargetTypes() {
        return kGLCircleNodeTypes;
    }
    getDataShader() {
        return {
            vs: dataVS,
            varyings: ['vPosition', 'vRadius', 'vColor'],
        };
    }
    handlePickingEvent(event, colorID) {
        if (this.picking && this.pickingColors.map.has(colorID)) {
            const id = this.idArray[this.pickingColors.map.get(colorID)];
            this.emit(event, id);
        }
    }
}

var nodeFS$1 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform uint uRenderMode;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float thickness=max(fPixelLength,min(0.05,fPixelLength*1.5*uPixelRatio));float antialias=min(thickness,fPixelLength*1.5);float radius=1.0-thickness;float ring=opOnion(sdCircle(vFromCenter,radius),thickness);float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float distance=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(ring>distance){discard;}if(uRenderMode==MODE_HIGH_PASS_2){if(ring<-antialias){discard;}fragColor=vec4(fColor.rgb,smoothstep(0.0,antialias,abs(ring)));}else{fragColor=vec4(fColor.rgb,1.0);}}"; // eslint-disable-line

class Ring extends Circle {
    getDrawShaders() {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS$1;
        return shaders;
    }
}

var nodeFS$2 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform uint uRenderMode;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float antialias=fPixelLength*1.5;float sd=sdEquilateralTriangle(vFromCenter,0.85);float outline=opOnion(sd,min(0.15,fPixelLength*6.0*uPixelRatio));float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float distance=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(sd>distance){discard;}vec3 color=fColor.rgb*(1.0-0.25*smoothstep(antialias,0.0,outline));if(uRenderMode==MODE_HIGH_PASS_2){if(sd<-antialias){discard;}fragColor=vec4(color,smoothstep(0.0,antialias,abs(sd)));}else{fragColor=vec4(color,1.0);}}"; // eslint-disable-line

var pickingFS$1 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float sd=sdEquilateralTriangle(vFromCenter,1.0);if(sd>0.0){discard;}fragColor=fColor;}"; // eslint-disable-line

class Triangle extends Circle {
    getDrawShaders() {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS$2;
        return shaders;
    }
    getPickingShaders() {
        const shaders = super.getPickingShaders();
        shaders.fs = pickingFS$1;
        return shaders;
    }
}

var nodeFS$3 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform uint uRenderMode;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float antialias=fPixelLength*1.5;float sd=sdPentagon(vFromCenter,1.0);float outline=opOnion(sd,min(0.15,fPixelLength*6.0*uPixelRatio));float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float distance=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(sd>distance){discard;}vec3 color=fColor.rgb*(1.0-0.25*smoothstep(antialias,0.0,outline));if(uRenderMode==MODE_HIGH_PASS_2){if(sd<-antialias){discard;}fragColor=vec4(color,smoothstep(0.0,antialias,abs(sd)));}else{fragColor=vec4(color,1.0);}}"; // eslint-disable-line

var pickingFS$2 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float sd=sdPentagon(vFromCenter,1.0);if(sd>0.0){discard;}fragColor=fColor;}"; // eslint-disable-line

class Pentagon extends Circle {
    getDrawShaders() {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS$3;
        return shaders;
    }
    getPickingShaders() {
        const shaders = super.getPickingShaders();
        shaders.fs = pickingFS$2;
        return shaders;
    }
}

var nodeFS$4 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform uint uRenderMode;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float antialias=fPixelLength*1.5;float sd=sdOctagon(vFromCenter,1.0);float outline=opOnion(sd,min(0.15,fPixelLength*6.0*uPixelRatio));float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float distance=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(sd>distance){discard;}vec3 color=fColor.rgb*(1.0-0.25*smoothstep(antialias,0.0,outline));if(uRenderMode==MODE_HIGH_PASS_2){if(sd<-antialias){discard;}fragColor=vec4(color,smoothstep(0.0,antialias,abs(sd)));}else{fragColor=vec4(color,1.0);}}"; // eslint-disable-line

var pickingFS$3 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float sd=sdOctagon(vFromCenter,1.0);if(sd>0.0){discard;}fragColor=fColor;}"; // eslint-disable-line

class Octagon extends Circle {
    getDrawShaders() {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS$4;
        return shaders;
    }
    getPickingShaders() {
        const shaders = super.getPickingShaders();
        shaders.fs = pickingFS$3;
        return shaders;
    }
}

var nodeFS$5 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform uint uRenderMode;uniform uint uSides;uniform float uAngleDivisor;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float antialias=fPixelLength*1.5;float sd=sdStar(vFromCenter,1.0,uSides,uAngleDivisor);float outline=opOnion(sd,min(0.15,fPixelLength*6.0*uPixelRatio));float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float distance=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(sd>distance){discard;}vec3 color=fColor.rgb*(1.0-0.25*smoothstep(antialias,0.0,outline));if(uRenderMode==MODE_HIGH_PASS_2){if(sd<-antialias){discard;}fragColor=vec4(color,smoothstep(0.0,antialias,abs(sd)));}else{fragColor=vec4(color,1.0);}}"; // eslint-disable-line

var pickingFS$4 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform uint uSides;uniform float uAngleDivisor;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float sd=sdStar(vFromCenter,1.0,uSides,uAngleDivisor);if(sd>0.0){discard;}fragColor=fColor;}"; // eslint-disable-line

class Star extends Circle {
    get sides() {
        return this.localUniforms.uSides;
    }
    set sides(value) {
        this.localUniforms.uSides = value;
    }
    get angleDivisor() {
        return this.localUniforms.uAngleDivisor;
    }
    set angleDivisor(value) {
        this.localUniforms.uAngleDivisor = value;
    }
    constructor(context, points, data, mappings, pickingManager, sides = 5, angleDivisor = 3.0) {
        super(context, points, data, mappings, pickingManager, sides, angleDivisor);
    }
    initialize(context, points, data, mappings, pickingManager, sides, angleDivisor) {
        super.initialize(context, points, data, mappings, pickingManager);
        this.localUniforms.uSides = sides;
        this.localUniforms.uAngleDivisor = angleDivisor;
    }
    getDrawShaders() {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS$5;
        return shaders;
    }
    getPickingShaders() {
        const shaders = super.getPickingShaders();
        shaders.fs = pickingFS$4;
        return shaders;
    }
}

var nodeFS$6 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform uint uRenderMode;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float antialias=fPixelLength*1.5;float sd=sdCross(vFromCenter,1.0,0.3);float outline=opOnion(sd,min(0.15,fPixelLength*6.0*uPixelRatio));float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float distance=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(sd>distance){discard;}vec3 color=fColor.rgb*(1.0-0.25*smoothstep(antialias,0.0,outline));if(uRenderMode==MODE_HIGH_PASS_2){if(sd<-antialias){discard;}fragColor=vec4(color,smoothstep(0.0,antialias,abs(sd)));}else{fragColor=vec4(color,1.0);}}"; // eslint-disable-line

var pickingFS$5 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float sd=sdCross(vFromCenter,1.0,0.3);if(sd>0.0){discard;}fragColor=fColor;}"; // eslint-disable-line

class Cross extends Circle {
    getDrawShaders() {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS$6;
        return shaders;
    }
    getPickingShaders() {
        const shaders = super.getPickingShaders();
        shaders.fs = pickingFS$5;
        return shaders;
    }
}

var nodeFS$7 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform uint uRenderMode;flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float antialias=fPixelLength*1.5;float sd=sdPlus(vFromCenter,vec2(0.9,0.3),0.0);float outline=opOnion(sd,min(0.15,fPixelLength*6.0*uPixelRatio));float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float distance=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(sd>distance){discard;}vec3 color=fColor.rgb*(1.0-0.25*smoothstep(antialias,0.0,outline));if(uRenderMode==MODE_HIGH_PASS_2){if(sd<-antialias){discard;}fragColor=vec4(color,smoothstep(0.0,antialias,abs(sd)));}else{fragColor=vec4(color,1.0);}}"; // eslint-disable-line

var pickingFS$6 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}flat in vec4 fColor;flat in float fPixelLength;in vec2 vFromCenter;out vec4 fragColor;void main(){float sd=sdPlus(vFromCenter,vec2(1.0,0.3),0.0);if(sd>0.0){discard;}fragColor=fColor;}"; // eslint-disable-line

class Plus extends Circle {
    getDrawShaders() {
        const shaders = super.getDrawShaders();
        shaders.fs = nodeFS$7;
        return shaders;
    }
    getPickingShaders() {
        const shaders = super.getPickingShaders();
        shaders.fs = pickingFS$6;
        return shaders;
    }
}

const types = {
    Circle,
    Ring,
    Triangle,
    Pentagon,
    Octagon,
    Star,
    Cross,
    Plus,
};

var edgeVS = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iOffsetA;layout(location=2)in vec3 iOffsetB;layout(location=3)in uint iColorA;layout(location=4)in uint iColorB;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform sampler2D uColorPalette;uniform float uLineWidth;flat out float fLineWidth;out vec3 vColor;out vec2 vProjectedPosition;out float vProjectedW;vec4 getColorByIndexFromTexture(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){float multA=aVertex.y;float multB=1.0-aVertex.y;vec4 colorA=getColorByIndexFromTexture(uColorPalette,int(iColorA));vec4 colorB=getColorByIndexFromTexture(uColorPalette,int(iColorB));vColor=colorA.rgb*multA+colorB.rgb*multB;mat4 renderMatrix=uProjectionMatrix*uViewMatrix*uSceneMatrix;vec4 aProjected=renderMatrix*vec4(iOffsetA,1.0);vec2 aScreen=aProjected.xy/aProjected.w*uViewportSize*0.5;vec4 bProjected=renderMatrix*vec4(iOffsetB,1.0);vec2 bScreen=bProjected.xy/bProjected.w*uViewportSize*0.5;vec2 direction=normalize(bScreen-aScreen);vec2 perp=vec2(-direction.y,direction.x);fLineWidth=uLineWidth*uPixelRatio;float offsetWidth=fLineWidth+0.5;vec4 position=aProjected*multA+bProjected*multB;vec4 offset=vec4(((aVertex.x*perp*offsetWidth)/uViewportSize)*position.w,0.0,0.0);gl_Position=position+offset;vProjectedPosition=position.xy;vProjectedW=position.w;}"; // eslint-disable-line

var edgeFS = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\n#define ONE_ALPHA 0.00392156862\nfloat lineAlpha(vec2 position,float w,vec2 viewportSize,float alpha,float lineWidth){vec2 lineCenter=((position/w)*0.5+0.5)*viewportSize;float distOffset=(lineWidth-1.0)*0.5;float dist=smoothstep(lineWidth*0.5-0.5,lineWidth*0.5+0.5,distance(lineCenter,gl_FragCoord.xy));return alpha*(1.0-dist);}vec4 lineColor(vec3 color,vec2 position,float w,vec2 viewportSize,float alpha,uint mode,float lineWidth){if(mode<MODE_HIGH_PASS_1){return vec4(color,alpha);}float a=lineAlpha(position,w,viewportSize,alpha,lineWidth);if(a<ONE_ALPHA){discard;}return vec4(color,a);}uniform vec2 uViewportSize;uniform float uAlpha;uniform uint uRenderMode;flat in float fLineWidth;in vec3 vColor;in vec2 vProjectedPosition;in float vProjectedW;out vec4 fragColor;void main(){fragColor=lineColor(vColor,vProjectedPosition,vProjectedW,uViewportSize,uAlpha,uRenderMode,fLineWidth);}"; // eslint-disable-line

var dataVS$1 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in uint aSourceIndex;layout(location=1)in uint aTargetIndex;layout(location=2)in uint aSourceColor;layout(location=3)in uint aTargetColor;uniform sampler2D uGraphPoints;out vec3 vSource;out vec3 vTarget;flat out uint vSourceColor;flat out uint vTargetColor;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){vec4 source=valueForIndex(uGraphPoints,int(aSourceIndex));vec4 target=valueForIndex(uGraphPoints,int(aTargetIndex));vec3 direction=normalize(target.xyz-source.xyz);vSource=source.xyz+direction*source[3];vTarget=target.xyz-direction*target[3];vSourceColor=aSourceColor;vTargetColor=aTargetColor;}"; // eslint-disable-line

const kBasicEdgeMappings = {
    id: (entry, i) => 'id' in entry ? entry.id : i,
    source: (entry) => entry.source,
    target: (entry) => entry.target,
    sourceColor: (entry) => 'sourceColor' in entry ? entry.sourceColor : 0,
    targetColor: (entry) => 'targetColor' in entry ? entry.targetColor : 0,
};
const kBasicEdgeDataTypes = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
};
class Edges extends LayerRenderable {
    static get defaultMappings() {
        return kBasicEdgeMappings;
    }
    get alpha() {
        return this.localUniforms.uAlpha;
    }
    set alpha(value) {
        this.localUniforms.uAlpha = value;
    }
    get lineWidth() {
        return this.localUniforms.uLineWidth;
    }
    set lineWidth(value) {
        this.localUniforms.uLineWidth = value;
    }
    initialize(...args) {
        this.localUniforms = {
            uAlpha: 1.0,
            uLineWidth: 1.5,
        };
        super.initialize(...args);
    }
    constructor(...args) {
        super(...args);
    }
    computeMappings(mappings) {
        const edgesMappings = Object.assign({}, kBasicEdgeMappings, mappings);
        // patches the mappings to get the points index from their IDs
        const sourceMapping = edgesMappings.source;
        edgesMappings.source = (entry, i) => {
            return this.points.getPointIndex(sourceMapping(entry, i));
        };
        const targetMapping = edgesMappings.target;
        edgesMappings.target = (entry, i) => {
            return this.points.getPointIndex(targetMapping(entry, i));
        };
        return edgesMappings;
    }
}

const kGLStraightEdgeTypes = {
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
};
class Straight extends Edges {
    initialize(context, points, data, mappings, pickingManager) {
        super.initialize(context, points, data, mappings, pickingManager);
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, 0,
            1, 0,
            -1, 1,
            1, 1,
        ]));
        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);
        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);
        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });
        // printDataGL(context, this.targetVBO, data.length, kGLStraightEdgeTypes);
    }
    destroy() {
        // TODO: Implement destroy method
    }
    render(context, mode, uniforms) {
        context.enable(PicoGL.BLEND);
        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(false);
        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);
        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
                break;
            case RenderMode.HIGH_PASS_2:
                break;
            default:
                this.drawCall.draw();
                break;
        }
    }
    getDrawShaders() {
        return {
            vs: edgeVS,
            fs: edgeFS,
        };
    }
    getPickingShaders() {
        return {
            vs: edgeVS,
            fs: null,
        };
    }
    getGLSourceTypes() {
        return kBasicEdgeDataTypes;
    }
    getGLTargetTypes() {
        return kGLStraightEdgeTypes;
    }
    getDataShader() {
        return {
            vs: dataVS$1,
            varyings: ['vSource', 'vTarget', 'vSourceColor', 'vTargetColor'],
        };
    }
}

var edgeVS$1 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iOffsetA;layout(location=2)in vec3 iOffsetB;layout(location=3)in uint iColorA;layout(location=4)in uint iColorB;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform sampler2D uColorPalette;uniform uint uDashLength;uniform float uLineWidth;flat out float fLineWidth;out vec3 vColor;out float vDashLength;out vec2 vProjectedPosition;out float vProjectedW;vec4 getColorByIndexFromTexture(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){float multA=aVertex.y;float multB=1.0-aVertex.y;vec4 colorA=getColorByIndexFromTexture(uColorPalette,int(iColorA));vec4 colorB=getColorByIndexFromTexture(uColorPalette,int(iColorB));vColor=colorA.rgb*multA+colorB.rgb*multB;mat4 renderMatrix=uProjectionMatrix*uViewMatrix*uSceneMatrix;vec4 aProjected=renderMatrix*vec4(iOffsetA,1.0);vec2 aScreen=(aProjected.xy/aProjected.w)*(uViewportSize/2.0);vec4 bProjected=renderMatrix*vec4(iOffsetB,1.0);vec2 bScreen=(bProjected.xy/bProjected.w)*(uViewportSize/2.0);vec2 direction=normalize(bScreen-aScreen);vec2 perp=vec2(-direction.y,direction.x);fLineWidth=uLineWidth*uPixelRatio;float offsetWidth=fLineWidth+0.5;vec4 position=aProjected*multA+bProjected*multB;vec4 offset=vec4(((aVertex.x*perp*offsetWidth)/uViewportSize)*position.w,0.0,0.0);gl_Position=position+offset;vProjectedPosition=position.xy;vProjectedW=position.w;float screenDistance=distance(aScreen,bScreen);vDashLength=(screenDistance/float(uDashLength))*aVertex.y;}"; // eslint-disable-line

var edgeFS$1 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\n#define ONE_ALPHA 0.00392156862\nfloat lineAlpha(vec2 position,float w,vec2 viewportSize,float alpha,float lineWidth){vec2 lineCenter=((position/w)*0.5+0.5)*viewportSize;float distOffset=(lineWidth-1.0)*0.5;float dist=smoothstep(lineWidth*0.5-0.5,lineWidth*0.5+0.5,distance(lineCenter,gl_FragCoord.xy));return alpha*(1.0-dist);}vec4 lineColor(vec3 color,vec2 position,float w,vec2 viewportSize,float alpha,uint mode,float lineWidth){if(mode<MODE_HIGH_PASS_1){return vec4(color,alpha);}float a=lineAlpha(position,w,viewportSize,alpha,lineWidth);if(a<ONE_ALPHA){discard;}return vec4(color,a);}uniform vec2 uViewportSize;uniform float uAlpha;uniform uint uRenderMode;flat in float fLineWidth;in vec3 vColor;in float vDashLength;in vec2 vProjectedPosition;in float vProjectedW;out vec4 fragColor;void main(){if(int(vDashLength)% 2==1){discard;}fragColor=lineColor(vColor,vProjectedPosition,vProjectedW,uViewportSize,uAlpha,uRenderMode,fLineWidth);}"; // eslint-disable-line

class Dashed extends Straight {
    get dashLength() {
        return this.localUniforms.uDashLength;
    }
    set dashLength(value) {
        this.localUniforms.uDashLength = value;
    }
    initialize(context, points, data, mappings, pickingManager) {
        super.initialize(context, points, data, mappings, pickingManager);
        this.localUniforms.uDashLength = 10.0;
    }
    getDrawShaders() {
        return {
            vs: edgeVS$1,
            fs: edgeFS$1,
        };
    }
}

var edgeVS$2 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iOffsetA;layout(location=2)in vec3 iOffsetB;layout(location=3)in uint iColorA;layout(location=4)in uint iColorB;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform float uGravity;uniform sampler2D uColorPalette;out vec3 vColor;out vec2 vProjectedPosition;out float vProjectedW;vec4 getColorByIndexFromTexture(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){float multA=aVertex.x;float multB=1.0-aVertex.x;vec4 colorA=getColorByIndexFromTexture(uColorPalette,int(iColorA));vec4 colorB=getColorByIndexFromTexture(uColorPalette,int(iColorB));vColor=colorA.rgb*multA+colorB.rgb*multB;vec3 direction=iOffsetB-iOffsetA;vec3 middle=iOffsetA+direction*0.5;float distance=length(direction);float toCenter=length(middle);vec3 towardsCenter=(middle*-1.0)/toCenter;vec3 gravity=middle+towardsCenter*min(toCenter,distance*uGravity);vec3 position=gravity+pow(multB,2.0)*(iOffsetB-gravity)+pow(multA,2.0)*(iOffsetA-gravity);mat4 renderMatrix=uProjectionMatrix*uViewMatrix*uSceneMatrix;gl_Position=renderMatrix*vec4(position,1.0);vProjectedPosition=gl_Position.xy;vProjectedW=gl_Position.w;}"; // eslint-disable-line

var edgeFS$2 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\n#define ONE_ALPHA 0.00392156862\nfloat lineAlpha(vec2 position,float w,vec2 viewportSize,float alpha,float lineWidth){vec2 lineCenter=((position/w)*0.5+0.5)*viewportSize;float distOffset=(lineWidth-1.0)*0.5;float dist=smoothstep(lineWidth*0.5-0.5,lineWidth*0.5+0.5,distance(lineCenter,gl_FragCoord.xy));return alpha*(1.0-dist);}vec4 lineColor(vec3 color,vec2 position,float w,vec2 viewportSize,float alpha,uint mode,float lineWidth){if(mode<MODE_HIGH_PASS_1){return vec4(color,alpha);}float a=lineAlpha(position,w,viewportSize,alpha,lineWidth);if(a<ONE_ALPHA){discard;}return vec4(color,a);}uniform vec2 uViewportSize;uniform float uAlpha;uniform uint uRenderMode;in vec3 vColor;in vec2 vProjectedPosition;in float vProjectedW;out vec4 fragColor;void main(){fragColor=lineColor(vColor,vProjectedPosition,vProjectedW,uViewportSize,uAlpha,uRenderMode);}"; // eslint-disable-line

var dataVS$2 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in uint aSourceIndex;layout(location=1)in uint aTargetIndex;layout(location=2)in uint aSourceColor;layout(location=3)in uint aTargetColor;uniform sampler2D uGraphPoints;out vec3 vSource;out vec3 vTarget;flat out uint vSourceColor;flat out uint vTargetColor;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){vec4 source=valueForIndex(uGraphPoints,int(aSourceIndex));vSource=source.xyz;vec4 target=valueForIndex(uGraphPoints,int(aTargetIndex));vTarget=target.xyz;vSourceColor=aSourceColor;vTargetColor=aTargetColor;}"; // eslint-disable-line

({
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
});
class Gravity extends Edges {
    constructor(context, points, data, mappings, pickingManager, segments = 16) {
        super(context, points, data, mappings, pickingManager, segments);
    }
    get gravity() {
        return this.localUniforms.uGravity;
    }
    set gravity(value) {
        this.localUniforms.uGravity = value;
    }
    initialize(context, points, data, mappings, pickingManager, segments) {
        super.initialize(context, points, data, mappings, pickingManager);
        this.localUniforms.uGravity = -0.2;
        const segmentVertices = [];
        for (let i = 0; i <= segments; ++i) {
            segmentVertices.push(i / segments, 0);
        }
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(segmentVertices));
        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);
        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.LINE_STRIP);
        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });
        // printDataGL(context, this.targetVBO, data.length, kGLStraightEdgeTypes);
    }
    destroy() {
        // TODO: Implement destroy method
    }
    render(context, mode, uniforms) {
        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);
        context.enable(PicoGL.BLEND);
        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(false);
        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
                break;
            case RenderMode.HIGH_PASS_2:
                break;
            default:
                this.drawCall.draw();
                break;
        }
    }
    getDrawShaders() {
        return {
            vs: edgeVS$2,
            fs: edgeFS$2,
        };
    }
    getPickingShaders() {
        return {
            vs: edgeVS$2,
            fs: null,
        };
    }
    getGLSourceTypes() {
        return kBasicEdgeDataTypes;
    }
    getGLTargetTypes() {
        return kGLStraightEdgeTypes;
    }
    getDataShader() {
        return {
            vs: dataVS$2,
            varyings: ['vSource', 'vTarget', 'vSourceColor', 'vTargetColor'],
        };
    }
}

var edgeVS$3 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iOffsetA;layout(location=2)in vec3 iOffsetB;layout(location=3)in vec3 iControl;layout(location=4)in uint iColorA;layout(location=5)in uint iColorB;layout(location=6)in vec2 iColorMix;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform sampler2D uColorPalette;uniform float uLineWidth;uniform float uSegments;flat out float fLineWidth;out vec3 vColor;out vec2 vProjectedPosition;out float vProjectedW;vec4 getColorByIndexFromTexture(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}vec3 bezier(vec3 p0,vec3 p1,vec3 p2,float t){return p1+pow(1.0-t,2.0)*(p2-p1)+pow(t,2.0)*(p0-p1);}void main(){float t0=aVertex.y/uSegments;float t1=(aVertex.y+1.0)/uSegments;vec3 b0=bezier(iOffsetA,iControl,iOffsetB,t0);vec3 b1=bezier(iOffsetA,iControl,iOffsetB,t1);mat4 renderMatrix=uProjectionMatrix*uViewMatrix*uSceneMatrix;vec4 b0Projected=renderMatrix*vec4(b0,1.0);vec4 b1Projected=renderMatrix*vec4(b1,1.0);vec2 b0Screen=(b0Projected.xy/b0Projected.w)*uViewportSize*0.5;vec2 b1Screen=(b1Projected.xy/b1Projected.w)*uViewportSize*0.5;vec2 direction=normalize(b1Screen-b0Screen);vec2 normal=vec2(-direction.y,direction.x);fLineWidth=uLineWidth*uPixelRatio;float offsetWidth=fLineWidth+0.5;vec4 offset=vec4(((aVertex.x*normal*offsetWidth)/uViewportSize)*b0Projected.w,0.0,0.0);gl_Position=b0Projected+offset;vProjectedPosition=b0Projected.xy;vProjectedW=b0Projected.w;vec4 colorA=getColorByIndexFromTexture(uColorPalette,int(iColorA));vec4 colorB=getColorByIndexFromTexture(uColorPalette,int(iColorB));vec3 mixColorA=mix(colorA.rgb,colorB.rgb,iColorMix[1]);vec3 mixColorB=mix(colorA.rgb,colorB.rgb,iColorMix[0]);vColor=mix(mixColorA.rgb,mixColorB.rgb,t0);}"; // eslint-disable-line

var edgeFS$3 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\n#define ONE_ALPHA 0.00392156862\nfloat lineAlpha(vec2 position,float w,vec2 viewportSize,float alpha,float lineWidth){vec2 lineCenter=((position/w)*0.5+0.5)*viewportSize;float distOffset=(lineWidth-1.0)*0.5;float dist=smoothstep(lineWidth*0.5-0.5,lineWidth*0.5+0.5,distance(lineCenter,gl_FragCoord.xy));return alpha*(1.0-dist);}vec4 lineColor(vec3 color,vec2 position,float w,vec2 viewportSize,float alpha,uint mode,float lineWidth){if(mode<MODE_HIGH_PASS_1){return vec4(color,alpha);}float a=lineAlpha(position,w,viewportSize,alpha,lineWidth);if(a<ONE_ALPHA){discard;}return vec4(color,a);}uniform vec2 uViewportSize;uniform float uAlpha;uniform uint uRenderMode;flat in float fLineWidth;in vec3 vColor;in vec2 vProjectedPosition;in float vProjectedW;out vec4 fragColor;void main(){fragColor=lineColor(vColor,vProjectedPosition,vProjectedW,uViewportSize,uAlpha,uRenderMode,fLineWidth);}"; // eslint-disable-line

var dataVS$3 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in uint aSourceIndex;layout(location=1)in uint aTargetIndex;layout(location=2)in uvec3 aControl;layout(location=3)in uint aSourceColor;layout(location=4)in uint aTargetColor;uniform sampler2D uGraphPoints;out vec3 vSource;out vec3 vTarget;out vec3 vControl;flat out uint vSourceColor;flat out uint vTargetColor;out vec2 vColorMix;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){vec4 source=valueForIndex(uGraphPoints,int(aSourceIndex));vec4 target=valueForIndex(uGraphPoints,int(aTargetIndex));vec4 control=valueForIndex(uGraphPoints,int(aControl[0]));if(aControl[1]==0u){vSource=source.xyz;}else{vSource=(source.xyz+control.xyz)/2.0;}if(aControl[1]==aControl[2]-1u){vTarget=target.xyz;}else{vTarget=(target.xyz+control.xyz)/2.0;}vControl=control.xyz;vSourceColor=aSourceColor;vTargetColor=aTargetColor;vColorMix=vec2(float(aControl[1])/float(aControl[2]),float(aControl[1]+1u)/float(aControl[2]));}"; // eslint-disable-line

const kPathEdgeMappings = {
    id: (entry, i) => 'id' in entry ? entry.id : i,
    source: (entry) => entry.source,
    target: (entry) => entry.target,
    control: (entry) => entry.control,
    sourceColor: (entry) => 'sourceColor' in entry ? entry.sourceColor : 0,
    targetColor: (entry) => 'targetColor' in entry ? entry.targetColor : 0,
};
const kPathEdgeDataTypes = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    control: [PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT, PicoGL.UNSIGNED_INT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
};
const kGLPathEdgeTypes = {
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    control: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    colorMix: [PicoGL.FLOAT, PicoGL.FLOAT],
};
class CurvedPath extends Edges {
    constructor(context, points, data, mappings, pickingManager, segments = 16) {
        super(context, points, data, mappings, pickingManager, segments);
    }
    initialize(context, points, data, mappings, pickingManager, segments) {
        super.initialize(context, points, data, mappings, pickingManager);
        const segmentVertices = [];
        for (let i = 0; i <= segments; ++i) {
            segmentVertices.push(-1, i, 1, i);
        }
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(segmentVertices));
        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);
        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);
        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });
        // printDataGL(context, this.targetVBO, data.length, kGLStraightEdgeTypes);
        this.localUniforms.uSegments = segments;
    }
    destroy() {
        // TODO: Implement destroy method
    }
    render(context, mode, uniforms) {
        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);
        context.enable(PicoGL.BLEND);
        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(false);
        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
                break;
            case RenderMode.HIGH_PASS_2:
                break;
            default:
                context.blendFuncSeparate(PicoGL.SRC_ALPHA, PicoGL.ONE, PicoGL.ONE, PicoGL.ONE);
                this.drawCall.draw();
                break;
        }
    }
    getDrawShaders() {
        return {
            vs: edgeVS$3,
            fs: edgeFS$3,
        };
    }
    getPickingShaders() {
        return {
            vs: edgeVS$3,
            fs: null,
        };
    }
    getGLSourceTypes() {
        return kPathEdgeDataTypes;
    }
    getGLTargetTypes() {
        return kGLPathEdgeTypes;
    }
    getDataShader() {
        return {
            vs: dataVS$3,
            varyings: ['vSource', 'vTarget', 'vControl', 'vSourceColor', 'vTargetColor', 'vColorMix'],
        };
    }
    computeMappings(mappings) {
        const edgesMappings = Object.assign({}, kPathEdgeMappings, super.computeMappings(mappings));
        // patches the mappings to get the points index from their IDs and account for flattening
        edgesMappings.control[kDataMappingFlatten] = (entry, i, l) => {
            return [this.points.getPointIndex(entry.control[i]), i, l];
        };
        edgesMappings.source[kDataMappingFlatten] = (entry, i, l) => {
            if (i === 0) {
                return entry.source;
            }
            return edgesMappings.control[kDataMappingFlatten](entry, i - 1, l)[0];
        };
        edgesMappings.target[kDataMappingFlatten] = (entry, i, l) => {
            if (i === l - 1) {
                return entry.target;
            }
            return edgesMappings.control[kDataMappingFlatten](entry, i + 1, l)[0];
        };
        return edgesMappings;
    }
}

var edgeVS$4 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iOffsetA;layout(location=2)in vec3 iOffsetB;layout(location=3)in vec3 iControl;layout(location=4)in uint iColorA;layout(location=5)in uint iColorB;layout(location=6)in vec2 iColorMix;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform sampler2D uColorPalette;uniform float uLineWidth;uniform float uSegments;flat out float fLineWidth;out vec3 vColor;out vec2 vProjectedPosition;out float vProjectedW;vec4 getColorByIndexFromTexture(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}vec3 bezier(vec3 p0,vec3 p1,vec3 p2,float t){return p1+pow(1.0-t,2.0)*(p2-p1)+pow(t,2.0)*(p0-p1);}void main(){float t0=aVertex.y/uSegments;float t1=(aVertex.y+1.0)/uSegments;vec3 b0=bezier(iOffsetA,iControl,iOffsetB,t0);vec3 b1=bezier(iOffsetA,iControl,iOffsetB,t1);mat4 renderMatrix=uProjectionMatrix*uViewMatrix*uSceneMatrix;vec4 b0Projected=renderMatrix*vec4(b0,1.0);vec4 b1Projected=renderMatrix*vec4(b1,1.0);vec2 b0Screen=(b0Projected.xy/b0Projected.w)*uViewportSize*0.5;vec2 b1Screen=(b1Projected.xy/b1Projected.w)*uViewportSize*0.5;vec2 direction=normalize(b1Screen-b0Screen);vec2 normal=vec2(-direction.y,direction.x);fLineWidth=uLineWidth*uPixelRatio;float offsetWidth=fLineWidth+0.5;vec4 offset=vec4(((aVertex.x*normal*offsetWidth)/uViewportSize)*b0Projected.w,0.0,0.0);gl_Position=b0Projected+offset;vProjectedPosition=b0Projected.xy;vProjectedW=b0Projected.w;vec4 colorA=getColorByIndexFromTexture(uColorPalette,int(iColorA));vec4 colorB=getColorByIndexFromTexture(uColorPalette,int(iColorB));vec3 mixColorA=mix(colorA.rgb,colorB.rgb,iColorMix[1]);vec3 mixColorB=mix(colorA.rgb,colorB.rgb,iColorMix[0]);vColor=mix(mixColorA.rgb,mixColorB.rgb,t0);}"; // eslint-disable-line

var edgeFS$4 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\n#define ONE_ALPHA 0.00392156862\nfloat lineAlpha(vec2 position,float w,vec2 viewportSize,float alpha,float lineWidth){vec2 lineCenter=((position/w)*0.5+0.5)*viewportSize;float distOffset=(lineWidth-1.0)*0.5;float dist=smoothstep(lineWidth*0.5-0.5,lineWidth*0.5+0.5,distance(lineCenter,gl_FragCoord.xy));return alpha*(1.0-dist);}vec4 lineColor(vec3 color,vec2 position,float w,vec2 viewportSize,float alpha,uint mode,float lineWidth){if(mode<MODE_HIGH_PASS_1){return vec4(color,alpha);}float a=lineAlpha(position,w,viewportSize,alpha,lineWidth);if(a<ONE_ALPHA){discard;}return vec4(color,a);}uniform vec2 uViewportSize;uniform float uAlpha;uniform uint uRenderMode;flat in float fLineWidth;in vec3 vColor;in vec2 vProjectedPosition;in float vProjectedW;out vec4 fragColor;void main(){fragColor=lineColor(vColor,vProjectedPosition,vProjectedW,uViewportSize,uAlpha,uRenderMode,fLineWidth);}"; // eslint-disable-line

var dataVS$4 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in uint aSourceIndex;layout(location=1)in uint aTargetIndex;layout(location=2)in uint aSourceClusterIndex;layout(location=3)in uint aTargetClusterIndex;layout(location=4)in uint aSourceColor;layout(location=5)in uint aTargetColor;layout(location=6)in uint aIndex;uniform sampler2D uGraphPoints;out vec3 vSource;out vec3 vTarget;out vec3 vControl;flat out uint vSourceColor;flat out uint vTargetColor;out vec2 vColorMix;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){vec4 source=valueForIndex(uGraphPoints,int(aSourceIndex));vec4 target=valueForIndex(uGraphPoints,int(aTargetIndex));vec4 sourceCluster=valueForIndex(uGraphPoints,int(aSourceClusterIndex));vec4 targetCluster=valueForIndex(uGraphPoints,int(aTargetClusterIndex));vec3 direction=normalize(vec3(targetCluster.xy,0.0)-vec3(sourceCluster.xy,0.0));vec3 sourceClusterEdge=sourceCluster.xyz+direction*sourceCluster[3];vec3 targetClusterEdge=targetCluster.xyz-direction*targetCluster[3];float edgeToEdge=length(targetClusterEdge-sourceClusterEdge);vec3 bundlePoint=sourceClusterEdge+direction*(edgeToEdge*0.5);vec3 sourceEdgeToNode=sourceClusterEdge-source.xyz-direction*source[3];float sourceNodeAdjacent=dot(normalize(sourceEdgeToNode),direction)*length(sourceEdgeToNode);vec3 sourceClusterControl=sourceClusterEdge-direction*min(sourceNodeAdjacent*0.75,sourceCluster[3]);vec3 sourceControlDirection=normalize(sourceClusterControl-source.xyz);vec3 sourcePoint=source.xyz+sourceControlDirection*source[3];vec3 targetEdgeToNode=target.xyz-targetClusterEdge-direction*target[3];float targetNodeAdjacent=dot(normalize(targetEdgeToNode),direction)*length(targetEdgeToNode);vec3 targetClusterControl=targetClusterEdge+direction*min(targetNodeAdjacent*0.75,targetCluster[3]);vec3 targetControlDirection=normalize(targetClusterControl-target.xyz);vec3 targetPoint=target.xyz+targetControlDirection*target[3];if(aIndex==0u){if(aSourceIndex==aSourceClusterIndex){vSource=sourcePoint;vControl=sourcePoint;vTarget=sourcePoint;}else{vSource=sourcePoint;vControl=sourceClusterControl;vTarget=(sourceClusterControl+bundlePoint)/2.0;}}else if(aIndex==1u){if(aSourceIndex==aSourceClusterIndex){vSource=sourcePoint;}else{vSource=(sourceClusterControl+bundlePoint)/2.0;}vControl=bundlePoint;if(aTargetIndex==aTargetClusterIndex){vTarget=targetPoint;}else{vTarget=(bundlePoint+targetClusterControl)/2.0;}}else{if(aTargetIndex==aTargetClusterIndex){vSource=targetPoint;vControl=targetPoint;vTarget=targetPoint;}else{vSource=(bundlePoint+targetClusterControl)/2.0;vControl=targetClusterControl;vTarget=targetPoint;}}vSourceColor=aSourceColor;vTargetColor=aTargetColor;vColorMix=vec2(float(aIndex)*0.25,float(aIndex+1u)*0.25);}"; // eslint-disable-line

const kClusterBundleEdgeMappings = {
    id: (entry, i) => 'id' in entry ? entry.id : i,
    source: (entry) => entry.source,
    target: (entry) => entry.target,
    sourceCluster: (entry) => entry.sourceCluster,
    targetCluster: (entry) => entry.targetCluster,
    sourceColor: (entry) => 'sourceColor' in entry ? entry.sourceColor : 0,
    targetColor: (entry) => 'targetColor' in entry ? entry.targetColor : 0,
    index: () => [0, 1, 2],
};
const kClusterBundleEdgeDataTypes = {
    source: PicoGL.UNSIGNED_INT,
    target: PicoGL.UNSIGNED_INT,
    sourceCluster: PicoGL.UNSIGNED_INT,
    targetCluster: PicoGL.UNSIGNED_INT,
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    index: PicoGL.UNSIGNED_INT,
};
const kGLClusterBundleEdgeTypes = {
    source: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    target: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    control: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    sourceColor: PicoGL.UNSIGNED_INT,
    targetColor: PicoGL.UNSIGNED_INT,
    colorMix: [PicoGL.FLOAT, PicoGL.FLOAT],
};
class ClusterBundle extends Edges {
    constructor(context, points, data, mappings, pickingManager, segments = 16) {
        super(context, points, data, mappings, pickingManager, segments);
    }
    initialize(context, points, data, mappings, pickingManager, segments) {
        super.initialize(context, points, data, mappings, pickingManager);
        const segmentVertices = [];
        for (let i = 0; i <= segments; ++i) {
            segmentVertices.push(-1, i, 1, i);
        }
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(segmentVertices));
        this.edgesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.edgesVAO);
        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.edgesVAO).primitive(PicoGL.TRIANGLE_STRIP);
        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });
        // printDataGL(context, this.targetVBO, data.length, kGLClusterBundleEdgeTypes);
        this.localUniforms.uSegments = segments;
    }
    destroy() {
        // TODO: Implement destroy method
    }
    render(context, mode, uniforms) {
        setDrawCallUniforms(this.drawCall, uniforms);
        setDrawCallUniforms(this.drawCall, this.localUniforms);
        context.enable(PicoGL.BLEND);
        context.depthRange(this.nearDepth, this.farDepth);
        context.depthMask(false);
        switch (mode) {
            case RenderMode.PICKING:
                // this.pickingDrawCall.draw();
                break;
            case RenderMode.HIGH_PASS_2:
                break;
            default:
                this.drawCall.draw();
                break;
        }
    }
    getDrawShaders() {
        return {
            vs: edgeVS$4,
            fs: edgeFS$4,
        };
    }
    getPickingShaders() {
        return {
            vs: edgeVS$4,
            fs: null,
        };
    }
    getGLSourceTypes() {
        return kClusterBundleEdgeDataTypes;
    }
    getGLTargetTypes() {
        return kGLClusterBundleEdgeTypes;
    }
    getDataShader() {
        return {
            vs: dataVS$4,
            varyings: ['vSource', 'vTarget', 'vControl', 'vSourceColor', 'vTargetColor', 'vColorMix'],
        };
    }
    computeMappings(mappings) {
        const edgesMappings = Object.assign({}, kClusterBundleEdgeMappings, super.computeMappings(mappings));
        // patches the mappings to get the points index from their IDs
        const sourceClusterMapping = edgesMappings.sourceCluster;
        edgesMappings.sourceCluster = (entry, i) => {
            return this.points.getPointIndex(sourceClusterMapping(entry, i));
        };
        const targetClusterMapping = edgesMappings.targetCluster;
        edgesMappings.targetCluster = (entry, i) => {
            return this.points.getPointIndex(targetClusterMapping(entry, i));
        };
        return edgesMappings;
    }
}

const types$1 = {
    Straight,
    Dashed,
    Gravity,
    CurvedPath,
    ClusterBundle,
};

var nodeFS$8 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nuniform float uPixelRatio;uniform sampler2D uLabelTexture;uniform uint uRenderMode;flat in vec4 fColor;flat in vec2 fLabelSize;flat in float fPixelLength;in vec2 vFromCenter;in vec2 vUV;out vec4 fragColor;void main(){vec4 texPixel=texture(uLabelTexture,vUV);float smoothing=4.0/fLabelSize.y;float distance=texPixel.a;float alpha=smoothstep(0.5-smoothing,0.5+smoothing,distance);float threshold=uRenderMode==MODE_HIGH_PASS_1 ? 0.75 : 0.5;if(uRenderMode!=MODE_HIGH_PASS_2){if(alpha<threshold){discard;}fragColor=vec4(texPixel.rgb*fColor.rgb,1.0);}else{if(texPixel.a==1.0){discard;}fragColor=vec4(texPixel.rgb*fColor.rgb,alpha);}}"; // eslint-disable-line

var nodeVS$1 = "#version 300 es\nprecision lowp usampler2D;\n#define GLSLIFY 1\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iPosition;layout(location=2)in float iRadius;layout(location=3)in uint iColor;layout(location=4)in uint iBox;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform sampler2D uColorPalette;uniform usampler2D uLabelBoxes;uniform sampler2D uLabelTexture;uniform float uVisibilityThreshold;uniform vec2 uLabelPlacement;flat out vec4 fColor;flat out vec2 fLabelSize;flat out float fPixelLength;out vec2 vFromCenter;out vec2 vUV;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){mat4 offsetMatrix=mat4(1.0);offsetMatrix[3]=vec4(iPosition,1.0);mat4 modelMatrix=uViewMatrix*uSceneMatrix*offsetMatrix;mat4 lookAtMatrix=mat4(modelMatrix);lookAtMatrix[0]=vec4(1.0,0.0,0.0,lookAtMatrix[0][3]);lookAtMatrix[1]=vec4(0.0,1.0,0.0,lookAtMatrix[1][3]);lookAtMatrix[2]=vec4(0.0,0.0,1.0,lookAtMatrix[2][3]);vec4 quadCenter=uProjectionMatrix*lookAtMatrix*vec4(0.0,0.0,0.0,1.0);vec2 screenQuadCenter=quadCenter.xy/quadCenter.w;vec4 quadSide=uProjectionMatrix*lookAtMatrix*vec4(iRadius,0.0,0.0,1.0);vec2 screenQuadSide=quadSide.xy/quadSide.w;float pixelRadius=length((screenQuadSide-screenQuadCenter)*uViewportSize*0.5);fColor=valueForIndex(uColorPalette,int(iColor));fPixelLength=1.0/max(1.0,pixelRadius);vFromCenter=aVertex.xy;vec4 box=vec4(uvalueForIndex(uLabelBoxes,int(iBox)));vec2 texSize=vec2(textureSize(uLabelTexture,0));vec2 uvMultiplier=vec2((aVertex.xy+1.0)/2.0);float u=(box[0]/texSize.x)+(box[2]/texSize.x)*uvMultiplier.x;float v=(box[1]/texSize.y)+(box[3]/texSize.y)*uvMultiplier.y;vUV=vec2(u,v);fLabelSize=vec2(box[2],box[3]);float visibilityThreshold=uVisibilityThreshold*uPixelRatio;vec3 visibilityMultiplier=vec3(smoothstep(visibilityThreshold*0.5,visibilityThreshold*0.6,pixelRadius),smoothstep(visibilityThreshold*0.5,visibilityThreshold*0.525,pixelRadius),1.0);float pixelToWorld=iRadius/pixelRadius;vec3 labelSize=vec3(box[2]*pixelToWorld,box[3]*pixelToWorld,0.0);mat4 renderMatrix=uProjectionMatrix*lookAtMatrix;float labelMargin=5.0*pixelToWorld;vec3 labelOffset=vec3((iRadius+labelSize.x*0.5+labelMargin)*uLabelPlacement.x,(iRadius+labelSize.y*0.5+labelMargin)*uLabelPlacement.y,0.01);vec4 worldVertex=renderMatrix*vec4(aVertex*labelSize*0.5*visibilityMultiplier+labelOffset,1.0);gl_Position=worldVertex;}"; // eslint-disable-line

var dataVS$5 = "#version 300 es\n#define GLSLIFY 1\nlayout(location=0)in uint aPositionIndex;layout(location=1)in uint aColor;layout(location=2)in uint aBox;uniform sampler2D uGraphPoints;out vec3 vPosition;out float vRadius;flat out uint vColor;flat out uint vBox;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){vec4 value=valueForIndex(uGraphPoints,int(aPositionIndex));vPosition=value.xyz;vRadius=value.w;vColor=aColor;vBox=aBox;}"; // eslint-disable-line

var testVS$1 = "#version 300 es\nprecision lowp usampler2D;\n#define GLSLIFY 1\nlayout(location=0)in uint aIndex;uniform usampler2D uDataTexture;flat out vec4 vBox;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){vec2 texSize=vec2(textureSize(uDataTexture,0));vec4 box=vec4(uvalueForIndex(uDataTexture,int(aIndex)));vBox=vec4(box[0]/texSize.x,box[1]/texSize.y,box[2]/texSize.x,box[3]/texSize.y);}"; // eslint-disable-line

const kImageMargin = 2;
const INF = 1e20;
const kLabelMappings = {
    id: (entry, i) => 'id' in entry ? entry.id : i,
    label: (entry, i) => 'label' in entry ? entry.label : `${i}`,
    font: (entry) => 'font' in entry ? entry.font : 'monospace',
    fontSize: (entry) => 'fontSize' in entry ? entry.fontSize : 18,
    padding: (entry) => 'padding' in entry ? entry.padding : [8, 5],
    background: (entry) => 'background' in entry ? entry.background : false,
};
const kLabelBoxDataMappings = {
    box: (entry) => [entry.x, entry.y, entry.w, entry.h],
};
const kLabelBoxDataTypes = {
    box: [PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT, PicoGL.UNSIGNED_SHORT],
};
class LabelAtlas {
    constructor(context, data, mappings) {
        this.labelPixelRatio = window.devicePixelRatio;
        this.labelMap = new Map();
        if (data.length) {
            this.processData(context, data, Object.assign({}, kLabelMappings, mappings));
        }
        else {
            this._dataTexture = context.createTexture2D(1, 1);
            this._labelsTexture = context.createTexture2D(1, 1);
        }
    }
    get dataTexture() {
        return this._dataTexture;
    }
    get labelsTexture() {
        return this._labelsTexture;
    }
    processData(context, data, mappings) {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('style', 'font-smooth: never;-webkit-font-smoothing : none;');
        const ctx = canvas.getContext('2d');
        const boxes = [];
        for (const [, entry] of dataIterator(data, mappings)) {
            const image = this.computeDistanceField(this.renderLabelTexture(entry, ctx, canvas), entry.fontSize);
            boxes.push({ id: entry.id, w: image.width + kImageMargin * 2, h: image.height + kImageMargin * 2, image });
        }
        const pack = potpack(boxes);
        const finalImage = ctx.createImageData(pack.w, pack.h);
        const buffer = packData(boxes, kLabelBoxDataMappings, kLabelBoxDataTypes, true, ((i) => {
            const box = boxes[i];
            this.labelMap.set(box.id, i);
            this.blitImageData(box.image, finalImage, box.x + kImageMargin, finalImage.height - box.y - box.h + kImageMargin);
        }));
        this._labelsTexture = context.createTexture2D(finalImage, {
            flipY: true,
        });
        const uint16 = new Uint16Array(buffer);
        const textureWidth = Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(data.length)))));
        const textureHeight = Math.pow(2, Math.ceil(Math.log2(Math.ceil(data.length / textureWidth))));
        this._dataTexture = context.createTexture2D(textureWidth, textureHeight, {
            internalFormat: PicoGL.RGBA16UI,
        });
        this._dataTexture.data(uint16);
        // this.testFeedback(context);
    }
    renderLabelTexture(entry, context, canvas) {
        if (typeof entry.label === 'string') {
            const label = entry.label || ' ';
            const pixelRatio = this.labelPixelRatio;
            const outlineWidth = 3;
            let horizontalPadding;
            let verticalPadding;
            if (Array.isArray(entry.padding)) {
                horizontalPadding = entry.padding[0];
                verticalPadding = entry.padding.length > 1 ? entry.padding[1] : entry.padding[0];
            }
            else {
                horizontalPadding = entry.padding;
                verticalPadding = entry.padding;
            }
            context.font = `${entry.fontSize * pixelRatio}px ${entry.font}`;
            context.imageSmoothingEnabled = false;
            canvas.width = context.measureText(label).width + horizontalPadding * 2 * pixelRatio;
            canvas.height = entry.fontSize * pixelRatio + verticalPadding * 2 * pixelRatio;
            context.fillStyle = '#ff0000';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = `${entry.fontSize * pixelRatio}px ${entry.font}`;
            if (entry.background) {
                context.fillStyle = '#00ff66';
                context.lineWidth = outlineWidth;
                context.strokeStyle = '#00ffcc';
                this.roundRect(context, outlineWidth, outlineWidth, canvas.width - outlineWidth * 2, canvas.height - outlineWidth * 2, Math.min(10, canvas.height * 0.25, canvas.width * 0.25), true);
            }
            context.fillStyle = '#00ffff';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(label, canvas.width * 0.5, canvas.height * 0.5);
            return context.getImageData(0, 0, canvas.width, canvas.height);
        }
        return entry.label;
    }
    roundRect(context, x, y, width, height, radius = 5, fill = true, stroke = true) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        if (stroke) {
            context.stroke();
        }
        if (fill) {
            context.fill();
        }
    }
    blitImageData(src, dst, x, y) {
        for (let yy = 0; yy < src.height; ++yy) {
            const srcStart = src.width * yy * 4;
            const srcEnd = srcStart + src.width * 4;
            const dstOff = dst.width * (yy + y) * 4 + x * 4;
            dst.data.set(src.data.subarray(srcStart, srcEnd), dstOff);
        }
    }
    /* implementation based on: https://github.com/mapbox/tiny-sdf */
    computeDistanceField(imageData, fontSize) {
        const dataLength = imageData.width * imageData.height;
        // temporary arrays for the distance transform
        const maxDimension = Math.max(imageData.width, imageData.height);
        const gridOuter = new Float64Array(dataLength);
        const gridInner = new Float64Array(dataLength);
        const f = new Float64Array(maxDimension);
        const z = new Float64Array(maxDimension + 1);
        const v = new Uint16Array(maxDimension);
        for (let i = 0; i < dataLength; ++i) {
            const a = imageData.data[i * 4 + 1] / 255; // alpha value from green channel
            gridOuter[i] = a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
            gridInner[i] = a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
        }
        this.edt(gridOuter, imageData.width, imageData.height, f, v, z);
        this.edt(gridInner, imageData.width, imageData.height, f, v, z);
        const radius = fontSize / 3;
        const data = imageData.data;
        for (let i = 0; i < dataLength; ++i) {
            const d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i]);
            const p = i * 4;
            const a = data[p + 3] / 255;
            // de-multiply the alpha
            const gray = Math.min(255, (data[p] + data[p + 2]) / a); // the sum between the red and blue channels
            data[p] = gray;
            data[p + 1] = gray;
            data[p + 2] = gray;
            data[p + 3] = Math.round(255 - 255 * (d / radius + 0.5));
        }
        return imageData;
    }
    // 2D Euclidean squared distance transform by Felzenszwalb & Huttenlocher https://cs.brown.edu/~pff/papers/dt-final.pdf
    edt(data, width, height, f, v, z) {
        for (let x = 0; x < width; ++x) {
            this.edt1d(data, x, width, height, f, v, z);
        }
        for (let y = 0; y < height; ++y) {
            this.edt1d(data, y * width, 1, width, f, v, z);
        }
    }
    // 1D squared distance transform
    edt1d(grid, offset, stride, length, f, v, z) {
        let q, k, s, r;
        v[0] = 0;
        z[0] = -INF;
        z[1] = INF;
        for (q = 0; q < length; ++q) {
            f[q] = grid[offset + q * stride];
        }
        for (q = 1, k = 0, s = 0; q < length; ++q) {
            do {
                r = v[k];
                s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
            } while (s <= z[k] && --k > -1);
            ++k;
            v[k] = q;
            z[k] = s;
            z[k + 1] = INF;
        }
        for (q = 0, k = 0; q < length; ++q) {
            while (z[k + 1] < q) {
                ++k;
            }
            r = v[k];
            grid[offset + q * stride] = f[r] + (q - r) * (q - r);
        }
    }
    testFeedback(context) {
        const program = context.createProgram(testVS$1, testFS, { transformFeedbackVaryings: ['vBox'], transformFeedbackMode: PicoGL.INTERLEAVED_ATTRIBS });
        const pointsTarget = context.createVertexBuffer(PicoGL.FLOAT, 4, 40);
        const pointsIndices = context.createVertexBuffer(PicoGL.UNSIGNED_BYTE, 1, new Uint8Array([
            0,
            1,
            2,
            3,
            4,
            5,
        ]));
        const transformFeedback = context.createTransformFeedback().feedbackBuffer(0, pointsTarget);
        const vertexArray = context.createVertexArray().vertexAttributeBuffer(0, pointsIndices);
        const drawCall = context.createDrawCall(program, vertexArray).transformFeedback(transformFeedback);
        drawCall.primitive(PicoGL.POINTS);
        drawCall.texture('uDataTexture', this._dataTexture);
        context.enable(PicoGL.RASTERIZER_DISCARD);
        drawCall.draw();
        context.disable(PicoGL.RASTERIZER_DISCARD);
        printDataGL(context, pointsTarget, 6, {
            box: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
        });
    }
}

const kLabelNodeMappings = Object.assign({}, kLabelMappings, {
    point: (entry, i) => 'point' in entry ? entry.point : i,
    color: (entry) => 'color' in entry ? entry.color : 0,
});
const kLabelNodeDataTypes = {
    point: PicoGL.UNSIGNED_INT,
    color: PicoGL.UNSIGNED_INT,
    label: PicoGL.UNSIGNED_INT,
};
const kGLLabelNodeTypes = {
    // TODO: maybe use points indices?
    position: [PicoGL.FLOAT, PicoGL.FLOAT, PicoGL.FLOAT],
    // TODO: maybe skip and use vertex indices when point radius is used.
    radius: PicoGL.FLOAT,
    // TODO: Create a color texture and use indices here.
    color: PicoGL.UNSIGNED_INT,
    box: PicoGL.UNSIGNED_INT,
};
var PointLabelPlacement;
(function (PointLabelPlacement) {
    PointLabelPlacement[PointLabelPlacement["CENTER"] = 0] = "CENTER";
    PointLabelPlacement[PointLabelPlacement["TOP"] = 1] = "TOP";
    PointLabelPlacement[PointLabelPlacement["BOTTOM"] = 2] = "BOTTOM";
    PointLabelPlacement[PointLabelPlacement["LEFT"] = 3] = "LEFT";
    PointLabelPlacement[PointLabelPlacement["RIGHT"] = 4] = "RIGHT";
})(PointLabelPlacement || (PointLabelPlacement = {}));
class PointLabel extends Nodes {
    constructor(...args) {
        super(...args);
        this._labelPlacement = PointLabelPlacement.CENTER;
    }
    get labelPlacement() {
        return this._labelPlacement;
    }
    set labelPlacement(value) {
        this._labelPlacement = value;
        switch (this._labelPlacement) {
            case PointLabelPlacement.CENTER:
                this.localUniforms.uLabelPlacement = [0, 0];
                break;
            case PointLabelPlacement.BOTTOM:
                this.localUniforms.uLabelPlacement = [0, -1];
                break;
            case PointLabelPlacement.TOP:
                this.localUniforms.uLabelPlacement = [0, 1];
                break;
            case PointLabelPlacement.LEFT:
                this.localUniforms.uLabelPlacement = [-1, 0];
                break;
            case PointLabelPlacement.RIGHT:
                this.localUniforms.uLabelPlacement = [1, 0];
                break;
        }
    }
    get visibilityThreshold() {
        return this.localUniforms.uVisibilityThreshold;
    }
    set visibilityThreshold(value) {
        this.localUniforms.uVisibilityThreshold = value;
    }
    initialize(context, points, data, mappings, pickingManager, labelAtlas) {
        if (labelAtlas) {
            this.labelAtlas = labelAtlas;
        }
        else {
            this.labelAtlas = new LabelAtlas(context, data, mappings);
        }
        super.initialize(context, points, data, mappings, pickingManager);
        this.verticesVBO = context.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]));
        this.nodesVAO = context.createVertexArray().vertexAttributeBuffer(0, this.verticesVBO);
        this.configureTargetVAO(this.nodesVAO);
        const shaders = this.getDrawShaders();
        this.program = context.createProgram(shaders.vs, shaders.fs);
        this.drawCall = context.createDrawCall(this.program, this.nodesVAO).primitive(PicoGL.TRIANGLE_STRIP);
        this.compute(context, {
            uGraphPoints: this.dataTexture,
        });
        this.localUniforms.uLabelBoxes = this.labelAtlas.dataTexture;
        this.localUniforms.uLabelTexture = this.labelAtlas.labelsTexture;
        this.localUniforms.uVisibilityThreshold = 15;
        this.localUniforms.uLabelPlacement = [0, 0];
    }
    destroy() {
        //
    }
    render(context, mode, uniforms) {
        context.depthRange(this.nearDepth, this.farDepth);
        switch (mode) {
            case RenderMode.DRAFT:
            case RenderMode.MEDIUM:
            case RenderMode.HIGH_PASS_1:
                context.disable(PicoGL.BLEND);
                context.depthMask(true);
                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.draw();
                break;
            case RenderMode.HIGH_PASS_2:
                context.enable(PicoGL.BLEND);
                // context.blendFuncSeparate(PicoGL.ONE, PicoGL.ONE_MINUS_SRC_ALPHA, PicoGL.ONE, PicoGL.ONE_MINUS_SRC_ALPHA);
                context.depthMask(false);
                // context.depthFunc(PicoGL.LEQUAL);
                setDrawCallUniforms(this.drawCall, uniforms);
                setDrawCallUniforms(this.drawCall, this.localUniforms);
                this.drawCall.draw();
                // context.depthFunc(PicoGL.LESS);
                break;
        }
    }
    getDrawShaders() {
        return {
            vs: nodeVS$1,
            fs: nodeFS$8,
        };
    }
    getGLSourceTypes() {
        return kLabelNodeDataTypes;
    }
    getGLTargetTypes() {
        return kGLLabelNodeTypes;
    }
    getDataShader() {
        return {
            vs: dataVS$5,
            varyings: ['vPosition', 'vRadius', 'vColor', 'vBox'],
        };
    }
    computeMappings(mappings) {
        const dataMappings = Object.assign({}, kLabelNodeMappings, super.computeMappings(mappings));
        const idMapping = dataMappings.id;
        dataMappings.label = (entry, i) => this.labelAtlas.labelMap.get(idMapping(entry, i));
        return dataMappings;
    }
}

var nodeVS$2 = "#version 300 es\nprecision lowp usampler2D;\n#define GLSLIFY 1\n#define M_PI 3.14159265359\n#define M_2PI 6.28318530718\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iPosition;layout(location=2)in float iRadius;layout(location=3)in uint iColor;layout(location=4)in uint iBox;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform sampler2D uColorPalette;uniform usampler2D uLabelBoxes;uniform sampler2D uLabelTexture;uniform float uVisibilityThreshold;uniform vec2 uLabelPositioning;uniform int uRepeatLabel;uniform float uRepeatGap;uniform float uPlacementMargin;uniform float uLabelPlacement;uniform vec2 uLabelDirection;flat out vec4 fColor;flat out vec2 fLabelSize;flat out float fPixelRadius;flat out vec4 fUV;flat out float fLabelStep;out vec2 vFromCenter;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}void main(){mat4 offsetMatrix=mat4(1.0);offsetMatrix[3]=vec4(iPosition,1.0);mat4 modelMatrix=uViewMatrix*uSceneMatrix*offsetMatrix;mat4 lookAtMatrix=mat4(modelMatrix);lookAtMatrix[0]=vec4(1.0,0.0,0.0,lookAtMatrix[0][3]);lookAtMatrix[1]=vec4(0.0,1.0,0.0,lookAtMatrix[1][3]);lookAtMatrix[2]=vec4(0.0,0.0,1.0,lookAtMatrix[2][3]);vec4 quadCenter=uProjectionMatrix*lookAtMatrix*vec4(0.0,0.0,0.0,1.0);vec2 screenQuadCenter=quadCenter.xy/quadCenter.w;vec4 quadSide=uProjectionMatrix*lookAtMatrix*vec4(iRadius,0.0,0.0,1.0);vec2 screenQuadSide=quadSide.xy/quadSide.w;float pixelRadius=length((screenQuadSide-screenQuadCenter)*uViewportSize*0.5);vec4 box=vec4(uvalueForIndex(uLabelBoxes,int(iBox)));float placementOffset=box[3]*uLabelPlacement+uPlacementMargin*(-1.0+2.0*uLabelPlacement)*uPixelRatio;fPixelRadius=pixelRadius+placementOffset;mat4 renderMatrix=uProjectionMatrix*lookAtMatrix;float visibilityMultiplier=pixelRadius>=uVisibilityThreshold*0.5*uPixelRatio ? 1.0 : 0.0;vec2 texSize=vec2(textureSize(uLabelTexture,0));fUV=vec4((box[0]/texSize.x),(box[1]/texSize.y),(box[2]/texSize.x),(box[3]/texSize.y));fLabelSize=vec2(box[2],box[3]);fColor=valueForIndex(uColorPalette,int(iColor));vFromCenter=aVertex.xy;float pixelLength=iRadius/pixelRadius;float textRadius=iRadius+pixelLength*placementOffset;vec3 labelOffset=vec3(0.0,0.0,0.01);vec4 worldVertex=renderMatrix*vec4(aVertex*textRadius*visibilityMultiplier+labelOffset,1.0);float repeatLabels=float(uint(uRepeatLabel));float repeatGap=uRepeatGap*uPixelRatio;float diameter=fPixelRadius*M_2PI;float maxLabels=min(repeatLabels,floor(diameter/(fLabelSize.x+repeatGap)));float maxLabelsLength=fLabelSize.x*maxLabels;float labelGap=(diameter-maxLabelsLength)/maxLabels;fLabelStep=fLabelSize.x+labelGap;gl_Position=worldVertex;}"; // eslint-disable-line

var nodeFS$9 = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define M_PI 3.14159265359\n#define M_2PI 6.28318530718\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform sampler2D uLabelTexture;uniform uint uRenderMode;uniform vec2 uLabelDirection;uniform bool uMirror;flat in vec4 fColor;flat in vec2 fLabelSize;flat in float fPixelRadius;flat in vec4 fUV;flat in float fLabelStep;in vec2 vFromCenter;out vec4 fragColor;float cross_ish(vec2 a,vec2 b){return a.x*b.y-a.y*b.x;}void main(){float fromCenter=length(vFromCenter);float halfLabelWidth=fLabelSize.x*0.5;float halfLabelHeight=fLabelSize.y*0.5;float normalizedHeight=halfLabelHeight/fPixelRadius;float circle=fromCenter-(1.0-normalizedHeight);float ring=opOnion(circle,normalizedHeight);vec2 positionVector=uLabelDirection;float angle=atan(cross_ish(vFromCenter,positionVector),dot(vFromCenter,positionVector));float angleDistance=angle*fPixelRadius;/**try to compesate for float precission issues by substracting 2 pixels on each side,tested on:nvidia-linux-1920 x 1080-no scalingnvidia-windows-1440 x 900-no scalingamd-macOS-2880 x 1800-retina scalingamd-windows-1920 x 1080-no scalingamd-linux-1920 x 1080-no scalingTODO: Find a way to do this(and the UV calculation below)using discrete math*/if(ring>0.0||fract((abs(angleDistance)+halfLabelWidth-2.0)/fLabelStep)>=(fLabelSize.x-4.0)/fLabelStep){discard;}float uProgress=fract((angleDistance+halfLabelWidth)/fLabelStep)/(fLabelSize.x/fLabelStep);float u;if(uMirror){u=fUV[0]+fUV[2]*(1.0-uProgress);}else{u=fUV[0]+fUV[2]*uProgress;}float height=(1.0-fromCenter)*fPixelRadius;float v;if(uMirror){v=fUV[1]+fUV[3]*(height/fLabelSize.y);}else{v=fUV[1]+fUV[3]*(1.0-height/fLabelSize.y);}vec4 texPixel=texture(uLabelTexture,vec2(u,v));float smoothing=4.0/fLabelSize.y;float distance=texPixel.a;float alpha=smoothstep(0.5-smoothing,0.5+smoothing,distance);float threshold=uRenderMode==MODE_HIGH_PASS_1 ? 0.75 : 0.5;if(uRenderMode!=MODE_HIGH_PASS_2){if(alpha<threshold){discard;}fragColor=vec4(texPixel.rgb*fColor.rgb,1.0);}else{if(texPixel.a==1.0){discard;}fragColor=vec4(texPixel.rgb*fColor.rgb,alpha);}}"; // eslint-disable-line

var CircularLabelPlacement;
(function (CircularLabelPlacement) {
    CircularLabelPlacement[CircularLabelPlacement["INSIDE"] = 0] = "INSIDE";
    CircularLabelPlacement[CircularLabelPlacement["OUTSIDE"] = 1] = "OUTSIDE";
})(CircularLabelPlacement || (CircularLabelPlacement = {}));
class CircularLabel extends PointLabel {
    get repeatLabel() {
        return this.localUniforms.uRepeatLabel;
    }
    set repeatLabel(value) {
        this.localUniforms.uRepeatLabel = value;
    }
    get repeatGap() {
        return this.localUniforms.uRepeatGap;
    }
    set repeatGap(value) {
        this.localUniforms.uRepeatGap = value;
    }
    get placementMargin() {
        return this.localUniforms.uPlacementMargin;
    }
    set placementMargin(value) {
        this.localUniforms.uPlacementMargin = value;
    }
    get mirror() {
        return this.localUniforms.uMirror;
    }
    set mirror(value) {
        this.localUniforms.uMirror = value;
    }
    get labelPlacement() {
        return this.localUniforms.uLabelPlacement;
    }
    set labelPlacement(value) {
        this.localUniforms.uLabelPlacement = value;
    }
    get labelDirection() {
        return this._labelDirection;
    }
    set labelDirection(value) {
        const rad = value * 0.0174533;
        this.localUniforms.uLabelDirection = [Math.cos(rad), Math.sin(rad)];
    }
    initialize(context, points, data, mappings, pickingManager, labelAtlas) {
        super.initialize(context, points, data, mappings, pickingManager, labelAtlas);
        this.localUniforms.uRepeatLabel = -1;
        this.localUniforms.uRepeatGap = 5;
        this.localUniforms.uPlacementMargin = 0;
        this.localUniforms.uMirror = false;
        this.localUniforms.uLabelPlacement = CircularLabelPlacement.OUTSIDE;
        this.labelDirection = 90;
    }
    getDrawShaders() {
        return {
            vs: nodeVS$2,
            fs: nodeFS$9,
        };
    }
}

var nodeVS$3 = "#version 300 es\nprecision lowp usampler2D;\n#define GLSLIFY 1\n#define M_PI 3.14159265359\n#define M_2PI 6.28318530718\nlayout(location=0)in vec3 aVertex;layout(location=1)in vec3 iPosition;layout(location=2)in float iRadius;layout(location=3)in uint iColor;layout(location=4)in uint iBox;uniform mat4 uViewMatrix;uniform mat4 uSceneMatrix;uniform mat4 uProjectionMatrix;uniform vec2 uViewportSize;uniform float uPixelRatio;uniform sampler2D uColorPalette;uniform usampler2D uLabelBoxes;uniform sampler2D uLabelTexture;uniform float uVisibilityThreshold;uniform vec2 uLabelPositioning;uniform int uRepeatLabel;uniform float uRepeatGap;uniform float uPlacementMargin;uniform float uLabelPlacement;uniform vec2 uLabelDirection;flat out vec4 fColor;flat out vec3 fContrastColor;flat out vec2 fLabelSize;flat out float fPixelRadius;flat out float fPixelLength;flat out float fThickness;flat out vec4 fUV;flat out float fLabelStep;out vec2 vFromCenter;vec4 valueForIndex(sampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}uvec4 uvalueForIndex(usampler2D tex,int index){int texWidth=textureSize(tex,0).x;int col=index % texWidth;int row=index/texWidth;return texelFetch(tex,ivec2(col,row),0);}float luminance_x(float x){return x<=0.04045 ? x/12.92 : pow((x+0.055)/1.055,2.4);}float color_l(float l){return min(1.0,max(0.0,l<=0.0031308 ? l*12.92 : pow(l*1.055,1.0/2.4)-0.055));}float rgb2luminance(vec3 color){float r=luminance_x(color.r);float g=luminance_x(color.g);float b=luminance_x(color.b);return 0.2126*r+0.7152*g+0.0722*b;}vec3 setLuminance(vec3 color,float luminance){float r=luminance_x(color.r)*0.2126;float g=luminance_x(color.g)*0.7152;float b=luminance_x(color.b)*0.0722;float colorLuminance=r+g+b;float tr=luminance*(r/colorLuminance);float tg=luminance*(g/colorLuminance);float tb=luminance*(b/colorLuminance);float rr=color_l(tr/0.2126);float rg=color_l(tg/0.7152);float rb=color_l(tb/0.0722);return vec3(rr,rg,rb);}float findDarker(float luminance,float contrast){return(contrast*luminance)+(0.05*contrast)-0.05;}float findLighter(float luminance,float contrast){return(luminance+0.05-(0.05*contrast))/contrast;}vec3 contrastingColor(vec3 color,float contrast){float luminance=rgb2luminance(color);float darker=findDarker(luminance,contrast);float lighter=findLighter(luminance,contrast);float targetLuminance;if(darker<0.0||darker>1.0){targetLuminance=lighter;}else if(lighter<0.0||lighter>1.0){targetLuminance=darker;}else{targetLuminance=abs(luminance-lighter)<abs(darker-luminance)? lighter : darker;}return setLuminance(color,targetLuminance);}void main(){mat4 offsetMatrix=mat4(1.0);offsetMatrix[3]=vec4(iPosition,1.0);mat4 modelMatrix=uViewMatrix*uSceneMatrix*offsetMatrix;mat4 lookAtMatrix=mat4(modelMatrix);lookAtMatrix[0]=vec4(1.0,0.0,0.0,lookAtMatrix[0][3]);lookAtMatrix[1]=vec4(0.0,1.0,0.0,lookAtMatrix[1][3]);lookAtMatrix[2]=vec4(0.0,0.0,1.0,lookAtMatrix[2][3]);vec4 quadCenter=uProjectionMatrix*lookAtMatrix*vec4(0.0,0.0,0.0,1.0);vec2 screenQuadCenter=quadCenter.xy/quadCenter.w;vec4 quadSide=uProjectionMatrix*lookAtMatrix*vec4(iRadius,0.0,0.0,1.0);vec2 screenQuadSide=quadSide.xy/quadSide.w;float pixelRadius=length((screenQuadSide-screenQuadCenter)*uViewportSize*0.5);vec4 box=vec4(uvalueForIndex(uLabelBoxes,int(iBox)));float visibilityThreshold=uVisibilityThreshold*uPixelRatio;float visibilityMultiplier=smoothstep(visibilityThreshold*0.5-box[3],visibilityThreshold*0.5,pixelRadius*0.5);float minThickness=max(2.0,min(pixelRadius*0.1,3.0*uPixelRatio));fThickness=(minThickness+(box[3]-minThickness)*visibilityMultiplier)*0.5;fPixelRadius=pixelRadius+fThickness;fPixelLength=1.0/fPixelRadius;mat4 renderMatrix=uProjectionMatrix*lookAtMatrix;vec2 texSize=vec2(textureSize(uLabelTexture,0));fUV=vec4((box[0]/texSize.x),(box[1]/texSize.y),(box[2]/texSize.x),(box[3]/texSize.y));fLabelSize=vec2(box[2],box[3]);fColor=valueForIndex(uColorPalette,int(iColor));fContrastColor=contrastingColor(fColor.rgb,7.0);vFromCenter=aVertex.xy;float pixelLength=iRadius/pixelRadius;float textRadius=iRadius+pixelLength*fThickness;vec4 worldVertex=renderMatrix*vec4(aVertex*textRadius,1.0);float repeatLabels=float(uint(uRepeatLabel));float repeatGap=uRepeatGap*uPixelRatio;float circumference=fPixelRadius*M_2PI;float maxLabels=min(repeatLabels,floor(circumference/(fLabelSize.x+repeatGap)));float maxLabelsLength=fLabelSize.x*maxLabels;float labelGap=(circumference-maxLabelsLength)/maxLabels;fLabelStep=fLabelSize.x+labelGap;gl_Position=worldVertex;}"; // eslint-disable-line

var nodeFS$a = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\n#define M_PI 3.14159265359\n#define M_2PI 6.28318530718\n#define MODE_DRAFT 0u\n#define MODE_MEDIUM 1u\n#define MODE_HIGH_PASS_1 2u\n#define MODE_HIGH_PASS_2 3u\n#define MODE_PICKING 4u\nfloat opRound(in float d,in float r){return d-r;}float opOnion(in float d,in float r){return abs(d)-r;}float sdCircle(in vec2 p,in float r){return length(p)-r;}float sdEquilateralTriangle(in vec2 p,in float r){const float k=sqrt(3.0);p.x=abs(p.x)-r;p.y=p.y+(r)/k;if(p.x+k*p.y>0.0){p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;}p.x-=clamp(p.x,-2.0*r,0.0);return-length(p)*sign(p.y);}float sdPentagon(in vec2 p,in float r){const vec3 k=vec3(0.809016994,0.587785252,0.726542528);p.y=-(p.y)*1.25;p.x=abs(p.x)*1.25;p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=vec2(clamp(p.x,-r*k.z,r*k.z),r);return length(p)*sign(p.y);}float sdOctagon(in vec2 p,in float r){const vec3 k=vec3(-0.9238795325,0.3826834323,0.4142135623);p=abs(p)*1.1;p-=2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y);p-=2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y);p-=vec2(clamp(p.x,-k.z*r,k.z*r),r);return length(p)*sign(p.y);}float sdStar(in vec2 p,in float r,in uint n,in float m){float an=3.141593/float(n);float en=3.141593/m;vec2 acs=vec2(cos(an),sin(an));vec2 ecs=vec2(cos(en),sin(en));float bn=mod(atan(p.x,p.y),2.0*an)-an;p=length(p)*vec2(cos(bn),abs(sin(bn)));p-=r*acs;p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);return length(p)*sign(p.x);}float sdCross(in vec2 p,in float w,in float r){p=abs(p);return length(p-min(p.x+p.y,w)*0.5)-r;}float sdPlus(in vec2 p,in vec2 b,float r){p=abs(p);p=(p.y>p.x)? p.yx : p.xy;vec2 q=p-b;float k=max(q.y,q.x);vec2 w=(k>0.0)? q : vec2(b.y-p.x,-k);return sign(k)*length(max(w,0.0))+r;}uniform float uPixelRatio;uniform sampler2D uLabelTexture;uniform uint uRenderMode;uniform vec2 uLabelDirection;uniform bool uMirror;flat in vec4 fColor;flat in vec3 fContrastColor;flat in vec2 fLabelSize;flat in float fPixelRadius;flat in float fPixelLength;flat in float fThickness;flat in vec4 fUV;flat in float fLabelStep;in vec2 vFromCenter;out vec4 fragColor;float cross_ish(vec2 a,vec2 b){return a.x*b.y-a.y*b.x;}void main(){float fromCenter=length(vFromCenter);float thickness=fThickness*fPixelLength;float antialias=min(thickness,fPixelLength*1.5);float radius=1.0-thickness;float circle=fromCenter-(1.0-thickness);float ring=opOnion(circle,thickness);float modeDistance=uRenderMode==MODE_HIGH_PASS_1 ?-antialias :-antialias*0.5;float ringThreshold=uRenderMode==MODE_HIGH_PASS_2 ? 0.0 : modeDistance;if(ring>ringThreshold){discard;}float halfLabelWidth=fLabelSize.x*0.5;float halfLabelHeight=fLabelSize.y*0.5;float normalizedHeight=halfLabelHeight/fPixelRadius;vec2 positionVector=uLabelDirection;float angle=atan(cross_ish(vFromCenter,positionVector),dot(vFromCenter,positionVector));float angleDistance=angle*fPixelRadius;float uProgress=min(1.0,max(0.0,fract((angleDistance+halfLabelWidth)/fLabelStep)/(fLabelSize.x/fLabelStep)));float u;if(uMirror){u=fUV[0]+fUV[2]*(1.0-uProgress);}else{u=fUV[0]+fUV[2]*min(1.0,max(0.0,uProgress));}float height=(1.0-fromCenter)*fPixelRadius;float v;if(uMirror){v=fUV[1]+fUV[3]*(height/fLabelSize.y);}else{v=fUV[1]+fUV[3]*(1.0-height/fLabelSize.y);}vec4 texPixel=texture(uLabelTexture,vec2(u,v));float smoothing=4.0/fLabelSize.y;float distance=texPixel.a;float labelMix=smoothstep(0.5-smoothing,0.5+smoothing,distance);float heightMultiplier=pow((fThickness*2.0)/fLabelSize.y,3.0);vec3 color=mix(fColor.rgb,fContrastColor,labelMix*heightMultiplier);if(uRenderMode==MODE_HIGH_PASS_2){if(ring<-antialias){discard;}fragColor=vec4(color,smoothstep(0.0,antialias,abs(ring)));}else{fragColor=vec4(color,1.0);}}"; // eslint-disable-line

class RingLabel extends CircularLabel {
    getDrawShaders() {
        return {
            vs: nodeVS$3,
            fs: nodeFS$a,
        };
    }
}

const types$2 = {
    PointLabel,
    CircularLabel,
    RingLabel,
};

class Layer extends EventEmitter {
    constructor(nodes, edges, labels, name = 'Layer') {
        super();
        this._nearDepth = 0.0;
        this._farDepth = 1.0;
        this._nodesNearDepth = 0;
        this._nodesFarDepth = 1;
        this._edgesNearDepth = 0;
        this._edgesFarDepth = 1;
        this._labelsNearDepth = 0;
        this._labelsFarDepth = 1;
        this.enabled = true;
        this._nodes = nodes;
        this._edges = edges;
        this._labels = labels;
        this.name = name;
        if (this._nodes) {
            this._nodes.on(EventEmitter.omniEvent, (event, id) => {
                this.emit(event, {
                    layer: this.name,
                    type: 'node',
                    id,
                });
            });
        }
        if (this._edges) {
            this._edges.on(EventEmitter.omniEvent, (event, id) => {
                this.emit(event, {
                    layer: this.name,
                    type: 'edge',
                    id,
                });
            });
        }
    }
    get nodes() {
        return this._nodes;
    }
    get edges() {
        return this._edges;
    }
    get labels() {
        return this._labels;
    }
    get nearDepth() {
        return this._nearDepth;
    }
    set nearDepth(value) {
        this._nearDepth = value;
        this.updateLabelsDepths();
        this.updateNodesDepths();
        this.updateEdgesDepths();
    }
    get farDepth() {
        return this._farDepth;
    }
    set farDepth(value) {
        this._farDepth = value;
        this.updateLabelsDepths();
        this.updateNodesDepths();
        this.updateEdgesDepths();
    }
    get nodesNearDepth() {
        return this._nodesNearDepth;
    }
    set nodesNearDepth(value) {
        this._nodesNearDepth = value;
        this.updateNodesDepths();
    }
    get nodesFarDepth() {
        return this._nodesFarDepth;
    }
    set nodesFarDepth(value) {
        this._nodesFarDepth = value;
        this.updateNodesDepths();
    }
    get edgesNearDepth() {
        return this._edgesNearDepth;
    }
    set edgesNearDepth(value) {
        this._edgesNearDepth = value;
        this.updateEdgesDepths();
    }
    get edgesFarDepth() {
        return this._edgesFarDepth;
    }
    set edgesFarDepth(value) {
        this._edgesFarDepth = value;
        this.updateEdgesDepths();
    }
    get labelsNearDepth() {
        return this._labelsNearDepth;
    }
    set labelsNearDepth(value) {
        this._labelsNearDepth = value;
        this.updateLabelsDepths();
    }
    get labelsFarDepth() {
        return this._labelsFarDepth;
    }
    set labelsFarDepth(value) {
        this._labelsFarDepth = value;
        this.updateLabelsDepths();
    }
    render(context, mode, uniforms) {
        this.renderLabels(context, mode, uniforms);
        this.renderNodes(context, mode, uniforms);
        this.renderEdges(context, mode, uniforms);
    }
    renderNodes(context, mode, uniforms) {
        if (this._nodes && this._nodes.enabled) {
            this._nodes.render(context, mode, uniforms);
        }
    }
    renderEdges(context, mode, uniforms) {
        if (this._edges && this._edges.enabled) {
            this._edges.render(context, mode, uniforms);
        }
    }
    renderLabels(context, mode, uniforms) {
        if (this._labels && this.labels.enabled) {
            this._labels.render(context, mode, uniforms);
        }
    }
    updateLabelsDepths() {
        if (this._labels) {
            const depthRange = this._farDepth - this._nearDepth;
            this._labels.nearDepth = this._nearDepth + depthRange * this._labelsNearDepth;
            this._labels.farDepth = this._nearDepth + depthRange * this._labelsFarDepth;
        }
    }
    updateNodesDepths() {
        if (this._nodes) {
            const depthRange = this._farDepth - this._nearDepth;
            this._nodes.nearDepth = this._nearDepth + depthRange * this._nodesNearDepth;
            this._nodes.farDepth = this._nearDepth + depthRange * this._nodesFarDepth;
        }
    }
    updateEdgesDepths() {
        if (this._edges) {
            const depthRange = this._farDepth - this._nearDepth;
            this._edges.nearDepth = this._nearDepth + depthRange * this._edgesNearDepth;
            this._edges.farDepth = this._nearDepth + depthRange * this._edgesFarDepth;
        }
    }
}

class DragModule extends UXModule {
    constructor(viewport, enabled = false) {
        super();
        this.button = 'primary';
        this.boundHandler = this.handleMouse.bind(this);
        this.viewport = viewport;
        this.enabled = enabled;
    }
    hookEvents() {
        this.viewport.mouseHandler.on(MouseHandler.events.move, this.boundHandler);
    }
    unhookEvents() {
        this.viewport.mouseHandler.off(MouseHandler.events.move, this.boundHandler);
    }
}

class DragTruck extends DragModule {
    handleMouse(event, state, delta) {
        if (state.buttons[this.button]) {
            const position = this.viewport.camera.position;
            const rotated = transformQuat(create(), position, this.viewport.camera.rotation);
            const distance = Math.abs(rotated[2]); // vec3.length(position); // use the rotated z distance instead
            const vertical = this.viewport.camera.aovRad * distance; // good enough approximation
            const pixelToWorld = vertical / this.viewport.rect.height;
            const delta3 = fromValues(delta[0] * pixelToWorld, delta[1] * -pixelToWorld, 0);
            const inverse = invert(create$1(), this.viewport.camera.rotation);
            transformQuat(delta3, delta3, inverse);
            add(position, position, delta3);
            this.viewport.camera.position = position;
            this.viewport.render();
        }
    }
}

class DragRotation extends DragModule {
    constructor() {
        super(...arguments);
        this.button = 'secondary';
    }
    handleMouse(event, state, delta) {
        if (state.buttons[this.button]) {
            const side = Math.min(this.viewport.size[0], this.viewport.size[1]);
            const rawRotation = fromEuler(create$1(), (delta[1] / side) * 90, (delta[0] / side) * 90, 0);
            const camInverse = invert(create$1(), this.viewport.camera.rotation);
            const rotation = mul(create$1(), camInverse, rawRotation);
            mul(rotation, rotation, this.viewport.camera.rotation);
            this.viewport.graph.rotate(rotation);
            this.viewport.render();
        }
    }
}

class ScrollModule extends UXModule {
    constructor(viewport, enabled = false) {
        super();
        this.speed = 4.5;
        this.boundHandler = this.handleMouse.bind(this);
        this.viewport = viewport;
        this.enabled = enabled;
    }
    hookEvents() {
        this.viewport.mouseHandler.on(MouseHandler.events.wheel, this.boundHandler);
    }
    unhookEvents() {
        this.viewport.mouseHandler.off(MouseHandler.events.wheel, this.boundHandler);
    }
}

class ScrollDolly extends ScrollModule {
    handleMouse(event, state, delta) {
        const invProjection = invert$1(create$2(), this.viewport.camera.projectionMatrix);
        const invView = invert$1(create$2(), this.viewport.camera.viewMatrix);
        const viewportCoords = fromValues$1(state.canvasCoords[0] * this.viewport.pixelRatio, state.canvasCoords[1] * this.viewport.pixelRatio);
        const worldCoords = fromValues$1((2.0 * viewportCoords[0]) / this.viewport.size[0] - 1.0, 1.0 - (2.0 * viewportCoords[1]) / this.viewport.size[1]);
        const rayClip = fromValues$2(worldCoords[0], worldCoords[1], -1, 1);
        const rayEye = transformMat4(create$4(), rayClip, invProjection);
        rayEye[2] = -1.0;
        rayEye[3] = 0.0;
        const rayWorld4 = transformMat4(create$4(), rayEye, invView);
        const rayWorld = fromValues(rayWorld4[0], rayWorld4[1], rayWorld4[2]);
        normalize(rayWorld, rayWorld);
        const position = this.viewport.camera.position;
        const zMult = position[2] / rayWorld[2];
        const rayZeroZ = fromValues(position[0] + rayWorld[0] * zMult, position[1] + rayWorld[1] * zMult, 0.0);
        const distance$1 = Math.max(100.0, distance(position, rayZeroZ));
        const speed = this.speed * (distance$1 / 100.0);
        scaleAndAdd(position, position, rayWorld, delta * speed);
        this.viewport.camera.position = position;
        this.viewport.render();
    }
}

class DragPan extends DragModule {
    handleMouse(event, state, delta) {
        if (state.buttons[this.button]) {
            const aspect = this.viewport.size[0] / this.viewport.size[1];
            const aov = this.viewport.camera.aov;
            const rotationX = -aov * (delta[1] / this.viewport.rect.height);
            const rotationY = -aov * (delta[0] / this.viewport.rect.width) * aspect;
            const r = fromEuler(create$1(), rotationX, rotationY, 0);
            this.viewport.camera.rotate(r);
            this.viewport.render();
        }
    }
}

class GraferController extends EventEmitter {
    constructor(canvas, data) {
        super();
        this._viewport = new Viewport(canvas);
        this._generateIdPrev = 0;
        const dolly = new ScrollDolly(this._viewport);
        dolly.enabled = true;
        const truck = new DragTruck(this._viewport);
        truck.button = 'primary';
        truck.enabled = true;
        const rotation = new DragRotation(this._viewport);
        rotation.button = 'secondary';
        rotation.enabled = true;
        const pan = new DragPan(this._viewport);
        pan.button = 'auxiliary';
        pan.enabled = true;
        if (data) {
            this.loadData(data);
        }
    }
    get viewport() {
        return this._viewport;
    }
    get context() {
        return this.viewport.context;
    }
    get hasColors() {
        return this._hasColors;
    }
    generateId() {
        return this._generateIdPrev++;
    }
    loadData(data) {
        const pointsRadiusMapping = { radius: (entry) => 'radius' in entry ? entry.radius : 1.0 };
        this.loadColors(data);
        this.loadPoints(data, pointsRadiusMapping);
        this.loadLayers(data, pointsRadiusMapping);
        if (this._viewport.graph) {
            this._viewport.camera.position = [0, 0, -this._viewport.graph.bbCornerLength * 2];
            this._viewport.camera.farPlane = Math.max(this._viewport.graph.bbCornerLength * 4, 1000);
            this._viewport.render();
        }
    }
    render() {
        if (this._viewport.graph) {
            this._viewport.render();
        }
        else {
            throw new Error('No graph found.');
        }
    }
    concatenateNodesFromLayers(data) {
        const nodes = [];
        const layers = data.layers;
        for (let i = 0, n = layers.length; i < n; ++i) {
            const data = layers[i].nodes?.data ?? layers[i].labels?.data;
            for (let ii = 0, nn = data.length; ii < nn; ++ii) {
                data[ii].point = this.generateId();
            }
            nodes.push(layers[i].nodes.data);
        }
        return nodes;
    }
    loadLayers(data, pointsRadiusMapping) {
        if (data.layers && data.layers.length) {
            const layers = data.layers;
            this._hasColors = Boolean(data.colors);
            if (!Boolean(this._viewport.graph)) {
                const nodes = this.concatenateNodesFromLayers(data);
                this._viewport.graph = Graph.createGraphFromNodes(this.context, nodes, pointsRadiusMapping);
                this._viewport.graph.picking = new PickingManager(this._viewport.context, this._viewport.mouseHandler);
            }
            for (let i = 0, n = layers.length; i < n; ++i) {
                const name = layers[i].name || `Layer_${i}`;
                this.addLayer(layers[i], name, this.hasColors);
            }
        }
    }
    addLayer(layer, name, useColors) {
        if (useColors && !this.hasColors) {
            throw new Error('No colors found.');
        }
        useColors = useColors ?? this.hasColors;
        const hasPoints = Boolean(this._viewport.graph);
        const graph = this._viewport.graph;
        const nodesData = layer.nodes;
        const nodes = this.addNodes(nodesData, useColors);
        const edgesData = layer.edges;
        if (edgesData && !nodes && !hasPoints) {
            throw new Error('Cannot load an edge-only layer in a graph without points!');
        }
        const edges = this.addEdges(edgesData, nodes, useColors);
        const layersData = layer.labels;
        const labels = this.addLabels(layersData, useColors);
        if (nodes || edges || labels) {
            const layer = new Layer(nodes, edges, labels, name);
            graph.layers.unshift(layer);
            layer.on(EventEmitter.omniEvent, (...args) => this.emit(...args));
        }
    }
    removeLayerByName(name) {
        const { layers } = this._viewport.graph;
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.name === name) {
                this.removeLayerByIndex(i);
                i--;
            }
        }
    }
    removeLayerByIndex(index) {
        const { layers } = this._viewport.graph;
        if (index >= 0 && index < layers.length) {
            layers.splice(index, 1);
        }
    }
    addLabels(labelsData, hasColors) {
        const pickingManager = this._viewport.graph.picking;
        const context = this.context;
        const graph = this._viewport.graph;
        let labels = null;
        if (labelsData) {
            const labelsType = labelsData.type ? labelsData.type : 'PointLabel';
            const LabelsClass = types$2[labelsType] || PointLabel;
            const labelsMappings = Object.assign({}, LabelsClass.defaultMappings, labelsData.mappings);
            if (!hasColors) {
                const colorMapping = labelsMappings.color;
                labelsMappings.color = (entry, i) => {
                    const value = colorMapping(entry, i);
                    if (typeof value !== 'number') {
                        return this._viewport.colorRegisrty.registerColor(value);
                    }
                    return value;
                };
            }
            labels = new LabelsClass(context, graph, labelsData.data, labelsMappings, pickingManager);
            if ('options' in labelsData) {
                const options = labelsData.options;
                const keys = Object.keys(options);
                for (const key of keys) {
                    if (key in labels) {
                        labels[key] = options[key];
                    }
                }
            }
        }
        return labels;
    }
    addEdges(edgesData, nodes, hasColors) {
        const pickingManager = this._viewport.graph.picking;
        const context = this.context;
        const graph = this._viewport.graph;
        const hasPoints = Boolean(this._viewport.graph);
        let edges = null;
        if (edgesData) {
            const edgesType = edgesData.type ? edgesData.type : 'Straight';
            const EdgesClass = types$1[edgesType] || Straight;
            const edgesMappings = Object.assign({}, EdgesClass.defaultMappings, edgesData.mappings);
            if (!hasPoints) {
                const sourceMapping = edgesMappings.source;
                edgesMappings.source = (entry, i) => {
                    return nodes.getEntryPointID(sourceMapping(entry, i));
                };
                const targetMapping = edgesMappings.target;
                edgesMappings.target = (entry, i) => {
                    return nodes.getEntryPointID(targetMapping(entry, i));
                };
            }
            if (!hasColors) {
                const sourceColorMapping = edgesMappings.sourceColor;
                edgesMappings.sourceColor = (entry, i) => {
                    const value = sourceColorMapping(entry, i);
                    if (typeof value !== 'number') {
                        return this._viewport.colorRegisrty.registerColor(value);
                    }
                    return value;
                };
                const targetColorMapping = edgesMappings.targetColor;
                edgesMappings.targetColor = (entry, i) => {
                    const value = targetColorMapping(entry, i);
                    if (typeof value !== 'number') {
                        return this._viewport.colorRegisrty.registerColor(value);
                    }
                    return value;
                };
            }
            edges = new EdgesClass(context, graph, edgesData.data, edgesMappings, pickingManager);
            if ('options' in edgesData) {
                const options = edgesData.options;
                const keys = Object.keys(options);
                for (const key of keys) {
                    if (key in edges) {
                        edges[key] = options[key];
                    }
                }
            }
        }
        return edges;
    }
    addNodes(nodesData, hasColors) {
        const pickingManager = this._viewport.graph.picking;
        const context = this.context;
        const graph = this._viewport.graph;
        let nodes = null;
        if (nodesData) {
            const nodesType = nodesData.type ? nodesData.type : 'Circle';
            const NodesClass = types[nodesType] || Circle;
            const nodesMappings = Object.assign({}, NodesClass.defaultMappings, nodesData.mappings);
            if (!hasColors) {
                const colorMapping = nodesMappings.color;
                nodesMappings.color = (entry, i) => {
                    const value = colorMapping(entry, i);
                    if (typeof value !== 'number') {
                        return this._viewport.colorRegisrty.registerColor(value);
                    }
                    return value;
                };
            }
            nodes = new NodesClass(context, graph, nodesData.data, nodesMappings, pickingManager);
            if ('options' in nodesData) {
                const options = nodesData.options;
                const keys = Object.keys(options);
                for (const key of keys) {
                    if (key in nodes) {
                        nodes[key] = options[key];
                    }
                }
            }
        }
        return nodes;
    }
    loadPoints(data, pointsRadiusMapping) {
        if (data.points) {
            const mappings = Object.assign({}, pointsRadiusMapping, data.points.mappings);
            this._viewport.graph = new Graph(this._viewport.context, data.points.data, mappings);
            this._viewport.graph.picking = new PickingManager(this._viewport.context, this._viewport.mouseHandler);
        }
    }
    loadColors(data) {
        if (data.colors) {
            const colors = data.colors;
            const colorRegisrty = this._viewport.colorRegisrty;
            for (let i = 0, n = colors.length; i < n; ++i) {
                colorRegisrty.registerColor(colors[i]);
            }
        }
        else {
            // add at least one color in case the data does not have colors either
            this._viewport.colorRegisrty.registerColor('#d8dee9');
        }
    }
}

export { DragTruck as D, GraferController as G, PointLabelPlacement as P, ScrollDolly as S, Gravity as a, DragRotation as b, DragPan as c, PickingManager as d, kButton2Index as k };
//# sourceMappingURL=GraferController.js.map
