import Word from './word.js';
import Logger from './logger.js';
import Escape_Mapper from './escape_mapper.js';

import { weightedRandomPick, resolve_wordshape_sets } from './utilities'

class Word_Builder {
    public logger: Logger;
    public escape_mapper: Escape_Mapper;
    public categories: Map< string, {graphemes:string[], weights:number[]} >;
    public wordshapes: {items:string[], weights:number[]};
    public wordshape_distribution: string;
    public optionals_weight: number;

    constructor(
        logger: Logger,
        escape_mapper: Escape_Mapper,
        categories: Map< string, {graphemes:string[], weights:number[]} >,
        wordshapes: {items:string[], weights:number[]},
        wordshape_distribution: string,
        optionals_weight: number,
        debug: boolean,
    ) {
        this.logger = logger;
        this.escape_mapper = escape_mapper;
        this.categories = categories;
        this.wordshapes = wordshapes;
        this.wordshape_distribution = wordshape_distribution;
        this.optionals_weight = optionals_weight;

        Word.debug = debug;
    }

    make_word() : Word {
        // skeleton word looks like `CV(@, !)CVF[@, !]`
        let skeleton_word:string | undefined = weightedRandomPick(this.wordshapes.items, this.wordshapes.weights);
        if (skeleton_word === undefined) {
            throw new Error('A word was undefined')
        }



        // baby word looks like `CVCVF!`
        const baby_word:string = resolve_wordshape_sets(skeleton_word, this.wordshape_distribution, this.optionals_weight);

        // adult word looks like `tacan!`. ready to be transformed and added to text
        let adult_word:string = "";
        for (let i = 0; i < baby_word.length; i++) { // going through each char of baby
            let new_char:string = baby_word[i];
            if (!new_char){
                throw new Error("This should not have happened")
            }
            for (const [category_key, category_field] of this.categories) { //going through C = [[a, b, c], [1, 2, 3]]
                if (category_key == new_char) {
                    new_char = weightedRandomPick(category_field.graphemes, category_field.weights)
                    break;
                }
            }
            adult_word += new_char
        }

        if (this.escape_mapper.counter != 0) {
            skeleton_word = this.escape_mapper.restoreEscapedChars(skeleton_word);
            adult_word = this.escape_mapper.restoreEscapedChars(adult_word);
        }
        return new Word(skeleton_word, adult_word);
    }
}

export default Word_Builder;