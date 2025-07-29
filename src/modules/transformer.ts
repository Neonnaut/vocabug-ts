import Word from './word';
import Logger from './logger';

import { xsampa_to_ipa, ipa_to_xsampa } from './xsampa';

class Transformer {
    public logger: Logger;
   
    public graphemes: string[];
    public transforms: {
        target:string[], result:string[],
        conditions:{ before:string, after:string }[], exceptions:{ before:string, after:string }[],
        chance:(number|null),
        line_num:number
    }[];

    constructor(
        logger: Logger,
        graphemes: string[],
        transforms: {
            target:string[], result:string[],
            conditions:{ before:string, after:string }[], exceptions:{ before:string, after:string }[],
            chance:(number|null),
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

    span_to_length(tokens: string[], target_length: number): number {
        let total = 0;
        for (let i = 0; i < tokens.length; i++) {
            total += tokens[i].length;
            if (total >= target_length) return i + 1;
        }
        return tokens.length;
    }


    apply_transform(
        word: Word,
        tokens: string[],
        transform: {
            target: string[];
            result: string[];
            conditions: { before: string; after: string }[];
            exceptions: { before: string; after: string }[];
            chance: (number | null);
            line_num: number;
        }
    ): string[] {
        function span_to_length(sub_tokens: string[], target_len: number): number {
            let count = 0;
            for (let i = 0; i < sub_tokens.length; i++) {
                count += sub_tokens[i].length;
                if (count >= target_len) return i + 1;
            }
            return sub_tokens.length;
        }

        function context_matches(
            full: string,
            startIdx: number,
            raw_search: string,
            before: string,
            after: string
        ): boolean {
            const target_len = raw_search.length;

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
                if (startIdx + target_len !== full.length) return false;
            } else if (after.endsWith("#")) {
                const expected = after.slice(0, -1);
                if (startIdx + target_len !== full.length || full.slice(startIdx + target_len) !== expected) return false;
            } else {
                const actual = full.slice(startIdx + target_len, startIdx + target_len + after.length);
                if (actual !== after) return false;
            }

            return true;
        }

        const { target, result, conditions, exceptions, chance, line_num } = transform;

        const full_word = tokens.join("");

        if (chance !== null && Math.random() * 100 >= chance) {
            // 🎲 Roll failed — skip transformation entirely
            return tokens;
        }

        if (target[0] === "$") {
            let modified_word = ''
            switch (result[0]) {
                case "decompose":
                    modified_word = full_word.normalize("NFD"); break;
                case "compose":
                    modified_word = full_word.normalize("NFC"); break;
                case "capitalise":
                    modified_word = full_word.charAt(0).toUpperCase() + full_word.slice(1); break;
                case "decapitalise":
                    modified_word = full_word.charAt(0).toLowerCase() + full_word.slice(1); break;
                case "to-upper-case":
                    modified_word = full_word.toUpperCase(); break;
                case "to-lower-case":
                    modified_word = full_word.toLowerCase(); break;
                case "xsampa-to-ipa":
                    modified_word = xsampa_to_ipa(full_word); break;
                case "ipa-to-xsampa":
                    modified_word = ipa_to_xsampa(full_word); break;
                default:
                    this.logger.validation_error("This should not have happened");
            }
            word.record_transformation(
                `${result[0]}`,
                modified_word,
                line_num
            );
            return this.graphemosis(modified_word);
        }

        if (target.length !== result.length) {
            this.logger.validation_error("Mismatched target/result concurrent set lengths in a transform", line_num)
        }

        const replacements: { index: number; length: number; replacement: string }[] = [];

        for (let i = 0; i < target.length; i++) {
            let raw_target = target[i].replace(/\\/g, "");
            let raw_result = result[i].replace(/\\/g, "");

            if (raw_result === "^REJECT" || raw_result === "^R") {
                for (let j = 0; j < tokens.length; j++) {
                    const sub_tokens = tokens.slice(j);
                    const span = span_to_length(sub_tokens, raw_target.length);
                    const window = sub_tokens.slice(0, span).join("");
                    if (window === raw_target) {
                        const startIdx = tokens.slice(0, j).join("").length;

                        const passes = conditions.length === 0 || conditions.some(c =>
                            context_matches(full_word, startIdx, raw_target, c.before, c.after)
                        );
                        const blocked = exceptions.some(e =>
                            context_matches(full_word, startIdx, raw_target, e.before, e.after)
                        );

                        if (passes && !blocked) {
                            word.rejected = true;
                            word.record_transformation(`${raw_target} → ^REJECT`, "❌", line_num);
                            return tokens;
                        }
                    }
                }
            }

            if (raw_target == "^") {
                // Insertion case
                if (conditions.length === 0) {
                    this.logger.validation_error("Insertion requires at least one condition", line_num);
                }
                for (let j = 0; j <= tokens.length; j++) {
                    const startIdx = tokens.slice(0, j).join("").length;
                    const passes = conditions.some(cond => context_matches(full_word, startIdx, "", cond.before, cond.after));
                    const blocked = exceptions.some(exc => context_matches(full_word, startIdx, "", exc.before, exc.after));
                    if (passes && !blocked) {
                        replacements.push({ index: j, length: 0, replacement: raw_result });
                    }
                }
            } else if (raw_result === "^") {
                // Deletion case
                for (let j = 0; j < tokens.length; j++) {
                    const span = span_to_length(tokens.slice(j), raw_target.length);
                    const window = tokens.slice(j, j + span).join("");
                    if (window === raw_target) {
                        const startIdx = tokens.slice(0, j).join("").length;
                        const passes = conditions.length === 0 || conditions.some(c => context_matches(full_word, startIdx, raw_target, c.before, c.after));
                        const blocked = exceptions.some(e => context_matches(full_word, startIdx, raw_target, e.before, e.after));
                        if (passes && !blocked) {
                            replacements.push({ index: j, length: span, replacement: "" });
                        }
                    }
                }
            } else {
                // Substitution case
                for (let j = 0; j < tokens.length; j++) {
                    const span = span_to_length(tokens.slice(j), raw_target.length);
                    const window = tokens.slice(j, j + span).join("");
                    if (window === raw_target) {
                        const startIdx = tokens.slice(0, j).join("").length;
                        const passes = conditions.length === 0 || conditions.some(c => context_matches(full_word, startIdx, raw_target, c.before, c.after));
                        const blocked = exceptions.some(e => context_matches(full_word, startIdx, raw_target, e.before, e.after));
                        if (passes && !blocked) {
                            replacements.push({ index: j, length: span, replacement: raw_result });
                        }
                    }
                }
            }
        }

        // ✂️ Non-destructive replacement
        replacements.sort((a, b) => a.index - b.index);
        const blocked = new Set<number>();
        // const result_tokens: string[] = [];

        const insertion_map = new Map<number, string[]>();
        const replacement_map = new Map<number, { length: number; replacement: string }>();

        for (const r of replacements) {
            if (r.length === 0) {
                if (!insertion_map.has(r.index)) insertion_map.set(r.index, []);
                insertion_map.get(r.index)!.push(r.replacement);
            } else {
                replacement_map.set(r.index, r);
            }
        }

        const result_tokens: string[] = [];
        let i = 0;

        while (i < tokens.length) {
            // 🪛 Insert before i
            if (insertion_map.has(i)) {
                for (const rep of insertion_map.get(i)!) {
                    result_tokens.push(rep);
                }
            }

            // 🔁 Replace current token span
            const replacement = replacement_map.get(i);
            if (replacement && ![...Array(replacement.length).keys()].some(k => blocked.has(i + k))) {
                if (replacement.replacement !== "") {
                    result_tokens.push(replacement.replacement);
                }
                for (let k = 0; k < replacement.length; k++) {
                    blocked.add(i + k);
                }
                i += replacement.length;
            } else {
                result_tokens.push(tokens[i]);
                i++;
            }
        }

        // Handle insertions after the last token
        if (insertion_map.has(tokens.length)) {
            for (const rep of insertion_map.get(tokens.length)!) {
                result_tokens.push(rep);
            }
        }

        const normalized = this.graphemosis(result_tokens.join(""));

        // 🧾 Log transformation summary

        const matched_pairs = new Set<string>();
        const matched_targets: string[] = [];
        const matched_results: string[] = [];

        for (let i = 0; i < target.length; i++) {
            const is_insertion = target[i] === "^";
            const is_deletion = result[i] === "^";

            const expected = is_insertion ? result[i] : (is_deletion ? "" : result[i]);

            const matched = replacements.some(r =>
                r.replacement === expected &&
                ((is_insertion && r.length === 0) || (!is_insertion && r.length > 0))
            );

            if (matched) {
                const pair = `${target[i]} → ${result[i]}`;
                if (!matched_pairs.has(pair)) {
                    matched_targets.push(target[i]);
                    matched_results.push(result[i]);
                    matched_pairs.add(pair);
                }
            }
        }


        if (matched_targets.length > 0) {
            let my_exceptions = '';
            for (let j = 0; j < exceptions.length; j++) {
                my_exceptions += ` ! ${exceptions[j].before}_${exceptions[j].after}`;
            }
            let my_conditions = '';
            for (let j = 0; j < conditions.length; j++) {
                my_conditions += ` / ${conditions[j].before}_${conditions[j].after}`;
            }
            const my_chance = chance !== null ? ` ? ${chance}` : '';

            word.record_transformation(
                `${matched_targets.join(", ")} → ${matched_results.join(", ")}${my_conditions}${my_exceptions}${my_chance}`,
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
            tokens = this.apply_transform(word, tokens, t);
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