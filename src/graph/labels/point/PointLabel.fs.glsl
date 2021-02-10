#version 300 es
precision highp float;

#pragma glslify: import(../../../renderer/shaders/outputColor.glsl)
#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)

uniform float uPixelRatio;
uniform sampler2D uLabelTexture;
uniform uint uRenderMode;

flat in vec4 fColor;
flat in vec2 fLabelSize;
flat in float fPixelLength;
in vec2 vFromCenter;
in vec2 vUV;

out vec4 fragColor;

void main() {
    vec4 texPixel = texture(uLabelTexture, vUV);

    float smoothing = 4.0 / fLabelSize.y;
    float distance = texPixel.a;
    float alpha = smoothstep(0.5 - smoothing, 0.5 + smoothing, distance);
    float threshold = uRenderMode == MODE_HIGH_PASS_1 ? 0.75 : 0.5;

    if (uRenderMode != MODE_HIGH_PASS_2) {
        if (alpha < threshold) {
            discard;
        }
        fragColor = outputColor(vec4(texPixel.rgb * fColor.rgb, 1.0));
    } else {
        if (texPixel.a == 1.0) {
            discard;
        }
        fragColor = outputColor(vec4(texPixel.rgb * fColor.rgb, alpha));
    }

//    if ((uRenderMode != MODE_HIGH_PASS_2 && texPixel.a < threshold) || (uRenderMode == MODE_HIGH_PASS_2 && texPixel.a == 1.0)) {
//        discard;
//    }
//    float alpha = uRenderMode == MODE_HIGH_PASS_2 ? texPixel.a : 1.0;
//    fragColor = vec4(texPixel.rgb * fColor.rgb, alpha);
}
