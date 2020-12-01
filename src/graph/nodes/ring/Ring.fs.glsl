#version 300 es
precision highp float;

#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#pragma glslify: import(../shaders/shapes.glsl)

uniform float uPixelRatio;
uniform uint uRenderMode;

flat in vec4 fColor;
flat in float fPixelLength;
in vec2 vFromCenter;

out vec4 fragColor;

void main() {
    float thickness = min(0.05, fPixelLength * 3.0);
    float antialias = min(thickness, fPixelLength * 1.5);
    float radius = 1.0 - thickness;
    float ring = opOnion(sdCircle(vFromCenter, radius), thickness);
    float distance = uRenderMode == MODE_HIGH_PASS_1 ? -antialias : 0.0;

    if (ring > distance) {
        discard;
    }

    if (uRenderMode == MODE_HIGH_PASS_2) {
        if (ring < -antialias) {
            discard;
        }
        fragColor = vec4(fColor.rgb, smoothstep(0.0, antialias, abs(ring)));
    } else {
        fragColor = vec4(fColor.rgb, 1.0);
    }
}
