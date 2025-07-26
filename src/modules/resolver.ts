import type Escape_Mapper from './escape_mapper';
import Logger from './logger';
import SupraBuilder from './supra_builder';

import { getCatSeg, GetTransform, makePercentage, get_distribution
 } from './utilities'

class Resolver {
    private logger: Logger;
    private escape_mapper: Escape_Mapper;
    public supra_builder: SupraBuilder

    public num_of_words: number;
    public debug: boolean;
    public paragrapha: boolean;
    public remove_duplicates: boolean;
    public force_word_limit: boolean;
    public sort_words: boolean;
    public capitalise_words: boolean;
    public word_divider: string;

    public category_distribution: string;
    private category_strings: Map<string, string>;
    public categories: Map<string, { graphemes:string[], weights:number[]} >;
    
    public segments: Map<string, string>;
    public optionals_weight: number;
    public wordshape_distribution: string;
    private wordshape_string: string;
    public wordshapes: { items:string[], weights:number[]};
    private wordshape_line_num: number;
    
    public pre_transforms: {
        target:string[], result:string[],
        conditions:{ before:string, after:string }[], exceptions:{ before:string, after:string }[],
        line_num:number
    }[];
    public transforms: {
        target:string[], result:string[],
        conditions:{ before:string, after:string }[], exceptions:{ before:string, after:string }[],
        line_num:number
    }[];
    public graphemes: string[];
    public alphabet: string[];
    public invisible: string[];

    private file_line_num = 0;

