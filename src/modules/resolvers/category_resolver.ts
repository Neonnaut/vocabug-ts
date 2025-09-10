import type Escape_Mapper from '../escape_mapper';
import Logger from '../logger';

import { recursive_expansion } from '../utilities';
import { get_distribution } from '../picker_utilities';
import type { Output_Mode } from '../types';

class Category_Resolver {
   private logger: Logger;
   private escape_mapper: Escape_Mapper;
   private output_mode: Output_Mode;

   public category_distribution: string;
   private category_pending: Map<string, { content:string, line_num:number }>;
   public categories: Map<string, { graphemes:string[], weights:number[] }>;

   public trans_categories: Map<string, string[]>;

   constructor(
      logger: Logger, output_mode: Output_Mode,
      escape_mapper: Escape_Mapper,
      
      category_distribution: string,
      category_pending: Map<string, { content:string, line_num:number }>
   ) {
      this.logger = logger; this.output_mode = output_mode;
      this.escape_mapper = escape_mapper;
      
      this.category_distribution = category_distribution;
      this.category_pending = category_pending;

      this.categories = new Map;
      this.trans_categories = new Map;

      this.resolve_categories();
      this.get_trans_categories();
      if (this.output_mode === 'debug'){ this.show_debug(); }
   }

   private get_trans_categories() {
      for (const [key, value] of this.categories) {
         this.trans_categories.set(key, value.graphemes);
      }
   }

   public resolve_categories() {
      for (const [key, value] of this.category_pending) {
         if (!this.valid_category_brackets(value.content)) {
            this.logger.validation_error(`Category '${key}' had missmatched brackets`, value.line_num);
         }
         if (!this.valid_category_weights(value.content)) {
            this.logger.validation_error(`Category '${key}' had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',', a bracket, or ' '`, value.line_num);
         }
         
         for (const [key, value] of this.category_pending.entries()) {
            const expanded_content = recursive_expansion(value.content, this.category_pending);
            this.category_pending.set(key, {
               content: expanded_content,
               line_num: value.line_num, // Preserve original line_num
            });
         }
      }

      for (const [key, value] of this.category_pending) {
         const new_category_field: { graphemes:string[], weights:number[]} = this.resolve_nested_categories(value.content, this.category_distribution);
         
         // Escape special chars in graphemes
         for (let i = 0; i < new_category_field.graphemes.length; i++) {
            new_category_field.graphemes[i] = this.escape_mapper.escape_special_chars(new_category_field.graphemes[i]);
         }
         this.categories.set(key, new_category_field);
      }
   }

