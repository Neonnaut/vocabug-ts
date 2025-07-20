import { get_last } from './utilities'

class Word {
    static debug: boolean = false;

    private transformations: string[];
    private forms: string[];
    public rejected: boolean;
    private line_nums: (number|null)[];

    constructor(skeleton: string, adult: string) {
        this.transformations = [skeleton];
        this.forms = [adult];
        this.rejected = false; // This may be changed in transforms or when the word is ""
        this.line_nums = [null];
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

                output += `⟨${this.transformations[i]}⟩${this.line_nums[i] || ""} 🔹 ⟨${this.forms[i]}⟩\n`;
            }
            return output;
        }
        output = get_last(this.forms);
        if (output == undefined) {
            return "undefined";
        }
        return output;
    }

    record_transformation(rule:string, form:string, line_num:number|null = null): void {
        this.transformations.push(rule);
        this.forms.push(form);
        this.line_nums.push(line_num);
    }
}

export default Word;