// most of these come from this excellent post:
// https://iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm

float opRound(in float d, in float r) {
    return d - r;
}

float opOnion(in float d, in float r) {
    return abs(d) - r;
}

float sdCircle(in vec2 p, in float r ) {
    return length(p) - r;
}

float sdEquilateralTriangle(in vec2 p, in float r) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + (r) / k;
    if (p.x + k * p.y > 0.0) {
        p = vec2(p.x-k*p.y,-k*p.x-p.y) / 2.0;
    }
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}

float sdPentagon(in vec2 p, in float r) {
    const vec3 k = vec3(0.809016994, 0.587785252, 0.726542528);
    p.y = -(p.y) * 1.25;
    p.x = abs(p.x) * 1.25;
    p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
    p -= 2.0 * min(dot(vec2(k.x, k.y), p), 0.0) * vec2(k.x, k.y);
    p -= vec2(clamp(p.x, -r*k.z, r*k.z), r);
    return length(p) * sign(p.y);
}

float sdOctagon(in vec2 p, in float r) {
    // pi/8: cos, sin, tan.
    const vec3 k = vec3(
        -0.9238795325,   // sqrt(2+sqrt(2))/2
        0.3826834323,   // sqrt(2-sqrt(2))/2
        0.4142135623
    ); // sqrt(2)-1
    // reflections
    p = abs(p) * 1.1;
    p -= 2.0 * min(dot(vec2(k.x,k.y), p), 0.0) * vec2(k.x,k.y);
    p -= 2.0 * min(dot(vec2(-k.x,k.y), p), 0.0) * vec2(-k.x,k.y);
    // Polygon side.
    p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
    return length(p) * sign(p.y);
}

float sdStar(in vec2 p, in float r, in uint n, in float m) { // m=[2,n]
    // these 4 lines can be precomputed for a given shape
    float an = 3.141593 / float(n);
    float en = 3.141593 / m;
    vec2  acs = vec2(cos(an), sin(an));
    vec2  ecs = vec2(cos(en), sin(en)); // ecs=vec2(0,1) and simplify, for regular polygon,

    // reduce to first sector
    float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
    p = length(p) * vec2(cos(bn), abs(sin(bn)));

    // line sdf
    p -= r * acs;
    p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
    return length(p) * sign(p.x);
}

float sdCross(in vec2 p, in float w, in float r) {
    p = abs(p);
    return length(p - min(p.x + p.y, w) * 0.5) - r;
}

// TODO: Precompute this, we always pass the same parameters tot his function (v, vec2(1.0, 0.3), 0.0)
float sdPlus( in vec2 p, in vec2 b, float r ) {
    p = abs(p);
    p = (p.y > p.x) ? p.yx : p.xy;

    vec2  q = p - b;
    float k = max(q.y, q.x);
    vec2  w = (k > 0.0) ? q : vec2(b.y - p.x, -k);

    return sign(k)*length(max(w, 0.0)) + r;
}
