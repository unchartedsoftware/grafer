
float opRound(in float d, in float r) {
    return d - r;
}

float opOnion(in float d, in float r) {
    return abs(d) - r;
}

float sdCircle(vec2 p, float r ) {
    return length(p) - r;
}


