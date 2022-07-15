#version 300 es

precision lowp usampler2D;

#define M_PI 3.14159265359
#define M_2PI 6.28318530718

layout(location=0) in vec3 aVertex;
layout(location=1) in uint iPoint;
layout(location=2) in uint iColor;
layout(location=3) in uvec4 iLabel;

//layout(std140) uniform RenderUniforms {
    uniform mat4 uViewMatrix;
    uniform mat4 uSceneMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec2 uViewportSize;
    uniform float uPixelRatio;
    uniform sampler2D uGraphPoints;
    uniform sampler2D uColorPalette;
    uniform uint uCameraMode; // 0 = 2D; 1 = 3D;
//};
uniform sampler2D uCharTexture;
uniform float uVisibilityThreshold;
uniform vec2 uLabelPositioning;
uniform int uRepeatLabel;
uniform float uRepeatGap;
uniform float uPlacementMargin;
uniform float uLabelPlacement;
uniform vec2 uLabelDirection;
uniform bool uBackground;
uniform float uPadding;

flat out vec4 fBackgroundColor;
flat out vec4 fTextColor;
flat out vec4 fHaloColor;
flat out float fPixelRadius;
flat out float fLabelStep;
flat out vec2 fCharTextureSize;
flat out vec4 fLabelInfo;
flat out float fPixelLength;
out vec2 vFromCenter;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)
#pragma glslify: import(../../../renderer/shaders/colorTools.glsl)

void main() {
    vec4 point = valueForIndex(uGraphPoints, int(iPoint));
    vec3 position = point.xyz;
    float radius = point.w;
    // claculate the offset matrix, done as a matrix to be able to compute "billboard" vertices in the shader
    mat4 offsetMatrix = mat4(1.0);
    offsetMatrix[3] = vec4(position, 1.0);

    // reset the rotation of the model-view matrix
    mat4 modelMatrix = uViewMatrix * uSceneMatrix * offsetMatrix;
    mat4 lookAtMatrix = mat4(modelMatrix);
    if (uCameraMode == 1u) {
        lookAtMatrix[0] = vec4(1.0, 0.0, 0.0, lookAtMatrix[0][3]);
        lookAtMatrix[1] = vec4(0.0, 1.0, 0.0, lookAtMatrix[1][3]);
        lookAtMatrix[2] = vec4(0.0, 0.0, 1.0, lookAtMatrix[2][3]);
    }

    // the on-screen center of this point
    vec4 quadCenter = uProjectionMatrix * lookAtMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 screenQuadCenter = quadCenter.xy / quadCenter.w;

    // the on-screen position of a side of this quad
    vec4 quadSide = uProjectionMatrix * lookAtMatrix * vec4(radius, 0.0, 0.0, 1.0);
    vec2 screenQuadSide = quadSide.xy / quadSide.w;

    // compute the pixel radius of this point for a size of 1 in world coordinates
    float pixelRadius = length((screenQuadSide - screenQuadCenter) * uViewportSize * 0.5);

    // send the size of the char texture to the fragment shader
    fCharTextureSize = vec2(textureSize(uCharTexture, 0));

    // send the render color to the fragment shader
    vec4 color = valueForIndex(uColorPalette, int(iColor));
    if (uBackground) {
        fBackgroundColor = vec4(color.rgb, 1.0);
        fTextColor = vec4(contrastingColor(color.rgb, 7.0), 1.0);
    } else {
        fBackgroundColor = vec4(color.rgb, 0.0);
        fTextColor = vec4(color.rgb, 1.0);
    }
    fHaloColor = mix(vec4(1.), vec4(0., 0., 0., 1.), float(length(fTextColor.rgb) > 0.866));

    // send thelabel info to the fragment shader
    fLabelInfo = vec4(iLabel);

    // send the pixel radius of this label to the fragment shader
    float padding = uPadding * uPixelRatio;
    float placementOffset = (fLabelInfo[3] + padding * 2.0) * uLabelPlacement + uPlacementMargin * (-1.0 + 2.0 * uLabelPlacement) * uPixelRatio;
    fPixelRadius = pixelRadius + placementOffset;

    // calculate the render matrix
    mat4 renderMatrix = uProjectionMatrix * lookAtMatrix;

    // compute the visibility multiplier
    float visibilityMultiplier = pixelRadius >= uVisibilityThreshold * 0.5 * uPixelRatio ? 1.0 : 0.0;

    // send the normalized length of a single pixel
    fPixelLength = 1.0 / fPixelRadius;

    // send the normalized distance from the center to the fragment shader
    vFromCenter = aVertex.xy;

    // compute the vertex position and its screen position
    float pixelLength = radius / pixelRadius;
    float textRadius = radius + pixelLength * placementOffset;
    vec3 labelOffset = vec3(0.0, 0.0, uCameraMode == 1u ? 0.01 : 0.0); // offset the label forward a tiny bit so it's always in front in 3D
    vec4 worldVertex = renderMatrix * vec4(aVertex * textRadius * visibilityMultiplier + labelOffset, 1.0);

    // find the number of label repetitions
    float repeatLabels = float(uint(uRepeatLabel));
    float repeatGap = uRepeatGap * uPixelRatio;
    float diameter = fPixelRadius * M_2PI;
    float maxLabels = min(repeatLabels, floor(diameter / (fLabelInfo[2] + repeatGap + padding * 2.0)));
    float maxLabelsLength = (fLabelInfo[2] + padding * 2.0) * maxLabels;
    float labelGap = (diameter - maxLabelsLength) / maxLabels;
    fLabelStep = fLabelInfo[2] + labelGap + padding * 2.0;

    // set the render vertex location
    gl_Position = worldVertex;
}
