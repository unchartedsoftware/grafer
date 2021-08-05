#pragma glslify: import(./colorTools.glsl)

uniform vec4 uClearColor;
uniform float uDesaturate;
uniform float uBrightness;
uniform float uFade;
uniform float uAlpha;

vec4 outputColor(vec4 color) {
    // desaturate => fade => alpha
    vec3 ret = vec3(desaturateColor(color.rgb + uBrightness, uDesaturate));
    ret = mix(ret, uClearColor.rgb, uFade);
    return vec4(ret, color.a * uAlpha);
}
