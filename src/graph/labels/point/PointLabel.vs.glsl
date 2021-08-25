#version 300 es

precision lowp usampler2D;

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
uniform usampler2D uLabelIndices;
uniform usampler2D uCharBoxes;
uniform sampler2D uCharTexture;
uniform float uVisibilityThreshold;
uniform vec2 uLabelPlacement;
uniform bool uBackground;
uniform float uPadding;

flat out vec4 fBackgroundColor;
flat out vec4 fTextColor;
flat out vec4 fLabelInfo;
flat out float fPixelLength;
flat out vec2 fCharTextureSize;
out vec2 vFromCenter;
out vec2 vStringCoords;
out vec2 vPixelCoords;


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

    // send the normalized length of a single pixel to the fragment shader
    fPixelLength = 1.0 / max(1.0, pixelRadius);

    // send the normalized distance from the center to the fragment shader
    vFromCenter = aVertex.xy;

    // send the label size to the fragment shader
    fLabelInfo = vec4(iLabel);

    // compute the visibility multiplier
    float visibilityThreshold = uVisibilityThreshold * uPixelRatio;
    vec3 visibilityMultiplier = vec3(
        smoothstep(visibilityThreshold * 0.5, visibilityThreshold * 0.6, pixelRadius),
        smoothstep(visibilityThreshold * 0.5, visibilityThreshold * 0.525, pixelRadius),
        1.0
    );
//    float visibilityMultiplier = pixelRadius >= uVisibilityThreshold * 0.5 * uPixelRatio ? 1.0 : 0.0;

    // calculate the size of a pixel in worls coordinates with repsect to the point's position
    float pixelToWorld = radius / pixelRadius;

    // calculate the with and height of the label
    float padding = uPadding * uPixelRatio;
    vec3 labelSize = vec3((fLabelInfo[2] + padding * 2.0) * pixelToWorld, (fLabelInfo[3] + padding * 2.0) * pixelToWorld, 0.0);

    // compute the UV multiplier based on the vertices of the quad
    vec2 pixelMultiplier = vec2((aVertex.xy + 1.0) / 2.0);
    // send the pixel coords to the fragment shader
    vPixelCoords = vec2(fLabelInfo[2] + padding * 2.0, fLabelInfo[3] + padding * 2.0) * pixelMultiplier;

    // calculate the render matrix
    mat4 renderMatrix = uProjectionMatrix * lookAtMatrix;

    // claculate the label offset
    float labelMargin = 5.0 * pixelToWorld; // pixels
    vec3 labelOffset = vec3(
        (radius + labelSize.x * 0.5 + labelMargin) * uLabelPlacement.x,
        (radius + labelSize.y * 0.5 + labelMargin) * uLabelPlacement.y,
        uCameraMode == 1u ? 0.01 : 0.0
    );

    // compute the vertex position and its screen position
    vec4 worldVertex = renderMatrix * vec4(aVertex * labelSize * 0.5 * visibilityMultiplier + labelOffset, 1.0);


    // set the render vertex location
    gl_Position = worldVertex;
}
