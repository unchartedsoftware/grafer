#pragma glslify: import(../../../renderer/shaders/outputColor.glsl)
#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#define ONE_ALPHA 0.00392156862 // 1.0 / 255.0

float lineAlpha(vec2 position, float w, vec2 viewportSize, float lineWidth) {
    vec2 lineCenter = ((position / w) * 0.5 + 0.5) * viewportSize;
    float distOffset = (lineWidth - 1.0) * 0.5;
    float dist = smoothstep(lineWidth * 0.5 - 0.5, lineWidth * 0.5 + 0.5, distance(lineCenter, gl_FragCoord.xy));
    return (1.0 - dist);
}

vec4 lineColor(vec3 color, vec2 position, float w, vec2 viewportSize, uint mode, float lineWidth) {
    if (mode < MODE_HIGH_PASS_1) {
        return outputColor(vec4(color, 1.0));
    }

    float a = lineAlpha(position, w, viewportSize, lineWidth);

    if (mode == MODE_HIGH_PASS_1) {
        if (a == 1.0) {
            return outputColor(vec4(color, a));
        } else {
            discard;
        }
    }

    // Possible optimization.
    // Edges run into fill rate issues because too many of them overlap, discarging pixels below a certain alpha
    // threshold might help speed things up a bit.
    if (a < ONE_ALPHA) {
        discard;
    }

    return outputColor(vec4(color, a));
}

#pragma glslify: export(lineColor)
