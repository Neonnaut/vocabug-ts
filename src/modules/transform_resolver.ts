// Yikes, there is so much of this that I needed to put it in a separate file to resolver.
import Logger from './logger';
import Nesca_Grammar_Stream from './nesca_grammar_stream';
import type { Token } from './types';

class Transform_Resolver {
    private logger: Logger;
    private nesca_grammar_stream: Nesca_Grammar_Stream;
    public categories: Map<string, { graphemes:string[], weights:number[] }>;
    public transform_pending: {
        target:string, result:string,
        conditions:string[], exceptions:string[],
        chance:(number|null),
        line_num:number
    }[];
    public transforms: {
        target:Token[][], result:Token[][],
        conditions:{ before:Token[], after:Token[] }[], exceptions:{ before:Token[], after:Token[] }[],
        chance:(number|null),
        line_num:number
    }[] = [];

    private line_num: number;

    constructor(
        logger:Logger,
        nesca_grmmar_stream:Nesca_Grammar_Stream, categories: Map<string,
        { graphemes:string[], weights:number[] }>,
        transform_pending: {
            target:string, result:string,
            conditions:string[], exceptions:string[],
            chance:(number|null),
            line_num:number
        }[]
    ) {
        this.logger = logger;
        this.nesca_grammar_stream = nesca_grmmar_stream;
        this.categories = categories;
        this.transform_pending = transform_pending;
        this.line_num = 0;
    }

    resolve_transforms() {
        // Resolve brackets, put categories in transforms, make a milkshake, etc.
        
        for (let i = 0; i < this.transform_pending.length; i++) {
            this.line_num = this.transform_pending[i].line_num;

            let target = this.transform_pending[i].target; // string

            // Replace category keys with category graphemes, must be item, or alone
            const target_with_cat = this.categories_into_transform(target);
            // Resolve alternators or optionalators as array of arrays
            const target_altors:string[][] = this.resolve_alt_opt(target_with_cat);
            
            const result = this.transform_pending[i].result; // string
            // Replace category keys with category graphemes, must be item, or alone
            const result_with_cat = this.categories_into_transform(result);
            // Resolve alternators or optionalators as array of arrays
            const result_altors:string[][] = this.resolve_alt_opt(result_with_cat);

            // Make sure lengths are good, and get merging change / sets
            const { result_array, target_array } = this.normaliseTransformLength(
                target_altors, result_altors
            );

            // Flatten the arrays
            const result_length_match:string[] = result_array.flat();
            const target_length_match:string[] = target_array.flat();

            let tokenised_target_array:Token[][] = []
            // Grammar stream for target
            for (let j = 0; j < target_length_match.length; j++) {
                tokenised_target_array.push(this.nesca_grammar_stream.main_parser(target_length_match[j], 'TARGET', this.line_num));
            }

            let tokenised_result_array:Token[][] = [];
            // Grammar stream for result
            for (let j = 0; j < result_length_match.length; j++) {
                tokenised_result_array.push(this.nesca_grammar_stream.main_parser(result_length_match[j], 'RESULT', this.line_num));
            }

            let chance = this.transform_pending[i].chance;

            let new_conditions:{ before:Token[], after:Token[] }[] = []
            let new_exceptions:{ before:Token[], after:Token[] }[] = [];

            for (let j = 0; j < this.transform_pending[i].conditions.length; j++) {

                // CONDITIONS
                let my_condition = this.transform_pending[i].conditions[j];
                my_condition = this.categories_into_transform(my_condition);
                // Validate brackets
                if (!this.valid_transform_brackets(my_condition)) {
                    this.logger.validation_error(`Invalid brackets in condition "${my_condition}"`, this.line_num);
                }
                let alt_opt_condition = this.resolve_alt_opt(my_condition);
                for (let k = 0; k < alt_opt_condition[0].length; k++) {
                    let split_condition = alt_opt_condition[0][k].split('_');
                    // Grammar stream for condition before
                    // Grammar stream for condition after
                    const before = this.nesca_grammar_stream.main_parser(split_condition[0], 'BEFORE', this.line_num);
                    const after = this.nesca_grammar_stream.main_parser(split_condition[1], 'AFTER', this.line_num);
                    new_conditions.push({
                        before:before,
                        after:after
                    });
                }
            }
            for (let j = 0; j < this.transform_pending[i].exceptions.length; j++) {

                // EXCEPTIONS
                let my_exception = this.transform_pending[i].exceptions[j];
                my_exception = this.categories_into_transform(my_exception);
                // Validate brackets
                if (!this.valid_transform_brackets(my_exception)) {
                    this.logger.validation_error(`Invalid brackets in exception "${my_exception}"`, this.line_num);
                }
                let alt_opt_exception = this.resolve_alt_opt(my_exception);
                for (let k = 0; k < alt_opt_exception[0].length; k++) {
                    let split_exception = alt_opt_exception[0][k].split('_');
                    // Grammar stream for exception before
                    // Grammar stream for exception after
                    const before = this.nesca_grammar_stream.main_parser(split_exception[0], 'BEFORE', this.line_num);
                    const after = this.nesca_grammar_stream.main_parser(split_exception[1], 'AFTER', this.line_num);
                    new_exceptions.push({
                        before:before,
                        after:after
                    });
                }
            }

            this.transforms.push({
                target: tokenised_target_array, result: tokenised_result_array,
                conditions: new_conditions, exceptions: new_exceptions,
                chance: chance,
                line_num: this.line_num
            });
        }
        return this.transforms;
    }
    
