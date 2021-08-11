#version 300 es
precision highp float;

#pragma glslify: import(../../../renderer/shaders/outputColor.glsl)
#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#pragma glslify: import(../shaders/shapes.glsl)

uniform float uPixelRatio;
uniform uint uRenderMode;
uniform float uOutline;

flat in vec4 fColor;
flat in float fPixelLength;
in vec2 vFromCenter;

out vec4 fragColor;

void main() {
    float thickness = max(fPixelLength, min(0.1, fPixelLength * uOutline * uPixelRatio));
    float antialias = min(thickness, fPixelLength * 1.5);
    float radius = 1.0 - thickness;
    float ring = opOnion(sdCircle(vFromCenter, radius), thickness);
    float modeDistance = uRenderMode == MODE_HIGH_PASS_1 ? -antialias : -antialias * 0.5;
    float distance = uRenderMode == MODE_HIGH_PASS_2 ? 0.0 : modeDistance;

    if (ring > distance) {
        discard;
    }

    if (uRenderMode == MODE_HIGH_PASS_2) {
        if (ring < -antialias) {
            discard;
        }
        fragColor = outputColor(vec4(fColor.rgb, smoothstep(0.0, antialias, abs(ring))));
    } else {
        fragColor = outputColor(vec4(fColor.rgb, 1.0));
    }
}
