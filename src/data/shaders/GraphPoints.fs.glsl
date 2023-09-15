#version 300 es
precision highp float;
precision lowp isampler2D;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D uPointTexture;
uniform isampler2D uClassTexture;

uniform uint uPositionClassMode;
uniform uint uRadiusClassMode;

#pragma glslify: import(../../renderer/shaders/valueForIndex.glsl)
#pragma glslify: import(./classMode.glsl)

void main() {
    vec2 texSize = vec2(textureSize(uPointTexture, 0).xy);
    ivec2 coords = ivec2(vUv * texSize);
    fragColor = texelFetch(uPointTexture, coords, 0);

    int i = 0;
    int classIndex = texelFetch(uClassTexture, coords, 0).x;
    while(classIndex != -1 && i++ < 500) {
        vec4 point = valueForIndex(uPointTexture, classIndex);
        if(uPositionClassMode == MODE_ADD) {
            fragColor.xyz += point.xyz;
        }
        if(uRadiusClassMode == MODE_ADD) {
            fragColor.w += point.w;
        }
        classIndex = ivalueForIndex(uClassTexture, classIndex).x;
    }
}