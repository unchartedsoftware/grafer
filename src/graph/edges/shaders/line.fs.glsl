#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#define ONE_ALPHA 0.00392156862 // 1.0 / 255.0

float lineAlpha(vec2 position, float w, vec2 viewportSize, float alpha) {
    vec2 lineCenter = ((position / w) * 0.5 + 0.5) * viewportSize;
    float dist = max(0.0 , length(lineCenter - gl_FragCoord.xy) - 0.5);
    return alpha * (1.0 - dist);
}

vec4 lineColor(vec3 color, vec2 position, float w, vec2 viewportSize, float alpha, uint mode) {
    if (mode < MODE_HIGH_PASS_1) {
        return vec4(color, alpha);
    }

    float a = lineAlpha(position, w, viewportSize, alpha);
    // Possible optimization.
    // Edges run into fill rate issues because too many of them overlap, discarging pixels below a certain alpha
    // threshold might help spee things up a bit.
    if (a < ONE_ALPHA) {
        discard;
    }
    return vec4(color, a);
}

#pragma glslify: export(lineColor)
