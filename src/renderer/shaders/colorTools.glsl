// from https://en.wikipedia.org/wiki/SRGB#The_reverse_transformation
float luminance_x(float x) {
    return x <= 0.04045 ? x / 12.92 : pow((x + 0.055) / 1.055, 2.4);
}
float color_l(float l) {
    return min(1.0, max(0.0, l <= 0.0031308 ? l * 12.92 : pow(l * 1.055, 1.0 / 2.4) - 0.055));
}

// from https://en.wikipedia.org/wiki/Relative_luminance
float rgb2luminance(vec3 color) {
    // relative luminance
    // see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    float r = luminance_x(color.r);
    float g = luminance_x(color.g);
    float b = luminance_x(color.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

vec3 setLuminance(vec3 color, float luminance) {
    float r = luminance_x(color.r) * 0.2126;
    float g = luminance_x(color.g) * 0.7152;
    float b = luminance_x(color.b) * 0.0722;
    float colorLuminance = r + g + b;

    float tr = luminance * (r / colorLuminance);
    float tg = luminance * (g / colorLuminance);
    float tb = luminance * (b / colorLuminance);

    float rr = color_l(tr / 0.2126);
    float rg = color_l(tg / 0.7152);
    float rb = color_l(tb / 0.0722);

    return vec3(rr, rg, rb );
}

// https://www.w3.org/TR/WCAG20/#contrast-ratiodef
// (L1 + 0.05) / (L2 + 0.05), where
// - L1 is the relative luminance of the lighter of the colors, and
// - L2 is the relative luminance of the darker of the colors.
float findDarker(float luminance, float contrast) {
    return (contrast * luminance) + (0.05 * contrast) - 0.05;
}
float findLighter(float luminance, float contrast) {
    return (luminance + 0.05 - (0.05 * contrast)) / contrast;
}

vec3 contrastingColor(vec3 color, float contrast) {
    float luminance = rgb2luminance(color);
    float darker = findDarker(luminance, contrast);
    float lighter = findLighter(luminance, contrast);

    float targetLuminance;
    if (darker < 0.0 || darker > 1.0) {
        targetLuminance = lighter;
    } else if (lighter < 0.0 || lighter > 1.0) {
        targetLuminance = darker;
    } else {
        targetLuminance = abs(luminance - lighter) < abs(darker - luminance) ? lighter : darker;
    }

    return setLuminance(color, targetLuminance);
}

vec3 desaturateColor(vec3 color, float amount) {
    float l = rgb2luminance(color);
    vec3 gray = vec3(l, l, l);
    return mix(color, gray, amount);
}
