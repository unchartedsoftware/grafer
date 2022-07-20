vec4 renderChar(float charWidth, vec4 texPixel, vec4 backgroundColor, vec4 haloColor, vec4 textColor, float halo) {
    float edgeThreshold = 0.49;
    float haloThreshold = 0.18; // sets max halo threshold
    float smoothing = 1.0 / charWidth;
    float distance = texPixel.a;

    vec4 finalColor = backgroundColor;
    if (distance > edgeThreshold - smoothing) { // text fill
        float textEdge = smoothstep(edgeThreshold - smoothing, edgeThreshold + smoothing, distance);
        vec4 textEdgeBlendColor = mix(haloColor, backgroundColor, float(halo == 0.));
        finalColor = mix(textEdgeBlendColor, textColor, textEdge);
    }
    else if (distance > edgeThreshold - haloThreshold * halo - smoothing) { // outline
        float haloEdge = smoothstep(edgeThreshold - haloThreshold * halo - smoothing, edgeThreshold - haloThreshold * halo + smoothing, distance);
        finalColor = mix(backgroundColor, haloColor, haloEdge);
    }

    return finalColor;
}