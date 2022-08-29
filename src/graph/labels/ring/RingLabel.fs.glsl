#version 300 es
precision highp float;
precision lowp usampler2D;

#define M_PI 3.14159265359
#define M_2PI 6.28318530718

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)
#pragma glslify: import(../../../renderer/shaders/outputColor.glsl)
#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#pragma glslify: import(../../nodes/shaders/shapes.glsl)
#pragma glslify: import(../shaders/renderChar.glsl)

uniform usampler2D uLabelIndices;
uniform usampler2D uCharBoxes;
uniform sampler2D uCharTexture;
uniform float uPixelRatio;
uniform uint uRenderMode;
uniform vec2 uLabelDirection;
uniform bool uMirror;
uniform float uPadding;
uniform float uHalo;

flat in vec4 fBackgroundColor;
flat in vec4 fTextColor;
flat in vec4 fHaloColor;
flat in float fPixelRadius;
flat in float fLabelStep;
flat in vec2 fCharTextureSize;
flat in vec4 fLabelInfo;
flat in float fPixelLength;
flat in float fThickness;
in vec2 vFromCenter;

out vec4 fragColor;

float cross_ish(vec2 a, vec2 b)
{
    return a.x * b.y - a.y * b.x;
}

void main() {
    float padding = uPadding * uPixelRatio;
    float fromCenter = length(vFromCenter);
    float thickness = fThickness * fPixelLength;
    float antialias = min(thickness, fPixelLength * 1.5);
    float radius = 1.0 - thickness;
    float circle = fromCenter - (1.0 - thickness);
    float ring = opOnion(circle, thickness);
    float modeDistance = uRenderMode == MODE_HIGH_PASS_1 ? -antialias : -antialias * 0.5;
    float ringThreshold = uRenderMode == MODE_HIGH_PASS_2 ? 0.0 : modeDistance;

    if (ring > ringThreshold) {
        discard;
    }

    float halfLabelWidth = fLabelInfo[2] * 0.5;
    float halfLabelHeight = fLabelInfo[3] * 0.5;
    float normalizedHeight = (halfLabelHeight + padding) / fPixelRadius;

    vec2 positionVector = uLabelDirection;
    float angle = atan(cross_ish(vFromCenter, positionVector), dot(vFromCenter, positionVector));
    float angleDistance = angle * fPixelRadius;
    float paddedLabelWidth = fLabelInfo[2] + padding * 2.0;
    float offsetAngleDistance = angleDistance + halfLabelWidth + padding;

    float width = fract(offsetAngleDistance / fLabelStep) * fLabelStep;
    float height = (1.0 - fromCenter) * fPixelRadius - padding;
    vec4 finalColor;

    if (height < 0.0 || height > fLabelInfo[3] || width < padding || width > fLabelInfo[2] + padding) {
        finalColor = fBackgroundColor;
    } else {
        float uProgress = (width - padding) / fLabelInfo[2];
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

        finalColor = renderChar(fLabelInfo[3], texPixel, fBackgroundColor, fHaloColor, fTextColor, uHalo);
    }

    if (uRenderMode == MODE_HIGH_PASS_2) {
        if (ring < -antialias) {
            discard;
        }
        fragColor = outputColor(vec4(finalColor.rgb, smoothstep(0.0, antialias, abs(ring))));
    } else {
        fragColor = outputColor(vec4(finalColor.rgb, 1.0));
    }

//    fragColor = vec4(1.0,0.0,1.0,1.0);
}
