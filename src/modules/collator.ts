import Logger from "./logger";

function collator(logger:Logger, words: string[], customAlphabet: string[]): string[] {
    
    if (customAlphabet.length == 0) {
        return words.sort((Intl.Collator().compare));
    }

    customAlphabet.push("🔃")
    
    const orderMap = new Map<string, number>();
    customAlphabet.forEach((char, index) => orderMap.set(char, index));

    const unknownSet = new Set<string>();

function tokenize(input: string): string[] {
    const tokens: string[] = [];
    const graphemes = Array.from(orderMap.keys()).sort((a, b) => b.length - a.length); // Longest first

    let i = 0;
    while (i < input.length) {
        let matched = false;

        for (const g of graphemes) {
            if (input.startsWith(g, i)) {
                tokens.push(g);
                i += g.length;
                matched = true;
                break;
            }
        }

        if (!matched) {
            tokens.push(input[i]); // Fallback to single character
            i += 1;
        }
    }

    return tokens;
}

    function getUnknownStartGrapheme(str: string): string | null {
        const firstTwo = str.slice(0, 2);
        const firstOne = str[0];

        // If either known, no problem
        if (orderMap.has(firstTwo) || orderMap.has(firstOne)) {
            return null;
        }

        return firstOne; // Always return just the first character

    }

    function customCompare(a: string, b: string): number {
        const unknownA = getUnknownStartGrapheme(a);
        const unknownB = getUnknownStartGrapheme(b);
        if (unknownA) unknownSet.add(unknownA);
        if (unknownB) unknownSet.add(unknownB);

        const aTokens = tokenize(a);
        const bTokens = tokenize(b);
        const maxLen = Math.max(aTokens.length, bTokens.length);

        for (let i = 0; i < maxLen; i++) {
            const aTok = aTokens[i];
            const bTok = bTokens[i];
            if (aTok === undefined) return -1;
            if (bTok === undefined) return 1;

            const aIndex = orderMap.get(aTok) ?? Infinity;
            const bIndex = orderMap.get(bTok) ?? Infinity;

            if (aIndex !== bIndex) {
                return aIndex - bIndex;
            }
        }

        return 0;
    }

    const sorted = [...words].sort(customCompare);
    const unknownGraphemes:string[] = Array.from(unknownSet);
    if (unknownGraphemes.length != 0) {
        logger.warn(`The custom order stated in \`alphabet\` was ignored because words had the unknown initial graphemes: "${unknownGraphemes.join(', ')}"; missing from \`alphabet\``)
        return words.sort((Intl.Collator().compare));
    }
    
    return sorted
}

export default collator;