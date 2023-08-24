#version 300 es
precision highp float;

#pragma glslify: lineColor = require(../shaders/line.fs.glsl)

uniform vec2 uViewportSize;
uniform uint uRenderMode;

flat in float fLineWidth;
in vec3 vColor;
in vec2 vProjectedPosition;
in float vProjectedW;

out vec4 fragColor;

void main() {
    fragColor = lineColor(vColor, vProjectedPosition, vProjectedW, uViewportSize, uRenderMode, fLineWidth);
}
