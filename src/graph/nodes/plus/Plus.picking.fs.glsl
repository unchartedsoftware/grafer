#version 300 es
precision highp float;

#pragma glslify: import(../shaders/shapes.glsl)

flat in vec4 fColor;
flat in float fPixelLength;
in vec2 vFromCenter;

out vec4 fragColor;

void main() {
    float sd = sdPlus(vFromCenter, vec2(1.0, 0.3), 0.0);
    if (sd > 0.0) {
        discard;
    }
    fragColor = fColor;
}
