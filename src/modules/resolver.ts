import type Escape_Mapper from './escape_mapper';
import Logger from './logger';
import Supra_Builder from './supra_builder';

import { get_cat_seg, make_percentage, get_distribution
 } from './utilities'
import type { Token, Generation_Mode } from './types';

class Resolver {
    private logger: Logger;
    private escape_mapper: Escape_Mapper;
    public supra_builder: Supra_Builder

    public num_of_words: number;
    public debug: boolean;
    public paragrapha: boolean;
    public remove_duplicates: boolean;
    public force_word_limit: boolean;
    public sort_words: boolean;
    public capitalise_words: boolean;
    public word_divider: string;

    public category_distribution: string;
    private category_pending: Map<string, { content:string, line_num:number }>;
    public categories: Map<string, { graphemes:string[], weights:number[] }>;
    
    public segments: Map<string, { content:string, line_num:number }>;
    public optionals_weight: number;
    public wordshape_distribution: string;
    private wordshape_pending: string;
    public wordshapes: { items:string[], weights:number[] };
    private wordshape_line_num: number;
    
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
    }[];
    public graphemes: string[];
    public alphabet: string[];
    public invisible: string[];

    private file_line_num = 0;

    constructor(
        logger: Logger,
        escape_mapper: Escape_Mapper,
        supra_builder: Supra_Builder,

        num_of_words_string: number | string,
        mode: Generation_Mode,
        sort_words: boolean,
        capitalise_words: boolean,
        remove_duplicates: boolean,
        force_word_limit: boolean,
        word_divider: string
    ) {
        this.logger = logger;
        this.escape_mapper = escape_mapper;
        this.supra_builder = supra_builder;

        if (num_of_words_string == '') {
            num_of_words_string = '100';
        }
        let num_of_words: number = Number(num_of_words_string);
        if (isNaN(num_of_words)) {
            this.logger.warn(`Number of words '${num_of_words}' was not a number. Genearating 100 words instead`);
            num_of_words = 100;
        } else if (!Number.isInteger(num_of_words)) {
            this.logger.warn(`Number of words '${num_of_words}' was rounded to the nearest whole number`);
            num_of_words = Math.ceil(num_of_words);
        }
        if ((num_of_words > 100_000) || (num_of_words < 1)) {
            this.logger.warn(`Number of words '${num_of_words}' was not between 1 and 100,000. Genearating 100 words instead`);
            num_of_words = 100;
        }
        this.num_of_words = num_of_words;

        this.debug = (mode === 'debug');
        this.paragrapha = (mode === 'paragraph');
        this.sort_words = sort_words;
        this.capitalise_words = capitalise_words;
        this.remove_duplicates = remove_duplicates;
        this.force_word_limit = force_word_limit;
        this.word_divider = word_divider === "" ? ' ' : word_divider;
        this.word_divider = this.word_divider.replace(new RegExp('\\\\n', 'g'), '\n');

        if (this.paragrapha) {
            this.sort_words = false;
            this.capitalise_words = false;
            this.remove_duplicates = false;
            this.force_word_limit = false;
            this.word_divider = ' ';
        } else if (this.debug) {
            this.sort_words = false;
            this.capitalise_words = false;
            this.remove_duplicates = false;
            this.force_word_limit = false;
            this.word_divider = '\n';
        }
        
        this.category_distribution = "gusein-zade";
        this.category_pending = new Map;
        this.categories = new Map;
        this.optionals_weight = 10;
        this.segments = new Map;
        this.wordshape_distribution = "zipfian";
        this.alphabet = [];
        this.invisible = [];
        this.wordshape_pending = ""
        this.wordshapes = { items: [], weights: [] };
        this.wordshape_line_num = 0;
        this.graphemes = [];
        this.transform_pending = [];
        this.transforms = [];
    }

    
    parse_file(file: string) {

        let transform_mode = false;
        let file_array = file.split('\n');

        for (; this.file_line_num < file_array.length; ++this.file_line_num) {
            let line = file_array[this.file_line_num];
            let line_value = '';

            line = this.escape_mapper.escape_backslash_space(line);
            line = line.replace(/(?<!\\);.*/u, '').trim(); // Remove comment unless escaped with backslash

            if (line === '') { continue; } // Blank line !!

            if (transform_mode) { // Lets do transforms !!
                line_value = line;

                if (line_value.startsWith("END")) {
                    transform_mode = false;
                    continue;
                }
                
                if (line.startsWith("% ")) { // Parse clusters
                    this.parse_cluster(file_array);
                    continue;
                }

                if (line.startsWith("| ")) { // Engine
                    line_value = line.substring(2).trim().toLowerCase();

                    line_value = line_value.replace(/\bcapitalize\b/g, 'capitalise')

                    for (const engine of line_value.split(/\s+/)) {
                        if (engine == "decompose"||engine == "compose" ||
                            engine == "capitalise" || engine == "decapitalise" ||
                            engine == "to-upper-case" || engine == "to-lower-case" ||
                            engine == "xsampa-to-ipa" || engine == "ipa-to-xsampa"
                        ) {
                            this.add_transform(
                                `|${engine}`, '\\', [], [], null, this.file_line_num
                            )
                        } else {
                            this.logger.validation_error(`Trash engine '${engine}' found`, this.file_line_num);
                        }
                    }
                    continue;
                }

                line_value = this.escape_mapper.escape_backslash_pairs(line_value);
                
                let [target, result, conditions, exceptions, chance] = this.get_transform(line_value);

                this.add_transform(target, result, conditions, exceptions, chance, this.file_line_num);
                continue;
            }

            if (line.startsWith("BEGIN transform:")) {
                transform_mode = true;

            } else if (line.startsWith("category-distribution:")) {
                line_value = line.substring(22).trim().toLowerCase();

                this.category_distribution = line_value;

            } else if (line.startsWith("wordshape-distribution:")) {
                line_value = line.substring(23).trim().toLowerCase();

                this.wordshape_distribution = line_value;

            } else if (line.startsWith("optionals-weight:")) {
                line_value = line.substring(17).replace(/%/g, "").trim();

                let optionals_weight = make_percentage(line_value);
                if (optionals_weight == null) {
                    this.logger.warn(`Invalid optionals-weight '${line_value}' -- expected a number between 1 and 100`, this.file_line_num);
                    continue;
                }
                this.optionals_weight = optionals_weight;

            } else if (line.startsWith("alphabet:")) {
                line_value = line.substring(9).trim();
                line_value = this.escape_mapper.restore_preserve_escaped_chars(line_value);

                let alphabet = line_value.split(/[,\s]+/).filter(Boolean);

                if (alphabet.length == 0){
                    this.logger.warn(`'alphabet' was introduced but there were no graphemes listed -- expected a list of graphemes`, this.file_line_num);
                }
                this.alphabet = alphabet;

            } else if (line.startsWith("invisible:")) {
                line_value = line.substring(10).trim();
                line_value = this.escape_mapper.restore_preserve_escaped_chars(line_value);

                let invisible = line_value.split(/[,\s]+/).filter(Boolean);

                if (invisible.length == 0){
                    this.logger.warn(`'invisible' was introduced but there were no graphemes listed -- expected a list of graphemes`, this.file_line_num);
                }
                this.invisible = invisible;

            } else if (line.startsWith("alphabet-and-graphemes:")) {
                line_value = line.substring(23).trim();
                line_value = this.escape_mapper.restore_preserve_escaped_chars(line_value);

                let a_g = line_value.split(/[,\s]+/).filter(Boolean);

                if (a_g.length == 0){
                    this.logger.warn(`'alphabet-and-graphemes' was introduced but there were no graphemes listed -- expected a list of graphemes`, this.file_line_num);
                }
                this.graphemes = a_g;
                this.alphabet = a_g;

            } else if (line.startsWith("graphemes:")) {
                line_value = line.substring(10).trim();
                line_value = this.escape_mapper.escape_backslash_pairs(line_value);

                let graphemes = line_value.split(/[,\s]+/).filter(Boolean);
                if (graphemes.length == 0){
                    this.logger.warn(`'graphemes' was introduced but there were no graphemes listed -- expected a list of graphemes`, this.file_line_num);
                }
                this.graphemes = graphemes;

            } else if (line.startsWith("words:")) {
                line_value = line.substring(6).trim();
                line_value = this.escape_mapper.escape_backslash_pairs(line_value);
                
                if (line_value != "") {
                    this.wordshape_pending = line_value;
                }
                this.wordshape_line_num = this.file_line_num;

            } else if (line.startsWith("BEGIN words:")) {
                this.parse_words_block(file_array);

            } else { // It's a category or segment
                line_value = line;
                line_value = this.escape_mapper.escape_backslash_pairs(line_value);

                let [my_name, field, valid, is_capital, has_dollar_sign] = get_cat_seg(line_value);

                if ( !valid || !is_capital ) {
                    this.logger.warn(`Junk ignored -- expected a category, segment, directive, ..., etc`, this.file_line_num);
                    continue;
                }
                if (has_dollar_sign) {
                    // SEGMENTS !!!
                    if (!this.validate_segment(field)) { this.logger.validation_error(`The segment '${my_name}' had separator(s) outside sets -- expected separators for segments to appear only in sets`, this.file_line_num)}
                    if (!this.valid_words_brackets(field)) {
                        this.logger.validation_error(`The segment '${name}' had missmatched brackets`, this.file_line_num);
                    }
                    this.segments.set(my_name, {content: field, line_num:this.file_line_num });
                } else {
                    // CATEGORIES !!!
                    this.category_pending.set(my_name, { content:field, line_num:this.file_line_num });
                }
            }
        }
        this.wordshape_distribution = this.parse_distribution(this.wordshape_distribution);
        this.category_distribution = this.parse_distribution(this.category_distribution);
    }

    validate_segment(str: string): boolean {
        let inside_square = false;
        let inside_paren = false;

        // We don't want random space or comma inside segment

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === "[") inside_square = true;
            else if (char === "]") inside_square = false;

            else if (char === "(") inside_paren = true;
            else if (char === ")") inside_paren = false;

            if ((char === "," || char === " ") && !inside_square && !inside_paren) {
            return false;
            }
        }

        return true;
        }

    parse_distribution(value:string):string {
        if (value.toLowerCase().startsWith("g")) {
            return "gusein-zade";
        } else if (value.toLowerCase().startsWith("z")) {
            return "zipfian";
        } else if (value.toLowerCase().startsWith("s")) {
            return "shallow";
        }
        return "flat";
    }

    set_wordshapes() {
        let result = [];
        let buffer = "";
        let inside_brackets = 0;

        if (this.wordshape_pending.length == 0){
            this.logger.validation_error(`No word-shapes to choose from -- expected 'words: wordshape1 wordshape2 ...'`, this.wordshape_line_num);
        }

        this.wordshape_pending = this.supra_builder.process_string(this.wordshape_pending, this.wordshape_line_num);

        if (!this.valid_words_brackets(this.wordshape_pending)) {
            this.logger.validation_error(`Word-shapes had missmatched brackets`, this.wordshape_line_num);
        }
        if (!this.valid_words_weights(this.wordshape_pending)) {
            this.logger.validation_error(`Word-shapes had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',' a bracket, or ' '`, this.wordshape_line_num);
        }

        for (let i = 0; i < this.wordshape_pending.length; i++) {
            const char = this.wordshape_pending[i];

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

    valid_words_brackets(str: string): boolean {
        const stack: string[] = [];
        const bracket_pairs: Record<string, string> = {
            ')': '(',
            '>': '<',
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

    extract_wordshape_value_and_weight(
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

    valid_words_weights(str: string): boolean {

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

    // TRANSFORMS !!!


    // This is run on parsing file. We then have to run resolve_transforms aftter parse file
    get_transform(input: string): [
        string, string,
        string[],
        string[],
        (number|null)
    ] {
        if (input === "") {
            this.logger.validation_error(`No input`, this.file_line_num)
        }

        const divided = input.split(/->|>|→/);
        if (divided.length === 1) {
            this.logger.validation_error(`No arrows in transform`, this.file_line_num)
        }
        if (divided.length !== 2) {
            this.logger.validation_error(`Too many arrows in transform`, this.file_line_num);
        }

        const target = divided[0].trim();
        if (target === "") {
            this.logger.validation_error(`Target is empty in transform`, this.file_line_num);
        }
        if (!this.valid_transform_brackets(target)) {
            this.logger.validation_error(`Target had missmatched brackets`, this.file_line_num);
        }

        const slash_index = divided[1].indexOf('/');
        const bang_index = divided[1].indexOf('!');
        const question_index = divided[1].indexOf('?');

        const delimiter_index = Math.min(
            slash_index === -1 ? Infinity : slash_index,
            bang_index === -1 ? Infinity : bang_index,
            question_index === -1 ? Infinity : question_index
        );

        const result = delimiter_index === Infinity
            ? divided[1].trim()
            : divided[1].slice(0, delimiter_index).trim();

        if (result == "") {
            this.logger.validation_error(`Result is empty in transform`, this.file_line_num);
        }
        if (!this.valid_transform_brackets(result)) {
            this.logger.validation_error(`Result had missmatched brackets`, this.file_line_num);
        }

        const environment = delimiter_index === Infinity
            ? ''
            : divided[1].slice(delimiter_index).trim();

        const { conditions, exceptions, chance } = this.get_environment(environment);

        return [target, result, conditions, exceptions, chance];
    }

    get_environment(environment_string: string): {
        conditions: string[];
        exceptions: string[];
        chance: number | null;
    } {
        const conditions: string[] = [];
        const exceptions: string[] = [];
        let chance: number | null = null;

        let buffer = "";
        let mode: "condition" | "exception" | "chance" = "condition";

        for (let i = 0; i < environment_string.length; i++) {
            const ch = environment_string[i];

            if (ch === '/') {
                if (buffer.trim()) {
                    const validated = this.validate_environment(buffer.trim(), mode);
                    (mode === "condition" ? conditions : exceptions).push(validated);
                }
                buffer = "";
                mode = "condition";
            } else if (ch === '!') {
                if (buffer.trim()) {
                    const validated = this.validate_environment(buffer.trim(), mode);
                    (mode === "condition" ? conditions : exceptions).push(validated);
                }
                buffer = "";
                mode = "exception";
            } else if (ch === '?') {
                if (buffer.trim()) {
                    const validated = this.validate_environment(buffer.trim(), mode);
                    (mode === "condition" ? conditions : exceptions).push(validated);
                }
                buffer = "";
                mode = "chance";
            } else {
                buffer += ch;
            }
        }

        if (buffer.trim()) {
            const segment = buffer.trim();
            if (mode === "chance") {
                const parsed = parseInt(segment, 10);
                if ( chance != null) {
                    this.logger.validation_error(`Duplicate chance value '${segment}'`, this.file_line_num);
                }
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                    chance = parsed;
                } else {
                    this.logger.validation_error(`Chance value "${segment}" must be between 0 and 100`, this.file_line_num);
                }
            } else {
                const validated = this.validate_environment(segment, mode);
                (mode === "condition" ? conditions : exceptions).push(validated);
            }
        }

        return {
            conditions: conditions,
            exceptions: exceptions,
            chance: chance
        };
    }

    validate_environment(segment: string, kind: 'condition' | 'exception' | 'chance'): string {
        if (kind === 'chance') {
            const parsed = parseInt(segment, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                return segment;
            } else {
                this.logger.validation_error(`Chance "${segment}" must be a number between 0 and 100`, this.file_line_num);
            }
        }

        const parts = segment.split('_');
        if (parts.length !== 2) {
            this.logger.validation_error(`${kind} "${segment}" must contain exactly one underscore`, this.file_line_num);
        }

        const [before, after] = parts;
        if (!before && !after) {
            this.logger.validation_error(`${kind} "${segment}" must have content on at least one side of '_'`, this.file_line_num);
        }

        return `${before}_${after}`;
    }

    add_transform(target:string, result:string, 
        conditions:string[],
        exceptions:string[],
        chance:(number|null),
        line_num:number) {
        this.transform_pending.push( { target:target, result:result,
            conditions:conditions, exceptions:exceptions,
            chance:chance,
            line_num:line_num} );
    }

    set_concurrent_changes(target_result:string) {
        let result = [];
        let buffer = "";
        let inside_brackets = 0;

        for (let i = 0; i < target_result.length; i++) {
            const char = target_result[i];

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

        return result;
    }

    private parse_cluster(file_array:string[]) {
        let line = file_array[this.file_line_num];
        line = line.replace(/;.*/u, '').trim(); // Remove comment!!
        if (line === '') { return; } // Blank line. End clusterfield... early !!
        let top_row = line.split(/[,\s]+/).filter(Boolean);
        top_row.shift();
        const row_length = top_row.length;
        this.file_line_num ++;

        let concurrent_target: string[] = [];
        let concurrent_result: string[] = [];

        let my_conditions: string[] = [];
        let my_exceptions: string[] = [];

        for (; this.file_line_num < file_array.length; ++this.file_line_num) {
            let line = file_array[this.file_line_num];
            line = line.replace(/;.*/u, '').trim(); // Remove comment!!
            if (line === '') { break} // Blank line. End clusterfield !!

            if (line.startsWith('/') || line.startsWith('!')) {
                const { conditions, exceptions } = this.get_environment(line);
                my_conditions.push(...conditions);
                my_exceptions.push(...exceptions);
                continue
            }

            let row = line.split(/[,\s]+/).filter(Boolean);
            let column = row[0];
            row.shift();

            if (row.length > row_length) {
                this.logger.validation_error(`Clusterfield row too long`, this.file_line_num);
            } else if (row.length < row_length) {
                this.logger.validation_error(`Clusterfield row too short`, this.file_line_num);
            }

            for (let i = 0; i < row_length; ++i) {
                if (row[i] === '+') {
                    continue;
                } else if (row[i] === '-') {
                    concurrent_target.push(column + top_row[i]!);
                    concurrent_result.push('^REJECT')
                } else {
                    concurrent_target.push(column + top_row[i]!);
                    concurrent_result.push(row[i]!);
                }
            }
        }
        this.add_transform(concurrent_target.join(','), concurrent_result.join(','), 
            my_conditions, my_exceptions, null, this.file_line_num);
    }

    set_transforms(resolved_transforms: {  // From resolve_transforms !!
        target:Token[][], result:Token[][],
        conditions:{ before:Token[], after:Token[] }[], exceptions:{ before:Token[], after:Token[] }[],
        chance:(number|null),
        line_num:number
    }[]) {
        this.transforms = resolved_transforms;
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

    expand_categories() {
        for (const [key, value] of this.category_pending) {
            if (!this.valid_category_brackets(value.content)) {
                this.logger.validation_error(`Category '${key}' had missmatched brackets`, value.line_num);
            }
            if (!this.valid_category_weights(value.content)) {
                this.logger.validation_error(`Category '${key}' had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',', a bracket, or ' '`, value.line_num);
            }
            
            for (const [key, value] of this.category_pending.entries()) {
                const expanded_content = this.recursive_expansion(value.content, this.category_pending);
                this.category_pending.set(key, {
                    content: expanded_content,
                    line_num: value.line_num, // Preserve original line_num
                });
            }
        }

        for (const [key, value] of this.category_pending) {
            const new_category_field: { graphemes:string[], weights:number[]} = this.resolve_nested_categories(value.content, this.category_distribution);
            this.categories.set(key, new_category_field);
        }
    }

    valid_category_brackets(str: string): boolean {
        const stack: string[] = [];
        const bracket_pairs: Record<string, string> = {
            ']': '['
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

    valid_category_weights(str: string): boolean {
        // Rule 1: asterisk must be followed by a number (integer or decimal)
        const asterisk_without_number = /\*(?!\d+(\.\d+)?)/g;

        // Rule 2: asterisk must not appear at the start
        const asterisk_at_start = /^\*/; // Returns false if follows rule

        // Rule 3: asterisk must not be preceded by space or comma
        const asterisk_after_space_or_comma = /[ ,\[\]]\*/g; // Returns false if follows rule

        // Rule 4: asterisk-number (int or decimal) pair
        // must be followed by space, comma, ], or end of string
        const asterisk_number_bad_suffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,\]\n]|$)/g;

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

    resolve_nested_categories(
      input: string,
      default_distribution: string
    ): { graphemes: string[]; weights: number[] } {
      type Entry = { key: string; weight: number };
    
      // Break expression into string tokens and nested groups with optional weights
      function tokenize(expr: string): (string | { group: string; weight: number })[] {
        const tokens: (string | { group: string; weight: number })[] = [];
        let i = 0;
        let buffer = '';
    
        // console.log(`🔍 Tokenizing expression: "${expr}"`);
    
        while (i < expr.length) {
          if (expr[i] === '[') {
            if (buffer.trim()) {
              // console.log(`🔹 Found literal token: "${buffer.trim()}"`);
              tokens.push(buffer.trim());
              buffer = '';
            }
    
            let depth = 1, j = i + 1;
            while (j < expr.length && depth > 0) {
              if (expr[j] === '[') depth++;
              else if (expr[j] === ']') depth--;
              j++;
            }
    
            const content = expr.slice(i + 1, j - 1);
            i = j;
    
            let weight = 1;
            if (expr[i] === '*') {
              i++;
              let w = '';
              while (i < expr.length && /[\d.]/.test(expr[i])) w += expr[i++];
              weight = parseFloat(w || '1');
            }
    
            // console.log(`🔸 Found nested group: [${content}] with weight ${weight}`);
            tokens.push({ group: content, weight });
          } else if (/[,\s]/.test(expr[i])) {
            if (buffer.trim()) {
              // console.log(`🔹 Found literal token: "${buffer.trim()}"`);
              tokens.push(buffer.trim());
              buffer = '';
            }
            i++;
          } else {
            buffer += expr[i++];
          }
        }
    
        if (buffer.trim()) {
          // console.log(`🔹 Found literal token at end: "${buffer.trim()}"`);
          tokens.push(buffer.trim());
        }
    
        return tokens;
      }
    
      // Evaluate expression tree and assign weights recursively
      function evaluate(expr: string, multiplier = 1): Entry[] {
        // console.log(`🔁 Evaluating expression: "${expr}" (multiplier=${multiplier})`);
        const tokens = tokenize(expr);
    
        const uses_explicit_weights = tokens.some(t =>
          typeof t === "string" && t.includes("*")
        );
    
        const dist = uses_explicit_weights
          ? Array(tokens.length).fill(1)
          : get_distribution(tokens.length, default_distribution);
    
        //if (uses_explicit_weights) {
          // console.log(`📊 Explicit weights detected; using flat distribution`);
        //} else {
          // console.log(`📊 No explicit weights; using distribution "${default_distribution}"`);
        //}
    
        const entries: Entry[] = [];
    
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          const token_weight = dist[i] * multiplier;
    
          if (typeof token === 'string') {
            const [key, raw_weight] = token.split('*');
            const has_custom_weight = raw_weight !== undefined && raw_weight !== '';
            const literal_weight = has_custom_weight ? parseFloat(raw_weight) : 1;
            const final_weight = has_custom_weight ? literal_weight * multiplier : token_weight;
    
            // console.log(`🔹 Literal "${key.trim()}" → weight: ${final_weight}`);
            entries.push({ key: key.trim(), weight: final_weight });
    
          } else {
            // console.log(`🔂 Recursing into nested group: "${token.group}" with weight ${token.weight}`);
            const inner_entries = evaluate(token.group, 1);
            const total = inner_entries.reduce((sum, e) => sum + e.weight, 0);
    
            for (const { key, weight } of inner_entries) {
              const scaled = (weight / total) * token.weight * token_weight;
              // console.log(`  ↪ "${key}" scaled to ${scaled.toFixed(4)}`);
              entries.push({ key, weight: scaled });
            }
          }
        }
        return entries;
      }
    
      const evaluated = evaluate(input);
      const keys = evaluated.map(e => e.key);
      const weights = evaluated.map(e => e.weight);
      // console.log(`🏁 Final result → Graphemes: ${keys.join(", ")} | Weights: ${weights.map(w => w.toFixed(4)).join(", ")}`);
      return { graphemes: keys, weights: weights };
    }

    expand_wordshape_segments() {
        this.wordshape_pending = this.recursive_expansion(this.wordshape_pending, this.segments);

        // Remove dud segments
        const match = this.wordshape_pending.match(/\$[A-Z]/);
        if (match) {
            this.logger.validation_error(`Nonexistent segment detected: '${match[0]}'`, this.wordshape_line_num);
        }
    }

    expand_segments() {
        for (const [key, value] of this.segments.entries()) {
            const expanded_content = this.recursive_expansion(value.content, this.segments);
            this.segments.set(key, {
                content: expanded_content,
                line_num: value.line_num, // Preserve original line_num
            });
        }
    }

    recursive_expansion(
        input: string,
        mappings: Map<string, { content: string, line_num: number }>,
        enclose_in_brackets: boolean = false
    ): string {
        const mappingKeys = [...mappings.keys()].sort((a, b) => b.length - a.length);

        const resolve_mapping = (str: string, history: string[] = []): string => {
            let result = '', i = 0;

            while (i < str.length) {
                let matched = false;

                for (const key of mappingKeys) {
                    const entry = mappings.get(key)!;

                    if (str.startsWith(key, i)) {
                        if (history.includes(key)) {
                            this.logger.warn(`A cycle was detected when mapping '${key}'`, entry.line_num);
                            result += '�';
                        } else {
                            const entry = mappings.get(key);
                            const resolved = resolve_mapping(entry?.content || '', [...history, key]);
                            result += enclose_in_brackets ? `[${resolved}]` : resolved;
                        }
                        i += key.length;
                        matched = true;
                        break;
                    }
                }

                if (!matched) result += str[i++];
            }

            return result;
        };

        return resolve_mapping(input);
    }

    private parse_words_block(file_array:string[]) {
        let line = file_array[this.file_line_num];
        let line_value = line.substring(12).trim();
        line_value = this.escape_mapper.escape_backslash_pairs(line_value);
        line_value = line_value.replace(/;.*/u, '').trim(); // Remove comment!!
        if (line_value === 'END') {return}
        line_value = line_value.trimEnd().endsWith(",") || line_value.trimEnd().endsWith(" ") ? line_value : line_value + " ";

        this.wordshape_pending += line_value;
        this.file_line_num ++;

        for (; this.file_line_num < file_array.length; ++this.file_line_num) {
            line_value = file_array[this.file_line_num];
            line_value = this.escape_mapper.escape_backslash_pairs(line_value);
            line_value = line_value.replace(/;.*/u, '').trim(); // Remove comment!!
            if (line_value === 'END') { break} // END !!
            line_value = line_value.trimEnd().endsWith(",") || line_value.trimEnd().endsWith(" ") ? line_value : line_value + " ";

            this.wordshape_pending += line_value;   
        }
    }

    format_tokens(seq: Token[]): string {
        // Formatting for making the record
        return seq.map(t => {
            let s = t.base;

            if (t.type === "anythings-mark") {
                if ('blocked_by' in t && t.blocked_by) {
                    s+= `{${t.blocked_by.join(", ")}}`
                }
            }

            if ('escaped' in t && t.escaped) {
                s = '\\' + s;
            }
            if ('min' in t && t.min === 1 && t.max === Infinity) {
                s += `+`;
            } else if ('min' in t  && t.max === Infinity) {
                s += `+{${t.min},}`;
            } else if ('min' in t && t.min == t.max) {
                if (t.min == 1){
                    // min 1 and max 1
                } else {
                    s += `+{${t.min}}`;
                }
            } else if ('min' in t) {
                s += `+{${t.min}${t.max !== Infinity ? ',' + t.max : ''}}`;
            }
            return s;
        }).join('');
    }

    create_record(): void {
        let categories = [];
        for (const [key, value] of this.categories) {
            let cat_field:string[] = [];
            for (let i = 0; i < value.graphemes.length; i++) {
                cat_field.push(`${value.graphemes[i]}*${value.weights[i]}`);
            }
            const category_field:string = `${cat_field.join(', ')}`;

            categories.push(`  ${key} = ${category_field}`);
        }

        let segments = [];
        for (const [key, value] of this.segments) {
            segments.push(`  ${key} = ${value.content}`);
        }

        let wordshapes = [];
        for (let i = 0; i < this.wordshapes.items.length; i++) {
            wordshapes.push(`  ${this.wordshapes.items[i]}*${this.wordshapes.weights[i]}`);
        }

        let transforms = [];
        for (let i = 0; i < this.transforms.length; i++) {
            const my_transform = this.transforms[i];

            let my_target = [];
            for (let j = 0; j < my_transform.target.length; j++) {
                my_target.push(this.format_tokens(my_transform.target[j]));
            }
            let my_result = [];
            for (let j = 0; j < my_transform.result.length; j++) {
                my_result.push(this.format_tokens(my_transform.result[j]));
            }

            let chance = my_transform.chance ? ` ? ${my_transform.chance}` : '';
            let exceptions = '';
            for (let j = 0; j < my_transform.exceptions.length; j++) {
                exceptions += ` ! ${this.format_tokens(my_transform.exceptions[j].before)}_${this.format_tokens(my_transform.exceptions[j].after)}`;
            }
            let conditions = '';
            for (let j = 0; j < my_transform.conditions.length    ; j++) {
                conditions += ` / ${this.format_tokens(my_transform.conditions[j].before)}_${this.format_tokens(my_transform.conditions[j].after)}`;
            }

            transforms.push(`  ⟨${my_target.join(", ")} → ${my_result.join(", ")}${conditions}${exceptions}${chance}⟩:${my_transform.line_num}`);
        }

        let info:string =
            `~ OPTIONS ~\n` +
            `Num of words: ` + this.num_of_words + 
            `\nDebug: ` + this.debug + 
            `\nParagrapha: ` + this.paragrapha +
            `\nRemove duplicates: ` + this.remove_duplicates +
            `\nForce word limit: ` + this.force_word_limit +
            `\nSort words: ` + this.sort_words +
            `\nCapitalise words: ` + this.capitalise_words +
            `\nWord divider: "` + this.word_divider + `"` +

            `\n\n~ FILE ~` +
            `\nCategory-distribution: ` + this.category_distribution +
            `\nCategories {\n` + categories.join('\n') + `\n}` +

            `\nSegments {\n` + segments.join('\n') + `\n}` +
            `\nOptionals-weight: ` + this.optionals_weight +

            `\nWordshape-distribution: ` + this.wordshape_distribution +
            `\nWordshapes {\n` + wordshapes.join('\n') + `\n}` +

            `\nTransforms {\n` + transforms.join('\n') + `\n}` +
            `\nGraphemes: ` + this.graphemes.join(', ') +
            `\nAlphabet: ` + this.alphabet.join(', ') +
            `\nInvisible: ` + this.invisible.join(', ');
        info = this.escape_mapper.restore_preserve_escaped_chars(info);

        this.logger.diagnostic(info);
    }
}

export default Resolver;