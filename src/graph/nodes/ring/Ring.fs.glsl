#version 300 es
precision highp float;

#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)

uniform float uPixelRatio;
uniform uint uRenderMode;

flat in vec4 fColor;
flat in float fPixelRadius;
in vec2 vPixelLocation;

out vec4 fragColor;

void main() {
    float outterRadius = fPixelRadius;
    float innerRadius = fPixelRadius - max(1.0, min(4.0 * uPixelRatio, floor(fPixelRadius * 0.4)));
    float discardOutterRadius = uRenderMode == MODE_HIGH_PASS_1 ? outterRadius - 1.5 : outterRadius;
    float discardInnerRadius = uRenderMode == MODE_HIGH_PASS_1 ? innerRadius + 1.5 : innerRadius;

    float fromCenter = length(vPixelLocation);

    if (fromCenter > discardOutterRadius || fromCenter < discardInnerRadius) {
        discard;
    }

    switch (uRenderMode) {
        case MODE_DRAFT:
        case MODE_MEDIUM:
        case MODE_HIGH_PASS_1:
            fragColor = vec4(fColor.rgb, 1.0);
        break;

        case MODE_HIGH_PASS_2:
        if (fromCenter < outterRadius - 1.5 && fromCenter > innerRadius + 1.5) {
            discard;
        }
        float outterAlpha = smoothstep(outterRadius, outterRadius - 1.5, fromCenter);
        float innerAlpha = smoothstep(innerRadius, innerRadius + 1.5, fromCenter);
        fragColor = vec4(fColor.rgb,outterAlpha * innerAlpha);

        default:
        break;
    }


}
