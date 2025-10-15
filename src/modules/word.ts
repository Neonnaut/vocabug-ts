import { get_last } from './utilities'
import type { Output_Mode } from './types'

class Word {
    static output_mode: Output_Mode = 'word-list';

    transformations: (string|null)[];
    forms: string[];
    rejected: boolean;
    line_nums: string[];

    constructor(first_form:(string|null), second_form:string) {
        this.transformations = [first_form];
        this.forms = [second_form];
        this.rejected = false; // This may be changed in transforms or when the word is ""
        this.line_nums = [''];
    }

    get_last_form(): string { // Gets canonical word. Use this when sorting the words
        const output = get_last(this.forms);
        if (output == undefined) {
            return "undefined";
        }
        return output;
    }

    get_word(): string { // Use this when creating the text
        let output: string | undefined = '';

        if (Word.output_mode == 'debug') {
            for (let i = 0; i < this.forms.length; i++) {
                if (this.transformations[i]) {
                    output += `⟨${this.transformations[i]}⟩${this.line_nums[i]} ➤ ⟨${this.forms[i]}⟩\n`;
                } else {
                    output += `⟨${this.forms[i]}⟩\n`;
                }
            }
            return output;
        }
        if (Word.output_mode == 'old-to-new') {
            output = `${this.forms[0]} => ${get_last(this.forms)}`;
            return output;
        }
        output = get_last(this.forms);
        if (output == undefined) {
            return "undefined";
        }
        return output;
    }

    record_transformation(rule:string|null, form:string, line_num:number|null = null): void {
        this.transformations.push(rule);
        this.forms.push(form);
        let my_line_num = '';
        if (line_num != null) {
            my_line_num = `:${line_num+1}`
        }
        this.line_nums.push(my_line_num);
    }
}

export default Word;