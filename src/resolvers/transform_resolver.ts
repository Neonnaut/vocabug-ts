// Yikes, there is so much of this that I needed to put it in a separate file to resolver.
import Logger from "../logger";
import Nesca_Grammar_Stream from "./nesca_grammar_stream";
import type {
   Token,
   Output_Mode,
   Transform,
   Transform_Pending,
} from "../utils/types";

class Transform_Resolver {
   private logger: Logger;
   private output_mode: Output_Mode;

   public nesca_grammar_stream: Nesca_Grammar_Stream;
   public categories: Map<string, string[]>;
   public transform_pending: Transform_Pending[];
   public transforms: Transform[] = [];

   public syllable_boundaries: string[];

   public features: Map<string, { graphemes: string[] }> = new Map();

   private line_num: number;

   constructor(
      logger: Logger,
      output_mode: Output_Mode,
      nesca_grmmar_stream: Nesca_Grammar_Stream,
      categories: Map<string, string[]>,
      transform_pending: Transform_Pending[],
      features: Map<string, { graphemes: string[] }>,
      syllable_boundaries: string[],
   ) {
      this.logger = logger;
      this.output_mode = output_mode;

      this.nesca_grammar_stream = nesca_grmmar_stream;
      this.categories = categories;
      this.transform_pending = transform_pending;
      this.features = features;
      this.syllable_boundaries =
         syllable_boundaries.length === 0 ? ["."] : syllable_boundaries;
      this.line_num = 0;

      this.resolve_transforms();
      if (this.output_mode === "debug") {
         this.show_debug();
      }
   }

