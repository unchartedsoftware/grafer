#version 300 es

layout(location=0) in uint aPositionIndex;
layout(location=1) in float aRadius;

uniform sampler2D uGraphPoints;
uniform bool uUsePointRadius;

out vec3 vPosition;
out float vRadius;
flat out uint vColor;

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
    vec4 value = getValueByIndexFromTexture(uGraphPoints, int(aPositionIndex));
    vPosition = value.xyz;

    if (uUsePointRadius) {
        vRadius = value.w;
    } else {
        vRadius = aRadius;
    }

    vColor = uint(0xff0000ff);
}
