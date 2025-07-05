import Logger from './logger';

export class SupraBuilder {
    private logger: Logger;
    private weights: Record<number, number>;
    private letters: Record<number, string>;
    private idCounter: number;

    constructor(logger: Logger) {
        this.logger = logger;
        this.weights = {};
        this.letters = {};
        this.idCounter = 1;
    }

    public processString(input: string): string {
        const tokenRegex = /\{([^}]*)\}/g;
        const validContentRegex = /^(\^|[A-Z\u00C1\u0106\u00C9\u01F4\u00CD\u1E30\u0139\u1E3E\u0143\u00D3\u1E54\u0154\u015A\u00DA\u1E82\u00DD\u0179\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9])(?::(\d+))?$/;

        return input.replace(tokenRegex, (fullMatch, content) => {
            const match = validContentRegex.exec(content);
            if (!match) {
                throw new Error(`Invalid inter-picker: ${fullMatch} -- expected all inter-pickers to look like \`{A}\` or \`{A:2}\``);
            }

            const letter = match[1];
            const weight = match[2] ? Number(match[2]) : 1;

            const id = this.idCounter++;
            this.weights[id] = weight;
            this.letters[id] = letter;

            return `{${id}}`;
        });
    }

        public extractLettersAndWeights(input: string): [string[], number[]] {
        const idRegex = /\{(\d+)\}/g;
        const ids: string[] = [];
        const weights: number[] = [];

        let match: RegExpExecArray | null;
        while ((match = idRegex.exec(input)) !== null) {
            const id = Number(match[1]);

            if (!(id in this.letters) || !(id in this.weights)) {
                this.logger.error(`ID ${id} not found in state.`);
                throw new Error(`Missing data for ID ${id}`);
            }

            ids.push(id.toString());
            weights.push(this.weights[id]);
        }

        return [ ids, weights ];
    }

public replaceLetterAndClean(input: string, targetID: number): string {
    const idRegex = /\{(\d+)\}/g;

    return input.replace(idRegex, (_match, idStr) => {
        const id = Number(idStr);

        // Safety check
        if (!(id in this.letters)) {
            this.logger.warn(`Unknown ID ${id} found in input.`);
            return '';
        }

        // Keep only the target letter
        return id === targetID ? `${this.letters[id]}` : '';
    });
}






    public getWeights(): Record<number, number> {
        return this.weights;
    }

    public getLetters(): Record<number, string> {
        return this.letters;
    }
}

export default SupraBuilder;