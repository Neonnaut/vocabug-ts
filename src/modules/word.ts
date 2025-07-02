import { get_last } from './utilities'

class Word {
    static debug: boolean = false;

    transformations: string[];
    forms: string[];
    rejected: boolean;

    constructor(skeleton: string, adult: string) {
        this.transformations = [skeleton];
        this.forms = [adult];
        this.rejected = false; // This may be changed in transforms or when the word is ""
    }

    get_last_form(): string { // Gets canonical word. Use this when sorting the words
        let output = get_last(this.forms);
        if (output == undefined) {
            return "undefined";
        }
        return output;
    }

    get_word(): string { // Use this when creating the text
        let output: string | undefined = '';
        if (Word.debug) {
            for (let i = 0; i < this.forms.length; i++) {
                output += `{${this.transformations[i]}}: {${this.forms[i]}}\n`;
            }
            return output;
        }
        output = get_last(this.forms);
        if (output == undefined) {
            return "undefined";
        }
        return output;
    }

    record_transformation(rule:string, form:string): void {
        this.transformations.push(rule);
        this.forms.push(form);
        
    }
}

export default Word;