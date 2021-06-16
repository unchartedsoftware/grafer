#version 300 es

layout(location=0) in uint aSourceIndex;
layout(location=1) in uint aTargetIndex;
layout(location=2) in uint aSourceColor;
layout(location=3) in uint aTargetColor;

uniform sampler2D uGraphPoints;

out vec3 vSource;
out vec3 vTarget;
flat out uint vSourceColor;
flat out uint vTargetColor;

#pragma glslify: valueForIndex = require(../../../renderer/shaders/valueForIndex.glsl)

void main() {
    vec4 source = valueForIndex(uGraphPoints, int(aSourceIndex));
    vSource = source.xyz;

    vec4 target = valueForIndex(uGraphPoints, int(aTargetIndex));
    vTarget = target.xyz;

    vSourceColor = aSourceColor;
    vTargetColor = aTargetColor;
}