   resolve_transforms() {
      // Resolve brackets, put categories in transforms, make a milkshake, etc.

      for (let i = 0; i < this.transform_pending.length; i++) {
         this.line_num = this.transform_pending[i].line_num;

         if (this.transform_pending[i].t_type === "cluster-field") {
            this.transforms.push({
               t_type: this.transform_pending[i].t_type,
               target: this.get_cluser_field_graphemes(
                  this.transform_pending[i].target,
                  "TARGET",
               ),
               result: this.get_cluser_field_graphemes(
                  this.transform_pending[i].result,
                  "RESULT",
               ),
               conditions: [],
               exceptions: [],
               chance: null,
               line_num: this.line_num,
            });
            continue;
         } else if (this.transform_pending[i].t_type !== "rule") {
            // Routine type
            this.transforms.push({
               t_type: this.transform_pending[i].t_type,
               target: [],
               result: [],
               conditions: [],
               exceptions: [],
               chance: null,
               line_num: this.line_num,
            });
            continue;
         }

         const target = this.transform_pending[i].target; // string

         // Replace category keys with category graphemes, must be item, or alone
         const target_with_cat = this.categories_into_transform(target);
         // Replace feature matrix keys with feature matrix graphemes
         const target_with_fea = this.features_into_transform(target_with_cat);
         // Resolve alternators or optionalators as array of arrays
         const target_altors: string[][] =
            this.resolve_alt_opt(target_with_fea);

         const result = this.transform_pending[i].result; // string
         // Replace category keys with category graphemes, must be item, or alone
         const result_with_cat = this.categories_into_transform(result);
         // Replace feature matrix keys with feature matrix graphemes
         const result_with_fea = this.features_into_transform(result_with_cat);
         // Resolve alternators or optionalators as array of arrays
         const result_altors: string[][] =
            this.resolve_alt_opt(result_with_fea);

         // Make sure lengths are good, and get merging change / sets
         const { result_array, target_array } = this.normaliseTransformLength(
            target_altors,
            result_altors,
         );

         // Flatten the arrays
         const result_length_match: string[] = result_array.flat();
         const target_length_match: string[] = target_array.flat();

         const tokenised_target_array: Token[][] = [];
         // Grammar stream for target
         for (let j = 0; j < target_length_match.length; j++) {
            tokenised_target_array.push(
               this.nesca_grammar_stream.main_parser(
                  target_length_match[j],
                  "TARGET",
                  this.line_num,
               ),
            );
         }

         const tokenised_result_array: Token[][] = [];
         // Grammar stream for result
         for (let j = 0; j < result_length_match.length; j++) {
            tokenised_result_array.push(
               this.nesca_grammar_stream.main_parser(
                  result_length_match[j],
                  "RESULT",
                  this.line_num,
               ),
            );
         }

         const chance = this.transform_pending[i].chance;

         const new_conditions: { before: Token[]; after: Token[] }[] = [];
         const new_exceptions: { before: Token[]; after: Token[] }[] = [];

         for (let j = 0; j < this.transform_pending[i].conditions.length; j++) {
            // CONDITIONS
            let my_condition = this.transform_pending[i].conditions[j];
            my_condition = this.categories_into_transform(my_condition);
            my_condition = this.features_into_transform(my_condition);
            // Validate brackets
            if (!this.valid_transform_brackets(my_condition)) {
               this.logger.validation_error(
                  `Invalid brackets in condition "${my_condition}"`,
                  this.line_num,
               );
            }
            if (!this.valid_environment(my_condition)) {
               this.logger.validation_error(
                  `Found separators outside sets in condition "${my_condition}"`,
                  this.line_num,
               );
            }
            const alt_opt_condition = this.resolve_alt_opt(my_condition);
            for (let k = 0; k < alt_opt_condition[0].length; k++) {
               const [before_str, after_str] = this.environment_helper(
                  alt_opt_condition[0][k],
               );
               // Grammar stream for condition before
               const before = this.nesca_grammar_stream.main_parser(
                  before_str,
                  "BEFORE",
                  this.line_num,
               );
               // Grammar stream for condition after
               const after = this.nesca_grammar_stream.main_parser(
                  after_str,
                  "AFTER",
                  this.line_num,
               );
               new_conditions.push({
                  before: before,
                  after: after,
               });
            }
         }
         for (let j = 0; j < this.transform_pending[i].exceptions.length; j++) {
            // EXCEPTIONS
            let my_exception = this.transform_pending[i].exceptions[j];
            my_exception = this.categories_into_transform(my_exception);
            my_exception = this.features_into_transform(my_exception);
            // Validate brackets
            if (!this.valid_transform_brackets(my_exception)) {
               this.logger.validation_error(
                  `Invalid brackets in exception "${my_exception}"`,
                  this.line_num,
               );
            }
            if (!this.valid_environment(my_exception)) {
               this.logger.validation_error(
                  `Found separators outside sets in condition "${my_exception}"`,
                  this.line_num,
               );
            }
            const alt_opt_exception = this.resolve_alt_opt(my_exception);
            for (let k = 0; k < alt_opt_exception[0].length; k++) {
               const [before_str, after_str] = this.environment_helper(
                  alt_opt_exception[0][k],
               );
               // Grammar stream for exception before
               // Grammar stream for exception after
               const before = this.nesca_grammar_stream.main_parser(
                  before_str,
                  "BEFORE",
                  this.line_num,
               );
               const after = this.nesca_grammar_stream.main_parser(
                  after_str,
                  "AFTER",
                  this.line_num,
               );
               new_exceptions.push({
                  before: before,
                  after: after,
               });
            }
         }

         this.transforms.push({
            t_type: this.transform_pending[i].t_type,
            target: tokenised_target_array,
            result: tokenised_result_array,
            conditions: new_conditions,
            exceptions: new_exceptions,
            chance: chance,
            line_num: this.line_num,
         });
      }
      return this.transforms;
   }

   environment_helper(input: string): [string, string] {
      const [left = "", right = ""] = input.split("_", 2);
      return [left.trim(), right.trim()];
   }

   // 🧱 Internal: Split input into top-level chunks
   split_top_level(str: string): string[] {
      const chunks: string[] = [];
      let depth = 0;
      let buffer = "";

      for (let i = 0; i < str.length; i++) {
         const char = str[i];

         // Track nesting depth for (), [], and {}
         if (char === "[" || char === "(" || char === "{") depth++;
         else if (char === "]" || char === ")" || char === "}") depth--;

         // Split only at top level
         if ((char === "," || /\s/.test(char)) && depth === 0) {
            if (buffer.trim()) chunks.push(buffer.trim());
            buffer = "";
         } else {
            buffer += char;
         }
      }

      if (buffer.trim()) chunks.push(buffer.trim());
      return chunks;
   }

