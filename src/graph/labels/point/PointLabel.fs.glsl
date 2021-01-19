#version 300 es
precision highp float;

#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)

uniform float uPixelRatio;
uniform sampler2D uLabelTexture;
uniform uint uRenderMode;

flat in vec4 fColor;
flat in float fPixelLength;
in vec2 vFromCenter;
in vec2 vUV;

out vec4 fragColor;

void main() {
    vec4 texPixel = texture(uLabelTexture, vUV);
    float threshold = uRenderMode == MODE_HIGH_PASS_1 ? 1.0 : 0.5;
    if ((uRenderMode != MODE_HIGH_PASS_2 && texPixel.a < threshold) || (uRenderMode == MODE_HIGH_PASS_2 && texPixel.a == 1.0)) {
        discard;
    }
    fragColor = texPixel * fColor;
}
