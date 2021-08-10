#version 300 es

layout(location=0) in uint aPositionIndex;
layout(location=1) in uint aColor;
layout(location=2) in float aRadius; // optional atthe end

uniform sampler2D uGraphPoints;
uniform bool uUsePointRadius;

flat out uint vPositionIndex;
flat out float vRadius;
flat out uint vColor;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)

void main() {
    vec4 value = valueForIndex(uGraphPoints, int(aPositionIndex));
    if (uUsePointRadius) {
        vRadius = value.w;
    } else {
        vRadius = aRadius;
    }

    vPositionIndex = aPositionIndex;
    vColor = aColor;
}
