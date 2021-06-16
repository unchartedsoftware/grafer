#version 300 es
precision highp float;

flat in vec4 fColor;
flat in float fPixelLength;
in vec2 vFromCenter;

out vec4 fragColor;

void main() {
    float fromCenter = length(vFromCenter);
    if (fromCenter > 1.0) {
        discard;
    }
    fragColor = fColor;
}
