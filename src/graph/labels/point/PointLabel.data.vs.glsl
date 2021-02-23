#version 300 es

layout(location=0) in uint aPositionIndex;
layout(location=1) in uint aColor;
layout(location=2) in uvec4 aLabel;

uniform sampler2D uGraphPoints;

out vec3 vPosition;
out float vRadius;
flat out uint vColor;
flat out uvec4 vLabel;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)

void main() {
    vec4 value = valueForIndex(uGraphPoints, int(aPositionIndex));
    vPosition = value.xyz;
    vRadius = value.w;
    vColor = aColor;
    vLabel = aLabel;
}
