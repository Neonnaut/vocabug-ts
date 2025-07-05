import Word from './word';
import Logger from './logger';
import Escape_Mapper from './escape_mapper';
import SupraBuilder from './supra_builder';
import { weightedRandomPick, resolve_wordshape_sets } from './utilities'

class Word_Builder {
    public logger: Logger;
    public escape_mapper: Escape_Mapper;
    public supra_builder: SupraBuilder;
    public categories: Map< string, {graphemes:string[], weights:number[]} >;
    public wordshapes: {items:string[], weights:number[]};
    public wordshape_distribution: string;
    private category_distribution: string;
    public optionals_weight: number;

    constructor(
        logger: Logger,
        escape_mapper: Escape_Mapper,
        supra_builder: SupraBuilder,
        categories: Map< string, {graphemes:string[], weights:number[]} >,
        wordshapes: {items:string[], weights:number[]},
        wordshape_distribution: string,
        category_distribution: string,
        optionals_weight: number,
        debug: boolean,
    ) {
        this.logger = logger;
        this.escape_mapper = escape_mapper;
        this.supra_builder = supra_builder
        this.categories = categories;
        this.wordshapes = wordshapes;
        this.wordshape_distribution = wordshape_distribution;
        this.category_distribution = category_distribution;
        this.optionals_weight = optionals_weight;

        Word.debug = debug;
    }

    make_word() : Word {
        // skeleton word looks like `CV(@, !)CVF[@, !]`
        let stage_one:string | undefined = weightedRandomPick(this.wordshapes.items, this.wordshapes.weights);
        if (stage_one === undefined) {
            throw new Error('A word was undefined')
        }

        // baby word looks like `CVCVF!`
        const stage_two:string = resolve_wordshape_sets(stage_one, this.category_distribution, this.optionals_weight);

        const [ids, weights] = this.supra_builder.extractLettersAndWeights(stage_two);
        const chosen_id = weightedRandomPick(ids, weights);

        // Resolved Inters
        const stage_three = this.supra_builder.replaceLetterAndClean(stage_two, Number(chosen_id));

        // adult word looks like `tacan!`. ready to be transformed and added to text
        let stage_four:string = "";
        for (let i = 0; i < stage_three.length; i++) { // going through each char of baby
            let new_char:string = stage_three[i];
            if (!new_char){
                throw new Error("Undefined char of word")
            }
            for (const [category_key, category_field] of this.categories) { //going through C = [[a, b, c], [1, 2, 3]]
                if (category_key == new_char) {
                    new_char = weightedRandomPick(category_field.graphemes, category_field.weights)
                    break;
                }
            }
            stage_four += new_char
        }

        let stage_five = stage_four.replace(/\^/g, ""); // Remove caret from word

        if (this.escape_mapper.counter != 0) {
            stage_one = this.escape_mapper.restoreEscapedChars(stage_one);
            stage_five = this.escape_mapper.restoreEscapedChars(stage_five);
        }
        
        return new Word(stage_one, stage_five);
    }
}

export default Word_Builder;