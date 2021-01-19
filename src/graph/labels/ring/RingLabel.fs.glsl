#version 300 es
precision highp float;

#define M_PI 3.14159265359
#define M_2PI 6.28318530718

#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#pragma glslify: import(../../nodes/shaders/shapes.glsl)

uniform float uPixelRatio;
uniform sampler2D uLabelTexture;
uniform uint uRenderMode;
uniform vec2 uLabelDirection;
uniform bool uMirror;

flat in vec4 fColor;
flat in vec3 fContrastColor;
flat in vec2 fLabelSize;
flat in float fPixelRadius;
flat in float fPixelLength;
flat in float fThickness;
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

    float halfLabelWidth = fLabelSize.x * 0.5;
    float halfLabelHeight = fLabelSize.y * 0.5;
    float normalizedHeight = halfLabelHeight / fPixelRadius;

    vec2 positionVector = uLabelDirection;
    float angle = atan(cross_ish(vFromCenter, positionVector), dot(vFromCenter, positionVector));
    float angleDistance = angle * fPixelRadius;

    // clamp seems to be broken on linux nvidia drivers :/
    float uProgress = min(1.0, max(0.0, fract((angleDistance + halfLabelWidth) / fLabelStep) / (fLabelSize.x / fLabelStep)));
    float u;
    if (uMirror) {
        u = fUV[0] + fUV[2] * (1.0 - uProgress);
    } else {
        u = fUV[0] + fUV[2] * min(1.0, max(0.0, uProgress));
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
    float labelMix = smoothstep(0.5 - smoothing, 0.5 + smoothing, distance);
    float heightMultiplier = pow((fThickness * 2.0) / fLabelSize.y, 3.0);

    vec3 color = mix(fColor.rgb, fContrastColor, labelMix * heightMultiplier);

    if (uRenderMode == MODE_HIGH_PASS_2) {
        if (ring < -antialias) {
            discard;
        }
        fragColor = vec4(color, smoothstep(0.0, antialias, abs(ring)));
    } else {
        fragColor = vec4(color, 1.0);
    }

//    fragColor = vec4(1.0,0.0,1.0,1.0);
}
