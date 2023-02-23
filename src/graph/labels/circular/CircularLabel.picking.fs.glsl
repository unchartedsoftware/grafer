#version 300 es
precision highp float;

#pragma glslify: import(../../nodes/shaders/shapes.glsl)

uniform float uPixelRatio;
uniform vec2 uLabelDirection;
uniform float uPadding;
uniform bool uBackground;

flat in vec4 fPickingColor;
flat in float fPixelRadius;
flat in float fLabelStep;
flat in vec4 fLabelInfo;
in vec2 vFromCenter;

out vec4 fragColor;

float cross_ish(vec2 a, vec2 b)
{
    return a.x * b.y - a.y * b.x;
}

void main() {
    float padding = uPadding * uPixelRatio;
    float fromCenter = length(vFromCenter);
    float halfLabelWidth = fLabelInfo[2] * 0.5;
    float halfLabelHeight = fLabelInfo[3] * 0.5;
    float normalizedHeight = (halfLabelHeight + padding) / fPixelRadius;
    float circle = fromCenter - (1.0 - normalizedHeight);
    float ring = opOnion(circle, normalizedHeight);

    vec2 positionVector = uLabelDirection;
    float angle = atan(cross_ish(vFromCenter, positionVector), dot(vFromCenter, positionVector));
    float angleDistance = angle * fPixelRadius;
    float paddedLabelWidth = fLabelInfo[2] + padding * 2.0;
    float offsetAngleDistance = angleDistance + halfLabelWidth + padding;

    if (ring > 0.0 || fract(offsetAngleDistance / fLabelStep) >= paddedLabelWidth / fLabelStep) {
        discard;
    }

    float width = fract(offsetAngleDistance / fLabelStep) * fLabelStep;
    float height = (1.0 - fromCenter) * fPixelRadius - padding;

    if (!uBackground && (height < 0.0 || height > fLabelInfo[3] || width < padding || width > fLabelInfo[2] + padding)) {
            discard;
    } else {
        fragColor = fPickingColor;
    }
}
