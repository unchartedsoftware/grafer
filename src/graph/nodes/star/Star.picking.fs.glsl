#version 300 es
precision highp float;

#pragma glslify: import(../shaders/shapes.glsl)

uniform uint uSides;
uniform float uAngleDivisor;

flat in vec4 fColor;
flat in float fPixelLength;
in vec2 vFromCenter;

out vec4 fragColor;

void main() {
    float sd = sdStar(vFromCenter, 1.0, uSides, uAngleDivisor);
    if (sd > 0.0) {
        discard;
    }
    fragColor = fColor;
}
