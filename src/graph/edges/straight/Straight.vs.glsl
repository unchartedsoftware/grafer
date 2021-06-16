#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in vec3 iOffsetA;
layout(location=2) in vec3 iOffsetB;
layout(location=3) in uint iColorA;
layout(location=4) in uint iColorB;

uniform mat4 uViewMatrix;
uniform mat4 uSceneMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewportSize;
uniform float uPixelRatio;
uniform sampler2D uColorPalette;

uniform float uLineWidth;

flat out float fLineWidth;
out vec3 vColor;
out vec2 vProjectedPosition;
out float vProjectedW;

vec4 getColorByIndexFromTexture(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
    float multA = aVertex.y;
    float multB = 1.0 - aVertex.y;

    vec4 colorA = getColorByIndexFromTexture(uColorPalette, int(iColorA));
    vec4 colorB = getColorByIndexFromTexture(uColorPalette, int(iColorB));

    vColor = colorA.rgb * multA + colorB.rgb * multB;

    mat4 renderMatrix = uProjectionMatrix * uViewMatrix * uSceneMatrix;

    vec4 aProjected = renderMatrix * vec4(iOffsetA, 1.0);
    vec2 aScreen = aProjected.xy / aProjected.w * uViewportSize * 0.5;

    vec4 bProjected = renderMatrix * vec4(iOffsetB, 1.0);
    vec2 bScreen = bProjected.xy / bProjected.w * uViewportSize * 0.5;

    vec2 direction = normalize(bScreen - aScreen);
    vec2 perp = vec2(-direction.y, direction.x);

    fLineWidth = uLineWidth * uPixelRatio;
    float offsetWidth = fLineWidth + 0.5;
    vec4 position = aProjected * multA + bProjected * multB;
    vec4 offset = vec4(((aVertex.x * perp * offsetWidth) / uViewportSize) * position.w, 0.0, 0.0);
    gl_Position = position + offset;

    vProjectedPosition = position.xy;
    vProjectedW = position.w;
}
