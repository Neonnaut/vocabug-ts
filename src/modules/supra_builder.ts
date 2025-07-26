import Logger from './logger';
import { cappa } from './utilities';

export class SupraBuilder {
    private logger: Logger;
    private weights: Record<number, (number|'s')>;
    private letters: Record<number, string>;
    public idCounter: number;

    constructor(logger: Logger) {
        this.logger = logger
        this.weights = {};
        this.letters = {};
        this.idCounter = 1;
    }

    processString(input: string): string {
        const tokenRegex = /\{([^}]*)\}/g;
        const validContentRegex = new RegExp(
        `^(\\^|∅|${cappa})(?:\\*((\\d+(?:\\.\\d+)?)|s))?$` );

        return input.replace(tokenRegex, (fullMatch, content) => {
            const match = validContentRegex.exec(content);
            if (!match) {
                // THIS
                this.logger.validation_error(`Invalid supra-set item '${fullMatch}' -- expected all supra-set items to look like '{A}', '{^}' or '{A*2}'`, null);
            }

            const letter = match[1];
            const rawWeight = match[2];
            const weight = rawWeight === "s" ? "s" : (rawWeight ? Number(rawWeight) : 1);

            const id = this.idCounter++;
            this.weights[id] = weight;
            this.letters[id] = letter;

            return `{${id}}`;

        });
    }

    extractLettersAndWeights(input: string): [string[], (number|'s')[]] {
        const idRegex = /\{(\d+)\}/g;
        const ids: string[] = [];
        const weights: (number|'s')[] = [];

        let match: RegExpExecArray | null;
        while ((match = idRegex.exec(input)) !== null) {
            const id = Number(match[1]);

            if (!(id in this.letters) || !(id in this.weights)) {
                this.logger.validation_error(`Missing data for ID '${id}'`, null);
            }

            ids.push(id.toString());
            weights.push(this.weights[id]);
        }

        return [ ids, weights ];
    }

    replaceLetterAndClean(input: string, targetID: number): string {
        const idRegex = /\{(\d+)\}/g;

        return input.replace(idRegex, (_match, idStr) => {
            const id = Number(idStr);

            // Safety check
            if (!(id in this.letters)) {
                this.logger.validation_error(`Unknown ID '${id}' found in input.`, null);
            }

            // Keep only the target letter
            return id === targetID ? `${this.letters[id]}` : '';
        });
    }

    getWeights(): Record<number, (number|'s')> {
        return this.weights;
    }

    getLetters(): Record<number, string> {
        return this.letters;
    }
}

export default SupraBuilder;