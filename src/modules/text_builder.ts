import Word from './word';
import Logger from './logger';
import collator from './collator';
import { capitalise } from './utilities';
import type Escape_Mapper from './escape_mapper';

class Text_Builder {
    public logger: Logger;
    private build_start: number;
    public escape_mapper: Escape_Mapper

    public num_of_words: number;
    public debug: boolean;
    public paragrapha: boolean;
    public remove_duplicates: boolean;
    public force_word_limit: boolean;
    public sort_words: boolean;
    public capitalise_words: boolean;
    public word_divider: string;
    public alphabet: string[];
    public invisible: string[];

    public terminated: boolean;
    public words: string[];

    private num_of_duplicates: number;
    private num_of_rejects: number;
    private num_of_duds: number;
    private upper_gen_limit: number;

    constructor(
        logger: Logger, build_start: number,
        escape_mapper: Escape_Mapper,

        num_of_words: number,
        debug: boolean,
        paragrapha: boolean,
        remove_duplicates: boolean,
        force_word_limit: boolean,
        sort_words: boolean,
        capitalise_words: boolean,
        word_divider: string,
        alphabet: string[],
        invisible: string[]
    ) {
        this.logger = logger;
        this.build_start = build_start;
        this.escape_mapper = escape_mapper;

        this.num_of_words = num_of_words;
        this.debug = debug;
        this.paragrapha = paragrapha;
        this.remove_duplicates = remove_duplicates;
        this.force_word_limit = force_word_limit;
        this.sort_words = sort_words;
        this.capitalise_words = capitalise_words;
        this.word_divider = word_divider;
        this.alphabet = alphabet;
        this.invisible = invisible;

        this.terminated = false;
        this.words = []

        this.num_of_duplicates = 0;
        this.num_of_rejects = 0;
        this.num_of_duds = 0;

        this.upper_gen_limit = num_of_words * 5
        if (this.upper_gen_limit > 1000000) {
            this.upper_gen_limit = 1000000;
        }
    }

    add_word(word:Word) {
        let do_it:boolean = false;

        if (word.rejected && !Word.debug) {
            this.num_of_rejects ++;
            this.num_of_duds ++; // Record num of reject
        } else if (this.remove_duplicates){
            if (this.words.includes(word.get_last_form())) {
                this.num_of_duplicates ++; // A dulicate word
                this.num_of_duds ++;
            } else {
                do_it = true; // A unique word
            }
        } else{
            do_it = true; 
        }

        if (do_it) {
            this.words.push(word.get_word());
        }

        // Work out if we need to terminate -- stop more words being made.
        if (this.words.length >= this.num_of_words) {
            this.terminated = true; // Generated enough words !!
        } else if ((this.force_word_limit) && (Date.now() - this.build_start >= 30000) ) {
            this.terminated = true;
            if (this.remove_duplicates) {
                this.logger.warn('Could not generate the requested amount of words. Try adding more unique word-shapes or remove some reject transforms')
            } else {
                this.logger.warn('Could not generate the requested amount of words. Try adding more word-shapes or remove some reject transforms')
            }
        } else if ((this.num_of_duds >= this.upper_gen_limit) && (!this.force_word_limit)) {
            this.terminated = true;
            if (this.remove_duplicates) {
                this.logger.warn('Could not generate the requested amount of words. Try adding more unique word-shapes, remove some reject transforms')
            } else {
                this.logger.warn('Could not generate the requested amount of words. Try adding more word-shapes, remove some reject transforms')
            }
        }
    }

    create_record() {
        // Send some good info about the generation results
        let ms:any = Date.now() - this.build_start;
        const display = ms >= 1000 ? `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)} s` : `${ms} ms`;
        let text:string = '';
        
        if (this.words.length == 1) {
            text+= `1 word generated in ${display}`;
        } else if (this.words.length > 1) {
            text+= `${this.words.length} words generated in ${display}`;
        } else if (this.words.length == 0) {
            text+= `Zero words generated in ${display}`;
        }

        if (this.num_of_duplicates == 1) {
            text+= ` -- with 1 duplicate word removed`;
            if (this.num_of_rejects == 1) {
                text+= `, and 1 word rejected`;
            } else if (this.num_of_rejects > 1) {
                text+= `, and ${this.num_of_rejects} words rejected`;
            }
        } else if (this.num_of_duplicates > 1) {
            text+= ` -- with ${this.num_of_duplicates} duplicate words removed`;
            if (this.num_of_rejects == 1) {
                text+= `, and 1 word rejected`;
            } else if (this.num_of_rejects > 1) {
                text+= `, and ${this.num_of_rejects} words rejected`;
            }
        } else {
            if (this.num_of_rejects == 1) {
                text+= ` -- with 1 word rejected`;
            } else if (this.num_of_rejects > 1) {
                text+= ` -- with ${this.num_of_rejects} words rejected`;
            }
        }

        this.logger.info(text);
    }

    make_text() {
        if (this.sort_words){
            this.words = collator( this.logger, this.words, this.alphabet, this.invisible );
        }
        if (this.capitalise_words){
            for (let i = 0; i < this.words.length; i++) {
                this.words[i] = capitalise(this.words[i]);
            }
        }
        if (this.paragrapha){
            return this.paragraphify(this.words);
        }
        this.create_record();
        return this.words.join(this.word_divider);
    }

    paragraphify(words: string[]): string {
        if (words.length === 0) return '';
        if (words.length === 1) return capitalise(words[0]) + this.randomEndPunctuation();

        const result: string[] = [];

        let shouldCapitalise = true;
        for (let i = 0; i < words.length; i++) {
            let word = words[i];

            if (shouldCapitalise) {
                word = capitalise(word);
                shouldCapitalise = false;
            }

            if (i === words.length - 1) {
                result.push(word); // Hold final punctuation until the end
            } else if (i % 7 === 0 && i !== 0) {
                const punctuation = this.randomEndPunctuation();
                result.push(word + punctuation);
                shouldCapitalise = true; // Capitalize next word
            } else if (i % 6 === 0 && i !== 0) {
                result.push(word + ','); // Sprinkle commas
            } else {
                result.push(word);
            }
        }

        let paragraph = result.join(' ');

        // Remove any dangling punctuation at the end
        paragraph = paragraph.replace(/[,\s]*$/, '');

        // Add final punctuation (., ?, or ! with weighted odds)
        paragraph += this.randomEndPunctuation();

        return paragraph;
    }

    randomEndPunctuation(): string {
        const roll = Math.random();
        if (roll < 0.005) return '...';     // 0.4% chance of exclamation
        if (roll < 0.03) return '!';     // 2% chance of exclamation
        if (roll < 0.08) return '?';     // 5% chance of question
        return '.';                      // 93% chance of full stop
    }
}

export default Text_Builder;