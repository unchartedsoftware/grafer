#version 300 es

layout(location=0) in uint aSourceIndex;
layout(location=1) in uint aTargetIndex;
layout(location=2) in uint aSourceClusterIndex;
layout(location=3) in uint aTargetClusterIndex;
layout(location=4) in uint aSourceColor;
layout(location=5) in uint aTargetColor;
layout(location=6) in uvec2 aHyperEdgeStats;
layout(location=7) in uint aIndex;
layout(location=8) in uvec4 aPickingColor;

uniform sampler2D uGraphPoints;

out vec3 vSource;
out vec3 vTarget;
out vec3 vControl;
flat out uint vSourceColor;
flat out uint vTargetColor;
out vec2 vColorMix;
flat out uvec4 vPickingColor;

// manual import from ../../../renderer/shaders/valueForIndex.glsl
// to avoid uvec4 glslify error
vec4 valueForIndex(sampler2D tex, int index) {
    int texWidth = textureSize(tex, 0).x;
    int col = index % texWidth;
    int row = index / texWidth;
    return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
    vec4 source = valueForIndex(uGraphPoints, int(aSourceIndex));
    vec4 target = valueForIndex(uGraphPoints, int(aTargetIndex));
    vec4 sourceCluster = valueForIndex(uGraphPoints, int(aSourceClusterIndex));
    vec4 targetCluster = valueForIndex(uGraphPoints, int(aTargetClusterIndex));

    vec3 direction = normalize(vec3(targetCluster.xy, 0.0) - vec3(sourceCluster.xy, 0.0));
    // assume 2D and ignore Z, future Dario, make this 3D!
    vec3 perp = vec3(-direction.y, direction.x, direction.z);
    float minClusterRadius = min(sourceCluster[3], targetCluster[3]);
    float edgeWidth = minClusterRadius * 0.0005; // magic number
    float maxOffset = minClusterRadius * 0.1; // magic number
    float offsetLength = min(maxOffset, edgeWidth * float(aHyperEdgeStats[1]));
    vec3 offset = (-perp * offsetLength * 0.5) + (perp * (offsetLength / float(aHyperEdgeStats[1])) * float(aHyperEdgeStats[0]));

    vec3 sourceClusterEdge = sourceCluster.xyz + direction * sourceCluster[3] + offset;
    vec3 targetClusterEdge = targetCluster.xyz - direction * targetCluster[3] + offset;

    float edgeToEdge = length(targetClusterEdge - sourceClusterEdge);
    vec3 bundlePoint = sourceClusterEdge + direction * (edgeToEdge * 0.5);

    vec3 sourceEdgeToNode = sourceClusterEdge - source.xyz - direction * source[3];
    float sourceNodeAdjacent = dot(normalize(sourceEdgeToNode), direction) * length(sourceEdgeToNode);
    vec3 sourceClusterControl = sourceClusterEdge - direction * min(sourceNodeAdjacent * 0.75, sourceCluster[3]);
    vec3 sourceControlDirection = normalize(sourceClusterControl - source.xyz);
    vec3 sourcePoint = source.xyz + sourceControlDirection * source[3];

    vec3 targetEdgeToNode = target.xyz - targetClusterEdge - direction * target[3];
    float targetNodeAdjacent = dot(normalize(targetEdgeToNode), direction) * length(targetEdgeToNode);
    vec3 targetClusterControl = targetClusterEdge + direction * min(targetNodeAdjacent * 0.75, targetCluster[3]);
    vec3 targetControlDirection = normalize(targetClusterControl - target.xyz);
    vec3 targetPoint = target.xyz + targetControlDirection * target[3];

    // TODO: Optimize this to avoid branches. (If performance becomes a problem)
    if (aIndex == 0u) {
        if (aSourceIndex == aSourceClusterIndex) {
            vSource = sourcePoint;
            vControl = sourcePoint;
            vTarget = sourcePoint;
        } else {
            vSource = sourcePoint;
            vControl = sourceClusterControl;
            vTarget = (sourceClusterControl + bundlePoint) / 2.0;
        }
    } else if (aIndex == 1u) {
        if (aSourceIndex == aSourceClusterIndex) {
            vSource = sourcePoint;
        } else {
            vSource = (sourceClusterControl + bundlePoint) / 2.0;
        }

        vControl = bundlePoint;

        if (aTargetIndex == aTargetClusterIndex) {
            vTarget = targetPoint;
        } else {
            vTarget = (bundlePoint + targetClusterControl) / 2.0;
        }
    } else {
        if (aTargetIndex == aTargetClusterIndex) {
            vSource = targetPoint;
            vControl = targetPoint;
            vTarget = targetPoint;
        } else {
            vSource = (bundlePoint + targetClusterControl) / 2.0;
            vControl = targetClusterControl;
            vTarget = targetPoint;
        }
    }

    vSourceColor = aSourceColor;
    vTargetColor = aTargetColor;

    vColorMix = vec2(float(aIndex) * 0.25, float(aIndex + 1u) * 0.25);

    vPickingColor = aPickingColor;
}
