// singleton functions and variables
const subscriberSet: Set<(number) => void> = new Set();
function listenOnDevicePixelRatio(): void {
    function onChange(): void {
        for(const subscriberFn of subscriberSet.values()) {
            subscriberFn(window.devicePixelRatio);
        }
        listenOnDevicePixelRatio();
    }
    matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
        .addEventListener('change', onChange, { once: true });
}
listenOnDevicePixelRatio();

// exported types and class

export type PixelRatioObserverCallback = (devicePixelRatio: number) => void;

export class PixelRatioObserver {
    private callback: PixelRatioObserverCallback;
    public devicePixelRatio: number;

    constructor(callback: PixelRatioObserverCallback) {
        this.callback = (pixelRatio: number): void => {
            this.devicePixelRatio = pixelRatio;
            callback(pixelRatio);
        };
        subscriberSet.add(callback);
    }

    public disconnect(): void {
        subscriberSet.delete(this.callback);
    }
}