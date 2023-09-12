#version 300 es

layout(location=0) in uint aSourceIndex;
layout(location=1) in uint aTargetIndex;
layout(location=2) in uvec3 aControl;
layout(location=3) in uint aSourceColor;
layout(location=4) in uint aTargetColor;
layout(location=5) in float aWidth;
layout(location=6) in uvec4 aPickingColor;

uniform sampler2D uGraphPoints;

out vec3 vSource;
out vec3 vTarget;
out vec3 vControl;
flat out uint vSourceColor;
flat out uint vTargetColor;
out vec2 vColorMix;
flat out float vWidth;
flat out uvec4 vPickingColor;

// manual import from ../../../renderer/shaders/valueForIndex.glsl
// to avoid uvec4 glslify error
vec4 valueForIndex(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
    vec4 source = valueForIndex(uGraphPoints, int(aSourceIndex));
    vec4 target = valueForIndex(uGraphPoints, int(aTargetIndex));
    vec4 control = valueForIndex(uGraphPoints, int(aControl[0]));

    // TODO: Optimize this to avoid branches. (If performance becomes a problem)
    if (aControl[1] == 0u) {
        vSource = source.xyz;
    } else {
        vSource = (source.xyz + control.xyz) / 2.0;
    }

    if (aControl[1] == aControl[2] - 1u) {
        vTarget = target.xyz;
    } else {
        vTarget = (target.xyz + control.xyz) / 2.0;
    }

    vControl = control.xyz;

    vSourceColor = aSourceColor;
    vTargetColor = aTargetColor;

    vColorMix = vec2(float(aControl[1]) / float(aControl[2]), float(aControl[1] + 1u) / float(aControl[2]));

    vWidth = aWidth;
    vPickingColor = aPickingColor;
}
