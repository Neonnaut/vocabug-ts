import type { Output_Mode, Word_Step } from "./utils/types";

class Word {
   static output_mode: Output_Mode = "word-list";
   current_form: string;
   rejected: boolean;
   num_of_transformations: number;

   steps: Word_Step[];

   constructor(action: string | null, form: string) {
      this.rejected = false; // This may be changed in transforms or when the word is ""
      this.current_form = form;
      this.num_of_transformations = 0;

      this.steps = [];

      if (action === null) {
         // The only action can be creating a word from a word-shape
         this.steps.push({
            type: "nesca-input",
            form: form,
         });
      } else {
         this.steps.push({
            type: "word-creation",
            action: action,
            form: form,
         });
      }
   }

   get_last_form(): string {
      // Gets canonical word. Use this when sorting the words
      return this.current_form;
   }

   get_word(): string {
      // Use this when creating the text
      const output: string[] = [];

      if (Word.output_mode == "debug") {
         for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];

            if (step.type === "nesca-input") {
               // This is the nesca input line
               output.push(`⟨${step.form}⟩`);
            } else if (step.type === "word-creation") {
               // This is the generation line
               output.push(`${step.action} ➤ ⟨${step.form}⟩`);
            } else if (step.type === "transformation") {
               output.push(
                  `${step.action} ➤ ⟨${step.form}⟩ @ ln:${step.line_num}`,
               );
            } else if (step.type === "banner") {
               output.push(`${step.action}`);
            } else if (step.type === "output") {
               if (this.num_of_transformations != 0) {
                  output.push(`⟨${step.form}⟩`);
               }
            }
         }
         return output.join("\n");
      }
      if (Word.output_mode == "old-to-new") {
         const first_step = this.steps[0];
         let first_form = "";
         if (first_form) {
            if (
               first_step.type === "nesca-input" ||
               first_step.type === "word-creation"
            ) {
               first_form = first_step.form;
            }
         }
         output.push(`${first_form} => ${this.current_form}`);
         return output.join("");
      }
      output.push(`${this.current_form}`);
      return output.join("");
   }

   record_transformation(
      transformation: string,
      form: string,
      line_num: number,
   ): void {
      // WORD:
      // rejected, current_form, output_mode

      // STEPS:
      // transformation, form, line_num []

      this.steps.push({
         type: "transformation",
         action: transformation,
         form: form,
         line_num: line_num + 1,
      });
      this.num_of_transformations++;
   }

   record_banner(action: string) {
      this.steps.push({
         type: "banner",
         action: action,
      });
   }

   record_output() {
      this.steps.push({
         type: "output",
         form: this.get_last_form(),
      });
   }
}

export default Word;
