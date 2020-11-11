#version 300 es
precision highp float;

uniform float uPixelRatio;

flat in vec4 fColor;
flat in float fPixelRadius;
in vec2 vPixelLocation;

out vec4 fragColor;

void main() {
    float solidRadius = max(2.0, fPixelRadius);
    float fromCenter = length(vPixelLocation);

    float outlineRadius = fPixelRadius - min(8.0 * uPixelRatio, floor(fPixelRadius * 0.4));
    vec3 color = fColor.rgb * (1.0 - 0.2 * clamp(fromCenter - outlineRadius, 0.0, 1.0));

   if (fromCenter > solidRadius) {
       discard;
   }
   fragColor = vec4(color, 1.0);
}
