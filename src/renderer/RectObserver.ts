export type RectObserverCallback = (rect: DOMRectReadOnly) => void;

const POLLING_RATE = 400; // ms

export default class RectObserver {
    public elementTarget: HTMLElement;
    public callback: RectObserverCallback;
    public rect: DOMRectReadOnly;
    private poll: ReturnType<typeof setInterval>;

    constructor(callback: RectObserverCallback) {
        this.callback = callback;
    }

    public observe(element: HTMLElement): void {
        this.elementTarget = element;

        this.rect = this.elementTarget.getBoundingClientRect();
        this.pollElement();
        this.poll = setInterval(this.pollElement.bind(this), POLLING_RATE);
    }

    public disconnect(): void {
        clearInterval(this.poll);
    }

    private pollElement(): void {
        const rect = this.elementTarget.getBoundingClientRect();

        // remove observer if element is removed
        if(!this.elementTarget.isConnected) {
            this.disconnect();
        }

        if(!this.rectEqual(this.rect, rect)) {
            this.rect = rect;
            this.callback(this.rect);
        }
    }

    public rectEqual(prev: DOMRectReadOnly, curr: DOMRectReadOnly): boolean {
        return prev.width === curr.width &&
        prev.height === curr.height &&
        prev.top === curr.top &&
        prev.left === curr.left;
    }
}