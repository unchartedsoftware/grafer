#version 300 es
precision highp float;

flat in vec4 fPickingColor;

out vec4 fragColor;

void main() {
    fragColor = fPickingColor;
}
