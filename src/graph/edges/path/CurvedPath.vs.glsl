#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in vec3 iOffsetA;
layout(location=2) in vec3 iOffsetB;
layout(location=3) in vec3 iControl;
layout(location=4) in uint iColorA;
layout(location=5) in uint iColorB;
layout(location=6) in vec2 iColorMix;
layout(location=7) in float iWidth;
layout(location=8) in uvec4 iPickingColor;

uniform bool uPicking;

uniform mat4 uViewMatrix;
uniform mat4 uSceneMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uViewportSize;
uniform float uPixelRatio;
uniform float uPickingWidth;
uniform sampler2D uColorPalette;

uniform float uLineWidth;
uniform float uSegments;

flat out float fLineWidth;
flat out vec4 fPickingColor;
out vec3 vColor;
out vec2 vProjectedPosition;
out float vProjectedW;

vec4 getColorByIndexFromTexture(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

vec3 bezier(vec3 p0, vec3 p1, vec3 p2, float t) {
    return p1 + pow(1.0 - t, 2.0) * (p2 - p1) + pow(t, 2.0) * (p0 - p1);
}

void main() {
    fPickingColor = uPicking ? vec4(iPickingColor) / 255.0 : vec4(0.0);

    // bezier works fine with 0 > t > 1
    float t0 = aVertex.y / uSegments;
    float t1 = (aVertex.y + 1.0) / uSegments;

    // calculate both bezier points
    vec3 b0 = bezier(iOffsetA, iControl, iOffsetB, t0);
    vec3 b1 = bezier(iOffsetA, iControl, iOffsetB, t1);

    // project the points to the screen
    mat4 renderMatrix = uProjectionMatrix * uViewMatrix * uSceneMatrix;
    vec4 b0Projected = renderMatrix * vec4(b0, 1.0);
    vec4 b1Projected = renderMatrix * vec4(b1, 1.0);

    // get their screen coords
    vec2 b0Screen = (b0Projected.xy / b0Projected.w) * uViewportSize * 0.5;
    vec2 b1Screen = (b1Projected.xy / b1Projected.w) * uViewportSize * 0.5;

    // get the direction and normal of the segment
    vec2 direction = normalize(b1Screen - b0Screen);
    vec2 normal = vec2(-direction.y, direction.x);

    // calculate the pixel offset
    fLineWidth = (uPicking ? iWidth * uPickingWidth : iWidth) * uPixelRatio;
    float offsetWidth = fLineWidth + 0.5;
    vec4 offset = vec4(((aVertex.x * normal * offsetWidth) / uViewportSize) * b0Projected.w, 0.0, 0.0);

    // set the final vertex position
    gl_Position = b0Projected + offset;
    vProjectedPosition = b0Projected.xy;
    vProjectedW = b0Projected.w;

    // calculate the color
    vec4 colorA = getColorByIndexFromTexture(uColorPalette, int(iColorA));
    vec4 colorB = getColorByIndexFromTexture(uColorPalette, int(iColorB));
    vec3 mixColorA = mix(colorA.rgb, colorB.rgb, iColorMix[1]);
    vec3 mixColorB = mix(colorA.rgb, colorB.rgb, iColorMix[0]);
    vColor = mix(mixColorA.rgb, mixColorB.rgb, t0);
}
