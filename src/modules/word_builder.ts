import Logger from './logger';
import Word from './word';
import Escape_Mapper from './escape_mapper';
import SupraBuilder from './supra_builder';
import { weightedRandomPick, supraWeightedRandomPick, get_distribution } from './utilities'

class Word_Builder {
    private logger: Logger;
    private escape_mapper: Escape_Mapper;
    private supra_builder: SupraBuilder;
    private categories: Map< string, {graphemes:string[], weights:number[]} >;
    private wordshapes: {items:string[], weights:number[]};
    private category_distribution: string;
    private optionals_weight: number;

    constructor(
        logger: Logger,
        escape_mapper: Escape_Mapper,
        supra_builder: SupraBuilder,
        categories: Map< string, {graphemes:string[], weights:number[]} >,
        wordshapes: {items:string[], weights:number[]},
        category_distribution: string,
        optionals_weight: number,
        debug: boolean,
    ) {
        this.logger = logger;

        this.escape_mapper = escape_mapper;
        this.supra_builder = supra_builder
        this.categories = categories;
        this.wordshapes = wordshapes;

        this.category_distribution = category_distribution;
        this.optionals_weight = optionals_weight;

        Word.debug = debug;
    }

    make_word() : Word {
        // Stage one looks like `CV(@, !)CVF[@, !]`
        let stage_one:string = weightedRandomPick(this.wordshapes.items, this.wordshapes.weights);

        // Stage two looks like `CVCVF!`
        const stage_two:string = this.resolve_wordshape_sets(stage_one, this.category_distribution, this.optionals_weight);

        // Stage three, resolved supra-set
        let stage_three = stage_two;
        if (this.supra_builder.idCounter != 1) {
            const [ids, weights] = this.supra_builder.extractLettersAndWeights(stage_two);
            const chosen_id = supraWeightedRandomPick(ids, weights);
            stage_three = this.supra_builder.replaceLetterAndClean(stage_two, Number(chosen_id));
        } 

        // Stage four looks like `tacan!`. ready to be transformed and added to text
        let stage_four:string = "";
        for (let i = 0; i < stage_three.length; i++) { // going through each char of baby
            let new_char:string = stage_three[i];

            for (const [category_key, category_field] of this.categories) { //going through C = [[a, b, c], [1, 2, 3]]
                if (category_key == new_char) {
                    new_char = weightedRandomPick(category_field.graphemes, category_field.weights)
                    break;
                }
            }
            stage_four += new_char
        }

        // Stage five, remove caret from word
        let stage_five = stage_four.replace(/\^/g, ""); 
        stage_five = stage_five.replace(/∅/g, ""); 

        if (this.escape_mapper.counter != 0) {
            stage_one = this.escape_mapper.restoreEscapedChars(stage_one);
            stage_five = this.escape_mapper.restoreEscapedChars(stage_five);
        }
        
        return new Word(stage_one, stage_five);
    }

    resolve_wordshape_sets(
        input_list: string,
        distribution: string,
        optionals_weight: number // percentage chance to include optionals (0–100)
    ): string {
        const squarePattern = /\[[^\[\]]*\]/g;
        const roundPattern = /\([^\(\)]*\)/g;
        let matches: RegExpMatchArray | null;

        let items: string[] = [];
        let outputs: [string[], number[]];

        // console.log(`🔍 Starting with input: "${input_list}"`);

        // Resolve optional sets in round brackets based on weight
        while ((matches = input_list.match(roundPattern)) !== null) {
            const group = matches[matches.length - 1];
            const candidates = group.slice(1, -1).split(/[,\s]+/).filter(Boolean);

            // console.log(`🌀 Found optional group: (${candidates.join(", ")})`);

            const include = Math.random() * 100 < optionals_weight;
            // console.log(`🔸 Include group? ${include ? "Yes ✅" : "No ❌"} (weight=${optionals_weight}%)`);

            if (include && candidates.length > 0) {
            const usesExplicitWeights = candidates.some(c => c.includes("*"));
            const distType = usesExplicitWeights ? "flat" : distribution;
            // console.log(`📊 Resolving with distribution: ${distType}`);

            outputs = this.extract_value_and_weight(candidates, distType);
            const selected = weightedRandomPick(outputs[0], outputs[1]);
            // console.log(`🎯 Selected from optional: ${selected}`);
            input_list = input_list.replace(group, selected);
            } else {
            input_list = input_list.replace(group, '');
            // console.log(`🚫 Group excluded`);
            }

            // console.log(`🔄 Updated input: "${input_list}"`);
        }

        // Resolve nested sets in square brackets
        while ((matches = input_list.match(squarePattern)) !== null) {
            const mostNested = matches[matches.length - 1];
            items = mostNested.slice(1, -1).split(/[,\s]+/).filter(Boolean);

            // console.log(`🔧 Resolving nested set: [${items.join(", ")}]`);

            if (items.length === 0) {
                items = ["^"];
            // console.log(`⚠️ Empty set, defaulting to '^'`);
            } else {
            const usesExplicitWeights = items.some(c => c.includes("*"));
            const distType = usesExplicitWeights ? "flat" : distribution;
            // console.log(`📊 Resolving with distribution: ${distType}`);

            outputs = this.extract_value_and_weight(items, distType);
            const picked = weightedRandomPick(outputs[0], outputs[1]);
            // console.log(`🎯 Selected from nested: ${picked}`);
            items = [picked];
            }

            input_list = input_list.replace(mostNested, items[0]);
            // console.log(`🔄 Updated input: "${input_list}"`);
        }

        // Final resolution
        const finalPick = input_list;
        // console.log(`🧮 Final token: ${finalPick}`);

        return finalPick;
    }

    extract_value_and_weight(
        input_list: string[],
        default_distribution: string
    ): [string[], number[]] {
        let my_values: string[] = [];
        let my_weights: number[] = [];

        // Check if all items lack a weight (i.e., none contain "*")
        const allDefaultWeights = input_list.every(item => !item.includes("*"));

        if (allDefaultWeights) {
            my_values = input_list;

            my_weights = get_distribution(input_list.length, default_distribution);

            return [my_values, my_weights];
        }

        input_list.forEach(item => {
            let [value, weightStr] = item.split("*");
            const weight = weightStr && !isNaN(Number(weightStr)) ? parseFloat(weightStr) : 1;
            my_values.push(value);
            my_weights.push(weight);
        });

        return [my_values, my_weights];
    }
}

export default Word_Builder;