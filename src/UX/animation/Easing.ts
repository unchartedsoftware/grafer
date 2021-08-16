export type Easing = (x: number) => number;

export function LinearEasing(x: number): number {
    return x;
}

// easing methods taken from: https://easings.net/#
const sin = Math.sin;
const cos = Math.cos;
const pow = Math.pow;
const sqrt = Math.sqrt;
const PI = Math.PI;

export function EaseInSine(x: number): number {
    return 1 - cos((x * PI) / 2);
}

export function EaseOutSine(x: number): number {
    return sin((x * PI) / 2);
}

export function EaseInOutSine(x: number): number {
    return -(cos(PI * x) - 1) / 2;
}

export function EaseInQuad(x: number): number {
    return x * x;
}

export function EaseOutQuad(x: number): number {
    return 1 - (1 - x) * (1 - x);
}

export function EaseInOutQuad(x: number): number {
    return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
}

export function EaseInCubic(x: number): number {
    return x * x * x;
}

export function EaseOutCubic(x: number): number {
    return 1 - pow(1 - x, 3);
}

export function EaseInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

export function EaseInQuart(x: number): number {
    return x * x * x * x;
}

export function EaseOutQuart(x: number): number {
    return 1 - pow(1 - x, 4);
}

export function EaseInOutQuart(x: number): number {
    return x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2;
}

export function EaseInQuint(x: number): number {
    return x * x * x * x * x;
}

export function EaseOutQuint(x: number): number {
    return 1 - pow(1 - x, 5);
}

export function EaseInOutQuint(x: number): number {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2;
}

export function EaseInExpo(x: number): number {
    return x === 0 ? 0 : pow(2, 10 * x - 10);
}

export function EaseOutExpo(x: number): number {
    return x === 1 ? 1 : 1 - pow(2, -10 * x);
}

export function EaseInOutExpo(x: number): number {
    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5 ? pow(2, 20 * x - 10) / 2
                : (2 - pow(2, -20 * x + 10)) / 2;
}

export function EaseInCirc(x: number): number {
    return 1 - sqrt(1 - pow(x, 2));
}

export function EaseOutCirc(x: number): number {
    return sqrt(1 - pow(x - 1, 2));
}

export function EaseInOutCirc(x: number): number {
    return x < 0.5
        ? (1 - sqrt(1 - pow(2 * x, 2))) / 2
        : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2;
}

export function EaseInBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
}

export function EaseOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2);
}

export function EaseInOutBack(x: number): number {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return x < 0.5
        ? (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
        : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

export function EaseInElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4);
}

export function EaseOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1;
}

export function EaseInOutElastic(x: number): number {
    const c5 = (2 * Math.PI) / 4.5;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5
                ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
                : (pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1;
}

export function EaseOutBounce(x: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

export function EaseInBounce(x: number): number {
    return 1 - EaseOutBounce(1 - x);

}

export function EaseInOutBounce(x: number): number {
    return x < 0.5
        ? (1 - EaseOutBounce(1 - 2 * x)) / 2
        : (1 + EaseOutBounce(2 * x - 1)) / 2;
}
