#version 300 es

layout(location=0) in vec3 aVertex;
layout(location=1) in vec3 iPosition;
layout(location=2) in float iRadius;
layout(location=3) in uvec4 iColor;

//layout(std140) uniform RenderUniforms {
    uniform mat4 uViewMatrix;
    uniform mat4 uSceneMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec2 uViewportSize;
    uniform float uPixelRatio;
//};

uniform float uMinSize;
uniform float uMaxSize;
uniform bool uPixelSizing;
uniform bool uBillboard;

flat out vec4 fColor;
flat out float fPixelRadius;
out vec2 vPixelLocation;

void main() {
    // claculate the offset matrix, done as a matrix to be able to compute "billboard" vertices in the shader
    mat4 offsetMatrix = mat4(1.0);
    offsetMatrix[3] = vec4(iPosition, 1.0);

    // reset the rotation of the model-view matrix
    mat4 lookAtMatrix = uViewMatrix * uSceneMatrix * offsetMatrix;
    lookAtMatrix[0] = vec4(1.0, 0.0, 0.0, lookAtMatrix[0][3]);
    lookAtMatrix[1] = vec4(0.0, 1.0, 0.0, lookAtMatrix[1][3]);
    lookAtMatrix[2] = vec4(0.0, 0.0, 1.0, lookAtMatrix[2][3]);

    // calculate the render matrix
    mat4 renderMatrix = uProjectionMatrix * lookAtMatrix;

    // the on-screen center of this node
    vec4 quadCenter = renderMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 screenQuadCenter = quadCenter.xy / quadCenter.w;

    // the on-screen position of a side of this quad
    vec4 quadSide = renderMatrix * vec4(1.0, 0.0, 0.0, 1.0);
    vec2 screenQuadSide = quadSide.xy / quadSide.w;

    // compute the pixel radius of this node for a size of 1 in worls coordinates
    float pixelRadius = max(1.0, length((screenQuadSide - screenQuadCenter) * uViewportSize));

    // calculate the desired pixel radius for the size mode
    float size = iRadius; // uMinSize + (uMaxSize - uMinSize) * iRadius;
    float desiredPixelRadius = (uPixelSizing ? size : pixelRadius * size);

    // calculate the pixel radius multiplier needed to acomplish the desired pixel radius
    float pixelRadiusMult = desiredPixelRadius / pixelRadius;

    // compute the vertex position and its screen position
    vec4 worldVertex = uBillboard ?
        renderMatrix * vec4(aVertex * pixelRadiusMult, 1.0) :
        uProjectionMatrix * uViewMatrix * uSceneMatrix * vec4(aVertex * pixelRadiusMult + iPosition, 1.0);

    // send the render color to the fragment shader
    fColor = vec4(iColor) / 255.0;
    // send the final pixel radius to the fragment shader
    fPixelRadius = floor(desiredPixelRadius);
    // send the computed pixel location to the fragment shader
    vPixelLocation = aVertex.xy * fPixelRadius;

    // set the render vertex location
    gl_Position = worldVertex;
}
