import Word from './word.js';
import Logger from './logger';

class Transformer {
    public logger: Logger;
   
    public graphemes: string[];
    public transforms: { target:string[], result:string[] }[];

    constructor(
        logger: Logger,
        graphemes: string[],
        transforms: { target:string[], result:string[] }[]
    ) {
        this.logger = logger;
        this.graphemes = graphemes;
        this.transforms = transforms;
    }

    // Updated spelling here
    graphemosis(input: string, graphemes: string[]): string[] {
        const tokens: string[] = [];
        let i = 0;
        while (i < input.length) {
            let matched = false;
            for (const g of graphemes.sort((a, b) => b.length - a.length)) {
                if (input.startsWith(g, i)) {
                    tokens.push(g);
                    i += g.length;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                tokens.push(input[i]);
                i++;
            }
        }

        return tokens;
    }

    applyTransform(
        word: Word,
        tokens: string[],
        transform: { target: string[], result: string[] }
    ): string[] {
        let applied:boolean = false;
        const { target, result } = transform;

        if (target.length !== result.length) {
            throw new Error("Mismatched target/result concurrent set lengths in a transform");
        }

        const replacements: { index: number; length: number; replacement: string }[] = [];

        for (let i = 0; i < target.length; i++) {
            let rawSearch = target[i];
            let isDelete: boolean;
            if (result[i] === "^") {
                isDelete = true;
            } else {
                isDelete = false;
            }
            let replacement = isDelete ? "" : result[i];

            if (replacement == "^REJECT") {
                for (let j = 0; j <= tokens.length - rawSearch.length; j++) {
                    const window = tokens.slice(j, j + rawSearch.length).join("");
                    if (window === rawSearch) {
                        word.rejected = true;
                        word.record_transformation(`${transform.target.join(", ")} → ^REJECT`, "❌");
                        return tokens;
                    }
                }
            }
            // Prefix match
            if (rawSearch.startsWith("#")) {
                // Remove backslash
                rawSearch = rawSearch.replace(/\\/g, "");
                replacement = replacement.replace(/\\/g, "");

                const needle = rawSearch.slice(1);
                const head = tokens.slice(0, needle.length).join("");
                if (head === needle) {
                    replacements.push({ index: 0, length: needle.length, replacement });
                    applied = true;
                }
            // Suffix match
            } else if (rawSearch.endsWith("#") && !rawSearch.endsWith("\\#")) {
                // Remove backslash
                rawSearch = rawSearch.replace(/\\/g, "");
                replacement = replacement.replace(/\\/g, "");
                const needle = rawSearch.slice(0, -1);
                const tail = tokens.slice(-needle.length).join("");
                if (tail === needle) {
                    replacements.push({
                        index: tokens.length - needle.length,
                        length: needle.length,
                        replacement
                    });
                    applied = true;
                }

            // Anywhere match
            } else {
                // Remove backslash
                rawSearch = rawSearch.replace(/\\/g, "");
                replacement = replacement.replace(/\\/g, "");
                for (let j = 0; j <= tokens.length - rawSearch.length; j++) {
                    const window = tokens.slice(j, j + rawSearch.length).join("");
                    if (window === rawSearch) {
                        replacements.push({ index: j, length: rawSearch.length, replacement });
                        applied = true;
                    }
                }
            }
        }

        // Apply all replacements non-destructively
        replacements.sort((a, b) => a.index - b.index);
        const blocked = new Set<number>();
        const resultTokens: string[] = [];

        let i = 0;
        while (i < tokens.length) {
            const match = replacements.find(r =>
                r.index === i &&
                ![...Array(r.length).keys()].some(k => blocked.has(i + k))
            );

            if (match) {
                if (match.replacement !== "") {
                    resultTokens.push(match.replacement);
                }
            for (let k = 0; k < match.length; k++) {
                blocked.add(i + k);
            }
            i += match.length;
            } else {
                resultTokens.push(tokens[i]);
                i++;
            }
        }

        if (applied) {
            word.record_transformation(`${transform.target.join(", ")} → ${transform.result.join(", ")}`, resultTokens.join("·"));
        }
        return resultTokens;
    }

    do_transforms(
        word: Word,
    ): Word {
        if (this.transforms.length == 0) {
            return word; // No transforms 
        }

        let tokens = this.graphemosis(word.get_last_form(), this.graphemes);
        word.record_transformation("graphemosis", `${tokens.join("·")}`);

        for (const t of this.transforms) {
            if (word.rejected) {
                break;
            }
            tokens = this.applyTransform(word, tokens, t);
            if (tokens.length == 0) {
                word.rejected = true;
                word.record_transformation(`REJECT NULL WORD`, `❌`);
            }
        }

        if (!word.rejected) {
            word.record_transformation("retrographemosis", `${tokens.join("")}`);
        }

        return word;
    }
}

export default Transformer;