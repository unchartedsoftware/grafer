export abstract class UXModule {
    private _enabled: boolean = false;
    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        if (value !== this._enabled) {
            this._enabled = value;
            if (this._enabled) {
                this.hookEvents();
            } else {
                this.unhookEvents();
            }
        }
    }

    protected abstract hookEvents(): void;
    protected abstract unhookEvents(): void;
}
