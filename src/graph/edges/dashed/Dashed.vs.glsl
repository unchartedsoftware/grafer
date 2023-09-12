#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in uint iPointA;
layout(location=2) in uint iPointB;
layout(location=3) in uint iColorA;
layout(location=4) in uint iColorB;
layout(location=5) in float iWidth;
layout(location=6) in uvec4 iPickingColor;

uniform bool uPicking;

uniform mat4 uViewMatrix;
uniform mat4 uSceneMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewportSize;
uniform float uPixelRatio;
uniform float uPickingWidth;
uniform sampler2D uGraphPoints;
uniform sampler2D uColorPalette;
uniform uint uDashLength;

flat out float fLineWidth;
flat out vec4 fPickingColor;
out vec3 vColor;
out float vDashLength;
out vec2 vProjectedPosition;
out float vProjectedW;

// manual import from ../../../renderer/shaders/valueForIndex.glsl
// to avoid uvec4 glslify error
vec4 valueForIndex(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
    fPickingColor = uPicking ? vec4(iPickingColor) / 255.0 : vec4(0.0);

    vec4 pointA = valueForIndex(uGraphPoints, int(iPointA));
    vec4 pointB = valueForIndex(uGraphPoints, int(iPointB));

    vec3 direction = normalize(pointB.xyz - pointA.xyz);

    vec3 offsetA = pointA.xyz + direction * pointA[3];
    vec3 offsetB = pointB.xyz - direction * pointB[3];

    float multA = aVertex.y;
    float multB = 1.0 - aVertex.y;

    vec4 colorA = valueForIndex(uColorPalette, int(iColorA));
    vec4 colorB = valueForIndex(uColorPalette, int(iColorB));

    vColor = colorA.rgb * multA + colorB.rgb * multB;

    mat4 renderMatrix = uProjectionMatrix * uViewMatrix * uSceneMatrix;

    vec4 aProjected = renderMatrix * vec4(offsetA, 1.0);
    vec2 aScreen = (aProjected.xy / aProjected.w) * (uViewportSize / 2.0);

    vec4 bProjected = renderMatrix * vec4(offsetB, 1.0);
    vec2 bScreen = (bProjected.xy / bProjected.w) * (uViewportSize / 2.0);

    vec2 screenDirection = normalize(bScreen - aScreen);
    vec2 perp = vec2(-screenDirection.y, screenDirection.x);

    fLineWidth = (uPicking ? iWidth * uPickingWidth : iWidth) * uPixelRatio;
    float offsetWidth = fLineWidth + 0.5;
    vec4 position = aProjected * multA + bProjected * multB;
    vec4 offset = vec4(((aVertex.x * perp * offsetWidth) / uViewportSize) * position.w, 0.0, 0.0);
    gl_Position = position + offset;

    vProjectedPosition = position.xy;
    vProjectedW = position.w;

    float screenDistance = distance(aScreen, bScreen);
    vDashLength = (screenDistance / float(uDashLength)) * aVertex.y;
}
