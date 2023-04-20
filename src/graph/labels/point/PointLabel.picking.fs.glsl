#version 300 es
precision highp float;

uniform float uPixelRatio;
uniform float uPadding;
uniform bool uBackground;


flat in vec4 fPickingColor;
flat in vec4 fLabelInfo;
in vec2 vPixelCoords;

out vec4 fragColor;

void main() {
    float padding = uPadding * uPixelRatio;

    if (!uBackground && (vPixelCoords.x < padding || vPixelCoords.y < padding || vPixelCoords.x > fLabelInfo[2] + padding || vPixelCoords.y > fLabelInfo[3] + padding)) {
        discard;
    } else {
        fragColor = fPickingColor;
    }
}
