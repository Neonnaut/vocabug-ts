import Word from './word';
import Logger from './logger';

import { xsampa_to_ipa, ipa_to_xsampa } from './xsama';

class Transformer {
    public logger: Logger;
   
    public graphemes: string[];
    public transforms: {
        target:string[], result:string[],
        conditions:{ before:string, after:string }[], exceptions:{ before:string, after:string }[],
        line_num:number
    }[];

    constructor(
        logger: Logger,
        graphemes: string[],
        transforms: {
            target:string[], result:string[],
            conditions:{ before:string, after:string }[], exceptions:{ before:string, after:string }[],
            line_num:number
        }[]
    ) {
        this.logger = logger;
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
        transform: {
            target: string[];
            result: string[];
            conditions: { before: string; after: string }[];
            exceptions: { before: string; after: string }[];
            line_num: number;
        }
    ): string[] {
        function spanToLength(subTokens: string[], targetLen: number): number {
            let count = 0;
            for (let i = 0; i < subTokens.length; i++) {
                count += subTokens[i].length;
                if (count >= targetLen) return i + 1;
            }
            return subTokens.length;
        }

        function contextMatches(
            full: string,
            startIdx: number,
            rawSearch: string,
            before: string,
            after: string
        ): boolean {
            const targetLen = rawSearch.length;

            // BEFORE logic
            if (before === "#") {
                if (startIdx !== 0) return false;
            } else if (before.startsWith("#")) {
                const expected = before.slice(1);
                if (startIdx !== 0 || full.slice(0, startIdx) !== expected) return false;
            } else {
                const actual = full.slice(Math.max(0, startIdx - before.length), startIdx);
                if (actual !== before) return false;
            }

            // AFTER logic
            if (after === "#") {
                if (startIdx + targetLen !== full.length) return false;
            } else if (after.endsWith("#")) {
                const expected = after.slice(0, -1);
                if (startIdx + targetLen !== full.length || full.slice(startIdx + targetLen) !== expected) return false;
            } else {
                const actual = full.slice(startIdx + targetLen, startIdx + targetLen + after.length);
                if (actual !== after) return false;
            }

            return true;
        }

        const { target, result, conditions, exceptions, line_num } = transform;

        const fullWord = tokens.join("");

        if (target[0] === "engine:") {
            let modifiedWord = ''
            switch (result[0]) {
                case "decompose":
                    modifiedWord = fullWord.normalize("NFD"); break;
                case "compose":
                    modifiedWord = fullWord.normalize("NFC"); break;
                case "capitalise":
                    modifiedWord = fullWord.charAt(0).toUpperCase() + fullWord.slice(1); break;
                case "de-capitalise":
                    modifiedWord = fullWord.charAt(0).toLowerCase() + fullWord.slice(1); break;
                case "to-upper-case":
                    modifiedWord = fullWord.toUpperCase(); break;
                case "to-lower-case":
                    modifiedWord = fullWord.toLowerCase(); break;
                case "xsampa-to-ipa":
                    modifiedWord = xsampa_to_ipa(fullWord); break;
                case "ipa-to-xsampa":
                    modifiedWord = ipa_to_xsampa(fullWord); break;
                default:
                    this.logger.validation_error("This should not have happened");
            }
            word.record_transformation(
                `${result[0]}`,
                modifiedWord,
                line_num
            );
            return this.graphemosis(modifiedWord);
        }

        if (target.length !== result.length) {
            this.logger.validation_error("Mismatched target/result concurrent set lengths in a transform", line_num)
        }

        const replacements: { index: number; length: number; replacement: string }[] = [];

        for (let i = 0; i < target.length; i++) {
            let rawTarget = target[i].replace(/\\/g, "");
            let rawResult = result[i].replace(/\\/g, "");

            if (rawResult === "^REJECT" || rawResult === "^R") {
                for (let j = 0; j < tokens.length; j++) {
                    const subTokens = tokens.slice(j);
                    const span = spanToLength(subTokens, rawTarget.length);
                    const window = subTokens.slice(0, span).join("");
                    if (window === rawTarget) {
                        const startIdx = tokens.slice(0, j).join("").length;

                        const passes = conditions.length === 0 || conditions.some(c =>
                            contextMatches(fullWord, startIdx, rawTarget, c.before, c.after)
                        );
                        const blocked = exceptions.some(e =>
                            contextMatches(fullWord, startIdx, rawTarget, e.before, e.after)
                        );

                        if (passes && !blocked) {
                            word.rejected = true;
                            word.record_transformation(`${rawTarget} → ^REJECT`, "❌", line_num);
                            return tokens;
                        }
                    }
                }
            }


            if (rawTarget == "^") {
                // Insertion case
                if (conditions.length === 0) {
                    this.logger.validation_error("Insertion requires at least one condition", line_num);
                }
                for (let j = 0; j <= tokens.length; j++) {
                    const startIdx = tokens.slice(0, j).join("").length;
                    const passes = conditions.some(cond => contextMatches(fullWord, startIdx, "", cond.before, cond.after));
                    const blocked = exceptions.some(exc => contextMatches(fullWord, startIdx, "", exc.before, exc.after));
                    if (passes && !blocked) {
                        replacements.push({ index: j, length: 0, replacement: rawResult });
                    }
                }
            } else if (rawResult === "^") {
                // Deletion case
                for (let j = 0; j < tokens.length; j++) {
                    const span = spanToLength(tokens.slice(j), rawTarget.length);
                    const window = tokens.slice(j, j + span).join("");
                    if (window === rawTarget) {
                        const startIdx = tokens.slice(0, j).join("").length;
                        const passes = conditions.length === 0 || conditions.some(c => contextMatches(fullWord, startIdx, rawTarget, c.before, c.after));
                        const blocked = exceptions.some(e => contextMatches(fullWord, startIdx, rawTarget, e.before, e.after));
                        if (passes && !blocked) {
                            replacements.push({ index: j, length: span, replacement: "" });
                        }
                    }
                }
            } else {
                // Substitution case
                for (let j = 0; j < tokens.length; j++) {
                    const span = spanToLength(tokens.slice(j), rawTarget.length);
                    const window = tokens.slice(j, j + span).join("");
                    if (window === rawTarget) {
                        const startIdx = tokens.slice(0, j).join("").length;
                        const passes = conditions.length === 0 || conditions.some(c => contextMatches(fullWord, startIdx, rawTarget, c.before, c.after));
                        const blocked = exceptions.some(e => contextMatches(fullWord, startIdx, rawTarget, e.before, e.after));
                        if (passes && !blocked) {
                            replacements.push({ index: j, length: span, replacement: rawResult });
                        }
                    }
                }
            }
        }

        // ✂️ Non-destructive replacement
        replacements.sort((a, b) => a.index - b.index);
        const blocked = new Set<number>();
    // const resultTokens: string[] = [];

    const insertionMap = new Map<number, string[]>();
    const replacementMap = new Map<number, { length: number; replacement: string }>();

    for (const r of replacements) {
        if (r.length === 0) {
            if (!insertionMap.has(r.index)) insertionMap.set(r.index, []);
            insertionMap.get(r.index)!.push(r.replacement);
        } else {
            replacementMap.set(r.index, r);
        }
    }

    const resultTokens: string[] = [];
    let i = 0;

    while (i < tokens.length) {
        // 🪛 Insert before i
        if (insertionMap.has(i)) {
            for (const rep of insertionMap.get(i)!) {
                resultTokens.push(rep);
            }
        }

        // 🔁 Replace current token span
        const replacement = replacementMap.get(i);
        if (replacement && ![...Array(replacement.length).keys()].some(k => blocked.has(i + k))) {
            if (replacement.replacement !== "") {
                resultTokens.push(replacement.replacement);
            }
            for (let k = 0; k < replacement.length; k++) {
                blocked.add(i + k);
            }
            i += replacement.length;
        } else {
            resultTokens.push(tokens[i]);
            i++;
        }
    }

    // Handle insertions after the last token
    if (insertionMap.has(tokens.length)) {
        for (const rep of insertionMap.get(tokens.length)!) {
            resultTokens.push(rep);
        }
    }



        const normalized = this.graphemosis(resultTokens.join(""));

        // 🧾 Log transformation summary

        const matchedPairs = new Set<string>();
        const matchedTargets: string[] = [];
        const matchedResults: string[] = [];

    for (let i = 0; i < target.length; i++) {
        const isInsertion = target[i] === "^";
        const isDeletion = result[i] === "^";

        const expected = isInsertion ? result[i] : (isDeletion ? "" : result[i]);

        const matched = replacements.some(r =>
            r.replacement === expected &&
            ((isInsertion && r.length === 0) || (!isInsertion && r.length > 0))
        );

        if (matched) {
            const pair = `${target[i]} → ${result[i]}`;
            if (!matchedPairs.has(pair)) {
                matchedTargets.push(target[i]);
                matchedResults.push(result[i]);
                matchedPairs.add(pair);
            }
        }
    }


        if (matchedTargets.length > 0) {
            let my_exceptions = '';
            for (let j = 0; j < exceptions.length; j++) {
                my_exceptions += ` ! ${exceptions[j].before}_${exceptions[j].after}`;
            }
            let my_conditions = '';
            for (let j = 0; j < conditions.length; j++) {
                my_conditions += ` / ${conditions[j].before}_${conditions[j].after}`;
            }   

            word.record_transformation(
                `${matchedTargets.join(", ")} → ${matchedResults.join(", ")}${my_conditions}${my_exceptions}`,
                normalized.join(" "),
                line_num
            );
        }

        return normalized;
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
        word.record_transformation("graphemosis", `${tokens.join(" ")}`);

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