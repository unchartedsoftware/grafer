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
    float solidRadius = max(2.0, fPixelRadius);
    float discardRadius = uRenderMode == MODE_HIGH_PASS_1 ? solidRadius - 1.5 : solidRadius;
    float fromCenter = length(vPixelLocation);

    if (fromCenter > discardRadius) {
        discard;
    }

    float outlineRadius;
    vec3 color;

    switch (uRenderMode) {
        case MODE_DRAFT:
//            fragColor = vec4(fColor.rgb, 1.0);
//            break;

        case MODE_MEDIUM:
        case MODE_HIGH_PASS_1:
            outlineRadius = fPixelRadius - min(10.0 * uPixelRatio, fPixelRadius * 0.4);
            color = fColor.rgb * (1.0 - 0.25 * clamp(fromCenter - outlineRadius, 0.0, 1.0));
            fragColor = vec4(color, 1.0);
            break;

        case MODE_HIGH_PASS_2:
            if (fromCenter < solidRadius - 1.5) {
                discard;
            }
            outlineRadius = fPixelRadius - min(10.0 * uPixelRatio, fPixelRadius * 0.4);
            color = fColor.rgb * (1.0 - 0.25 * clamp(fromCenter - outlineRadius, 0.0, 1.0));
            fragColor = vec4(color, smoothstep(solidRadius, solidRadius - 1.5, fromCenter));

        default:
            break;
    }
}
