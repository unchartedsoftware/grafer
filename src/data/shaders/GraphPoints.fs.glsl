#version 300 es
precision highp float;
precision lowp isampler2D;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D uPointTexture;
uniform isampler2D uClassTexture;

#pragma glslify: import(../../renderer/shaders/valueForIndex.glsl)

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