// Parse transform grammar for
// TARGET, RESULT,
// EXCEPTION_BEFORE, EXCEPTION_AFTER
// CONDITION_BEFORE, CONDITION_AFTER
// GET LIST OF TOKENS

import Logger from "../logger.js";
import Escape_Mapper from "../escape_mapper.js";
import type { Token } from "../utils/types.js";
import type { Token_Stream_Mode } from "../utils/types.js";
import { graphemosis } from "../utils/utilities.js";

class Nesca_Grammar_Stream {
  public logger: Logger;
  public graphemes: string[];
  private escape_mapper: Escape_Mapper;

  constructor(
    logger: Logger,
    graphemes: string[],
    escape_mapper: Escape_Mapper,
  ) {
    this.logger = logger;
    this.graphemes = graphemes;
    this.escape_mapper = escape_mapper;
  }

  main_parser(
    stream: string,
    mode: Token_Stream_Mode,
    line_num: number,
  ): Token[] {
    let i = 0;
    const tokens: Token[] = [];

    if (stream.startsWith("@routine")) {
      const routine = stream.slice(8);
      return [{ type: "routine", base: routine, routine: routine }];
    } else if (stream === "^") {
      if (mode === "RESULT") {
        return [{ type: "deletion", base: "^" }];
      } else if (mode === "TARGET") {
        return [{ type: "insertion", base: "^" }];
      } else {
        this.logger.validation_error(
          `Unexpected character '${stream}' in mode '${mode}'`,
          line_num,
        );
      }
    } else if (stream === "0") {
      if (mode !== "RESULT") {
        this.logger.validation_error(
          `Reject not allowed in '${mode}'`,
          line_num,
        );
      }
      return [{ type: "reject", base: "0" }];
    }

    while (i < stream.length) {
      let new_token: Token = { type: "pending", base: "", min: 1, max: 1 };
      const char = stream[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Anythings-mark
      if (char === "%") {
        if (mode === "RESULT") {
          this.logger.validation_error(
            `Anythings-mark not allowed in '${mode}'`,
            line_num,
          );
        }

        new_token = {
          type: "anythings-mark",
          base: "%",
          min: 1,
          max: Infinity,
        };

        let look_ahead = i + 1;

        if (stream[look_ahead] === "[") {
          look_ahead++;
          let garde_stream = "";

          //  Collect full stream inside brackets
          while (look_ahead < stream.length) {
            const next_char = stream[look_ahead];
            if (next_char === "]") break;
            garde_stream += next_char;
            look_ahead++;
          }

          if (look_ahead >= stream.length || stream[look_ahead] !== "]") {
            this.logger.validation_error(`Unclosed blocker`, line_num);
          }

          //  Parse stream into consume and blocked_by

          const consume: string[][] = [];
          const blocked_by: string[][] = [];

          const raw_groups = garde_stream
            .split(",")
            .map((group) => group.trim())
            .filter(Boolean);

          let is_blocker = false;

          for (const group of raw_groups) {
            if (group.startsWith("^")) {
              is_blocker = true;
              //group.pop // Skip the ^ marker itself
            }

            const graphemes = graphemosis(group, this.graphemes)
              .map((g) => this.escape_mapper.restore_escaped_chars(g))
              .filter(Boolean);

            if (graphemes.length > 0) {
              if (is_blocker) {
                blocked_by.push(graphemes);
              } else {
                consume.push(graphemes);
              }
            }
          }

          if (consume.length !== 0) {
            new_token.consume = consume;
          }
          if (blocked_by.length !== 0) {
            new_token.blocked_by = blocked_by;
          }
          look_ahead++; // Consume closing bracket
          i = look_ahead;
        }
      } else if (char === "*") {
        if (mode == "RESULT") {
          this.logger.validation_error(
            `Wildcard not allowed in '${mode}'`,
            line_num,
          );
        }
        new_token = { type: "wildcard", base: "*", min: 1, max: 1 };
        i++;
      } else if (char == "#") {
        if (mode !== "BEFORE" && mode !== "AFTER") {
          this.logger.validation_error(
            `Word-boundary not allowed in '${mode}'`,
            line_num,
          );
        }
        if (i !== 0 && i + 1 !== stream.length) {
          this.logger.validation_error(
            `Hash must be at the start or end of '${mode}'`,
            line_num,
          );
        }
        new_token = { type: "word-boundary", base: "#", min: 1, max: 1 };
        tokens.push(new_token);
        i++;
        continue; // No modifiers allowed
      } else if (char == "$") {
        if (mode !== "BEFORE" && mode !== "AFTER") {
          this.logger.validation_error(
            `Syllable-boundary not allowed in '${mode}'`,
            line_num,
          );
        }
        new_token = { type: "syllable-boundary", base: "$", min: 1, max: 1 };
        tokens.push(new_token);
        i++;
        continue; // No modifiers allowed
      } else if (char == "&") {
        const look_ahead = i + 1;
        if (stream[look_ahead] === "T") {
          if (mode === "TARGET") {
            this.logger.validation_error(
              `Target-mark not allowed in '${mode}'`,
              line_num,
            );
          }
          new_token = { type: "target-mark", base: "&T", min: 1, max: 1 };
          i = look_ahead;
        } else if (stream[look_ahead] === "M") {
          if (mode === "TARGET") {
            this.logger.validation_error(
              `Metathesis-mark not allowed in '${mode}'`,
              line_num,
            );
          }
          new_token = { type: "metathesis-mark", base: "&M", min: 1, max: 1 };
          i = look_ahead;
        } else if (stream[look_ahead] === "E") {
          if (mode !== "TARGET") {
            this.logger.validation_error(
              `Empty-mark only allowed in 'TARGET'`,
              line_num,
            );
          }
          new_token = { type: "empty-mark", base: "&E", min: 1, max: 1 };
          i = look_ahead;
        } else if (stream[look_ahead] === "=") {
          // Begins a reference capture of sequenced graphemes
          new_token = {
            type: "reference-start-capture",
            base: "&=",
            min: 1,
            max: 1,
          };
          i = look_ahead + 1;
          tokens.push(new_token);
          continue; // No modifiers allowed
        } else {
          this.logger.validation_error(
            `A 'T', 'M' or '=' did not follow '&' in '${mode}'`,
            line_num,
          );
        }

        i++;
      } else if (char === "=") {
        const look_ahead = i + 1;
        const digit = stream[look_ahead];
        if (/^[1-9]$/.test(digit)) {
          // It's a reference capture
          new_token = {
            type: "reference-capture",
            base: `=${digit}`,
            key: digit,
            min: 1,
            max: 1,
          };
          tokens.push(new_token);
          i = look_ahead + 1;
          continue; // No modifiers allowed
        } else {
          this.logger.validation_error(
            `Invalid reference capture syntax in '${mode}'`,
            line_num,
          );
        }
      } else if (/^[1-9]$/.test(char)) {
        // It's a reference-mark
        if (mode === "TARGET") {
          this.logger.validation_error(
            "Reference-mark not allowed in 'TARGET'",
            line_num,
          );
        }

        new_token = {
          type: "reference-mark",
          base: char,
          key: char,
          min: 1,
          max: 1,
        };
        i++;
      } else if (char === "~") {
        // It's a based-mark
      } else if (
        // Syntax character used wrongly
        char == "⇒" ||
        char == "→" ||
        char == ">" ||
        char == "{" ||
        char == "}" ||
        char == "[" ||
        char == "]" ||
        char == "(" ||
        char == ")" ||
        char == "<" ||
        char === "∅" ||
        char === "^" ||
        char == "/" ||
        char === "!" ||
        char === "?" ||
        char == "_" ||
        char == "#" ||
        char == "+" ||
        char == ":" ||
        char == "*" ||
        char === "&" ||
        char === "%" ||
        char == "|" ||
        char === "~" ||
        char == "@" ||
        char === "=" ||
        char === "1" ||
        char === "2" ||
        char === "3" ||
        char === "4" ||
        char === "5" ||
        char === "6" ||
        char === "7" ||
        char === "8" ||
        char === "9" ||
        char === "0"
      ) {
        this.logger.validation_error(
          `Unexpected syntax character '${char}' in ${mode}`,
          line_num,
        );

        // GRAPHEME match
      } else {
        const escaped_stream = this.escape_mapper.restore_escaped_chars(stream);
        let is_escaped = false;
        if (escaped_stream[i] !== stream[i]) {
          is_escaped = true;
        }
        let matched = false;
        for (const g of this.graphemes.sort((a, b) => b.length - a.length)) {
          if (escaped_stream.startsWith(g, i)) {
            new_token = { type: "grapheme", base: g, min: 1, max: 1 };
            i += g.length;
            matched = true;
            break;
          }
        }
        if (!matched) {
          new_token = {
            type: "grapheme",
            base: escaped_stream[i],
            min: 1,
            max: 1,
          };
          i++;
        }
        if (is_escaped && new_token.type === "grapheme") {
          new_token.escaped = true; // Mark as escaped
        }
      }

      // ✅ Modifier parsing (applies to any token type except word-boundary, reject, deletion, insertion)

      if (stream[i] === ":") {
        tokens.push({ ...new_token });
        let look_ahead = i + 1;
        while (stream[look_ahead] == ":") {
          tokens.push({ ...new_token });
          look_ahead++;
        }
        i = look_ahead;
      }
      if (stream[i] === "+") {
        if (mode === "RESULT") {
          this.logger.validation_error(
            `Quantifier not allowed in '${mode}'`,
            line_num,
          );
        }
        let look_ahead = i + 1;
        if (stream[look_ahead] !== "[") {
          new_token.min = 1;
          new_token.max = Infinity; // Default quantifier
          i++;
        } else {
          look_ahead += 1;
          let quantifier = "";
          while (look_ahead < stream.length && stream[look_ahead] !== "]") {
            quantifier += stream[look_ahead];
            look_ahead++;
          }
          if (stream[look_ahead] !== "]") {
            this.logger.validation_error(`Unclosed quantifier`, line_num);
          }

          const parts = quantifier.split(",");
          if (parts.length === 1) {
            const n = parseInt(parts[0], 10);
            if (isNaN(n)) {
              this.logger.validation_error(
                `Invalid quantifier value: "${parts[0]}"`,
                line_num,
              );
            }
            new_token.min = n;
            new_token.max = n;
          } else if (parts.length === 2) {
            const [minStr, maxStr] = parts;
            const min = minStr === "" ? 1 : parseInt(minStr, 10);
            const max = maxStr === "" ? Infinity : parseInt(maxStr, 10);
            if (minStr !== "" && isNaN(min)) {
              this.logger.validation_error(
                `Invalid min value: "${minStr}"`,
                line_num,
              );
            }
            if (maxStr !== "" && max !== null && isNaN(max)) {
              this.logger.validation_error(
                `Invalid max value: "${maxStr}"`,
                line_num,
              );
            }
            new_token.min = min;
            new_token.max = max;
          } else {
            this.logger.validation_error(
              `Invalid quantifier format: "${quantifier}"`,
              line_num,
            );
          }

          i = look_ahead + 1;
        }
        if (new_token.max != Infinity) {
          if (new_token.min > new_token.max) {
            this.logger.validation_error(
              `Invalid quantifier: min '${new_token.min}' cannot be greater than max '${new_token.max}'`,
              line_num,
            );
          }
        }
      }

      if (new_token.type !== "pending") {
        tokens.push(new_token);
      }
    }
    return tokens;
  }
}

export default Nesca_Grammar_Stream;
