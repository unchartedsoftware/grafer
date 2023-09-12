#version 300 es

layout(location=0) in uint aSourceIndex;
layout(location=1) in uint aTargetIndex;
layout(location=2) in uint aSourceColor;
layout(location=3) in uint aTargetColor;
layout(location=4) in float aWidth;

uniform sampler2D uGraphPoints;

flat out uint fSource;
flat out uint fTarget;
flat out uint fSourceColor;
flat out uint fTargetColor;
flat out float fWidth;

void main() {
    fSource = aSourceIndex;
    fTarget = aTargetIndex;
    fSourceColor = aSourceColor;
    fTargetColor = aTargetColor;
    fWidth = aWidth;
}
