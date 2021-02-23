#version 300 es
precision highp float;
precision lowp usampler2D;

#define M_PI 3.14159265359
#define M_2PI 6.28318530718

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)
#pragma glslify: import(../../../renderer/shaders/outputColor.glsl)
#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#pragma glslify: import(../../nodes/shaders/shapes.glsl)

uniform usampler2D uLabelIndices;
uniform usampler2D uCharBoxes;
uniform sampler2D uCharTexture;
uniform float uPixelRatio;
uniform uint uRenderMode;
uniform vec2 uLabelDirection;
uniform bool uMirror;
uniform float uPadding;

flat in vec4 fBackgroundColor;
flat in vec4 fTextColor;
flat in float fPixelRadius;
flat in float fLabelStep;
flat in vec2 fCharTextureSize;
flat in vec4 fLabelInfo;
flat in float fPixelLength;
in vec2 vFromCenter;

out vec4 fragColor;

float cross_ish(vec2 a, vec2 b)
{
    return a.x * b.y - a.y * b.x;
}

void main() {
    float fromCenter = length(vFromCenter);
    float halfLabelWidth = fLabelInfo[2] * 0.5;
    float halfLabelHeight = fLabelInfo[3] * 0.5;
    float normalizedHeight = (halfLabelHeight + uPadding) / fPixelRadius;
    float circle = fromCenter - (1.0 - normalizedHeight);
    float ring = opOnion(circle, normalizedHeight);

    vec2 positionVector = uLabelDirection;
    float angle = atan(cross_ish(vFromCenter, positionVector), dot(vFromCenter, positionVector));
    float angleDistance = angle * fPixelRadius;
    float paddedLabelWidth = fLabelInfo[2] + uPadding * 2.0;
    float offsetAngleDistance = angleDistance + halfLabelWidth + uPadding;

    if (ring > 0.0 || fract(offsetAngleDistance / fLabelStep) >= paddedLabelWidth / fLabelStep) {
        discard;
    }

    float width = fract(offsetAngleDistance / fLabelStep) * fLabelStep;
    float height = (1.0 - fromCenter) * fPixelRadius - uPadding;
    vec4 finalColor;

    if (height < 0.0 || height > fLabelInfo[3] || width < uPadding || width > fLabelInfo[2] + uPadding) {
        finalColor = fBackgroundColor;
    } else {
//        float uProgress = fract((angleDistance + halfLabelWidth) / fLabelStep) / (fLabelInfo[2] / fLabelStep);
        float uProgress = (width - uPadding) / fLabelInfo[2];
        if (uMirror) {
            uProgress = 1.0 - uProgress;
        }
        float stringProgress = fLabelInfo[0] + fLabelInfo[1] * uProgress;
        float stringIndex = floor(stringProgress);
        int charIndex = int(uivalueForIndex(uLabelIndices, int(stringIndex)));
        vec4 charBox = vec4(uvalueForIndex(uCharBoxes, charIndex));
        float charMult = stringProgress - stringIndex;

        vec4 charBoxUV = charBox / vec4(fCharTextureSize, fCharTextureSize);

        vec2 uv = vec2(charBoxUV[0] + charBoxUV[2] * charMult, charBoxUV[1] + charBoxUV[3] * fLabelInfo[1]);
        if (uMirror) {
            uv = vec2(charBoxUV[0] + charBoxUV[2] * charMult, charBoxUV[1] + charBoxUV[3] * (height / fLabelInfo[3]));
        } else {
            uv = vec2(charBoxUV[0] + charBoxUV[2] * charMult, charBoxUV[1] + charBoxUV[3] * (1.0 - height / fLabelInfo[3]));
        }

        vec4 texPixel = texture(uCharTexture, uv);

        float smoothing = 7.0 / fLabelInfo[3];
        float distance = texPixel.a;
        float textEdge = smoothstep(0.5 - smoothing, 0.5 + smoothing, distance);
        finalColor = mix(fBackgroundColor, fTextColor, textEdge);
    }

    finalColor.a *= smoothstep(0.0, fPixelLength * 1.5, abs(ring));

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
}