   private valid_category_brackets(str: string): boolean {
      const stack: string[] = [];
      const bracket_pairs: Record<string, string> = { '}': '{' };
      for (const char of str) {
         if (Object.values(bracket_pairs).includes(char)) {
            stack.push(char); // Push opening brackets onto stack
         } else if (Object.keys(bracket_pairs).includes(char)) {
               if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
                  return false; // Unmatched closing bracket
               }
         }
      }
      return stack.length === 0; // Stack should be empty if balanced
   }

   private valid_category_weights(str: string): boolean {
      // Rule 1: asterisk must be followed by a number (integer or decimal)
      const asterisk_without_number = /\*(?!\d+(\.\d+)?)/g;

      // Rule 2: asterisk must not appear at the start
      const asterisk_at_start = /^\*/; // Returns false if follows rule

      // Rule 3: asterisk must not be preceded by space or comma
      const asterisk_after_space_or_comma = /[ ,\{\}]\*/g; // Returns false if follows rule

      // Rule 4: asterisk-number (int or decimal) pair
      // must be followed by space, comma, ], or end of string
      const asterisk_number_bad_suffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,\]\n]|$)/g;

      // If any are true return false
      if (
         asterisk_without_number.test(str) ||
         asterisk_at_start.test(str) ||
         asterisk_after_space_or_comma.test(str) ||
         asterisk_number_bad_suffix.test(str)
      ) {
         return false;
      }
      return true;
   }

   private resolve_nested_categories(
      input: string,
      default_distribution: string
   ): { graphemes: string[]; weights: number[] } {

      type Entry = { key: string; weight: number };
   
      // Break expression into string tokens and nested groups with optional weights
      function tokenize(expr: string): (string | { group: string; weight: number })[] {
         const tokens: (string | { group: string; weight: number })[] = [];
         let i = 0;
         let buffer = '';
         // console.log(`🔍 Tokenizing expression: "${expr}"`);

         while (i < expr.length) {
            if (expr[i] === '{') {
               if (buffer.trim()) {
                  // console.log(`🔹 Found literal token: "${buffer.trim()}"`);
                  tokens.push(buffer.trim());
                  buffer = '';
               }
            let depth = 1, j = i + 1;
            while (j < expr.length && depth > 0) {
               if (expr[j] === '{') depth++;
               else if (expr[j] === '}') depth--;
               j++;
            }

            const content = expr.slice(i + 1, j - 1);
            i = j;

            let weight = 1;
            if (expr[i] === '*') {
               i++;
               let w = '';
               while (i < expr.length && /[\d.]/.test(expr[i])) w += expr[i++];
               weight = parseFloat(w || '1');
            }

            // console.log(`🔸 Found nested group: [${content}] with weight ${weight}`);
            tokens.push({ group: content, weight });
            } else if (/[,\s]/.test(expr[i])) {
               if (buffer.trim()) {
                  // console.log(`🔹 Found literal token: "${buffer.trim()}"`);
                  tokens.push(buffer.trim());
                  buffer = '';
               }
               i++;
            } else {
               buffer += expr[i++];
            }
         }

         if (buffer.trim()) {
            // console.log(`🔹 Found literal token at end: "${buffer.trim()}"`);
            tokens.push(buffer.trim());
         }
         return tokens;
      }

      // Evaluate expression tree and assign weights recursively
      function evaluate(expr: string, multiplier = 1): Entry[] {
         // console.log(`🔁 Evaluating expression: "${expr}" (multiplier=${multiplier})`);
         const tokens = tokenize(expr);

         const uses_explicit_weights = tokens.some(t =>
            typeof t === "string" && t.includes("*")
         );

         const dist = uses_explicit_weights
         ? Array(tokens.length).fill(1)
         : get_distribution(tokens.length, default_distribution);

         //if (uses_explicit_weights) {
         // console.log(`📊 Explicit weights detected; using flat distribution`);
         //} else {
         // console.log(`📊 No explicit weights; using distribution "${default_distribution}"`);
         //}

         const entries: Entry[] = [];

         for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const token_weight = dist[i] * multiplier;
         
            if (typeof token === 'string') {
               const [key, raw_weight] = token.split('*');
               const has_custom_weight = raw_weight !== undefined && raw_weight !== '';
               const literal_weight = has_custom_weight ? parseFloat(raw_weight) : 1;
               const final_weight = has_custom_weight ? literal_weight * multiplier : token_weight;
      
               // console.log(`🔹 Literal "${key.trim()}" → weight: ${final_weight}`);
               entries.push({ key: key.trim(), weight: final_weight });
            } else {
               // console.log(`🔂 Recursing into nested group: "${token.group}" with weight ${token.weight}`);
               const inner_entries = evaluate(token.group, 1);
               const total = inner_entries.reduce((sum, e) => sum + e.weight, 0);
      
               for (const { key, weight } of inner_entries) {
                  const scaled = (weight / total) * token.weight * token_weight;
                  // console.log(`  ↪ "${key}" scaled to ${scaled.toFixed(4)}`);
                  entries.push({ key, weight: scaled });
               }
            }
         }
         return entries;
      }
      const evaluated = evaluate(input);
      const keys = evaluated.map(e => e.key);
      const weights = evaluated.map(e => e.weight);
      // console.log(`🏁 Final result → Graphemes: ${keys.join(", ")} | Weights: ${weights.map(w => w.toFixed(4)).join(", ")}`);
      return { graphemes: keys, weights: weights };
   }

   show_debug(): void {
      let categories = [];
      for (const [key, value] of this.categories) {
         let cat_field:string[] = [];
         for (let i = 0; i < value.graphemes.length; i++) {
               cat_field.push(`${value.graphemes[i]}*${value.weights[i]}`);
         }
         const category_field:string = `${cat_field.join(', ')}`;

         categories.push(`  ${key} = ${category_field}`);
      }

      let info:string =
         `~ CATEGORIES ~\n` +
         `\nCategory-distribution: ` + this.category_distribution +
         `\nCategories {\n` + categories.join('\n') + `\n}`

      this.logger.diagnostic(info);
   }
}

export default Category_Resolver;