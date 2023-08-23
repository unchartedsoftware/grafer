#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in uint iPointA;
layout(location=2) in uint iPointB;
layout(location=3) in uint iColorA;
layout(location=4) in uint iColorB;
layout(location=5) in uvec4 iPickingColor;

uniform bool uPicking;

uniform mat4 uViewMatrix;
uniform mat4 uSceneMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewportSize;
uniform float uPixelRatio;
uniform float uPickingWidth;
uniform float uLineWidth;
uniform float uGravity;
uniform sampler2D uColorPalette;
uniform sampler2D uGraphPoints;

flat out float fLineWidth;
flat out vec4 fPickingColor;
out vec3 vColor;
out vec2 vProjectedPosition;
out float vProjectedW;

// manual import from ../../../renderer/shaders/valueForIndex.glsl
// to avoid uvec4 pragma error
vec4 valueForIndex(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
    fPickingColor = uPicking ? vec4(iPickingColor) / 255.0 : vec4(0.0);

    float multA = aVertex.x;
    float multB = 1.0 - aVertex.x;

    vec3 offsetA = valueForIndex(uGraphPoints, int(iPointA)).xyz;
    vec3 offsetB = valueForIndex(uGraphPoints, int(iPointB)).xyz;

    vec4 colorA = valueForIndex(uColorPalette, int(iColorA));
    vec4 colorB = valueForIndex(uColorPalette, int(iColorB));

    vColor = colorA.rgb * multA + colorB.rgb * multB;

    vec3 direction = offsetB - offsetA;
    vec3 middle = offsetA + direction * 0.5;
    float distance = length(direction);

    float toCenter = length(middle);
    vec3 towardsCenter = (middle * -1.0) / toCenter;

    fLineWidth = (uPicking ? uLineWidth * uPickingWidth : uLineWidth) * uPixelRatio;

    vec3 gravity = middle + towardsCenter * min(toCenter, distance * uGravity);
    vec3 position = gravity + pow(multB, 2.0) * (offsetB - gravity) + pow(multA, 2.0) * (offsetA - gravity);

    mat4 renderMatrix = uProjectionMatrix * uViewMatrix * uSceneMatrix;
    gl_Position = renderMatrix * vec4(position, 1.0);

    vProjectedPosition = gl_Position.xy;
    vProjectedW = gl_Position.w;
}
