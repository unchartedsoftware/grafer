#version 300 es
precision highp float;

uniform float uAlpha;

in vec3 vColor;

out vec4 fragColor;

void main() {
    fragColor = vec4(vColor, uAlpha);
}
