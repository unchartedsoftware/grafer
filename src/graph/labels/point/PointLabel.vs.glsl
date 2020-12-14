#version 300 es

precision lowp usampler2D;

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
uniform vec2 uLabelPlacement;

flat out vec4 fColor;
flat out vec2 fLabelSize;
flat out float fPixelLength;
out vec2 vFromCenter;
out vec2 vUV;


#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)

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


    // send the render color to the fragment shader
    fColor = valueForIndex(uColorPalette, int(iColor));
    // send the normalized length of a single pixel to the fragment shader
    fPixelLength = 1.0 / max(1.0, pixelRadius);
    // send the normalized distance from the center to the fragment shader
    vFromCenter = aVertex.xy;

    // get the box of the label to render
    vec4 box = vec4(uvalueForIndex(uLabelBoxes, int(iBox)));
    // and the size of the texture
    vec2 texSize = vec2(textureSize(uLabelTexture, 0));
    // compute the UV multiplier based on the vertices of the quad
    vec2 uvMultiplier = vec2((aVertex.xy + 1.0) / 2.0);
    // compute the uv for the label
    float u = (box[0] / texSize.x) + (box[2] / texSize.x) * uvMultiplier.x;
    float v = (box[1] / texSize.y) + (box[3] / texSize.y) * uvMultiplier.y;

    // send the uv to the fragment shader
    vUV = vec2(u, v);

    // send the label size to the fragment shader
    fLabelSize = vec2(box[2], box[3]);

    // compute the visibility multiplier
    float visibilityMultiplier = pixelRadius >= uVisibilityThreshold * 0.5 * uPixelRatio ? 1.0 : 0.0;

    // calculate the size of a pixel in worls coordinates with repsect to the point's position
    float pixelToWorld = iRadius / pixelRadius;

    // calculate the with and height of the label
    vec3 labelSize = vec3(box[2] * pixelToWorld, box[3] * pixelToWorld, 0.0);

    // calculate the render matrix
    mat4 renderMatrix = uProjectionMatrix * lookAtMatrix;

    // claculate the label offset
    float labelMargin = 5.0 * pixelToWorld; // pixels
    vec3 labelOffset = vec3(
        (iRadius + labelSize.x * 0.5 + labelMargin) * uLabelPlacement.x,
        (iRadius + labelSize.y * 0.5 + labelMargin) * uLabelPlacement.y,
        0.0
    );

    // compute the vertex position and its screen position
    vec4 worldVertex = renderMatrix * vec4(aVertex * labelSize * 0.5 * visibilityMultiplier + labelOffset, 1.0);


    // set the render vertex location
    gl_Position = worldVertex;
}
