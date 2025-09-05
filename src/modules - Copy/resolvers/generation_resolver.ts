import Logger from '../logger';
import Supra_Builder from '../supra_builder';

import { recursive_expansion } from '../utilities';
import { get_distribution } from '../picker_utilities';
import type { Distribution, Output_Mode } from '../types';

class Generation_Resolver {
    private logger: Logger;
    public supra_builder: Supra_Builder;
    private output_mode: Output_Mode;

    public optionals_weight: number;
    public segments: Map<string, { content:string, line_num:number }>;
    public wordshape_distribution: string;

    private wordshape_pending: {content:string, line_num:number};
    public wordshapes: { items:string[], weights:number[] };

    constructor(
        logger:Logger, output_mode: Output_Mode,
        supra_builder:Supra_Builder,
        wordshape_distribution:Distribution,
        segments:Map<string, { content:string, line_num:number }>,
        wordshape_pending:{content:string, line_num:number},
        optionals_weight:number
    ) {
        this.logger = logger;
        this.output_mode = output_mode;

        this.supra_builder = supra_builder;
        this.optionals_weight = optionals_weight;
        this.segments = segments;
        this.wordshape_distribution = wordshape_distribution;

        this.wordshape_pending = wordshape_pending;
        this.wordshapes = { items: [], weights: [] };

        this.expand_segments();
        this.expand_wordshape_segments();
        this.set_wordshapes();
        if (this.output_mode === 'debug'){ this.show_debug(); }
    }

    private set_wordshapes() {
        let result = [];
        let buffer = "";
        let inside_brackets = 0;

        if (this.wordshape_pending.content.length == 0){
            this.logger.validation_error(`No word-shapes to choose from -- expected 'words: wordshape1 wordshape2 ...'`, this.wordshape_pending.line_num);
        }

        this.wordshape_pending.content = this.supra_builder.process_string(this.wordshape_pending.content, this.wordshape_pending.line_num);

        if (!this.valid_words_brackets(this.wordshape_pending.content)) {
            this.logger.validation_error(`Word-shapes had missmatched brackets`, this.wordshape_pending.line_num);
        }
        if (!this.valid_words_weights(this.wordshape_pending.content)) {
            this.logger.validation_error(`Word-shapes had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',' a bracket, or ' '`, this.wordshape_pending.line_num);
        }

        for (let i = 0; i < this.wordshape_pending.content.length; i++) {
            const char = this.wordshape_pending.content[i];

            if (char === '[' || char === '(') {
                inside_brackets++;
            } else if (char === ']' || char === ')') {
                inside_brackets--;
            }

            if ((char === ' ' || char === ',') && inside_brackets === 0) {
                if (buffer.length > 0) {
                    result.push(buffer);
                    buffer = "";
                }
            } else {
                buffer += char;
            }
        }

        if (buffer.length > 0) {
            result.push(buffer);
        }

        let [result_str, result_num] = this.extract_wordshape_value_and_weight(result, this.wordshape_distribution);
        for (let i = 0; i < result_str.length; i++) {
            this.wordshapes.items.push(result_str[i]);
            this.wordshapes.weights.push(result_num[i]); ///
        } 
    }

