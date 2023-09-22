#version 300 es
precision lowp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D uFrameTexture;
uniform sampler2D uGlowTexture;

void main() {
    fragColor = texture(uFrameTexture, vUv).rgba;

    if(fragColor.a == 0.) {
        fragColor = texture(uGlowTexture, vUv).rgba;
    }
}