    constructor(
        logger: Logger,
        escape_mapper: Escape_Mapper,
        supra_builder: SupraBuilder,

        num_of_words_string: number | string,
        mode: string,
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
        this.category_strings = new Map;
        this.categories = new Map;
        this.optionals_weight = 10;
        this.segments = new Map;
        this.wordshape_distribution = "zipfian";
        this.alphabet = [];
        this.invisible = [];
        this.wordshape_string = ""
        this.wordshapes = { items: [], weights: [] };
        this.wordshape_line_num = 0;
        this.graphemes = [];
        this.pre_transforms = [];
        this.transforms = [];
    }

    
    parse_file(file: string) {

        let transform_mode = false;
        let file_array = file.split('\n');

        for (; this.file_line_num < file_array.length; ++this.file_line_num) {
            let line = file_array[this.file_line_num];
            let line_value = '';

            line = this.escape_mapper.escapeBackslashSpace(line);
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

                if (line.startsWith("$ ")) { // Engine
                    line_value = line.substring(2).trim().toLowerCase();

                    line_value = line_value.replace(/\bcapitalize\b/g, 'capitalise')

                    for (const engine of line_value.split(/\s+/)) {
                        if (engine == "decompose"||engine == "compose" ||
                            engine == "capitalise" || engine == "de-capitalise" ||
                            engine == "to-upper-case" || engine == "to-lower-case" ||
                            engine == "xsampa-to-ipa" || engine == "ipa-to-xsampa"
                        ) {
                            this.add_transform(
                                ["$"], [engine], [], [], this.file_line_num
                            )
                        } else {
                            this.logger.validation_error(`Trash engine found'${line_value}'`, this.file_line_num);
                        }
                    }
                    continue;
                }
                
                let [target, result, conditions, exceptions] = this.GetTransform(line_value);

                this.add_transform(target, result, conditions, exceptions, this.file_line_num);
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

                let optionals_weight = makePercentage(line_value);
                if (optionals_weight == null) {
                    this.logger.warn(`Invalid optionals-weight '${line_value}' -- expected a number between 1 and 100`, this.file_line_num);
                    continue;
                }
                this.optionals_weight = optionals_weight;

            } else if (line.startsWith("alphabet:")) {
                line_value = line.substring(9).trim();
                line_value = this.escape_mapper.restorePreserveEscapedChars(line_value);

                let alphabet = line_value.split(/[,\s]+/).filter(Boolean);

                if (alphabet.length == 0){
                    this.logger.warn(`'alphabet' was introduced but there were no graphemes listed -- expected a list of graphemes`, this.file_line_num);
                }
                this.alphabet = alphabet;

            } else if (line.startsWith("invisible:")) {
                line_value = line.substring(10).trim();
                line_value = this.escape_mapper.restorePreserveEscapedChars(line_value);

                let invisible = line_value.split(/[,\s]+/).filter(Boolean);

                if (invisible.length == 0){
                    this.logger.warn(`'invisible' was introduced but there were no graphemes listed -- expected a list of graphemes`, this.file_line_num);
                }
                this.invisible = invisible;

            } else if (line.startsWith("alphabet-and-graphemes:")) {
                line_value = line.substring(23).trim();
                line_value = this.escape_mapper.restorePreserveEscapedChars(line_value);

                let a_g = line_value.split(/[,\s]+/).filter(Boolean);

                if (a_g.length == 0){
                    this.logger.warn(`'alphabet-and-graphemes' was introduced but there were no graphemes listed -- expected a list of graphemes`, this.file_line_num);
                }
                this.graphemes = a_g;
                this.alphabet = a_g;

            } else if (line.startsWith("graphemes:")) {
                line_value = line.substring(10).trim();
                line_value = this.escape_mapper.escapeBackslashPairs(line_value);

                let graphemes = line_value.split(/[,\s]+/).filter(Boolean);
                if (graphemes.length == 0){
                    this.logger.warn(`'graphemes' was introduced but there were no graphemes listed -- expected a list of graphemes`, this.file_line_num);
                }
                this.graphemes = graphemes;

            } else if (line.startsWith("words:")) {
                line_value = line.substring(6).trim();
                line_value = this.escape_mapper.escapeBackslashPairs(line_value);
                
                if (line_value != "") {
                    this.wordshape_string = line_value;
                }
                this.wordshape_line_num = this.file_line_num;

            } else if (line.startsWith("BEGIN words:")) {
                this.parse_words_block(file_array);

            } else { // It's a category or segment
                line_value = line;
                line_value = this.escape_mapper.escapeBackslashPairs(line_value);

                let [myName, field, valid, isCapital, hasDollarSign] = getCatSeg(line_value);

                if ( !valid || !isCapital ) {
                    this.logger.warn(`Junk ignored -- expected a category, segment, directive, ..., etc`, this.file_line_num);
                    continue;
                }
                if (hasDollarSign) {
                    // SEGMENTS !!!
                    if (!this.validateSegment(field)) { this.logger.validation_error(`The segment '${myName}' had separator(s) outside sets -- expected separators for segments to appear only in sets`, this.file_line_num)}
                    if (!this.valid_words_brackets(field)) {
                        this.logger.validation_error(`The segment '${name}' had missmatched brackets`, this.file_line_num);
                    }
                    this.segments.set(myName, field);
                } else {
                    // CATEGORIES !!!
                    this.category_strings.set(myName, field);
                }
            }
        }
        this.wordshape_distribution = this.parse_distribution(this.wordshape_distribution);
        this.category_distribution = this.parse_distribution(this.category_distribution);
    }

    validateSegment(str: string): boolean {
        let insideSquare = false;
        let insideParen = false;

        // We don't want random space or comma inside segment

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === "[") insideSquare = true;
            else if (char === "]") insideSquare = false;

            else if (char === "(") insideParen = true;
            else if (char === ")") insideParen = false;

            if ((char === "," || char === " ") && !insideSquare && !insideParen) {
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
        let insideBrackets = 0;

        if (this.wordshape_string.length == 0){
            this.logger.validation_error(`No word-shapes to choose from -- expected 'words: wordshape1 wordshape2 ...'`, this.wordshape_line_num);
        }

        this.wordshape_string = this.supra_builder.processString(this.wordshape_string);

        if (!this.valid_words_brackets(this.wordshape_string)) {
            this.logger.validation_error(`Word-shapes had missmatched brackets`, this.wordshape_line_num);
        }
        if (!this.valid_words_weights(this.wordshape_string)) {
            this.logger.validation_error(`Word-shapes had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',' a bracket, or ' '`, this.wordshape_line_num);
        }

        for (let i = 0; i < this.wordshape_string.length; i++) {
            const char = this.wordshape_string[i];

            if (char === '[' || char === '(') {
                insideBrackets++;
            } else if (char === ']' || char === ')') {
                insideBrackets--;
            }

            if ((char === ' ' || char === ',') && insideBrackets === 0) {
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

        let [resultStr, resultNum] = this.extract_wordshape_value_and_weight(result, this.wordshape_distribution);
        for (let i = 0; i < resultStr.length; i++) {
            this.wordshapes.items.push(resultStr[i]);
            this.wordshapes.weights.push(resultNum[i]); ///
        } 
    }

    valid_words_brackets(str: string): boolean {
        const stack: string[] = [];
        const bracketPairs: Record<string, string> = {
            ')': '(',
            '>': '<',
            ']': '[',
        };
        for (const char of str) {
            if (Object.values(bracketPairs).includes(char)) {
            stack.push(char); // Push opening brackets onto stack
            } else if (Object.keys(bracketPairs).includes(char)) {
            if (stack.length === 0 || stack.pop() !== bracketPairs[char]) {
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
            let bracketDepth = 0;
            let parenDepth = 0;

            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                buffer += char;

                if (char === '[') bracketDepth++;
                if (char === ']') bracketDepth--;
                if (char === '(') parenDepth++;
                if (char === ')') parenDepth--;

                const atEnd = i === str.length - 1;

                if ((char === ',' && bracketDepth === 0 && parenDepth === 0) || atEnd) {
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
        const asteriskWithoutNumber = /\*(?!\d+(\.\d+)?)/g;

        // Rule 2: asterisk must not appear at the start
        const asteriskAtStart = /^\*/; // Returns false if follows rule

        // Rule 3: asterisk must not be preceded by space or comma
        const asteriskAfterSpaceOrComma = /[ ,]\*/g; // Returns false if follows rule

        // Rule 4: asterisk-number (int or decimal) pair
        // must be followed by space, comma, }, ], ), or end of string
        const asteriskNumberBadSuffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,}\]\)\n]|$)/g;

        // If any are true return false
        if (
            asteriskWithoutNumber.test(str) ||
            asteriskAtStart.test(str) ||
            asteriskAfterSpaceOrComma.test(str) ||
            asteriskNumberBadSuffix.test(str)
        ) {
            return false;
        }
        return true;
    }

    // TRANSFORMS !!!


    // This is run on parsing file. We then have to run resolve_transforms aftter parse file
    GetTransform(input: string): [
        string[], string[],
        { before: string; after: string }[],
        { before: string; after: string }[]
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
        const target_array = this.set_concurrent_changes(target);

        const slashIndex = divided[1].indexOf('/');
        const bangIndex = divided[1].indexOf('!');

        const delimiterIndex = Math.min(
            slashIndex === -1 ? Infinity : slashIndex,
            bangIndex === -1 ? Infinity : bangIndex
        );

        const result = delimiterIndex === Infinity
            ? divided[1].trim()
            : divided[1].slice(0, delimiterIndex).trim();

        if (result == "") {
            this.logger.validation_error(`Result is empty in transform`, this.file_line_num);
        }
        if (!this.valid_transform_brackets(result)) {
            this.logger.validation_error(`Result had missmatched brackets`, this.file_line_num);
        }
        const result_array = this.set_concurrent_changes(result);

        // Yo. We are doing merging change
        if (result_array.length === 1 && target_array.length > 1) {
            // Now fill the rest of the result array with the same value
            while (result_array.length < target_array.length) {
                result_array.push(result_array[0]);
            }
        }

        // If result array is not the same as target array send error
        if (target_array.length !== result_array.length) {
            this.logger.validation_error(`Target and result concurrent changes have missmatched lengths`, this.file_line_num)
        }

        const environment = delimiterIndex === Infinity
            ? ''
            : divided[1].slice(delimiterIndex).trim();

        const { conditions, exceptions } = this.get_environment(environment);

        return [target_array, result_array, conditions, exceptions];
    }

    get_environment(environment_string:string):
    {
        conditions: { before: string; after: string }[];
        exceptions: { before: string; after: string }[];
    } {
        const conditions: { before: string; after: string }[] = [];
        const exceptions: { before: string; after: string }[] = [];

        let buffer = "";
        let mode: "condition" | "exception" = "condition";

        for (let i = 0; i < environment_string.length; i++) {
            const ch = environment_string[i];

            if (ch === '/') {
                if (buffer.trim()) {
                    const validated = this.validateContext(buffer.trim(), mode);
                    (mode === "condition" ? conditions : exceptions).push(validated);
                }
                buffer = "";
                mode = "condition";
            } else if (ch === '!') {
                if (buffer.trim()) {
                    const validated = this.validateContext(buffer.trim(), mode);
                    (mode === "condition" ? conditions : exceptions).push(validated);
                }
                buffer = "";
                mode = "exception";
            } else {
                buffer += ch;
            }
        }

        if (buffer.trim()) {
            const validated = this.validateContext(buffer.trim(), mode);
            (mode === "condition" ? conditions : exceptions).push(validated);
        }

        return {
            conditions: conditions,
            exceptions: exceptions
        };
    }

    validateContext(segment: string, kind: 'condition' | 'exception'): { before: string; after: string } {
        const parts = segment.split('_');
        if (parts.length !== 2) {
            this.logger.validation_error(`${kind} "${segment}" must contain exactly one underscore`, this.file_line_num)
        }

        const [before, after] = parts;
        if (!before && !after) {
            this.logger.validation_error(`${kind} "${segment}" must have content on at least one side of '_'`, this.file_line_num)
        }

        return {
            before: before || '',
            after: after || ''
        };
    }

    add_transform(target:string[], result:string[], 
        conditions:{ before:string, after:string }[],
        exceptions:{ before:string, after:string }[],
        line_num:number) {
        this.pre_transforms.push( { target:target, result:result,
            conditions:conditions, exceptions:exceptions,
            line_num:line_num} );
    }

    set_concurrent_changes(target_result:string) {
        let result = [];
        let buffer = "";
        let insideBrackets = 0;

        for (let i = 0; i < target_result.length; i++) {
            const char = target_result[i];

            if (char === '[' || char === '(') {
                insideBrackets++;
            } else if (char === ']' || char === ')') {
                insideBrackets--;
            }

            if ((char === ' ' || char === ',') && insideBrackets === 0) {
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

        let my_conditions: { before: string, after: string }[] = [];
        let my_exceptions: { before: string, after: string }[] = [];

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
        this.add_transform(concurrent_target, concurrent_result, 
            my_conditions, my_exceptions, this.file_line_num);
    }


    resolve_transforms() {
         // Resolve brackets, put categories in transforms, make a milkshake, etc.
        
        let transforms = [];
        for (let i = 0; i < this.pre_transforms.length; i++) {
            let line_num = this.pre_transforms[i].line_num;

            let target = this.pre_transforms[i].target;
            let result = this.pre_transforms[i].result;

            let xesult = '';
            for (const char of target[0]) {
                const entry = this.categories.get(char);
                if (entry) {
                xesult += entry.graphemes.join('');
                } else {
                xesult += char;
                }
            }
            this.logger.info(xesult)


            //target = this.recursiveExpansion(target, this.category_strings, true);

            let exceptions = [];
            for (let j = 0; j < this.pre_transforms[i].exceptions.length; j++) {
                let exception_before = this.pre_transforms[i].exceptions[j].before
                let exception_after = this.pre_transforms[i].exceptions[j].after;

                exceptions.push({ before:exception_before, after:exception_after });
            }

            let conditions = [];
            for (let j = 0; j < this.pre_transforms[i].conditions.length    ; j++) {
                let condition_before = this.pre_transforms[i].conditions[j].before
                let condition_after = this.pre_transforms[i].conditions[j].after;

                conditions.push({ before:condition_before, after:condition_after });
            }
            transforms.push({
                target: target, result: result,
                conditions: conditions, exceptions: exceptions,
                line_num: line_num
            });
        }
        this.transforms = transforms;
    }

    //private parse_target_result(target, result): [string[],string[]] {

    //}

    valid_transform_brackets(str: string): boolean {
        const stack: string[] = [];
        const bracketPairs: Record<string, string> = {
            ')': '(',
            '}': '{',
            ']': '[',
        };
        for (const char of str) {
            if (Object.values(bracketPairs).includes(char)) {
            stack.push(char); // Push opening brackets onto stack
            } else if (Object.keys(bracketPairs).includes(char)) {
            if (stack.length === 0 || stack.pop() !== bracketPairs[char]) {
                return false; // Unmatched closing bracket
            }
            }
        }
        return stack.length === 0; // Stack should be empty if balanced
    }

    expand_categories() {
        for (const [key, value] of this.category_strings) {
            if (!this.valid_category_brackets(value)) {
                // THIS
                this.logger.validation_error(`Category '${key}' had missmatched brackets`);
            }
            if (!this.valid_category_weights(value)) {
                // THIS
                this.logger.validation_error(`Category '${key}' had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',', a bracket, or ' '`);
            }
            this.category_strings.set( key, this.recursiveExpansion(value, this.category_strings, true) );
        }



        for (const [key, value] of this.category_strings) {
            const newCategoryField: { graphemes:string[], weights:number[]} = this.resolve_nested_categories(value, this.category_distribution);
            this.categories.set(key, newCategoryField);
        }
    }

    valid_category_brackets(str: string): boolean {
        const stack: string[] = [];
        const bracketPairs: Record<string, string> = {
            ']': '['
        };
        for (const char of str) {
            if (Object.values(bracketPairs).includes(char)) {
            stack.push(char); // Push opening brackets onto stack
            } else if (Object.keys(bracketPairs).includes(char)) {
            if (stack.length === 0 || stack.pop() !== bracketPairs[char]) {
                return false; // Unmatched closing bracket
            }
            }
        }
        return stack.length === 0; // Stack should be empty if balanced
        }

    valid_category_weights(str: string): boolean {
        // Rule 1: asterisk must be followed by a number (integer or decimal)
        const asteriskWithoutNumber = /\*(?!\d+(\.\d+)?)/g;

        // Rule 2: asterisk must not appear at the start
        const asteriskAtStart = /^\*/; // Returns false if follows rule

        // Rule 3: asterisk must not be preceded by space or comma
        const asteriskAfterSpaceOrComma = /[ ,\[\]]\*/g; // Returns false if follows rule

        // Rule 4: asterisk-number (int or decimal) pair
        // must be followed by space, comma, ], or end of string
        const asteriskNumberBadSuffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,\]\n]|$)/g;

        // If any are true return false
        if (
            asteriskWithoutNumber.test(str) ||
            asteriskAtStart.test(str) ||
            asteriskAfterSpaceOrComma.test(str) ||
            asteriskNumberBadSuffix.test(str)
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
    
        const usesExplicitWeights = tokens.some(t =>
          typeof t === "string" && t.includes("*")
        );
    
        const dist = usesExplicitWeights
          ? Array(tokens.length).fill(1)
          : get_distribution(tokens.length, default_distribution);
    
        //if (usesExplicitWeights) {
          // console.log(`📊 Explicit weights detected; using flat distribution`);
        //} else {
          // console.log(`📊 No explicit weights; using distribution "${default_distribution}"`);
        //}
    
        const entries: Entry[] = [];
    
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          const tokenWeight = dist[i] * multiplier;
    
          if (typeof token === 'string') {
            const [key, rawWeight] = token.split('*');
            const hasCustomWeight = rawWeight !== undefined && rawWeight !== '';
            const literalWeight = hasCustomWeight ? parseFloat(rawWeight) : 1;
            const finalWeight = hasCustomWeight ? literalWeight * multiplier : tokenWeight;
    
            // console.log(`🔹 Literal "${key.trim()}" → weight: ${finalWeight}`);
            entries.push({ key: key.trim(), weight: finalWeight });
    
          } else {
            // console.log(`🔂 Recursing into nested group: "${token.group}" with weight ${token.weight}`);
            const innerEntries = evaluate(token.group, 1);
            const total = innerEntries.reduce((sum, e) => sum + e.weight, 0);
    
            for (const { key, weight } of innerEntries) {
              const scaled = (weight / total) * token.weight * tokenWeight;
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
        this.wordshape_string = this.recursiveExpansion(this.wordshape_string, this.segments);

        // Remove dud segments
        const match = this.wordshape_string.match(/\$[A-Z]/);
        if (match) {
            this.logger.validation_error(`Nonexistent segment detected: '${match[0]}'`, this.wordshape_line_num);
        }
    }

    expand_segments() {
        for (const [key, value] of this.segments) {
            this.segments.set(key, this.recursiveExpansion(value, this.segments, false));
        }
    }


    recursiveExpansion(
        input: string,
        mappings: Map<string, string>,
        encloseInBrackets: boolean = false
    ): string {
        const mappingKeys = [...mappings.keys()].sort((a, b) => b.length - a.length);

        const resolveMapping = (str: string, history: string[] = []): string => {
            let result = '', i = 0;

            while (i < str.length) {
                let matched = false;

                for (const key of mappingKeys) {
                    if (str.startsWith(key, i)) {
                        if (history.includes(key)) {
                            // THIS
                            this.logger.warn(`A cycle was detected when mapping '${key}'`);
                            result += '🔃';
                        } else {
                            let resolved = resolveMapping(mappings.get(key) || '', [...history, key]);
                            result += encloseInBrackets ? `[${resolved}]` : resolved;
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

        return resolveMapping(input);
    }

    private parse_words_block(file_array:string[]) {
        let line = file_array[this.file_line_num];
        let line_value = line.substring(12).trim();
        line_value = line_value.replace(/;.*/u, '').trim(); // Remove comment!!
        if (line_value === 'END') {return}
        line_value = line_value.trimEnd().endsWith(",") || line_value.trimEnd().endsWith(" ") ? line_value : line_value + " ";

        this.wordshape_string += line_value;
        this.file_line_num ++;

        for (; this.file_line_num < file_array.length; ++this.file_line_num) {
            line_value = file_array[this.file_line_num];
            line_value = line_value.replace(/;.*/u, '').trim(); // Remove comment!!
            if (line_value === 'END') { break} // END !!
            line_value = line_value.trimEnd().endsWith(",") || line_value.trimEnd().endsWith(" ") ? line_value : line_value + " ";

            this.wordshape_string += line_value;   
        }
    }

    create_record(): void {
        let categories = [];
        for (const [key, value] of this.categories) {
            let catField:string[] = [];
            for (let i = 0; i < value.graphemes.length; i++) {
                catField.push(`${value.graphemes[i]}:${value.weights[i]}`);
            }
            const category_field:string = `${catField.join(', ')}`;

            categories.push(`  ${key} = ${category_field}`);
        }

        let segments = [];
        for (const [key, value] of this.segments) {
            segments.push(`  ${key} = ${value}`);
        }

        let wordshapes = [];
        for (let i = 0; i < this.wordshapes.items.length; i++) {
            wordshapes.push(`⟨${this.wordshapes.items[i]}⟩:${this.wordshapes.weights[i]}`);
        }

        let transforms = [];
        for (let i = 0; i < this.transforms.length; i++) {
            transforms.push(`  ⟨${this.transforms[i].target.join(", ")} → ${this.transforms[i].result.join(", ")}⟩`);
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
            `\nWordshapes: ` + wordshapes.join(', ') + `\n}` +

            `\nTransforms {\n` + transforms.join('\n') + `\n}` +
            `\nGraphemes: ` + this.graphemes.join(', ') +
            `\nAlphabet: ` + this.alphabet.join(', ') +
            `\nInvisible: ` + this.invisible.join(', ');
        info = this.escape_mapper.restorePreserveEscapedChars(info);

        this.logger.diagnostic(info);
    }
}

export default Resolver;