    private valid_words_brackets(str: string): boolean {
        const stack: string[] = [];
        const bracket_pairs: Record<string, string> = {
            ')': '(',
            '>': '<',
            ']': '[',
            '}': '{'
        };
        for (const char of str) {
            if (Object.values(bracket_pairs).includes(char)) {
                stack.push(char); // Push opening brackets onto stack
            } else if (Object.keys(bracket_pairs).includes(char)) {
                if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
                    return false; // Unmatched closing bracket
                }
            }
        }
        return stack.length === 0; // Stack should be empty if balanced
    }

    private extract_wordshape_value_and_weight(
    input_list: string[],
    default_distribution: string
    ): [string[], number[]] {
        const my_values: string[] = [];
        const my_weights: number[] = [];

        const combine_adjacent_chunks = (str: string): string[] => {
            const chunks: string[] = [];
            let buffer = '';
            let bracket_depth = 0;
            let paren_depth = 0;

            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                buffer += char;

                if (char === '[') bracket_depth++;
                if (char === ']') bracket_depth--;
                if (char === '(') paren_depth++;
                if (char === ')') paren_depth--;

                const atEnd = i === str.length - 1;

                if ((char === ',' && bracket_depth === 0 && paren_depth === 0) || atEnd) {
                    if (char !== ',' && atEnd) {
                        // Final character is part of buffer
                    } else {
                        buffer = buffer.slice(0, -1); // remove comma
                    }
                    if (buffer.trim()) chunks.push(buffer.trim());
                    buffer = '';
                }
            }

            return chunks;
        };

        const all_parts = input_list.flatMap(combine_adjacent_chunks);

        const all_default_weights = all_parts.every(part =>
            !/^(?:\[.*\]|[^*]+)\*[\d.]+$/.test(part)
        );

        if (all_default_weights) {
        const trimmed_values = all_parts.map(part => part.trim());
        const total_items = trimmed_values.length;

        let chosen_distribution: number[];
        chosen_distribution = get_distribution(total_items, default_distribution);

        my_values.push(...trimmed_values);
        my_weights.push(...chosen_distribution);

        return [my_values, my_weights];
        }


        for (const part of all_parts) {
            const trimmed = part.trim();
            const match = trimmed.match(/^(.*)\*([\d.]+)$/);

            if (match && !/\[.*\*.*\]$/.test(match[1])) {
                my_values.push(match[1]);
                my_weights.push(parseFloat(match[2]));
            } else if (/^\[.*\]\*[\d.]+$/.test(trimmed)) {
                const i = trimmed.lastIndexOf("*");
                my_values.push(trimmed.slice(0, i));
                my_weights.push(parseFloat(trimmed.slice(i + 1)));
            } else {
                my_values.push(trimmed);
                my_weights.push(1);
            }
        }

        return [my_values, my_weights];
    }

    private valid_words_weights(str: string): boolean {

        // Rule 1: asterisk must be followed by a number (integer or decimal)
        const asterisk_without_number = /\*(?!\d+(\.\d+)?)/g;

        // Rule 2: asterisk must not appear at the start
        const asterisk_at_start = /^\*/; // Returns false if follows rule

        // Rule 3: asterisk must not be preceded by space or comma
        const asterisk_after_space_or_comma = /[ ,]\*/g; // Returns false if follows rule

        // Rule 4: asterisk-number (int or decimal) pair
        // must be followed by space, comma, }, ], ), or end of string
        const asterisk_number_bad_suffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,}\]\)\n]|$)/g;

        // If any are true return false
        if (
            asterisk_without_number.test(str) ||
            asterisk_at_start.test(str) ||
            asterisk_after_space_or_comma.test(str) ||
            asterisk_number_bad_suffix.test(str)
        ) {
            return false;
        }
        return true;
    }

    private expand_wordshape_segments() {
        this.wordshape_pending.content = recursive_expansion(this.wordshape_pending.content, this.segments);

        // Remove dud segments
        const match = this.wordshape_pending.content.match(/\$[A-Z]/);
        if (match) {
            this.logger.validation_error(`Nonexistent segment detected: '${match[0]}'`, this.wordshape_pending.line_num);
        }
    }

    private expand_segments() {
        for (const [key, value] of this.segments.entries()) {
            const expanded_content = recursive_expansion(value.content, this.segments);
            this.segments.set(key, {
                content: expanded_content,
                line_num: value.line_num, // Preserve original line_num
            });
        }
    }

    show_debug(): void {
        let segments = [];
        for (const [key, value] of this.segments) {
            segments.push(`  ${key} = ${value.content}`);
        }

        let wordshapes = [];
        for (let i = 0; i < this.wordshapes.items.length; i++) {
            wordshapes.push(`  ${this.wordshapes.items[i]}*${this.wordshapes.weights[i]}`);
        }

        let info:string =
            `~ WORD GENERATION ~\n` +
            `\nWordshape-distribution: ` + this.wordshape_distribution +
            `\nSegments {\n` + segments.join('\n') + `\n}` +
            `\nWordshapes {\n` + wordshapes.join('\n') + `\n}` +
            `\nOptionals-weight: ` + this.optionals_weight

        this.logger.diagnostic(info);
    }
}

export default Generation_Resolver;