   check_grammar_rules(str: string): void {
      const stack: { char: string; index: number }[] = [];

      for (let i = 0; i < str.length; i++) {
         const char = str[i];

         if (char === "{" || char === "(") {
            if (stack.length >= 1) {
               this.logger.validation_error(
                  "Nested alternator / optionalator not allowed",
                  this.line_num,
               );
            }
            stack.push({ char, index: i });
         }

         if (char === "}" || char === ")") {
            if (stack.length === 0) {
               this.logger.validation_error(
                  "Mismatched closing bracket",
                  this.line_num,
               );
            }

            const { char: open_char, index: open_index } = stack.pop()!;
            const is_matching =
               (open_char === "{" && char === "}") ||
               (open_char === "(" && char === ")");
            if (!is_matching) {
               this.logger.validation_error(
                  "Mismatched bracket types",
                  this.line_num,
               );
            }

            // Check for empty bracket content
            const inner = str.slice(open_index + 1, i).trim();
            if (!/[^\s,]/.test(inner)) {
               this.logger.validation_error(
                  "Alternator / optionalator must not be empty",
                  this.line_num,
               );
            }

            // Optional: check if bracket is part of a larger token
            const before = str.slice(0, open_index).trim();
            const after = str.slice(i + 1).trim();
            const has_outside_content =
               /[^\s,]/.test(before) || /[^\s,]/.test(after);
            if (!has_outside_content && char === ")") {
               this.logger.validation_error(
                  "Optionalator must be part of a larger sequence",
                  this.line_num,
               );
            }
         }
      }
      if (stack.length !== 0) {
         this.logger.validation_error("Unclosed bracket", this.line_num);
      }
   }

