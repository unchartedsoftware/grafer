#version 300 es

layout(location=0) in uint aSourceIndex;
layout(location=1) in uint aTargetIndex;
layout(location=2) in uvec2 aControl;
layout(location=3) in uint aSourceColor;
layout(location=4) in uint aTargetColor;

uniform sampler2D uGraphPoints;

out vec3 vSource;
out vec3 vTarget;
flat out uint vSourceColor;
flat out uint vTargetColor;
out vec2 vColorMix;

#pragma glslify: valueForIndex = require(../../../renderer/shaders/valueForIndex.glsl)

void main() {
    vec4 source = valueForIndex(uGraphPoints, int(aSourceIndex));
    vec4 target = valueForIndex(uGraphPoints, int(aTargetIndex));

    vSource = source.xyz;
    vTarget = target.xyz;

    vSourceColor = aSourceColor;
    vTargetColor = aTargetColor;

    vColorMix = vec2(float(aControl[0]) / float(aControl[1]), float(aControl[0] + 1u) / float(aControl[1]));
}
