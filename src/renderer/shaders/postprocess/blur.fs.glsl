#version 300 es
precision lowp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D uFrameTexture;
uniform vec2 uDirection;

void main() {
    vec2 texSize = 1. / vec2(textureSize(uFrameTexture, 0).xy);

    float blurOffsets[3];
    blurOffsets[0] = 0.0;
    blurOffsets[1] = 1.3846153846;
    blurOffsets[2] = 3.2307692308;

    float blurWeights[3];
    blurWeights[0] = 0.22697126013264554;
    blurWeights[1] = 0.31613854089904203;
    blurWeights[2] = 0.070253009088676;

    fragColor = texture(uFrameTexture, vUv) * blurWeights[0];
    for (int i = 1; i < 3; ++i) {
        fragColor += texture(uFrameTexture, vUv + (uDirection * texSize * blurOffsets[i])) * blurWeights[i];
        fragColor += texture(uFrameTexture, vUv - (uDirection * texSize * blurOffsets[i])) * blurWeights[i];
    }
}
