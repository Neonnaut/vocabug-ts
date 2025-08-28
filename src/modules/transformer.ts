import Word from './word';
import Logger from './logger';
import { swap_first_last_items } from './utilities';
import type { Token } from './types';

import { xsampa_to_ipa, ipa_to_xsampa } from './xsampa';

type MatchResult = {
    start: number; // actual match start
    end: number;   // exclusive end index
    matched: string[]; // matched tokens
};


class Transformer {
    public logger: Logger;

    public transforms: {
        target:Token[][], result:Token[][],
        conditions:{ before:Token[], after:Token[] }[], exceptions:{ before:Token[], after:Token[] }[],
        chance:(number|null),
        line_num:number
    }[];

    public graphemes: string[];

    private debug: boolean = false;

    constructor(
        logger: Logger,
        graphemes: string[],
        transforms: {
            target:Token[][], result:Token[][],
            conditions:{ before:Token[], after:Token[] }[], exceptions:{ before:Token[], after:Token[] }[],
            chance:(number|null),
            line_num:number
        }[],
        debug: boolean
    ) {
        this.logger = logger;
        this.graphemes = graphemes;
        this.transforms = transforms;
        this.debug = debug;
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

    run_engine(engine:string, word:Word, word_stream:string[], line_num:number) {
        const full_word = word_stream.join("");

        let modified_word = ''
        switch (engine) {
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

        if (this.debug) {
            word.record_transformation(
                `| ${engine}`, modified_word, line_num
            );
        }
        return this.graphemosis(modified_word);
    }

    target_to_word_match(
        word_tokens: string[],
        raw_target: Token[]
    ): [number, number, string[]] {
        for (let j = 0; j <= word_tokens.length; j++) {
            const result = this.match_pattern_at(word_tokens, raw_target, j, word_tokens.length);
            if (result !== null) {
                return [result.start, result.end - result.start, result.matched];
            }
        }
        return [0, 0, []];
    }

    result_former(
        raw_result: Token[],
        target_stream: string[]
    ) : string[] {
        let replacement_stream:string[] = []
        for (let j = 0; j < raw_result.length; j++) {
            const my_result_token:Token = raw_result[j];

            if (my_result_token.type === "grapheme") {
                replacement_stream.push(my_result_token.base);
            } else if (my_result_token.type === "backreference") {
                for (let k:number = 0; k <= target_stream.length; k++) {
                    replacement_stream.push(target_stream[k]);
                }
            }
        }
        return replacement_stream;
    }

    match_pattern_at(
        stream: string[],
        pattern: Token[],
        start: number,
        max_end?: number,
        target_stream?: string[]
    ): MatchResult | null {
        let i = start;
        let j = 0;
        const matched: string[] = [];

        while (j < pattern.length) {
            const token = pattern[j];
            if (
                token.type !== 'grapheme' &&
                token.type !== 'wildcard' &&
                token.type !== 'anythings-mark' &&
                token.type !== 'backreference'
            ) {
                j++;
                continue;
            }

            const min = token.min;
            const max = token.max;
            const max_available = max_end !== undefined
                ? Math.min(max, max_end - i)
                : max;

            if (token.type === 'grapheme') {
                let count = 0;
                while (
                    count < max_available &&
                    stream[i + count] === token.base
                ) {
                    count++;
                }

                if (count < min) {;
                    return null;
                }

                matched.push(...stream.slice(i, i + count));
                i += count;
            } else if (token.type === 'backreference') {
                if (!target_stream || target_stream.length === 0) {
                    this.logger.validation_error("Backreference requires a non-empty target_stream");
                }

                const unit = target_stream;
                const unitLength = unit.length;
                const min = token.min;
                const max = token.max;

                const max_available = max_end !== undefined
                    ? Math.min(max, Math.floor((max_end - i) / unitLength))
                    : max;

                let repetitions = 0;

                while (
                    repetitions < max_available &&
                    stream.slice(i + repetitions * unitLength, i + (repetitions + 1) * unitLength)
                        .every((val, idx) => val === unit[idx])
                ) {
                    repetitions++;
                }

                if (repetitions < min) {
                    return null;
                }

                const totalLength = repetitions * unitLength;
                matched.push(...stream.slice(i, i + totalLength));
                i += totalLength;
                
            } else if (token.type === 'wildcard') {
                const available = Math.min(max_available, stream.length - i);

                if (available < min) {
                    return null;
                }

                matched.push(...stream.slice(i, i + available));
                i += available;
            }

            else if (token.type === 'anythings-mark') {
                const blocked = token.blocked_by ?? [];
                const nextToken = pattern[j + 1];

                let count = 0;
                while (
                    count < max_available &&
                    stream[i + count] !== undefined &&
                    !blocked.includes(stream[i + count]) &&
                    !(nextToken?.type === 'grapheme' && stream[i + count] === nextToken.base)
                ) {
                    count++;
                }

                if (count < min) {
                    return null;
                }

                matched.push(...stream.slice(i, i + count));
                i += count;
            }

            j++;
        }

        return {
            start,
            end: i,
            matched
        };
    }

    environment_match(
        word_stream: string[],
        target_stream: string[],
        startIdx: number,
        raw_target: string[],
        before: Token[],
        after: Token[]
    ): boolean {
        const target_len = raw_target.length;

        // BEFORE logic
        const has_boundary_before = before.length > 0 && before[0].type === 'word-boundary';
        const before_tokens = has_boundary_before ? before.slice(1) : before;

        let before_matched = false;

        for (let i = 0; i <= startIdx; i++) {
            const result = this.match_pattern_at(word_stream, before_tokens, i, startIdx, target_stream);
            if (result !== null && result.end === startIdx) {
                if (has_boundary_before && result.start !== 0) continue;
                before_matched = true;
                break;
            }
        }

        if (!before_matched) return false;

        // AFTER logic
        const has_boundary_after = after.length > 0 && after[after.length - 1].type === 'word-boundary';
        const after_tokens = has_boundary_after ? after.slice(0, -1) : after;
        const after_start = startIdx + target_len;

        const result = this.match_pattern_at(word_stream, after_tokens, after_start, word_stream.length, target_stream);

        if (result === null) return false;

        if (has_boundary_after && result.end !== word_stream.length) return false;

        return true;
    }

    // Non destructively apply replacements
    replacementa(
        word_stream: string[],
        replacements: {
            index_span: number;
            length_span: number;
            replacement_stream: string[];
        }[],
        word: Word,
        conditions: { before: Token[]; after: Token[] }[],
        exceptions: { before: Token[]; after: Token[] }[],
        line_num: number
    ): string[] {
        // Sort replacements by index to apply left-to-right
        replacements.sort((a, b) => a.index_span - b.index_span);

        const blocked = new Set<number>();
        const insertion_map = new Map<number, string[]>();
        const replacement_map = new Map<number, { length_span: number; replacement_stream: string[] }>();

        for (const r of replacements) {
            if (r.length_span === 0) {
                if (!insertion_map.has(r.index_span)) insertion_map.set(r.index_span, []);
                insertion_map.get(r.index_span)!.push(...r.replacement_stream);
            } else {
                replacement_map.set(r.index_span, {
                    length_span: r.length_span,
                    replacement_stream: r.replacement_stream
                });
            }
        }

        const result_tokens: string[] = [];
        const applied_targets: string[] = [];
        const applied_results: string[] = [];

        let i = 0;

        while (i < word_stream.length) {
            // 🪛 Insert before i
            if (insertion_map.has(i)) {
                for (const rep of insertion_map.get(i)!) {
                    applied_targets.push("^");
                    applied_results.push(rep);
                    result_tokens.push(rep);
                }
            }

            // 🔁 Replace current token span
            const replacement = replacement_map.get(i);
            if (
                replacement &&
                ![...Array(replacement.length_span).keys()].some(k => blocked.has(i + k))
            ) {
                const replaced_chunk = word_stream.slice(i, i + replacement.length_span);
                if (replacement.replacement_stream.length > 0) {
                    result_tokens.push(...replacement.replacement_stream);
                }

                applied_targets.push(replaced_chunk.join(""));
                applied_results.push(
                    replacement.replacement_stream.length === 0 ? "∅" : replacement.replacement_stream.join("")
                );

                for (let k = 0; k < replacement.length_span; k++) {
                    blocked.add(i + k);
                }

                i += replacement.length_span;
            } else {
                result_tokens.push(word_stream[i]);
                i++;
            }
        }

        // Handle insertions after the last token
        if (insertion_map.has(word_stream.length)) {
            for (const rep of insertion_map.get(word_stream.length)!) {
                applied_targets.push("∅");
                applied_results.push(rep);
                result_tokens.push(rep);
            }
        }

        const normalized = result_tokens;

        // 🧾 Log transformation summary
        if (applied_targets.length > 0 && this.debug) {
            let my_exceptions = '';
            for (const e of exceptions) {
                const my_before = e.before.map(t => t.base).join("");
                const my_after = e.after.map(t => t.base).join("");
                my_exceptions += ` ! ${my_before}_${my_after}`;
            }

            let my_conditions = '';
            for (const c of conditions) {
                const my_before = c.before.map(t => t.base).join("");
                const my_after = c.after.map(t => t.base).join("");
                my_conditions += ` / ${my_before}_${my_after}`;
            }

            const transformation_str = `${applied_targets.join(", ")} → ${applied_results.join(", ")}`;

            word.record_transformation(
                `${transformation_str}${my_conditions}${my_exceptions}`,
                normalized.join(" "),
                line_num
            );
        }

        return normalized;
    }

    apply_transform(
        word: Word,
        word_stream: string[],
        transform: {
            target: Token[][]; result: Token[][];
            conditions: { before: Token[]; after: Token[] }[];
            exceptions: { before: Token[]; after: Token[] }[];
            chance: (number | null); line_num: number;
        }
    ): string[] {

        const { target, result, conditions, exceptions, chance, line_num } = transform;

        // CHANCE CONDITION
        if (chance != null && Math.random()*100 >= chance) {return word_stream;} // 🎲 Roll failed

        // ENGINE
        if (target[0][0].type == 'engine') {word_stream = this.run_engine(target[0][0].base, word, word_stream,line_num);}
        
        if (target.length !== result.length) {
            this.logger.validation_error("Mismatched target/result concurrent set lengths in a transform", line_num)
        } 

        const replacements: {index_span:number; length_span:number;
            target_stream:string[]; replacement_stream:string[] }[] = [];

        for (let i = 0; i < target.length; i++) {
            let raw_target:Token[] = target[i]; // like 'abc' of 'abc, hij > y, z'
            let raw_result:Token[] = result[i]; // like 'y' of 'abc, hij > y, z'

            let mode: "deletion"|"insertion"|"reject"|"metathesis"|"replacement" = "replacement";

            // NOW, build-up REPLACEMENT STREAM from RESULT tokens.
            if (raw_result[0].type === "deletion") {
                // DELETION
                mode = "deletion";
            } else if (raw_result[0].type === "reject") {
                // REJECT
                mode = "reject";
            } else if (raw_result[0].type === "metathesis") {
                mode = "metathesis"
            } else {
                // NORMAL GRAPHEME STREAM
            }

            // NOW, Go through TARGET
            if (raw_target[0].type === "insertion") {
                // INSERTION
                if (mode === "deletion" || mode === "reject") {
                    this.logger.validation_error(`Deletion of ${mode} is not valid`, line_num);
                }
                if (conditions.length === 0) {
                    this.logger.validation_error("Insertion without a condition is not valid", line_num);
                }
                mode = "insertion";
                for (let insert_index = 0; insert_index <= word_stream.length; insert_index++) {

                    // CREATE REPLACEMENT STREAM
                    const my_replacement_stream = this.result_former(raw_result, word_stream);

                    const passes = conditions.length === 0 || conditions.some(c =>
                        this.environment_match(word_stream, my_replacement_stream, insert_index, [], c.before, c.after)
                    );
                    const blocked = exceptions.some(e =>
                        this.environment_match(word_stream, my_replacement_stream, insert_index, [], e.before, e.after)
                    );
                    if (!passes || blocked) continue;

                    replacements.push({
                        index_span: insert_index,
                        length_span: 0,
                        target_stream: ["^"], // symbolic marker for insertion
                        replacement_stream: my_replacement_stream
                    });
                }

            } else {
                // TARGET is normal stream of grapheme, wildcard, anythings-mark
                let cursor = 0;

                while (cursor <= word_stream.length - raw_target.length) {
                    const [match_index, match_length, matched_stream] = this.target_to_word_match(
                        word_stream.slice(cursor),
                        raw_target
                    );

                    if (match_length === 0) {
                        cursor++;
                        continue;
                    }

                    const global_index = cursor + match_index;

                    // Condition match and exception not match
                    const passes = conditions.length === 0 || conditions.some(c =>
                        this.environment_match(word_stream, matched_stream, global_index, matched_stream, c.before, c.after)
                    );
                    const blocked = exceptions.some(e =>
                        this.environment_match(word_stream, matched_stream, global_index, matched_stream, e.before, e.after)
                    );
                    if (!passes || blocked) {
                        cursor = global_index + 1; continue; // skip this match
                    }

                    if (mode === "reject") {
                        word.rejected = true;

                        if (this.debug) {
                            word.record_transformation(
                                `${matched_stream.join("")} → ^REJECT`, "∅", line_num
                            );
                        }
                        return word_stream;
                    } else if (mode === "deletion") {
                        replacements.push({
                            index_span: global_index,
                            length_span: match_length,
                            target_stream: matched_stream,
                            replacement_stream: []
                        });
                    } else if (mode === "metathesis") {
                        const my_metathesis = swap_first_last_items(matched_stream)
                        replacements.push({
                            index_span: global_index,
                            length_span: match_length,
                            target_stream: matched_stream,
                            replacement_stream: my_metathesis
                        });                        
                    } else {

                        // CREATE REPLACEMENT STREAM
                        const my_replacement_stream = this.result_former(raw_result, matched_stream);

                        replacements.push({
                            index_span:global_index,
                            length_span:match_length,
                            target_stream:matched_stream,
                            replacement_stream:my_replacement_stream
                        });
                    }

                    cursor = global_index + match_length;
                }
            }
        }

        word_stream = this.replacementa(
            word_stream,
            replacements,
            word,
            conditions,
            exceptions,
            line_num
        )
        return word_stream;
    }


    do_transforms(
        word: Word,
    ): Word {
        if (word.get_last_form() == ''){
            word.rejected = true;
            return word;
        }
        if (this.transforms.length == 0) { return word; } // No transforms

        let tokens = this.graphemosis(word.get_last_form());

        for (const t of this.transforms) {
            if (word.rejected) {
                break;
            }
            if (t.target.length == 0) {
                continue;
            }
            tokens = this.apply_transform(word, tokens, t);
            if (tokens.length == 0) {
                word.rejected = true;
                if (this.debug) { word.record_transformation(`^REJECT NULL WORD`, `∅`); }
            }
        }

        if (!word.rejected) {
            if (this.debug) {
                if (word.transformations.length > 1) {
                    word.record_transformation(null, `${tokens.join("")}`);
                }
            } else {
                word.record_transformation(null, `${tokens.join("")}`);
            }
        }

        return word;
    }
}

export default Transformer;