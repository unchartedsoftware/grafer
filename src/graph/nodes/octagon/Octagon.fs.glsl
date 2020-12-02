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
    float antialias = fPixelLength * 1.5;
    float sd = sdOctagon(vFromCenter, 1.0);
    float outline = opOnion(sd, min(0.15, fPixelLength * 6.0 * uPixelRatio));
    float modeDistance = uRenderMode == MODE_HIGH_PASS_1 ? -antialias : -antialias * 0.5;
    float distance = uRenderMode == MODE_HIGH_PASS_2 ? 0.0 : modeDistance;

    if (sd > distance) {
        discard;
    }

    vec3 color = fColor.rgb * (1.0 - 0.25 * smoothstep(antialias, 0.0, outline));

    if (uRenderMode == MODE_HIGH_PASS_2) {
        if (sd < -antialias) {
            discard;
        }
        fragColor = vec4(color, smoothstep(0.0, antialias, abs(sd)));
    } else {
        fragColor = vec4(color, 1.0);
    }
}
