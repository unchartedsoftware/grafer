#version 300 es

precision lowp usampler2D;

#define M_PI 3.14159265359
#define M_2PI 6.28318530718

layout(location=0) in vec3 aVertex;
layout(location=1) in vec3 iPosition;
layout(location=2) in float iRadius;
layout(location=3) in uint iColor;
layout(location=4) in uint iBox;

//layout(std140) uniform RenderUniforms {
    uniform mat4 uViewMatrix;
    uniform mat4 uSceneMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec2 uViewportSize;
    uniform float uPixelRatio;
    uniform sampler2D uColorPalette;
//};
uniform usampler2D uLabelBoxes;
uniform sampler2D uLabelTexture;
uniform float uVisibilityThreshold;
uniform vec2 uLabelPositioning;
uniform int uRepeatLabel;
uniform float uRepeatGap;
uniform float uPlacementMargin;
uniform float uLabelPlacement;
uniform vec2 uLabelDirection;

flat out vec4 fColor;
flat out vec3 fContrastColor;
flat out vec2 fLabelSize;
flat out float fPixelRadius;
flat out float fPixelLength;
flat out float fThickness;
flat out vec4 fUV;
flat out float fLabelStep;
out vec2 vFromCenter;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)
#pragma glslify: import(../../../renderer/shaders/colorTools.glsl)

void main() {
    // claculate the offset matrix, done as a matrix to be able to compute "billboard" vertices in the shader
    mat4 offsetMatrix = mat4(1.0);
    offsetMatrix[3] = vec4(iPosition, 1.0);

    // reset the rotation of the model-view matrix
    mat4 modelMatrix = uViewMatrix * uSceneMatrix * offsetMatrix;
    mat4 lookAtMatrix = mat4(modelMatrix);
    lookAtMatrix[0] = vec4(1.0, 0.0, 0.0, lookAtMatrix[0][3]);
    lookAtMatrix[1] = vec4(0.0, 1.0, 0.0, lookAtMatrix[1][3]);
    lookAtMatrix[2] = vec4(0.0, 0.0, 1.0, lookAtMatrix[2][3]);

    // the on-screen center of this point
    vec4 quadCenter = uProjectionMatrix * lookAtMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 screenQuadCenter = quadCenter.xy / quadCenter.w;

    // the on-screen position of a side of this quad
    vec4 quadSide = uProjectionMatrix * lookAtMatrix * vec4(iRadius, 0.0, 0.0, 1.0);
    vec2 screenQuadSide = quadSide.xy / quadSide.w;

    // compute the pixel radius of this point for a size of 1 in world coordinates
    float pixelRadius = length((screenQuadSide - screenQuadCenter) * uViewportSize * 0.5);

    // get the box of the label to render
    vec4 box = vec4(uvalueForIndex(uLabelBoxes, int(iBox)));

    // calculate the label visibility
    float visibilityThreshold = uVisibilityThreshold * uPixelRatio;
    float visibilityMultiplier = smoothstep(visibilityThreshold * 0.5 - box[3], visibilityThreshold * 0.5, pixelRadius * 0.5);

    // send the pixel radius of this label to the fragment shader
    float minThickness = 3.0 * uPixelRatio;
    fThickness = (minThickness + (box[3] - minThickness) * visibilityMultiplier) * 0.5;
    fPixelRadius = pixelRadius + fThickness;

    // send the normalized length of a single pixel
    fPixelLength = 1.0 / fPixelRadius;

    // calculate the render matrix
    mat4 renderMatrix = uProjectionMatrix * lookAtMatrix;

    // and the size of the texture
    vec2 texSize = vec2(textureSize(uLabelTexture, 0));

    // send the uv to the fragment shader
    fUV = vec4(
        (box[0] / texSize.x),
        (box[1] / texSize.y),
        (box[2] / texSize.x),
        (box[3] / texSize.y)
    );

    // send the label size to the fragment shader
    fLabelSize = vec2(box[2], box[3]);

    // send the render color to the fragment shader
    fColor = valueForIndex(uColorPalette, int(iColor));
    // send the contrast color to the fragment shader
    // https://www.w3.org/TR/WCAG20/#visual-audio-contrast
    fContrastColor = contrastingColor(fColor.rgb, 7.0);

    // send the normalized distance from the center to the fragment shader
    vFromCenter = aVertex.xy;

    // compute the vertex position and its screen position
    float pixelLength = iRadius / pixelRadius;
    float textRadius = iRadius + pixelLength * fThickness;
    vec4 worldVertex = renderMatrix * vec4(aVertex * textRadius, 1.0);

    // find the number of label repetitions
    float repeatLabels = float(uint(uRepeatLabel));
    float repeatGap = uRepeatGap * uPixelRatio;
    float circumference = fPixelRadius * M_2PI;
    float maxLabels = min(repeatLabels, floor(circumference / (fLabelSize.x + repeatGap)));
    float maxLabelsLength = fLabelSize.x * maxLabels;
    float labelGap = (circumference - maxLabelsLength) / maxLabels;
    fLabelStep = fLabelSize.x + labelGap;

    // set the render vertex location
    gl_Position = worldVertex;
}
