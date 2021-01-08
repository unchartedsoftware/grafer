export type RectObserverCallback = (rect: DOMRectReadOnly) => void;

export default class RectObserver {
    public elementTarget: HTMLElement;
    public elementObserver: HTMLElement;
    public elementObserverId: string;
    public callback: RectObserverCallback;
    public rect: DOMRectReadOnly;
    private resizeObserver: ResizeObserver;
    private intersectionObserver: IntersectionObserver;

    constructor(callback: RectObserverCallback) {
        this.callback = callback;
    }

    public observe(element: HTMLElement): void {
        this.elementTarget = element;
        this.rect = this.getRect();
        this.elementObserver = this.generateObserver();
        this.styleObserver(this.elementObserver, this.rect);
        this.elementTarget.appendChild(this.elementObserver);

        this.attachObserver();
    }

    public disconnect(): void {
        this.resizeObserver && this.resizeObserver.disconnect();
        this.intersectionObserver && this.intersectionObserver.disconnect();
    }

    private getRect(response?: IntersectionObserverEntry | ResizeObserverEntry): DOMRect {
        // @ts-expect-error: IntersectionObserverEntry type incorrect
        if(response === IntersectionObserverEntry) {
            return (response as IntersectionObserverEntry).rootBounds;
        }
        // @ts-expect-error: ResizeObserverEntry type incorrect
        else if(response === ResizeObserverEntry) {
            return (response as ResizeObserverEntry).contentRect;
        }
        else {
            return this.elementTarget ? this.elementTarget.getBoundingClientRect() : null;
        }
    }

    private generateObserverId(): string {
        let id = null;
        let i = 0;
        while(id === null || document.getElementById(id) !== null) {
            id = `rectObserver-${i}`;
            i++;
        }
        return id;
    }

    private generateObserver(): HTMLElement {
        this.elementObserverId = this.generateObserverId();
        const observer = document.createElement('div');
        observer.classList.add('rectObserver');
        observer.id = this.elementObserverId;
        return observer;
    }

    private styleObserver(observerEl: HTMLElement, rect: DOMRectReadOnly): void {
        if(observerEl && rect) {
            observerEl.style.position = 'fixed';
            observerEl.style.top = `${rect.top}px`;
            observerEl.style.left = `${rect.left}px`;
            observerEl.style.width = `${rect.width}px`;
            observerEl.style.height = `${rect.height}px`;
            observerEl.style.pointerEvents = 'none';
        }
    }

    private attachObserver(): void {
        const observerCallbackBound = this.observerCallback.bind(this);

        this.resizeObserver = new ResizeObserver(observerCallbackBound);
        this.resizeObserver.observe(this.elementTarget);

        this.intersectionObserver = new IntersectionObserver(
            observerCallbackBound,
            {threshold: Array(1001).fill(0).map((v,i) => i/1000)}
        );
        this.intersectionObserver.observe(this.elementTarget);
    }

    private observerCallback(response: IntersectionObserverEntry | ResizeObserverEntry): void {
        this.rect = this.getRect(response);
        this.styleObserver(this.elementObserver, this.rect);
        this.callback(this.rect);
    }
}