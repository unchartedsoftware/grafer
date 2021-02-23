#version 300 es
precision highp float;

#define M_PI 3.14159265359
#define M_2PI 6.28318530718

#pragma glslify: import(../../../renderer/shaders/outputColor.glsl)
#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#pragma glslify: import(../../nodes/shaders/shapes.glsl)

uniform float uPixelRatio;
uniform sampler2D uLabelTexture;
uniform uint uRenderMode;
uniform vec2 uLabelDirection;
uniform bool uMirror;

flat in vec4 fColor;
flat in vec2 fLabelSize;
flat in float fPixelRadius;
flat in vec4 fUV;
flat in float fLabelStep;
in vec2 vFromCenter;

out vec4 fragColor;

float cross_ish(vec2 a, vec2 b)
{
    return a.x * b.y - a.y * b.x;
}

void main() {
    float fromCenter = length(vFromCenter);
    float halfLabelWidth = fLabelSize.x * 0.5;
    float halfLabelHeight = fLabelSize.y * 0.5;
    float normalizedHeight = halfLabelHeight / fPixelRadius;
    float circle = fromCenter - (1.0 - normalizedHeight);
    float ring = opOnion(circle, normalizedHeight);

    vec2 positionVector = uLabelDirection;
    float angle = atan(cross_ish(vFromCenter, positionVector), dot(vFromCenter, positionVector));
    float angleDistance = angle * fPixelRadius;


    /**
      try to compesate for float precission issues by substracting 2 pixels on each side, tested on:
      nvidia - linux - 1920 x 1080 - no scaling
      nvidia - windows - 1440 x 900 - no scaling
      amd - macOS - 2880 x 1800 - retina scaling
      amd - windows - 1920 x 1080 - no scaling
      amd - linux - 1920 x 1080 - no scaling
      TODO: Find a way to do this (and the UV calculation below) using discrete math
     */
    if (ring > 0.0 || fract((abs(angleDistance) + halfLabelWidth - 2.0) / fLabelStep) >= (fLabelSize.x - 4.0) / fLabelStep) {
        discard;
    }

    float uProgress = fract((angleDistance + halfLabelWidth) / fLabelStep) / (fLabelSize.x / fLabelStep);
    float u;
    if (uMirror) {
        u = fUV[0] + fUV[2] * (1.0 - uProgress);
    } else {
        u = fUV[0] + fUV[2] * uProgress;
    }

    float height = (1.0 - fromCenter) * fPixelRadius;
    float v;
    if (uMirror) {
        v = fUV[1] + fUV[3] * (height / fLabelSize.y);
    } else {
        v = fUV[1] + fUV[3] * (1.0 - height / fLabelSize.y);
    }

    vec4 texPixel = texture(uLabelTexture, vec2(u, v));

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
}