   expand_chunk(chunk: string): string[] {
      this.check_grammar_rules(chunk);

      const regex = /([^{(})]+)|(\{[^}]+\})|(\([^)]+\))/g;
      const parts = [...chunk.matchAll(regex)].map((m) => m[0]);

      const expansions: string[][] = parts.map((part) => {
         if (part.startsWith("{")) {
            // {a, b, c} → ["a", "b", "c"]
            return part.slice(1, -1).split(/[\s,]+/);
         }

         if (part.startsWith("(")) {
            // (x, y) → ["", "x", "y"]
            const vals = part.slice(1, -1).split(/[\s,]+/);
            return ["", ...vals];
         }

         // literal text
         return [part];
      });

      return expansions.reduce<string[]>(
         (acc, curr) => {
            const combo: string[] = [];
            for (const a of acc) {
               for (const c of curr) {
                  combo.push(a + c);
               }
            }
            return combo;
         },
         [""],
      );
   }

   resolve_alt_opt(input: string): string[][] {
      // ⚙️ Internal: Check for bracket rules

      // 🎯 Final: Resolve full input
      const chunks = this.split_top_level(input);
      return chunks.map((chunk) => this.expand_chunk(chunk));
   }

   getTransformLengths<T>(target: T[][], result: T[][]): T[][] {
      // 🔁 Surface level: Broadcast result if only one entry
      if (result.length === 1 && target.length > 1) {
         result = Array(target.length).fill(result[0]);
      }

      // ❌ Surface length mismatch
      if (result.length !== target.length) {
         this.logger.validation_error(
            `Concurrent change length mismatch: target has ${target.length}, result has ${result.length}`,
            this.line_num,
         );
      }

      return result.map((resItem, i) => {
         const target_item = target[i];

         // 🔁 Nested level: Broadcast if only one element
         if (resItem.length === 1 && target_item.length > 1) {
            resItem = Array(target_item.length).fill(resItem[0]);
         }

         // ❌ Nested length mismatch
         if (resItem.length !== target_item.length) {
            this.logger.validation_error(
               `Alternator / optionalator length mismatch at index ${i}: target has ${target_item.length}, result has ${resItem.length}`,
               this.line_num,
            );
         }

         return resItem;
      });
   }

   categories_into_transform(input: string): string {
      let output = "";
      const length = input.length;

      for (let i = 0; i < length; i++) {
         const char = input[i];

         // Preserve <T, <M, etc.
         if (char === "<" && /^[A-Z]$/.test(input[i + 1])) {
            output += char + input[i + 1];
            i += 1;
            continue;
         }

         // Category expansion (always expand, no boundary checks)
         if (this.categories.has(char)) {
            const entry = this.categories.get(char)!;

            const expanded = entry.filter((g) => !g.includes("^")).join(", ");

            // ----------------
            const isParenWrapped = this.check_bracket_context(
               input,
               i,
               i,
               "category",
            );
            if (isParenWrapped) {
               // inside ( [X] ) -> allowed
               output += `${expanded}`;
               continue;
            }
            // top-level -> allowed
            output += `{${expanded}}`;
            continue;
            // ---------------------------
         }

         // Default passthrough
         output += char;
      }

      return output;
   }

   features_into_transform(stream: string): string {
      const length = stream.length;
      const output: string[] = [];
      let feature_mode = false;
      let feature_matrix = "";
      let sq_start_index = 0;

      for (let i = 0; i < length; i++) {
         const char = stream[i];

         if (feature_mode) {
            if (char === "]") {
               feature_mode = false;

               if (feature_matrix.length !== 0) {
                  const resolved =
                     this.get_graphemes_from_matrix(feature_matrix);

                  // ---------------------------
                  const isParenWrapped = this.check_bracket_context(
                     stream,
                     sq_start_index,
                     i,
                     "feature",
                  );

                  if (isParenWrapped) {
                     output.push(`${resolved}`);
                     continue;
                  }
                  output.push(`{${resolved}}`);
                  continue;
                  // -----------------------------
               }

               feature_matrix = "";
               continue;
            }

            feature_matrix += char;
            continue;
         }

         if (char === "[") {
            sq_start_index = i; // ← RECORD START INDEX HERE

            const next = stream[i + 1];

            // Feature matrix only if [+...] or [-...]
            if (next === "+" || next === "-") {
               feature_mode = true;
               continue;
            }
         }

         // Normal passthrough
         output.push(char);
      }

      if (feature_mode) {
         this.logger.validation_error(
            "Unclosed feature-matrix missing ']'",
            this.line_num,
         );
      }

      return output.join("");
   }

   private check_bracket_context(
      stream: string,
      start: number, // token start
      end: number, // token end (same as start for category; ']' for feature)
      mode: "category" | "feature",
   ): boolean {
      const length = stream.length;

      // 1) Find the bracket that contains `start`
      const stack: { kind: string; index: number }[] = [];

      for (let i = 0; i < length; i++) {
         const ch = stream[i];

         // Only treat round and curly as structural containers
         if (ch === "(" || ch === "{") {
            stack.push({ kind: ch, index: i });
         } else if (ch === ")" || ch === "}") {
            stack.pop();
         }

         if (i === start) break;
      }

      const inside = stack.at(-1);
      if (!inside) return false; // top-level → no bracket context to check

      const open = inside.index;
      const close = this.find_matching_bracket(stream, open); // only for ( and {

      // 2) Token span is [start, end] as provided by caller
      const tokenStart = start;
      const tokenEnd = end;

      // 3) Scan left inside the container
      const left = tokenStart - 1;

      // 4) Scan right inside the container
      const right = tokenEnd + 1;

      const leftIsBoundary =
         left <= open || stream[left] === "," || stream[left] === " ";

      const rightIsBoundary =
         right >= close || stream[right] === "," || stream[right] === " ";

      if (!leftIsBoundary || !rightIsBoundary) {
         this.logger.validation_error(
            `A ${mode} is adjacent to other content inside a set`,
            this.line_num,
         );
      }

      return true;
   }

   private find_matching_bracket(stream: string, openIndex: number): number {
      const open = stream[openIndex];
      const close = open === "(" ? ")" : open === "{" ? "}" : ""; // no square brackets here

      let depth = 0;

      for (let i = openIndex; i < stream.length; i++) {
         if (stream[i] === open) depth++;
         else if (stream[i] === close) depth--;

         if (depth === 0) return i;
      }

      return -1;
   }

   get_graphemes_from_matrix(feature_matrix: string): string {
      const keys: string[] = feature_matrix.split(",").map((k) => k.trim());
      const grapheme_sets: string[][] = [];

      for (const key of keys) {
         const entry = this.features.get(key);
         if (!entry) {
            this.logger.validation_error(
               `Unknown feature '${key}'`,
               this.line_num,
            );
         }
         grapheme_sets.push(entry.graphemes);
      }

      if (grapheme_sets.length === 0) return "";

      const intersection = grapheme_sets
         .slice(1)
         .reduce(
            (acc, set) => acc.filter((g) => set.includes(g)),
            grapheme_sets[0],
         );

      return intersection.join(", ");
   }

   normaliseTransformLength(
      target: string[][],
      result: string[][],
   ): { target_array: string[][]; result_array: string[][] } {
      // 🔁 Surface level: Broadcast result if only one entry
      if (result.length === 1 && target.length > 1) {
         result = Array(target.length).fill(result[0]);
      }

      // ❌ Surface length mismatch
      if (result.length !== target.length) {
         this.logger.validation_error(
            `Concurrent change length mismatch: target has ${target.length}, result has ${result.length}`,
            this.line_num,
         );
      }

      result = result.map((resItem, i) => {
         const target_item = target[i];

         // 🔁 Nested level: Broadcast if only one element
         if (resItem.length === 1 && target_item.length > 1) {
            resItem = Array(target_item.length).fill(resItem[0]);
         }

         // ❌ Nested length mismatch
         if (resItem.length !== target_item.length) {
            this.logger.validation_error(
               `An alternator / optionalator length mismatch occured: target has ${target_item.length}, result has ${resItem.length}`,
               this.line_num,
            );
         }

         return resItem;
      });
      const target_array = target;
      const result_array = result;
      return { target_array, result_array };
   }

   valid_transform_brackets(str: string): boolean {
      const stack: string[] = [];
      const bracket_pairs: Record<string, string> = {
         ")": "(",
         "}": "{",
         "]": "[",
      };
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

   valid_environment(input: string) {
      let depth = 0;

      for (let i = 0; i < input.length; i++) {
         const ch = input[i];

         // Track bracket depth
         if ("{(".includes(ch)) depth++;
         else if ("})".includes(ch)) depth--;

         if (depth === 0) {
            // --- SPACE CHECK ---
            if (ch === " ") {
               const prev = input[i - 1];
               const next = input[i + 1];

               const allowedAroundUnderscore = prev === "_" || next === "_";

               if (!allowedAroundUnderscore) {
                  return false; // unwanted space
               }
            }

            // --- COMMA CHECK ---
            if (ch === ",") {
               return false; // unwanted comma
            }
         }
      }

      return true; // no violations found
   }

   valid_cat_fea(stream: string) {
      const out: string[] = [];
      const stack: string[] = [];
      const length = stream.length;

      let sq_mode = false;
      let sq_content = "";
      let sq_start_index = 0;

      for (let i = 0; i < length; i++) {
         const ch = stream[i];

         // Track bracket nesting
         if (!sq_mode) {
            if (ch === "(" || ch === "{") {
               stack.push(ch);
               out.push(ch);
               continue;
            }
            if (ch === ")" || ch === "}") {
               stack.pop();
               out.push(ch);
               continue;
            }
         }

         // Enter square-bracket mode
         if (!sq_mode && ch === "[") {
            sq_mode = true;
            sq_content = "";
            sq_start_index = i;
            continue;
         }

         // Inside square-bracket mode
         if (sq_mode) {
            if (ch === "]") {
               sq_mode = false;

               const inside = stack.at(-1); // "(" or "{" or undefined

               // CASE 1: inside brackets but not ([...])
               if (inside === "(" || inside === "{") {
                  const prev = stream[sq_start_index - 1];
                  const next = stream[i + 1];

                  const looks_like_paren_wrapper =
                     inside === "(" && prev === "(" && next === ")";

                  if (!looks_like_paren_wrapper) {
                     this.logger.validation_error(
                        `Square bracket set "[${sq_content}]" is not allowed inside ${inside}`,
                        this.line_num,
                     );
                  }

                  // CASE 2: ([blah]) → remove square brackets
                  out.push(sq_content);
                  continue;
               }

               // CASE 3: top-level → convert to curly
               out.push(`{${sq_content}}`);
               continue;
            }

            sq_content += ch;
            continue;
         }

         // Normal passthrough
         out.push(ch);
      }

      if (sq_mode) {
         this.logger.validation_error(
            "Unclosed square bracket set",
            this.line_num,
         );
      }

      return out.join("");
   }

   format_tokens(seq: Token[]): string {
      // Formatting for making the record
      return seq
         .map((t) => {
            let s = t.base;

            if (t.type === "anythings-mark") {
               if ("consume" in t && t.consume) {
                  const groups = t.consume
                     .map((group) => group.join("")) // join inner items
                     .join(", "); // join groups with ,
                  s += `[${groups}]`;
               }
               if ("blocked_by" in t && t.blocked_by) {
                  const groups = t.blocked_by
                     .map((group) => group.join("")) // join inner items
                     .join(", "); // join groups with ,
                  s += `|[${groups}]`;
               }
            }

            if ("escaped" in t && t.escaped) {
               s = "\\" + s;
            }
            if ("min" in t && t.min === 1 && t.max === Infinity) {
               s += `+`;
            } else if ("min" in t && t.max === Infinity) {
               s += `+[${t.min},]`;
            } else if ("min" in t && t.min == t.max) {
               if (t.min == 1) {
                  // min 1 and max 1
               } else {
                  s += `+[${t.min}]`;
               }
            } else if ("min" in t) {
               s += `+[${t.min}${t.max !== Infinity ? "," + t.max : ""}]`;
            }

            if ("association" in t) {
               s += `~`;
            }
            return s;
         })
         .join(" ");
   }

   get_cluser_field_graphemes(
      input: string,
      mode: "RESULT" | "TARGET",
   ): Token[][] {
      const streams: string[] = input.split(/[,]+/).filter(Boolean);

      const tokenised_array: Token[][] = [];
      for (let j = 0; j < streams.length; j++) {
         const stream = streams[j].trim();

         const tokens = this.nesca_grammar_stream.cluster_parser(
            stream,
            mode,
            this.line_num,
         );
         tokenised_array.push(tokens);
      }
      return tokenised_array;
   }

   show_debug(): void {
      const transforms = [];
      for (let i = 0; i < this.transforms.length; i++) {
         const my_transform = this.transforms[i];

         if (
            my_transform.t_type != "rule" &&
            my_transform.t_type != "cluster-field"
         ) {
            transforms.push(
               `  <routine = ${my_transform.t_type}> @ ln:${my_transform.line_num + 1}`,
            );
            continue;
         }

         const my_target = [];
         for (let j = 0; j < my_transform.target.length; j++) {
            my_target.push(this.format_tokens(my_transform.target[j]));
         }
         const my_result = [];
         for (let j = 0; j < my_transform.result.length; j++) {
            my_result.push(this.format_tokens(my_transform.result[j]));
         }

         const chance = my_transform.chance
            ? ` CHANCE ${my_transform.chance}`
            : "";
         let exceptions = "";
         for (let j = 0; j < my_transform.exceptions.length; j++) {
            exceptions += ` ! ${this.format_tokens(my_transform.exceptions[j].before)}_${this.format_tokens(my_transform.exceptions[j].after)}`;
         }
         let conditions = "";
         for (let j = 0; j < my_transform.conditions.length; j++) {
            conditions += ` / ${this.format_tokens(my_transform.conditions[j].before)}_${this.format_tokens(my_transform.conditions[j].after)}`;
         }

         transforms.push(
            `  ${my_target.join(", ")} → ${my_result.join(", ")}${conditions}${exceptions}${chance} @ ln:${my_transform.line_num + 1}`,
         );
      }

      const features = [];
      for (const [key, value] of this.features) {
         features.push(`  ${key} = ${value.graphemes.join(", ")}`);
      }

      const parts: string[] = [];
      for (const entry of this.nesca_grammar_stream.associateme_mapper) {
         // Each variant group becomes {a,i,u}, {á,í,ú}, etc.
         const variantStrings = entry.variants.map(
            (group) => `{${group.join(",")}}`,
         );
         // Join with "<"
         const chain = "  " + variantStrings.join("<");
         parts.push(chain);
      }

      const associatemes: string = parts.join("\n");

      const info: string =
         `Graphemes: ` +
         this.nesca_grammar_stream.graphemes.join(", ") +
         `\nSyllable Boundaries: ` +
         this.syllable_boundaries.join(", ") +
         `\nAssociatemes: \n` +
         associatemes +
         `\nFeatures {\n` +
         features.join("\n") +
         `\n}` +
         `\nTransforms {\n` +
         transforms.join("\n") +
         `\n}`;
      this.logger.diagnostic(info);
   }
}

export default Transform_Resolver;
