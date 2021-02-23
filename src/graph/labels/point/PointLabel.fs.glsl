#version 300 es
precision highp float;
precision lowp usampler2D;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)
#pragma glslify: import(../../../renderer/shaders/outputColor.glsl)
#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)

uniform usampler2D uLabelIndices;
uniform usampler2D uCharBoxes;
uniform sampler2D uCharTexture;
uniform float uPixelRatio;
uniform uint uRenderMode;
uniform float uPadding;

flat in vec4 fBackgroundColor;
flat in vec4 fTextColor;
flat in vec4 fLabelInfo;
flat in float fPixelLength;
flat in vec2 fCharTextureSize;
in vec2 vFromCenter;
in vec2 vStringCoords;
in vec2 vPixelCoords;

out vec4 fragColor;

void main() {
    float padding = uPadding * uPixelRatio;
    vec4 finalColor;

    if (vPixelCoords.x < padding || vPixelCoords.y < padding || vPixelCoords.x > fLabelInfo[2] + padding || vPixelCoords.y > fLabelInfo[3] + padding) {
        finalColor = fBackgroundColor;
    } else {
        vec2 uvMultiplier = (vPixelCoords - padding) / fLabelInfo.ba;
        float u = fLabelInfo[0] + fLabelInfo[1] * uvMultiplier.x;
        float v = uvMultiplier.y;

        float stringIndex = floor(u);
        int charIndex = int(uivalueForIndex(uLabelIndices, int(stringIndex)));
        vec4 charBox = vec4(uvalueForIndex(uCharBoxes, charIndex));
        float charMult = u - stringIndex;

        vec4 charBoxUV = charBox / vec4(fCharTextureSize, fCharTextureSize);

        vec2 uv = vec2(charBoxUV[0] + charBoxUV[2] * charMult, charBoxUV[1] + charBoxUV[3] * v);
        vec4 texPixel = texture(uCharTexture, uv);

        float smoothing = 7.0 / fLabelInfo[3];
        float distance = texPixel.a;
        float textEdge = smoothstep(0.5 - smoothing, 0.5 + smoothing, distance);
        finalColor = mix(fBackgroundColor, fTextColor, textEdge);
    }

    float threshold = uRenderMode == MODE_HIGH_PASS_1 ? 0.75 : 0.5;

    if (uRenderMode != MODE_HIGH_PASS_2) {
        if (finalColor.a < threshold) {
            discard;
        }
        fragColor = outputColor(vec4(finalColor.rgb, 1.0));
    } else {
        if (finalColor.a == 1.0) {
            discard;
        }
        fragColor = outputColor(finalColor);
    }

//    if ((uRenderMode != MODE_HIGH_PASS_2 && texPixel.a < threshold) || (uRenderMode == MODE_HIGH_PASS_2 && texPixel.a == 1.0)) {
//        discard;
//    }
//    float alpha = uRenderMode == MODE_HIGH_PASS_2 ? texPixel.a : 1.0;
//    fragColor = vec4(texPixel.rgb * fColor.rgb, alpha);
}
