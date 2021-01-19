#version 300 es

precision lowp usampler2D;

layout(location=0) in uint aIndex;

uniform usampler2D uDataTexture;

flat out vec4 vBox;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)

void main() {
    vec2 texSize = vec2(textureSize(uDataTexture, 0));
    vec4 box = vec4(uvalueForIndex(uDataTexture, int(aIndex)));
    vBox = vec4(
        box[0] / texSize.x,
        box[1] / texSize.y,
        box[2] / texSize.x,
        box[3] / texSize.y
    );
}
