import Logger from './logger';
import { cappa } from './utilities';

export class Supra_Builder {
    private logger: Logger;
    private weights: Record<number, (number|'s')>;
    private letters: Record<number, string>;
    public id_counter: number;

    constructor(logger: Logger) {
        this.logger = logger
        this.weights = {};
        this.letters = {};
        this.id_counter = 1;
    }

    process_string(input: string, wordshape_line_num:number): string {
        const token_regex = /\{([^}]*)\}/g;
        const valid_content_regex = new RegExp(
        `^(\\^|∅|${cappa})(?:\\*((\\d+(?:\\.\\d+)?)|s))?$` );

        return input.replace(token_regex, (fullMatch, content) => {
            const match = valid_content_regex.exec(content);
            if (!match) {
                this.logger.validation_error(`Invalid supra-set item '${fullMatch}' -- expected all supra-set items to look like '{A}', '{^}' or '{A*2}'`, wordshape_line_num);
            }

            const letter = match[1];
            const raw_weight = match[2];
            const weight = raw_weight === "s" ? "s" : (raw_weight ? Number(raw_weight) : 1);

            const id = this.id_counter++;
            this.weights[id] = weight;
            this.letters[id] = letter;

            return `{${id}}`;

        });
    }

    extract_letters_and_weights(input: string): [string[], (number|'s')[]] {
        const id_regex = /\{(\d+)\}/g;
        const ids: string[] = [];
        const weights: (number|'s')[] = [];

        let match: RegExpExecArray | null;
        while ((match = id_regex.exec(input)) !== null) {
            const id = Number(match[1]);

            if (!(id in this.letters) || !(id in this.weights)) {
                this.logger.validation_error(`Missing data for ID '${id}'`, null);
            }

            ids.push(id.toString());
            weights.push(this.weights[id]);
        }

        return [ ids, weights ];
    }

    replace_letter_and_clean(input: string, target_ID: number): string {
        const id_regex = /\{(\d+)\}/g;

        return input.replace(id_regex, (_match, id_str) => {
            const id = Number(id_str);

            // Safety check
            if (!(id in this.letters)) {
                this.logger.validation_error(`Unknown ID '${id}' found in input.`, null);
            }

            // Keep only the target letter
            return id === target_ID ? `${this.letters[id]}` : '';
        });
    }

    getWeights(): Record<number, (number|'s')> {
        return this.weights;
    }

    getLetters(): Record<number, string> {
        return this.letters;
    }
}

export default Supra_Builder;