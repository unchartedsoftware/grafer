#version 300 es
precision highp float;

uniform float uPixelRatio;

flat in vec4 fColor;
flat in float fPixelRadius;
in vec2 vPixelLocation;

out vec4 fragColor;

#define COMPUTE_ANTIALIAS 0 // proper antialias needs two passes
#if (COMPUTE_ANTIALIAS == 1)
    #define ANTIALIAS_WIDTH 4.0
#else
    #define ANTIALIAS_WIDTH 0.0
#endif

void main() {
    float antialiasWidth = min(floor(fPixelRadius * 0.5), ANTIALIAS_WIDTH);
    float solidRadius = fPixelRadius - antialiasWidth;
    float fromCenter = length(vPixelLocation);

    float outlineRadius = fPixelRadius - min(8.0 * uPixelRatio, floor(fPixelRadius * 0.4));
    vec3 color = fColor.rgb * (1.0 - 0.2 * clamp(fromCenter - outlineRadius, 0.0, 1.0));

   if (COMPUTE_ANTIALIAS == 1) {
       if (fromCenter - solidRadius > antialiasWidth) {
           discard;
       }
       float alpha = 1.0 - max(0.0, fromCenter - solidRadius) / antialiasWidth;
       fragColor = vec4(color, alpha);
   } else {
       if (fromCenter > solidRadius) {
           discard;
       }
       fragColor = vec4(color, 1.0);
   }
}
