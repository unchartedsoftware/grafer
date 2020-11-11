#version 300 es
precision highp float;

uniform float uPixelRatio;

flat in vec4 fColor;
flat in float fPixelRadius;
in vec2 vPixelLocation;

out vec4 fragColor;

void main() {
    float solidRadius = fPixelRadius;
    float fromCenter = length(vPixelLocation);
    float outlineRadius = fPixelRadius - max(1.0, min(4.0 * uPixelRatio, floor(fPixelRadius * 0.4)));

    if (fromCenter > solidRadius || fromCenter < outlineRadius) {
        discard;
    }
    fragColor = vec4(fColor.rgb, 1.0);
}
