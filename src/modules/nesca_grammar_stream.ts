// Parse transform grammar for
// TARGET, RESULT,
// EXCEPTION_BEFORE, EXCEPTION_AFTER
// CONDITION_BEFORE, CONDITION_AFTER
// GET LIST OF TOKENS

import Logger from './logger.js';

type Token =
  | {
      type: "grapheme"; // ch, a, \*
      base: string;
      min?: number;
      max?: number|null;
    }
  | {
      type: "wildcard"; // *
      base: "*";
      min?: number;
      max?: number|null;
    }
  | {
      type: "anythings-mark"; // ~
      base: "~";
      min?: number;
      max?: number;
      blocked_by?: string[];
    }
  | {
      type: "deletion"; // ∅
      base: "∅";
    }
  | {
      type: "insertion"; // ∅
      base: "∅";
    }
  | {
      type: "reject"; // ∅
      base: "^REJECT";
    }
  | {
      type: "pending";
      base: string;
      min?: number;
      max?: number|null;
      position?: number;
    };

type Mode = "target" | "result" | "before" | "after";


class Nesca_Grammar_Stream {
   public logger: Logger;
   private graphemes: string[];
   private mode: Mode;
   
   constructor(
      logger: Logger,
      graphemes: string[],
      mode: Mode
   ) {
      this.logger = logger;
      this.graphemes = graphemes;
      this.mode = mode;
   }

   main_parser(stream: string): Token[] {
      let i = 0;
      const tokens: Token[] = [];

      if (stream === "^" || stream === "∅") {
         if (this.mode === "result") {
            return [{ type: "deletion", base: "∅" }];
         } else if (this.mode === "target") {
            return [{ type: "insertion", base: "∅" }];
         } else {
            this.logger.validation_error(`Unexpected character '${stream}' in mode '${this.mode}'`);
         }
      } else if (stream === "^REJECT" || stream === "^R") {
         return [{ type: "reject", base: "^REJECT" }];
      }

      while (i < stream.length) {
         let new_token: Token = { type: "pending", base: "" };
         const char = stream[i];

         if (/\s/.test(char)) {
            i++;
            continue;
         }

         // Base token
         if (char === "~" || char === "…") {
            if (this.mode  === "result") {
               this.logger.validation_error(`Anythings-mark not allowed in '${this.mode}'`);
            }
            new_token = { type: "anythings-mark", base: "~" };
            i++;
         } else if (char === "*") {
            if (this.mode  == "result") {
               this.logger.validation_error(`Wildcard not allowed in '${this.mode}'`);
            }
            new_token = { type: "wildcard", base: "*" };
            i++;
         } else if (char === "+" || char === ":" || char === "∅" || char === "^") {
            this.logger.validation_error(`Unexpected character '${char}' at position ${i}`);
         } else {
            let matched = false;
            for (const g of this.graphemes.sort((a, b) => b.length - a.length)) {
               if (stream.startsWith(g, i)) {
                  new_token = { type: "grapheme", base: g };
                  i += g.length;
                  matched = true;
                  break;
               }
            }
            if (!matched) {
               new_token = { type: "grapheme", base: stream[i] };
               i++;
            }
         }

         // ✅ Modifier parsing (applies to any token type)
         if (stream[i] === "+") {
            if (this.mode  !== "target") {
               this.logger.validation_error(`Quantifier not allowed in '${this.mode}'`);
            }
            let look_ahead = i + 1;
            if (stream[look_ahead] !== "{") {
               new_token.min = 1;
               new_token.max = null;
               i++;
            } else {
               look_ahead += 1;
               let quantifier = "";
               while (look_ahead < stream.length && stream[look_ahead] !== "}") {
                  quantifier += stream[look_ahead];
                  look_ahead++;
               }
               if (stream[look_ahead] !== "}") {
                  throw new Error(`Unclosed quantifier block at position ${i}`);
               }

               const parts = quantifier.split(",");
               if (parts.length === 1) {
                  const n = parseInt(parts[0], 10);
                  if (isNaN(n)) throw new Error(`Invalid quantifier value: "${parts[0]}"`);
                  new_token.min = n;
                  new_token.max = n;
               } else if (parts.length === 2) {
                  const [minStr, maxStr] = parts;
                  const min = minStr === "" ? 1 : parseInt(minStr, 10);
                  const max = maxStr === "" ? null : parseInt(maxStr, 10);
                  if (minStr !== "" && isNaN(min)) throw new Error(`Invalid min value: "${minStr}"`);
                  if (maxStr !== "" && max !== null && isNaN(max)) throw new Error(`Invalid max value: "${maxStr}"`);
                  new_token.min = min;
                  new_token.max = max;
               } else {
                  throw new Error(`Invalid quantifier format: "${quantifier}"`);
               }

               i = look_ahead + 1;
            }
         } else if (stream[i] === ":") {
            new_token.min = 2;
            new_token.max = 2;
            i++;
         }

         if (new_token.type !== "pending") {
            tokens.push(new_token);
         }
      }
      return tokens;
   }
}

export default Nesca_Grammar_Stream;