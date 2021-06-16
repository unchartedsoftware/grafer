#version 300 es

layout(location=0) in uint aIndex;

uniform sampler2D uDataTexture;

flat out vec3 vPosition;
flat out float vRadius;
flat out float vYolo;

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
    vec4 value = getValueByIndexFromTexture(uDataTexture, int(aIndex));
    vPosition = value.xyz;
    vRadius = value.w;
    vYolo = value.w / 10.0;
}
