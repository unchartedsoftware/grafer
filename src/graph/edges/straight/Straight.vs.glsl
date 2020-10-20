#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in vec3 iOffsetA;
layout(location=2) in vec3 iOffsetB;
layout(location=3) in uvec3 iColorA;
layout(location=4) in uvec3 iColorB;

uniform mat4 uViewMatrix;
uniform mat4 uSceneMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewportSize;
uniform float uPixelRatio;

out vec3 vColor;

void main() {
    float multA = aVertex.x;
    float multB = 1.0 - aVertex.x;

    vColor = (vec3(iColorA) / 255.0) * multA + (vec3(iColorB) / 255.0) * multB;

    mat4 renderMatrix = uProjectionMatrix * uViewMatrix * uSceneMatrix;
    vec3 position = iOffsetA * multA + iOffsetB * multB;
    gl_Position = renderMatrix * vec4(position, 1.0);
}
