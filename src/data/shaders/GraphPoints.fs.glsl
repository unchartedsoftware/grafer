#version 300 es
precision highp float;
precision lowp isampler2D;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D uPointTexture;
uniform isampler2D uParentTexture;

uniform uint uPositionHierarchyType;
uniform uint uRadiusHierarchyType;
uniform uint uMaxHierarchyDepth;

#pragma glslify: import(../../renderer/shaders/valueForIndex.glsl)
#pragma glslify: import(./hierarchyType.glsl)

void main() {
    vec2 texSize = vec2(textureSize(uPointTexture, 0).xy);
    ivec2 coords = ivec2(vUv * texSize);
    fragColor = texelFetch(uPointTexture, coords, 0);

    uint i = 0u;
    int parentIndex = texelFetch(uParentTexture, coords, 0).x;
    while(parentIndex != -1 && i++ < uMaxHierarchyDepth) {
        vec4 point = valueForIndex(uPointTexture, parentIndex);
        if(uPositionHierarchyType == MODE_ADD) {
            fragColor.xyz += point.xyz;
        }
        if(uRadiusHierarchyType == MODE_ADD) {
            fragColor.w += point.w;
        }
        parentIndex = ivalueForIndex(uParentTexture, parentIndex).x;
    }
}