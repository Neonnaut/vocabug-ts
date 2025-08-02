function categories_into_transform(
    input: string,
    categories: Map<string, { graphemes: string[], weights: number[] }>
): string {
    const validPattern = /\[([A-Z])\]|\(([A-Z])\)|(?<=^|[ ,])([A-Z])(?=$|[ ,])/g;
    let output = '';
    let lastIndex = 0;

    for (const match of input.matchAll(validPattern)) {
        const [fullMatch] = match;
        const index = match.index!;
        const key = match[1] || match[2] || match[3]!;

        const interim = input.slice(lastIndex, index);
        const illegal = interim.match(/[A-Z]/g);
        if (illegal) {
            throw new Error(`Invalid category usage: ${illegal.join(', ')}`);
        }

        const entry = categories.get(key);
        let resolved = entry ? entry.graphemes.join(', ') : key;

        if (match[1]) resolved = `[${resolved}]`;      // preserve square brackets
        else if (match[2]) resolved = `(${resolved})`; // preserve parentheses

        output += interim + resolved;
        lastIndex = index + fullMatch.length;
    }

    const trailing = input.slice(lastIndex);
    const illegal = trailing.match(/[A-Z]/g);
    if (illegal) {
        throw new Error(`Invalid category usage: ${illegal.join(', ')}`);
    }

    output += trailing;
    return output;
}


let xnput = '[C]lll[C]l, C, Z';

let map:Map<string, { graphemes:string[], weights:number[] }> = new Map;
map.set('C', { graphemes:['a','b','v'], weights:[1, 2, 3] });
map.set('Z', { graphemes:['z'], weights:[1] });

console.log(categories_into_transform(xnput, map));