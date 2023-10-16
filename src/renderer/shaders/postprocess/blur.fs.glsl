#version 300 es
precision lowp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D uFrameTexture;
uniform vec2 uDirection;
uniform float uStrength;

float gaussian(float x, float a) {
    float exponent = (x * x) / (2. * a * a);
    exponent = -exponent;
    return exp(exponent) / sqrt(3.141 * 2. * a);
}

void main() {
    vec2 texSize = 1. / vec2(textureSize(uFrameTexture, 0).xy);

    float strength = mix(1.5, 3., uStrength);
    vec4 inputSample = texture(uFrameTexture, vUv);
    vec4 result = inputSample * gaussian(0., strength);
    for (int i = 1; i < 10; ++i) {
        result += texture(uFrameTexture, vUv + vec2(uDirection * texSize * float(i))) * gaussian(float(i), strength);
        result += texture(uFrameTexture, vUv - vec2(uDirection * texSize * float(i))) * gaussian(float(i), strength);
    }

    fragColor = result;
}
