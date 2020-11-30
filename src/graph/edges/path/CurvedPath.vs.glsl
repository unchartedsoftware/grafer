#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in vec3 iOffsetA;
layout(location=2) in vec3 iOffsetB;
layout(location=3) in vec3 iControl;
layout(location=4) in uint iColorA;
layout(location=5) in uint iColorB;
layout(location=6) in vec2 iColorMix;

uniform mat4 uViewMatrix;
uniform mat4 uSceneMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewportSize;
uniform float uPixelRatio;
uniform sampler2D uColorPalette;

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
    float multA = aVertex.x;
    float multB = 1.0 - aVertex.x;

    vec4 colorA = getColorByIndexFromTexture(uColorPalette, int(iColorA));
    vec4 colorB = getColorByIndexFromTexture(uColorPalette, int(iColorB));
    vec3 mixColorA = mix(colorA.rgb, colorB.rgb, iColorMix[1]);
    vec3 mixColorB = mix(colorA.rgb, colorB.rgb, iColorMix[0]);
    vColor = mix(mixColorA.rgb, mixColorB.rgb, multA);

    mat4 renderMatrix = uProjectionMatrix * uViewMatrix * uSceneMatrix;
    vec3 position = iControl + pow(multB, 2.0) * (iOffsetB - iControl) + pow(multA, 2.0) * (iOffsetA - iControl);
    gl_Position = renderMatrix * vec4(position, 1.0);

    vProjectedPosition = gl_Position.xy;
    vProjectedW = gl_Position.w;
}
