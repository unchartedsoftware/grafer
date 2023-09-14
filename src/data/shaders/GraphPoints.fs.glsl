#version 300 es
precision highp float;
precision highp isampler2D;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D uPointTexture;
uniform isampler2D uClassTexture;

vec4 valueForIndex(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

ivec4 ivalueForIndex(isampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
    vec2 texSize = vec2(textureSize(uPointTexture, 0).xy);
    ivec2 coords = ivec2(vUv * texSize);
    fragColor = texelFetch(uPointTexture, coords, 0);

    int i = 0;
    int classIndex = texelFetch(uClassTexture, coords, 0).x;
    while(classIndex != -1 && i++ < 500) {
        fragColor += valueForIndex(uPointTexture, classIndex);
        classIndex = ivalueForIndex(uClassTexture, classIndex).x;
    }
}