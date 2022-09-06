export function createNodePoints(count: number, radius: number = 10.0): any[] {
    const PI2 = Math.PI * 2;
    const degStep = (PI2) / count;
    const result = [];

    for (let angle = 0, i = 0; angle < PI2; angle += degStep, ++i) {
        const pX = Math.cos(angle) * radius;
        const pY = Math.sin(angle) * radius;
        result.push({
            id: `p${i}-${radius}`,
            x: pX,
            y: pY,
            radius: 2,
            label: `The quick brown fox jumped over the lazy dog`,
            color: Math.round(Math.random() * 4),
            fontSize: 16,
        });
    }

    return result;
}

export function log(logText: string): void {
    const logContainerEl = document.getElementsByClassName("log_output")[0];
    if(logContainerEl) {
        const logLineEl = document.createElement('p');
        logLineEl.innerHTML = logText;
        logContainerEl.append(logLineEl);
        logContainerEl.scrollTo(0, logContainerEl.scrollHeight);
    }
}
