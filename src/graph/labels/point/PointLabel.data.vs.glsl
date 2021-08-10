#version 300 es

layout(location=0) in uint aPositionIndex;
layout(location=1) in uint aColor;
layout(location=2) in uvec4 aLabel;

uniform sampler2D uGraphPoints;

flat out uint fPoint;
flat out uint fColor;
flat out uvec4 fLabel;

void main() {
    fPoint = aPositionIndex;
    fColor = aColor;
    fLabel = aLabel;
}
