#version 300 es
precision lowp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D uFrameTexture;

void main() {
    fragColor = texture(uFrameTexture, vUv);
}
