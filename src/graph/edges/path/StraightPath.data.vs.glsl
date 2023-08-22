#version 300 es

layout(location=0) in uint aSourceIndex;
layout(location=1) in uint aTargetIndex;
layout(location=2) in uvec2 aControl;
layout(location=3) in uint aSourceColor;
layout(location=4) in uint aTargetColor;
layout(location=5) in uvec4 aPickingColor;

uniform sampler2D uGraphPoints;

flat out uint fSource;
flat out uint fTarget;
flat out uint fSourceColor;
flat out uint fTargetColor;
flat out vec2 fColorMix;
flat out uvec4 fPickingColor;

void main() {
    fSource = aSourceIndex;
    fTarget = aTargetIndex;

    fSourceColor = aSourceColor;
    fTargetColor = aTargetColor;

    fColorMix = vec2(float(aControl[0]) / float(aControl[1]), float(aControl[0] + 1u) / float(aControl[1]));

    fPickingColor = aPickingColor;
}
