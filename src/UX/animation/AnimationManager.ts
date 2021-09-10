import {PropertyInterpolator, PropertyType} from './PropertyInterpolator';
import {Easing, LinearEasing} from './Easing';

export type AnimationFrameCallback = (progress: number) => void;

interface AnimationEntry {
    interpolator: PropertyInterpolator<PropertyType>;
    cb: AnimationFrameCallback;
    easing: Easing;
    duration: number;
    currentTime: number;
}

export class AnimationManager {
    private targets: Map<unknown, Map<string, AnimationEntry>> = new Map();

    public animate<T extends PropertyType>(target: unknown, property: string, duration: number, start: T, end: T, cb: AnimationFrameCallback = null, easing: Easing = LinearEasing): void {
        const needsAnimationFrame = this.targets.size === 0;

        const interpolator = new PropertyInterpolator(target, property, start, end);
        let targetAnimations = this.targets.get(target);
        if (!targetAnimations) {
            targetAnimations = new Map();
            this.targets.set(target, targetAnimations);
        }

        targetAnimations.set(property, {
            interpolator,
            cb,
            easing,
            duration,
            currentTime: null,
        });

        if (needsAnimationFrame) {
            const time = performance.now();
            requestAnimationFrame(() => this.animationFrame(time));
        }
    }

    private animationFrame(last): void {
        const time = performance.now();
        const dt = time - last;
        for (const [target, animations] of this.targets) {
            for (const [property, entry] of animations) {
                if (entry.currentTime === null) {
                    entry.currentTime = 0;
                    continue;
                }

                entry.currentTime += dt;

                const progress = Math.min(entry.currentTime / entry.duration, 1);
                entry.interpolator.setPropertyValue(entry.easing(progress));

                if (entry.cb) {
                    entry.cb(progress);
                }

                if (entry.currentTime >= entry.duration) {
                    animations.delete(property);
                }
            }

            if (!animations.size) {
                this.targets.delete(target);
            }
        }

        if (this.targets.size !== 0) {
            requestAnimationFrame(() => this.animationFrame(time));
        }
    }
}
