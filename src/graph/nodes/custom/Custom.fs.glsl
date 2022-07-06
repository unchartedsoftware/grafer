#version 300 es
precision highp float;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)
#pragma glslify: import(../../../renderer/shaders/outputColor.glsl)
#pragma glslify: import(../../../renderer/shaders/RenderMode.glsl)
#pragma glslify: import(../shaders/shapes.glsl)

uniform float uPixelRatio;
uniform uint uRenderMode;
uniform float uOutline;
uniform usampler2D uTexBoxes;
uniform sampler2D uTexAtlas;

flat in vec4 fColor;
flat in uint fTexture;
flat in vec2 fTextureAtlasSize;
flat in float fPixelLength;
in vec2 vFromCenter;

out vec4 fragColor;

void main() {
    float antialias = fPixelLength * 1.5;
    float sd = sdBox(vFromCenter, vec2(1.0, 1.0));
    float modeDistance = uRenderMode == MODE_HIGH_PASS_1 ? -antialias : -antialias * 0.5;
    float distance = uRenderMode == MODE_HIGH_PASS_2 ? 0.0 : modeDistance;

    if (sd > distance) {
        discard;
    }

    vec2 mult = (vFromCenter + 1.) * 0.5;
    vec4 textureBox = vec4(uvalueForIndex(uTexBoxes, int(fTexture)));
    vec4 textureUV = textureBox / vec4(fTextureAtlasSize, fTextureAtlasSize);
    vec2 uv = vec2(textureUV[0] + textureUV[2] * mult[0], textureUV[1] + textureUV[3] * mult[1]);
    vec4 texPixel = texture(uTexAtlas, uv);

    if (texPixel.a == 0.) {
        discard;
    }

    // float texPixelLen = length(texPixel.rgba) / sqrt(4.);
    vec4 texColor = mix(uClearColor, fColor, texPixel.a);
    fragColor = outputColor(texColor);
}
