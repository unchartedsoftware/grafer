#version 300 es
precision highp float;
precision lowp usampler2D;

#pragma glslify: import(../../nodes/shaders/shapes.glsl)

uniform float uPixelRatio;
uniform float uPadding;

flat in vec4 fPickingColor;
flat in float fPixelLength;
flat in float fThickness;
in vec2 vFromCenter;

out vec4 fragColor;

float cross_ish(vec2 a, vec2 b)
{
    return a.x * b.y - a.y * b.x;
}

void main() {
    float padding = uPadding * uPixelRatio;
    float fromCenter = length(vFromCenter);
    float thickness = fThickness * fPixelLength;
    float radius = 1.0 - thickness;
    float circle = fromCenter - (1.0 - thickness);
    float ring = opOnion(circle, thickness);

    if (ring > 0.0) {
        discard;
    }

    fragColor = fPickingColor;
}
