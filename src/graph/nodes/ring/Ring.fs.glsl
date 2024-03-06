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
    float thickness = uOutline / 2.0;
    float innerRadius = 1.0 - thickness;
    float ring = opOnion(sdCircle(vFromCenter, innerRadius), thickness);
    float antialias = fPixelLength * 1.5;

    if (ring > 0.0) {
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
