// assume colorList is a list of 7 character hex strings (with # included)
export function generateGradient(colorList: string[], samples: number): string[] {
    const hexRgbList = [];
    const samplesPerPair = Math.ceil((samples - colorList.length) / (colorList.length - 1));

    for(let i = 0; i < colorList.length - 1; i++) {
        const startColor = colorList[i];
        const endColor = colorList[i + 1];

        // push start colour onto list
        hexRgbList.push(startColor);

        // find decimal value for start and end hex colours
        const startR = parseInt(startColor.substring(1, 3), 16);
        const startG = parseInt(startColor.substring(3, 5), 16);
        const startB = parseInt(startColor.substring(5, 7), 16);

        const endR = parseInt(endColor.substring(1, 3), 16);
        const endG = parseInt(endColor.substring(3, 5), 16);
        const endB = parseInt(endColor.substring(5, 7), 16);

        // interpolate up to the next colour on list
        for(let j = 1; j < samplesPerPair + 1; j++) {
            const interR = Math.round(startR + ((endR - startR) / (samplesPerPair + 1) * j))
                .toString(16)
                .padStart(2, '0');
            const interG = Math.round(startG + ((endG - startG) / (samplesPerPair + 1) * j))
                .toString(16)
                .padStart(2, '0');
            const interB = Math.round(startB + ((endB - startB) / (samplesPerPair + 1) * j))
                .toString(16)
                .padStart(2, '0');
            hexRgbList.push(`#${interR}${interG}${interB}`);
        }
    }

    hexRgbList.push(colorList[colorList.length - 1]);

    return hexRgbList.slice(0, samples);
}