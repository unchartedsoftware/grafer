#version 300 es

layout(location=0) in uint aPositionIndex;
layout(location=1) in uint aColor;
layout(location=2) in float aRadius; // optional atthe end

uniform sampler2D uGraphPoints;
uniform bool uUsePointRadius;

flat out uint fPoint;
flat out float fRadius;
flat out uint fColor;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)

void main() {
    vec4 value = valueForIndex(uGraphPoints, int(aPositionIndex));
    if (uUsePointRadius) {
        fRadius = value.w;
    } else {
        fRadius = aRadius;
    }

    fPoint = aPositionIndex;
    fColor = aColor;
}
