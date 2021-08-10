#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in uint iPositionIndex;
layout(location=2) in float iRadius;
layout(location=3) in uint iColor;
layout(location=4) in uvec4 iPickingColor;

//layout(std140) uniform RenderUniforms {
    uniform mat4 uViewMatrix;
    uniform mat4 uSceneMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec2 uViewportSize;
    uniform float uPixelRatio;
    uniform sampler2D uGraphPoints;
    uniform sampler2D uColorPalette;
//};

uniform bool uPixelSizing;
uniform bool uBillboard;

uniform bool uPicking;

flat out vec4 fColor;
flat out float fPixelLength;
out vec2 vFromCenter;

#pragma glslify: import(../../../renderer/shaders/valueForIndex.glsl)

void main() {
    // claculate the offset matrix, done as a matrix to be able to compute "billboard" vertices in the shader
    mat4 offsetMatrix = mat4(1.0);
    offsetMatrix[3] = vec4(valueForIndex(uGraphPoints, int(iPositionIndex)).xyz, 1.0);

    // reset the rotation of the model-view matrix
    mat4 modelMatrix = uViewMatrix * uSceneMatrix * offsetMatrix;
    mat4 lookAtMatrix = mat4(modelMatrix);
    lookAtMatrix[0] = vec4(1.0, 0.0, 0.0, lookAtMatrix[0][3]);
    lookAtMatrix[1] = vec4(0.0, 1.0, 0.0, lookAtMatrix[1][3]);
    lookAtMatrix[2] = vec4(0.0, 0.0, 1.0, lookAtMatrix[2][3]);

    // the on-screen center of this node
    vec4 quadCenter = uProjectionMatrix * lookAtMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 screenQuadCenter = quadCenter.xy / quadCenter.w;

    // the on-screen position of a side of this quad
    vec4 quadSide = uProjectionMatrix * lookAtMatrix * vec4(iRadius, 0.0, 0.0, 1.0);
    vec2 screenQuadSide = quadSide.xy / quadSide.w;

    // compute the pixel radius of this node for a size of 1 in world coordinates
    float pixelRadius = max(1.0, length((screenQuadSide - screenQuadCenter) * uViewportSize * 0.5));

    // calculate the desired pixel radius for the size mode
    float desiredPixelRadius = (uPixelSizing ? iRadius : pixelRadius);

    // calculate the pixel radius multiplier needed to acomplish the desired pixel radius
    float pixelRadiusMult = desiredPixelRadius / pixelRadius;

    // calculate the render matrix
    mat4 renderMatrix = uBillboard ? uProjectionMatrix * lookAtMatrix : uProjectionMatrix * modelMatrix;

    // compute the vertex position and its screen position
    vec4 worldVertex = renderMatrix * vec4(aVertex * iRadius * pixelRadiusMult, 1.0);

    // send the render color to the fragment shader
    fColor = uPicking ? vec4(iPickingColor) / 255.0 : valueForIndex(uColorPalette, int(iColor));
    // send the normalized length of a single pixel to the fragment shader
    fPixelLength = 1.0 / desiredPixelRadius;
    // send the normalized distance from the center to the fragment shader
    vFromCenter = aVertex.xy;

    // set the render vertex location
    gl_Position = worldVertex;
}