    // 🧱 Internal: Split input into top-level chunks
    splitTopLevel(str: string): string[] {
        const chunks: string[] = [];
        let depth = 0;
        let buffer = '';

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            // Track nesting depth for (), [], and {}
            if (char === '[' || char === '(' || char === '{') depth++;
            else if (char === ']' || char === ')' || char === '}') depth--;

            // Split only at top level
            if ((char === ',' || /\s/.test(char)) && depth === 0) {
                if (buffer.trim()) chunks.push(buffer.trim());
                buffer = '';
            } else {
                buffer += char;
            }
        }

        if (buffer.trim()) chunks.push(buffer.trim());
        return chunks;
    }


    checkGrammarRules(str: string): void {
    const stack: { char: string; index: number }[] = [];

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (char === '[' || char === '(') {
            if (stack.length >= 1) {
                this.logger.validation_error("Nested alternator / optionalator not allowed", this.line_num);
            }
            stack.push({ char, index: i });
        }

        if (char === ']' || char === ')') {
            if (stack.length === 0) {
                this.logger.validation_error("Mismatched closing bracket", this.line_num);
            }

            const { char: openChar, index: openIndex } = stack.pop()!;
            const isMatching = (openChar === '[' && char === ']') || (openChar === '(' && char === ')');
            if (!isMatching) {
                this.logger.validation_error("Mismatched bracket types", this.line_num);
            }

            // Check for empty bracket content
            const inner = str.slice(openIndex + 1, i).trim();
            if (!/[^\s,]/.test(inner)) {
                this.logger.validation_error("Alternator / optionalator must not be empty", this.line_num);
            }

            // Optional: check if bracket is part of a larger token
            const before = str.slice(0, openIndex).trim();
            const after = str.slice(i + 1).trim();
            const hasOutsideContent = /[^\s,]/.test(before) || /[^\s,]/.test(after);
            if (!hasOutsideContent && char===")") {
                this.logger.validation_error("Optionalator must be part of a larger token", this.line_num);
            }
        }
    }

    if (stack.length !== 0) {
        this.logger.validation_error("Unclosed bracket", this.line_num);
    }
}
    
    // 🔄 Internal: Expand a single chunk
    expandChunk(chunk: string): string[] {
        this.checkGrammarRules(chunk);

        const regex = /([^\[\(\]\)]+)|(\[[^\]]+\])|(\([^\)]+\))/g;
        const parts = [...chunk.matchAll(regex)].map(m => m[0]);

        const expansions: string[][] = parts.map(part => {
            if (part.startsWith("[")) {
                return part.slice(1, -1).split(/[\s,]+/);
            } else if (part.startsWith("(")) {
                const val = part.slice(1, -1);
                return [val, ""];
            } else {
                return [part];
            }
        });

        return expansions.reduce<string[]>((acc, curr) => {
        const combo: string[] = [];
        for (const a of acc) {
            for (const c of curr) {
                combo.push(a + c);
            }
        }
        return combo;
        }, [""]);
    }

    resolve_alt_opt(input: string): string[][] {
        // ⚙️ Internal: Check for bracket rules

        // 🎯 Final: Resolve full input
        const chunks = this.splitTopLevel(input);
        return chunks.map(chunk => this.expandChunk(chunk));
    }
    
    getTransformLengths(target: any[][], result: any[][]): any[][] {
        // 🔁 Surface level: Broadcast result if only one entry
        if (result.length === 1 && target.length > 1) {
            result = Array(target.length).fill(result[0]);
        }

        // ❌ Surface length mismatch
        if (result.length !== target.length) {
            this.logger.validation_error(`Concurrent change length mismatch: target has ${target.length}, result has ${result.length}`, this.line_num);
        }

        return result.map((resItem, i) => {
            const targetItem = target[i];

            // 🔁 Nested level: Broadcast if only one element
            if (resItem.length === 1 && targetItem.length > 1) {
            resItem = Array(targetItem.length).fill(resItem[0]);
            }

            // ❌ Nested length mismatch
            if (resItem.length !== targetItem.length) {
                this.logger.validation_error(`Alternator / optionalator length mismatch at index ${i}: target has ${targetItem.length}, result has ${resItem.length}`, this.line_num);
            }

            return resItem;
        });
    }
    
    categories_into_transform(input: string): string {
        let output = '';
        const length = input.length;

        for (let i = 0; i < length; i++) {
            const char = input[i];

            // ⏭️ Skip "^R" or "^REJECT" sequences and preserve them
            if (char === '^') {
                const slice = input.slice(i, i + 8); // Enough to cover "^REJECT"
                if (slice.startsWith('^R')) {
                    const rejectMatch = slice.startsWith('^REJECT') ? '^REJECT' : '^R';
                    output += rejectMatch;
                    i += rejectMatch.length - 1;
                    continue; // ✅ Prevent further processing of this sequence
                }
            }

            // ✅ Category key expansion
            if (this.categories.has(char)) {
                const prev = input[i - 1] ?? '';
                const next = input[i + 1] ?? '';

                const isBoundaryBefore = i === 0 || ' ,([)'.includes(prev);
                const isBoundaryAfter  = i === length - 1 || ' ,([)]'.includes(next);

                if (isBoundaryBefore && isBoundaryAfter) {
                    const entry = this.categories.get(char)!;
                    output += entry.graphemes.filter(g => !['^','∅'].some(b => g.includes(b))).join(', ');

                } else {
                    this.logger.validation_error(
                        `Category key "${char}" is adjacent to other content at position ${i}`,
                        this.line_num
                    );
                }
            } else {
                output += char;
            }
        }

        return output;
    }
    
    normaliseTransformLength(target: string[][], result: string[][]): { target_array: string[][], result_array: string[][] } {
        // 🔁 Surface level: Broadcast result if only one entry
        if (result.length === 1 && target.length > 1) {
            result = Array(target.length).fill(result[0]);
        }

        // ❌ Surface length mismatch
        if (result.length !== target.length) {
            this.logger.validation_error(`Concurrent change length mismatch: target has ${target.length}, result has ${result.length}`, this.line_num);
        }

        result = result.map((resItem, i) => {
            const targetItem = target[i];

            // 🔁 Nested level: Broadcast if only one element
            if (resItem.length === 1 && targetItem.length > 1) {
                resItem = Array(targetItem.length).fill(resItem[0]);
            }

            // ❌ Nested length mismatch
            if (resItem.length !== targetItem.length) {   
                this.logger.validation_error(`An alternator / optionalator length mismatch occured: target has ${targetItem.length}, result has ${resItem.length}`, this.line_num);
            }

            return resItem;
        });
        const target_array = target; const result_array = result;
        return { target_array, result_array };
    }
    
    valid_transform_brackets(str: string): boolean {
        const stack: string[] = [];
        const bracket_pairs: Record<string, string> = {
            ')': '(',
            '}': '{',
            ']': '[',
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
}

export default Transform_Resolver;