#version 300 es
precision highp float;

flat in vec4 fColor;
flat in float fPixelRadius;
in vec2 vPixelLocation;

out vec4 fragColor;

void main() {
    float fromCenter = length(vPixelLocation);
    if (fromCenter > fPixelRadius) {
        discard;
    }
    fragColor = fColor;
}
