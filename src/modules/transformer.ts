import Word from './word';

class Transformer {   
    private graphemes: string[];
    private transforms: { target:string[], result:string[], line_num:string }[];

    constructor(
        graphemes: string[],
        transforms: { target:string[], result:string[], line_num:string }[]
    ) {
        this.graphemes = graphemes;
        this.transforms = transforms;
    }

    graphemosis(input: string): string[] {
        const tokens: string[] = [];
        let i = 0;
        while (i < input.length) {
            let matched = false;
            for (const g of this.graphemes.sort((a, b) => b.length - a.length)) {
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

    spanToLength(tokens: string[], targetLength: number): number {
        let total = 0;
        for (let i = 0; i < tokens.length; i++) {
            total += tokens[i].length;
            if (total >= targetLength) return i + 1;
        }
        return tokens.length;
    }


applyTransform(
    word: Word,
    tokens: string[],
    transform: { target: string[]; result: string[], line_num:string}
): string[] {
    function spanToLength(subTokens: string[], targetLen: number): number {
        let count = 0;
        for (let i = 0; i < subTokens.length; i++) {
            count += subTokens[i].length;
            if (count >= targetLen) return i + 1;
        }
        return subTokens.length;
    }

    const { target, result } = transform;

    if (target.length !== result.length) {
        // We've already done this in resolover, but, you know...
        throw new Error("Mismatched target/result concurrent set lengths in a transform");
    }

    const replacements: { index: number; length: number; replacement: string }[] = [];

    for (let i = 0; i < target.length; i++) {
        let rawSearch = target[i];
        const isDelete = result[i] === "^" || result[i] === "∅";
        let replacement = isDelete ? "" : result[i];

        if (replacement === "^REJECT" || replacement === "^R") {
            for (let j = 0; j < tokens.length; j++) {
                const subTokens = tokens.slice(j);
                const span = spanToLength(subTokens, rawSearch.length);
                const window = subTokens.slice(0, span).join("");

                if (window === rawSearch) {
                    word.rejected = true;
                    word.record_transformation(`${rawSearch} → ^REJECT`, transform.line_num, "❌");
                    return tokens;
                }
            }
        }


        // 🔒 Full-string match: #...#
        if (rawSearch.startsWith("#") && rawSearch.endsWith("#") && !rawSearch.endsWith("\\#") && rawSearch.length > 2) {
            rawSearch = rawSearch.replace(/\\/g, "");
            replacement = replacement.replace(/\\/g, "");
            const needle = rawSearch.slice(1, -1);
            const joined = tokens.join("");
            if (joined === needle) {
                replacements.push({ index: 0, length: tokens.length, replacement });
            }
            continue;
        }

        // ⛳ Prefix match: #abc
        if (rawSearch.startsWith("#")) {
            rawSearch = rawSearch.replace(/\\/g, "");
            replacement = replacement.replace(/\\/g, "");
            const needle = rawSearch.slice(1);
            const span = spanToLength(tokens, needle.length);
            const head = tokens.slice(0, span).join("");
            if (head === needle) {
                replacements.push({ index: 0, length: span, replacement });
            }
            continue;
        }

        // 🏁 Suffix match: abc#
        if ( rawSearch.endsWith("#")  && !rawSearch.endsWith("\\#") ) {
            rawSearch = rawSearch.replace(/\\/g, "");
            replacement = replacement.replace(/\\/g, "");
            const needle = rawSearch.slice(0, -1);
            const reversed = [...tokens].reverse();
            const span = spanToLength(reversed, needle.length);
            const tail = reversed.slice(0, span).reverse().join("");
            if (tail === needle) {
                replacements.push({
                    index: tokens.length - span,
                    length: span,
                    replacement,
                });
            }
            continue;
        }

        rawSearch = rawSearch.replace(/\\/g, "");
        replacement = replacement.replace(/\\/g, "");

        // 🔍 Anywhere match
        for (let j = 0; j < tokens.length; j++) {
            const subTokens = tokens.slice(j);
            const span = spanToLength(subTokens, rawSearch.length);
            const window = subTokens.slice(0, span).join("");
            if (window === rawSearch) {
                replacements.push({ index: j, length: span, replacement });
            }
        }
    }

    // ✂️ Apply replacements non-destructively
    replacements.sort((a, b) => a.index - b.index);
    const blocked = new Set<number>();
    const resultTokens: string[] = [];

    let i = 0;
    while (i < tokens.length) {
        const match = replacements.find(
            r =>
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

    const normalized = this.graphemosis(resultTokens.join(""));

    const appliedSet = this.normalizeReplacements(tokens, replacements);

    const matchedTargets: string[] = [];
    const matchedResults: string[] = [];

    for (let i = 0; i < transform.target.length; i++) {
        const target = transform.target[i].replace(/\\/g, "");
        const result =
        transform.result[i] === "^" || transform.result[i] === "∅"
            ? ""
            : transform.result[i].replace(/\\/g, "");
        const recorded = transform.result[i];

        if (appliedSet.has(`${target}→${result}`)) {
            matchedTargets.push(transform.target[i]);
            matchedResults.push(recorded);
        }
    }


    if (matchedTargets.length > 0) {
        word.record_transformation(
        `${matchedTargets.join(", ")} → ${matchedResults.join(", ")}`, transform.line_num,
        normalized.join(" ")
        );
    }

    return normalized;
}

normalizeReplacements(tokens: string[], replacements: { index: number; length: number; replacement: string }[]): Set<string> {
  const applied = new Set<string>();

  for (const r of replacements) {
    const span = tokens.slice(r.index, r.index + r.length).join("");
    applied.add(`${span}→${r.replacement}`);
  }

  return applied;
}


    do_transforms(
        word: Word,
    ): Word {
        if (word.get_last_form() == ''){
            word.rejected = true;
            return word;
        }
        if (this.transforms.length == 0) {
            return word; // No transforms 
        }

        let tokens = this.graphemosis(word.get_last_form());
        word.record_transformation("graphemosis", '', `${tokens.join(" ")}`);

        for (const t of this.transforms) {
            if (word.rejected) {
                break;
            }
            tokens = this.applyTransform(word, tokens, t);
            if (tokens.length == 0) {
                word.rejected = true;
                word.record_transformation(`REJECT NULL WORD`, '', `❌`);
            }
        }

        if (!word.rejected) {
            word.record_transformation("retrographemosis", '', `${tokens.join("")}`);
        }

        return word;
    }
}

export default Transformer;