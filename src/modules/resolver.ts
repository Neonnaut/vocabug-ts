import type Escape_Mapper from './escape_mapper';
import Logger from './logger';
import InterBuilder from './inter_builder';

import { getCatSeg, GetTransform, makePercentage, extract_complex_value_and_weight, resolve_nested_categories,
    valid_words_brackets, valid_category_brackets, valid_weights, parse_distribution
 } from './utilities'

class Resolver {
    public logger: Logger;
    private escape_mapper: Escape_Mapper;

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
    
    public transforms: { target:string[], result:string[]}[];
    public graphemes: string[];
    public alphabet: string[];
    public invisible: string[];

    private file_line_num = 0;

    constructor(
        logger: Logger,
        escape_mapper: Escape_Mapper,
        num_of_words_string: string,

        mode: string,
        sort_words: boolean,
        capitalise_words: boolean,
        remove_duplicates: boolean,
        force_word_limit: boolean,
        word_divider: string
    ) {
        this.logger = logger;
        this.escape_mapper = escape_mapper;

        if (num_of_words_string == '') {
            num_of_words_string = '100';
        }
        let num_of_words: number = Number(num_of_words_string);
        if (isNaN(num_of_words)) {
            this.logger.warn('Number of words was not a number. Genearating 100 words instead');
            num_of_words = 100;
        } else if (!Number.isInteger(num_of_words)) {
            this.logger.warn('Number of words was rounded to the nearest whole number');
            num_of_words = Math.ceil(num_of_words);
        }
        if ((num_of_words > 1_000_000) || (num_of_words < 1)) {
            this.logger.warn('Number of words was not between 1 and 1,000,000. Genearating 100 words instead');
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
        
        this.category_distribution = "flat";
        this.category_strings = new Map;
        this.categories = new Map;
        this.optionals_weight = 10;
        this.segments = new Map;
        this.wordshape_distribution = "flat";
        this.alphabet = [];
        this.invisible = [];
        this.wordshape_string = ""
        this.wordshapes = { items: [], weights: [] };
        this.graphemes = [];
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
                
                let [target, result, valid] = GetTransform(line_value);

                if ( !valid ) {
                    this.logger.warn(`Malformed transform at line ${this.file_line_num + 1} -- expected \`old → new\` or a clusterfield`);
                    continue;
                } else if ( target.length != result.length ){
                    this.logger.warn(`Malformed transform at line ${this.file_line_num + 1} -- expected an equal amount of concurrent-set targets to concurrent-set results`);
                    continue;
                }

                this.add_transform(target, result);
                continue;
            }

            if (line.startsWith("BEGIN transform:")) {
                transform_mode = true;

            } else if (line.startsWith("category-distribution:")) {
                line_value = line.substring(22).trim().toLowerCase();

                this.category_distribution = parse_distribution(line_value);

            } else if (line.startsWith("wordshape-distribution:")) {
                line_value = line.substring(23).trim().toLowerCase();

                this.wordshape_distribution = parse_distribution(line_value);

            } else if (line.startsWith("optionals-weight:")) {
                line_value = line.substring(17).replace(/%/g, "").trim();

                let optionals_weight = makePercentage(line_value);
                if (optionals_weight == null) {
                    this.logger.warn(`Invalid optionals-weight at ${this.file_line_num + 1} -- expected a number between 1 and 100`);
                    continue;
                }
                this.optionals_weight = optionals_weight;

            } else if (line.startsWith("alphabet:")) {
                line_value = line.substring(9).trim();
                line_value = this.escape_mapper.restorePreserveEscapedChars(line_value);

                let alphabet = line_value.split(/[,\s]+/).filter(Boolean);

                if (alphabet.length == 0){
                    this.logger.warn(`\`alphabet\` was introduced but there were no graphemes listed at ${this.file_line_num + 1} -- expected a list of graphemes`);
                }
                this.alphabet = alphabet;

            } else if (line.startsWith("invisible:")) {
                line_value = line.substring(10).trim();
                line_value = this.escape_mapper.restorePreserveEscapedChars(line_value);

                let invisible = line_value.split(/[,\s]+/).filter(Boolean);

                if (invisible.length == 0){
                    this.logger.warn(`\`invisible\` was introduced but there were no graphemes listed at ${this.file_line_num + 1} -- expected a list of graphemes`);
                }
                this.invisible = invisible;

            } else if (line.startsWith("alphabet-and-graphs:")) {
                line_value = line.substring(20).trim();
                line_value = this.escape_mapper.restorePreserveEscapedChars(line_value);

                let a_g = line_value.split(/[,\s]+/).filter(Boolean);

                if (a_g.length == 0){
                    this.logger.warn(`\`alphabet-and-graphs\` was introduced but there were no graphemes listed at ${this.file_line_num + 1} -- expected a list of graphemes`);
                }
                this.graphemes = a_g;
                this.alphabet = a_g;

            } else if (line.startsWith("graphemes:")) {
                line_value = line.substring(10).trim();
                line_value = this.escape_mapper.escapeBackslashPairs(line_value);

                let graphemes = line_value.split(/[,\s]+/).filter(Boolean);
                if (graphemes.length == 0){
                    this.logger.warn(`\`graphemes\` was introduced but there were no graphemes listed at ${this.file_line_num + 1} -- expected a list of graphemes`);
                }
                this.graphemes = graphemes;

            } else if (line.startsWith("words:")) {
                line_value = line.substring(6).trim();
                line_value = this.escape_mapper.escapeBackslashPairs(line_value);
                
                if (line_value != "") {
                    this.wordshape_string = line_value;
                }

            } else { // It's a category or segment
                line_value = line;
                line_value = this.escape_mapper.escapeBackslashPairs(line_value);

                let [myName, field, valid, isCapital, hasDollarSign] = getCatSeg(line_value);

                if ( !valid || !isCapital ) {
                    this.logger.warn(`Junk ignored at line ${this.file_line_num + 1} -- expected a category, segment, directive, ..., etc`);
                    continue;
                }
                if (hasDollarSign) {
                    // SEGMENTS !!!
                    this.add_segment(myName, field);
                } else {
                    // CATEGORIES !!!
                    this.add_category(myName, field);
                }
            }
        }
    }
    
    add_category(name:string, field:string) {
        this.category_strings.set(name, field);
    }
    add_segment(name:string, field:string) {
        this.segments.set(name, field);
    }

    set_wordshapes(inter_builder: InterBuilder) {
        let result = [];
        let buffer = "";
        let insideBrackets = 0;

        if (this.wordshape_string.length == 0){
            throw new Error(`No word-shapes to choose from -- expected \`words: wordshape1 wordshape2 ...\``);
        }

        this.wordshape_string = inter_builder.processString(this.wordshape_string);

        if (!valid_words_brackets(this.wordshape_string)) {
            throw new Error("A word-shape had missmatched brackets");
        }
        if (!valid_weights(this.wordshape_string)) {
            throw new Error("A word-shape had invalid weights -- expected weights to follow an item and look like `:NUMBER` followed by either `,` or ` `");
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

        let [resultStr, resultNum] = extract_complex_value_and_weight(result, this.wordshape_distribution);
        for (let i = 0; i < resultStr.length; i++) {
            this.wordshapes.items.push(resultStr[i]);
            this.wordshapes.weights.push(resultNum[i]); ///
        } 
    }

    add_transform(target:string[], result:string[]) {
        this.transforms.push( { target:target, result:result } );
    }

    expand_categories() {
        for (const [key, value] of this.category_strings) {
            if (!valid_category_brackets(value)) {
                throw new Error("A category had missmatched brackets");
            }
            if (!valid_weights(value)) {
                throw new Error("A category had invalid weights -- expected weights to follow an item and look like `:NUMBER` followed by either `,` or ` `");
            }
            this.category_strings.set( key, this.recursiveExpansion(value, this.category_strings, true) );
        }



        for (const [key, value] of this.category_strings) {
            const newCategoryField: { graphemes:string[], weights:number[]} = resolve_nested_categories(value, this.category_distribution);
            this.categories.set(key, newCategoryField);
        }
    }

    expand_wordshape_segments() {
        this.wordshape_string = this.recursiveExpansion(this.wordshape_string, this.segments);

        // Remove dud segments
        this.wordshape_string = this.wordshape_string.replace(/\$[A-Z]/g, '❓');
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
                            this.logger.warn(`A cycle was detected when mapping "${key}"`);
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

        for (; this.file_line_num < file_array.length; ++this.file_line_num) {
            let line = file_array[this.file_line_num];
            line = line.replace(/;.*/u, '').trim(); // Remove comment!!
            if (line === '') { break} // Blank line. End clusterfield !!

            let row = line.split(/[,\s]+/).filter(Boolean);
            let column = row[0];
            row.shift();

            if (row.length > row_length) {
                throw new Error(`Clusterfield row too long at line number ${this.file_line_num + 1}`);
            } else if (row.length < row_length) {
                throw new Error(`Clusterfield row too short at line number ${this.file_line_num + 1}`);
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
        this.add_transform(concurrent_target, concurrent_result);
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
            wordshapes.push(`\`${this.wordshapes.items[i]}\`:${this.wordshapes.weights[i]}`);
        }

        let transforms = [];
        for (let i = 0; i < this.transforms.length; i++) {
            transforms.push(`  ${this.transforms[i].target.join(", ")} → ${this.transforms[i].result.join(", ")}`);
        }

        let info:string =
            `~ OPTIONS ~\n` +
            `Num of words:      ` + this.num_of_words + 
            `\nDebug:             ` + this.debug + 
            `\nParagrapha:        ` + this.paragrapha +
            `\nRemove duplicates: ` + this.remove_duplicates +
            `\nForce word limit:  ` + this.force_word_limit +
            `\nSort words:        ` + this.sort_words +
            `\nCapitalise words:  ` + this.capitalise_words +
            `\nWord divider:      "` + this.word_divider + `"` +
            `\n\n~ FILE ~` +

            `\nCategory-distribution:  ` + this.category_distribution +
            `\nCategories {\n` + categories.join('\n') + `\n}` +

            `\nSegments {\n` + segments.join('\n') + `\n}` +
            `\nOptionals-weight:       ` + this.optionals_weight +

            `\nWordshape-distribution: ` + this.wordshape_distribution +
            `\nWordshapes:             ` + wordshapes.join(', ') + `\n}` +

            `\nTransforms {\n` + transforms.join('\n') + `\n}` +
            `\nGraphemes:              ` + this.graphemes.join(', ') +
            `\nAlphabet:               ` + this.alphabet.join(', ') +
            `\nInvisible:             ` + this.invisible.join(', ');
        info = this.escape_mapper.restorePreserveEscapedChars(info);

        this.logger.silent_info(info);
    }
}

export default Resolver;