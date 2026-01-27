#!/usr/bin/env node

// bin/nesca/index.ts
import fs from "fs";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

// src/utils/utilities.ts
var cappa = "[A-Z\xC1\u0106\xC9\u01F4\xCD\u1E30\u0139\u1E3E\u0143\xD3\u1E54\u0154\u015A\xDA\u1E82\xDD\u0179\xC4\xCB\u1E26\xCF\xD6\xDC\u1E84\u1E8C\u0178\u01CD\u010C\u010E\u011A\u01E6\u021E\u01CF\u01E8\u013D\u0147\u01D1\u0158\u0160\u0164\u01D3\u017D\xC0\xC8\xCC\u01F8\xD2\xD9\u1E80\u1EF2\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9]";
var get_last = (arr) => (
  // This thing fetches the last item of an array
  arr?.[arr.length - 1]
);
var get_first = (arr) => (
  // This thing fetches the first item of an array
  arr?.[0]
);
var make_percentage = (input) => {
  const num = Number(input);
  return Number.isInteger(num) && num >= 1 && num <= 100 ? num : null;
};
function swap_first_last_items(array) {
  if (array.length >= 2) {
    const first_item = array[0];
    const last_item_index = array.length - 1;
    const last_item = array[last_item_index];
    array[0] = last_item;
    array[last_item_index] = first_item;
  }
  return array;
}
function reverse_items(array) {
  return array.slice().reverse();
}
function final_sentence(items) {
  const len = items.length;
  if (len === 0) return "";
  if (len === 1) return items[0];
  const all_but_last = items.slice(0, len - 1).join(", ");
  const last = items[len - 1];
  return `${all_but_last} and ${last}`;
}
function recursive_expansion(input, mappings, enclose_in_brackets = false) {
  const mapping_keys = [...mappings.keys()].sort(
    (a, b) => b.length - a.length
  );
  const resolve_mapping = (str, history = []) => {
    let result = "", i = 0;
    while (i < str.length) {
      let matched = false;
      for (const key of mapping_keys) {
        if (str.startsWith(key, i)) {
          if (history.includes(key)) {
            result += "\uFFFD";
          } else {
            const entry = mappings.get(key);
            const resolved = resolve_mapping(entry?.content || "", [
              ...history,
              key
            ]);
            result += enclose_in_brackets ? `{${resolved}}` : resolved;
          }
          i += key.length;
          matched = true;
          break;
        }
      }
      if (!matched) result += str[i++];
    }
    return result;
  };
  return resolve_mapping(input);
}
function graphemosis(input, canon_graphemes) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    let matched = false;
    for (const g of canon_graphemes.sort((a, b) => b.length - a.length)) {
      if (input.startsWith(g, i)) {
        tokens.push(g);
        i += g.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(input[i]);
      i++;
    }
  }
  return tokens;
}

// src/utils/types.ts
var directive_check = [
  "categories",
  "words",
  "units",
  "alphabet",
  "invisible",
  "graphemes",
  "syllable-boundaries",
  "features",
  "feature-field",
  "stage"
];
var SYNTAX_CHARS = [
  "<",
  ">",
  "@",
  "\u21D2",
  "\u2192",
  "->",
  ">>",
  "_",
  "{",
  "}",
  "[",
  "]",
  "(",
  ")",
  "0",
  "/",
  "!",
  "#",
  "$",
  "+",
  "?",
  ":",
  "*",
  "&",
  "%",
  "|",
  "~",
  "=",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9"
];
var SYNTAX_CHARS_AND_CARET = [...SYNTAX_CHARS, "^"];

// src/parser.ts
var Parser = class {
  logger;
  escape_mapper;
  lettercase_mapper;
  num_of_words;
  output_mode;
  remove_duplicates;
  force_word_limit;
  sort_words;
  input_divider;
  output_divider;
  directive = "none";
  disable_directive = false;
  directive_name;
  category_distribution;
  category_pending;
  units;
  optionals_weight;
  wordshape_distribution;
  wordshape_pending;
  feature_pending;
  // public transform_pending: Transform_Pending[];
  stages_pending = [];
  substages_pending = [];
  graphemes;
  syllable_boundaries;
  graphemes_pending = "";
  alphabet;
  invisible;
  file_line_num = 0;
  app;
  constructor(logger, app, escape_mapper, lettercase_mapper2, num_of_words_string, output_mode, sort_words, remove_duplicates, force_word_limit, input_divider, output_divider) {
    this.logger = logger;
    this.app = app;
    this.escape_mapper = escape_mapper;
    this.lettercase_mapper = lettercase_mapper2;
    if (num_of_words_string === "") {
      num_of_words_string = "100";
    }
    let num_of_words = Number(num_of_words_string);
    if (isNaN(num_of_words)) {
      this.logger.warn(
        `Number of words '${num_of_words}' was not a number. Genearating 100 words instead`
      );
      num_of_words = 100;
    } else if (!Number.isInteger(num_of_words)) {
      this.logger.warn(
        `Number of words '${num_of_words}' was rounded to the nearest whole number`
      );
      num_of_words = Math.ceil(num_of_words);
    }
    if (num_of_words > 1e5 || num_of_words < 1) {
      this.logger.warn(
        `Number of words '${num_of_words}' was not between 1 and 100,000. Genearating 100 words instead`
      );
      num_of_words = 100;
    }
    this.num_of_words = num_of_words;
    this.output_mode = output_mode;
    this.sort_words = sort_words;
    this.remove_duplicates = remove_duplicates;
    this.force_word_limit = force_word_limit;
    this.input_divider = input_divider === "" ? "\\n" : input_divider;
    this.input_divider = this.input_divider.replace(
      new RegExp("\\\\n", "g"),
      "\n"
    );
    if (app === "vocabug") {
      this.output_divider = output_divider === "" ? " " : output_divider;
    } else {
      this.output_divider = output_divider === "" ? "\n" : output_divider;
    }
    this.output_divider = this.output_divider.replace(
      new RegExp("\\\\n", "g"),
      "\n"
    );
    if (this.output_mode === "paragraph") {
      this.sort_words = false;
      this.remove_duplicates = false;
      this.force_word_limit = false;
      this.output_divider = " ";
    } else if (this.output_mode === "debug") {
      this.sort_words = false;
      this.remove_duplicates = false;
      this.force_word_limit = false;
      this.output_divider = "\n\n";
    }
    this.category_distribution = "gusein-zade";
    this.category_pending = /* @__PURE__ */ new Map();
    this.optionals_weight = 10;
    this.units = /* @__PURE__ */ new Map();
    this.wordshape_distribution = "zipfian";
    this.wordshape_pending = { content: "", line_num: 0 };
    this.stages_pending = [];
    this.substages_pending = [];
    this.feature_pending = /* @__PURE__ */ new Map();
    this.alphabet = [];
    this.invisible = [];
    this.graphemes_pending = "";
    this.graphemes = [];
    this.syllable_boundaries = [];
    this.disable_directive = false;
    this.directive_name = "";
  }
  get_line(file_array) {
    let line = file_array[this.file_line_num];
    line = this.escape_mapper.escape_backslash_pairs(line);
    line = line.replace(/;.*/u, "").trim();
    line = this.escape_mapper.escape_named_escape(line);
    if (line.includes("&[")) {
      this.logger.validation_error(
        `Invalid named escape`,
        this.file_line_num
      );
    }
    return line;
  }
  parse_file(file) {
    const file_array = file.split("\n");
    let my_decorator = "none";
    let my_directive = "none";
    let my_subdirective = "none";
    let my_header = [];
    let my_clusterfield_transform = [];
    let my_wrapped_rule = "";
    for (; this.file_line_num < file_array.length; ++this.file_line_num) {
      let line = this.get_line(file_array);
      if (line === "") {
        continue;
      }
      if (line.startsWith("@")) {
        my_decorator = this.parse_decorator(line, my_decorator);
        if (my_decorator != "none") {
          my_header = [];
          continue;
        }
      }
      const temp_directive = this.parse_directive(line, my_decorator);
      if (temp_directive != "none") {
        if (my_clusterfield_transform.length > 0) {
        }
        if (my_subdirective != "none") {
          this.logger.validation_error(
            `${my_subdirective} was not closed before directive change`,
            this.file_line_num
          );
        }
        my_directive = temp_directive;
        my_decorator = "none";
        if (this.disable_directive === true) {
          this.disable_directive = false;
        } else if (this.disable_directive === "p") {
          this.disable_directive = true;
        }
        if (my_directive === "stage") {
          const stage = { transforms_pending: [], name: "" };
          this.stages_pending.push(stage);
        }
        continue;
      }
      if (this.disable_directive) {
        continue;
      }
      if (my_directive === "none") {
        this.logger.validation_error(
          `Invalid syntax -- expected a decorator or directive`,
          this.file_line_num
        );
      }
      if (my_directive === "categories") {
        const [key, field, valid] = this.get_cat_seg_fea(line, "category");
        if (!valid) {
          this.logger.validation_error(
            `${line} is not a category declaration`,
            this.file_line_num
          );
        }
        this.category_pending.set(key, {
          content: field,
          line_num: this.file_line_num
        });
      }
      if (my_directive === "words") {
        if (this.app !== "vocabug") {
          this.logger.validation_error(
            `Words directive is only valid in Vocabug`,
            this.file_line_num
          );
        }
        if (!this.valid_words_brackets(line)) {
          this.logger.validation_error(
            `Wordshapes had missmatched brackets`,
            this.file_line_num
          );
        }
        this.wordshape_pending.content += " " + line;
        this.wordshape_pending.line_num = this.file_line_num;
        continue;
      }
      if (my_directive === "units") {
        if (this.app !== "vocabug") {
          this.logger.validation_error(
            `Units directive is only valid in Vocabug`,
            this.file_line_num
          );
        }
        const [key, field, valid] = this.get_cat_seg_fea(line, "unit");
        if (!valid) {
          this.logger.validation_error(
            `${line} is not a unit declaration`,
            this.file_line_num
          );
        }
        if (!this.validate_unit(field)) {
          this.logger.validation_error(
            `The unit '${key}' had separator(s) outside sets -- expected separators for units to appear only in sets`,
            this.file_line_num
          );
        }
        if (!this.valid_words_brackets(field)) {
          this.logger.validation_error(
            `The unit '${key}' had missmatched brackets`,
            this.file_line_num
          );
        }
        this.units.set(`<${key}>`, {
          content: `${field}`,
          line_num: this.file_line_num
        });
      }
      if (my_directive === "features") {
        const [key, field, valid] = this.get_cat_seg_fea(line, "feature");
        if (!valid) {
          this.logger.validation_error(
            `${line} is not a feature declaration`,
            this.file_line_num
          );
        }
        const graphemes = field.split(/[,\s]+/).filter(Boolean);
        if (graphemes.length == 0) {
          this.logger.validation_error(
            `Feature ${key} had no graphemes`,
            this.file_line_num
          );
        }
        this.feature_pending.set(key, {
          content: graphemes.join(","),
          line_num: this.file_line_num
        });
      }
      if (my_directive === "feature-field") {
        if (my_header.length === 0) {
          const top_row = line.split(/[\s]+/).filter(Boolean);
          if (top_row.length < 2) {
            this.logger.validation_error(
              `Feature-field header too short`,
              this.file_line_num
            );
          }
          my_header = top_row;
          continue;
        } else {
          this.parse_featurefield(line, my_header);
        }
      }
      if (my_directive === "letter-case-field") {
        if (my_header.length === 0) {
          const top_row = line.split(/[\s]+/).filter(Boolean);
          if (top_row.length < 2) {
            this.logger.validation_error(
              `letter-case-field header too short`,
              this.file_line_num
            );
          }
          my_header = top_row;
          continue;
        } else {
          this.parse_lettercasefield(line, my_header);
        }
      }
      if (my_directive === "alphabet") {
        const alphabet = line.split(/[,\s]+/).filter(Boolean);
        for (let i = 0; i < alphabet.length; i++) {
          alphabet[i] = this.escape_mapper.restore_escaped_chars(alphabet[i]).trim();
        }
        this.alphabet.push(...alphabet);
      }
      if (my_directive === "invisible") {
        const invisible = line.split(/[,\s]+/).filter(Boolean);
        for (let i = 0; i < invisible.length; i++) {
          invisible[i] = this.escape_mapper.restore_escaped_chars(invisible[i]).trim();
        }
        this.invisible.push(...invisible);
      }
      if (my_directive === "graphemes") {
        this.graphemes_pending += " " + line;
        continue;
      }
      if (my_directive === "syllable-boundaries") {
        const sybo = line.split(/[,\s]+/).filter(Boolean);
        for (let i = 0; i < sybo.length; i++) {
          sybo[i] = this.escape_mapper.restore_escaped_chars(sybo[i]).trim();
        }
        this.syllable_boundaries.push(...sybo);
      }
      if (my_directive === "stage") {
        if (my_subdirective === "clusterfield") {
          if (line.startsWith(">")) {
            for (const transform of my_clusterfield_transform) {
              this.push_transform_to_stage(transform);
            }
            my_subdirective = "none";
            my_header = [];
            my_clusterfield_transform = [];
            continue;
          }
          my_clusterfield_transform = this.parse_clusterfield(
            line,
            my_header,
            my_clusterfield_transform
          );
          continue;
        } else if (line.startsWith("< ")) {
          if (my_wrapped_rule.length != 0) {
            this.logger.validation_error(
              `Wrapped rule was not completed before starting cluster-field`,
              this.file_line_num
            );
          }
          my_clusterfield_transform.push({
            t_type: "cluster-field",
            target: "",
            result: "",
            conditions: [],
            exceptions: [],
            chance: null,
            line_num: this.file_line_num
          });
          line = line.substring(2).trim();
          const top_row = line.split(/[\s]+/).filter(Boolean);
          if (top_row.length < 2) {
            this.logger.validation_error(
              `Feature-field header too short`,
              this.file_line_num
            );
          }
          my_subdirective = "clusterfield";
          my_header = top_row;
          continue;
        } else if (line.startsWith("<routine")) {
          if (my_wrapped_rule.length != 0) {
            this.logger.validation_error(
              `Wrapped rule was not completed before starting routine`,
              this.file_line_num
            );
          }
          const my_routine = this.parse_routine(line);
          this.push_transform_to_stage({
            t_type: my_routine,
            target: "\\",
            result: "\\",
            conditions: [],
            exceptions: [],
            chance: null,
            line_num: this.file_line_num
          });
          continue;
        } else {
          const continuationRe = /(->|=>|>>|⇒|→|\/|!)$/;
          if (continuationRe.test(line)) {
            my_wrapped_rule += " " + line;
            continue;
          }
          line = my_wrapped_rule + " " + line;
          my_wrapped_rule = "";
          const [target, result, conditions, exceptions] = this.get_transform(line);
          this.push_transform_to_stage({
            t_type: "rule",
            target,
            result,
            conditions,
            exceptions,
            chance: null,
            line_num: this.file_line_num
          });
          continue;
        }
      }
    }
    if (my_decorator != "none") {
      this.logger.validation_error(
        `Decorator '${my_decorator}' was not followed by a directive`,
        this.file_line_num
      );
    }
  }
  push_transform_to_stage(transform) {
    let stage = get_last(this.stages_pending);
    if (!stage) {
      stage = { transforms_pending: [], name: "default" };
      this.stages_pending.push(stage);
    }
    stage.transforms_pending.push(transform);
  }
  get_cat_seg_fea(input, mode) {
    const divider = "=";
    if (input === "") {
      return ["", "", false];
    }
    const divided = input.split(divider);
    if (divided.length !== 2) {
      return [input, "", false];
    }
    const key = divided[0].trim();
    const field = divided[1].trim();
    if (key === "" || field === "") {
      return [input, "", false];
    }
    const categoryRegex = new RegExp(`^${cappa}$`);
    const unitRegex = /^[A-Za-z+$-]+$/;
    const featureRegex = /^(\+|-|>)[a-zA-Z+-]+$/;
    if (mode === "category") {
      if (categoryRegex.test(key)) {
        return [key, field, true];
      }
    } else if (mode === "unit") {
      if (unitRegex.test(key)) {
        return [key, field, true];
      }
    } else if (mode === "feature") {
      if (featureRegex.test(key)) {
        return [key, field, true];
      }
    }
    return [input, "", false];
  }
  parse_distribution(value) {
    if (value.toLowerCase().startsWith("g")) {
      return "gusein-zade";
    } else if (value.toLowerCase().startsWith("z")) {
      return "zipfian";
    } else if (value.toLowerCase().startsWith("s")) {
      return "shallow";
    }
    return "flat";
  }
  validate_unit(str) {
    let inside_square = false;
    let inside_paren = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "{") inside_square = true;
      else if (char === "}") inside_square = false;
      else if (char === "(") inside_paren = true;
      else if (char === ")") inside_paren = false;
      if ((char === "," || char === " ") && !inside_square && !inside_paren) {
        return false;
      }
    }
    return true;
  }
  parse_decorator(line, old_decorator) {
    let new_decorator = "none";
    line = line.substring(1);
    line = this.escape_mapper.restore_preserve_escaped_chars(line);
    const dotCount = (line.match(/\./g) || []).length;
    const eqCount = (line.match(/=/g) || []).length;
    if (dotCount !== 1) {
      this.logger.validation_error(
        `Invalid decorator format1`,
        this.file_line_num
      );
    }
    const [my_directive, my_thing] = line.split(/\.(.+)/).filter(Boolean);
    if (eqCount === 1) {
      let [my_property, my_value] = my_thing.split("=");
      my_property = my_property.trim();
      my_value = my_value.trim();
      if (my_directive === "words") {
        if (my_property === "distribution") {
          this.wordshape_distribution = this.parse_distribution(my_value);
          new_decorator = "words";
        } else if (my_property === "optionals-weight") {
          if (!my_value.endsWith("%")) {
            this.logger.validation_error(
              `Invalid optionals-weight '${my_value}' -- expected a percentage value ending with '%'`,
              this.file_line_num
            );
          }
          my_value = my_value.slice(0, -1).trim();
          const optionals_weight = make_percentage(my_value);
          if (optionals_weight == null) {
            this.logger.validation_error(
              `Invalid optionals-weight '${my_value}' -- expected a number between 1 and 100`,
              this.file_line_num
            );
          }
          this.optionals_weight = optionals_weight;
          new_decorator = "words";
        }
      } else if (my_directive === "categories") {
        if (my_property === "distribution") {
          this.category_distribution = this.parse_distribution(my_value);
          new_decorator = "categories";
        }
      }
    } else {
      if (my_thing === "disabled") {
        if (directive_check.includes(my_directive)) {
          new_decorator = my_directive;
          this.disable_directive = "p";
        } else {
          this.logger.validation_error(
            `Invalid directive name on decorator ${my_directive}`,
            this.file_line_num
          );
        }
      } else {
        this.logger.validation_error(
          `Invalid decorator format2`,
          this.file_line_num
        );
      }
    }
    if (new_decorator === "none") {
      this.logger.validation_error(`Invalid decorator`, this.file_line_num);
    } else if (old_decorator !== "none" && old_decorator !== new_decorator) {
      this.logger.validation_error(
        `Decorator mismatch -- expected '${old_decorator}' decorator after '${old_decorator}' decorator`,
        this.file_line_num
      );
    }
    return new_decorator;
  }
  parse_directive(line, current_decorator) {
    let temp_directive = "none";
    if (line === "categories:") {
      temp_directive = "categories";
    } else if (line === "words:") {
      temp_directive = "words";
    } else if (line === "units:") {
      temp_directive = "units";
    } else if (line === "alphabet:") {
      temp_directive = "alphabet";
    } else if (line === "invisible:") {
      temp_directive = "invisible";
    } else if (line === "graphemes:") {
      temp_directive = "graphemes";
    } else if (line === "syllable-boundaries:") {
      temp_directive = "syllable-boundaries";
    } else if (line === "features:") {
      temp_directive = "features";
    } else if (line === "feature-field:") {
      temp_directive = "feature-field";
    } else if (line === "stage:") {
      temp_directive = "stage";
    } else if (line === "letter-case-field:") {
      temp_directive = "letter-case-field";
    }
    if (temp_directive === "none") {
      return "none";
    }
    if (current_decorator != "none" && temp_directive != current_decorator) {
      this.logger.validation_error(
        `Directive mismatch -- expected '${current_decorator}' directive after '${current_decorator}' decorator`,
        this.file_line_num
      );
    }
    return temp_directive;
  }
  valid_words_brackets(str) {
    const stack = [];
    const bracket_pairs = {
      ")": "(",
      ">": "<",
      "}": "{"
    };
    for (const char of str) {
      if (Object.values(bracket_pairs).includes(char)) {
        stack.push(char);
      } else if (Object.keys(bracket_pairs).includes(char)) {
        if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  }
  parse_clusterfield(line, my_header, my_transforms) {
    if (my_transforms.length === 0) {
      this.logger.validation_error(
        `Clusterfield transform not started properly`,
        this.file_line_num
      );
    }
    const my_transform = my_transforms[0];
    my_transform.target += ", ";
    my_transform.result += ", ";
    const my_row = line.split(/[\s]+/).filter(Boolean);
    const my_key = my_row.shift();
    if (my_row.length !== my_header.length || my_key === void 0) {
      this.logger.validation_error(
        `Cluster-field row length mismatch with header length -- expected row length of ${my_header.length} but got lenght of ${my_row.length}`,
        this.file_line_num
      );
    }
    const my_target = [];
    const my_result = [];
    for (let i = 0; i < my_header.length; ++i) {
      if (my_row[i] === "+") {
        continue;
      } else {
        my_target.push(my_key + my_header[i]);
        my_result.push(my_row[i]);
      }
    }
    my_transform.target += my_target.join(", ");
    my_transform.result += my_result.join(", ");
    return [my_transform];
  }
  parse_routine(line) {
    line = this.escape_mapper.restore_preserve_escaped_chars(line);
    const eqCount = (line.match(/=/g) || []).length;
    if (eqCount !== 1) {
      this.logger.validation_error(
        `Invalid routine format1 '${line}'`,
        this.file_line_num
      );
    }
    let [, right] = line.split("=");
    right = right.trim();
    const gtCount = (right.match(/>/g) || []).length;
    if (gtCount !== 1) {
      this.logger.validation_error(
        `Invalid routine format '${line}'`,
        this.file_line_num
      );
    }
    let [routine] = right.split(">");
    routine = routine.trim();
    routine = routine.replace(/\bcapitalize\b/g, "capitalise");
    routine = routine.replace(/\blatin-to-hangeul\b/g, "latin-to-hangul");
    switch (routine) {
      case "reverse":
      case "compose":
      case "decompose":
      case "capitalise":
      case "decapitalise":
      case "to-uppercase":
      case "to-lowercase":
      case "latin-to-hangul":
      case "hangul-to-latin":
      case "greek-to-latin":
      case "latin-to-greek":
      case "xsampa-to-ipa":
      case "ipa-to-xsampa":
        return routine;
    }
    this.logger.validation_error(
      `Invalid routine '${routine}'`,
      this.file_line_num
    );
  }
  // TRANSFORMS !!!
  // This is run on parsing file. We then have to run resolve_transforms aftter parse file
  get_transform(input) {
    if (input === "") {
      this.logger.validation_error(`No input`, this.file_line_num);
    }
    input = input.replace(/\/\//g, "!");
    const divided = input.split(/>>|->|→|=>|⇒/);
    if (divided.length === 1) {
      this.logger.validation_error(
        `No arrows in transform`,
        this.file_line_num
      );
    }
    if (divided.length !== 2) {
      this.logger.validation_error(
        `Too many arrows in transform`,
        this.file_line_num
      );
    }
    const target = divided[0].trim();
    if (target === "") {
      this.logger.validation_error(
        `Target is empty in transform`,
        this.file_line_num
      );
    }
    if (!this.valid_transform_brackets(target)) {
      this.logger.validation_error(
        `Target had missmatched brackets`,
        this.file_line_num
      );
    }
    const slash_index = divided[1].indexOf("/");
    const bang_index = divided[1].indexOf("!");
    const delimiter_index = Math.min(
      slash_index === -1 ? Infinity : slash_index,
      bang_index === -1 ? Infinity : bang_index
    );
    const result = delimiter_index === Infinity ? divided[1].trim() : divided[1].slice(0, delimiter_index).trim();
    if (result == "") {
      this.logger.validation_error(
        `Result is empty in transform`,
        this.file_line_num
      );
    }
    if (!this.valid_transform_brackets(result)) {
      this.logger.validation_error(
        `Result had missmatched brackets`,
        this.file_line_num
      );
    }
    const environment = delimiter_index === Infinity ? "" : divided[1].slice(delimiter_index).trim();
    const { conditions, exceptions } = this.get_environment(environment);
    return [target, result, conditions, exceptions];
  }
  get_environment(environment_string) {
    const conditions = [];
    const exceptions = [];
    let buffer = "";
    let mode = "condition";
    for (let i = 0; i < environment_string.length; i++) {
      const ch = environment_string[i];
      if (ch === "/") {
        if (buffer.trim()) {
          const validated = this.validate_environment(buffer.trim(), mode);
          (mode === "condition" ? conditions : exceptions).push(validated);
        }
        buffer = "";
        mode = "condition";
      } else if (ch === "!") {
        if (buffer.trim()) {
          const validated = this.validate_environment(buffer.trim(), mode);
          (mode === "condition" ? conditions : exceptions).push(validated);
        }
        buffer = "";
        mode = "exception";
      } else {
        buffer += ch;
      }
    }
    if (buffer.trim()) {
      const unit = buffer.trim();
      const validated = this.validate_environment(unit, mode);
      (mode === "condition" ? conditions : exceptions).push(validated);
    }
    return {
      conditions,
      exceptions
    };
  }
  validate_environment(unit, kind) {
    const parts = unit.split("_");
    if (parts.length !== 2) {
      this.logger.validation_error(
        `${kind} "${unit}" must contain exactly one underscore`,
        this.file_line_num
      );
    }
    const [before, after] = parts;
    if (!before && !after) {
      this.logger.validation_error(
        `${kind} "${unit}" must have content on at least one side of '_'`,
        this.file_line_num
      );
    }
    return `${before}_${after}`;
  }
  parse_featurefield(line, top_row) {
    const my_row = line.split(/[\s]+/).filter(Boolean);
    const my_key = my_row.shift();
    if (my_row.length !== top_row.length || my_key === void 0) {
      this.logger.validation_error(
        `Feature-field row length mismatch with header length -- expected row length of ${top_row.length} but got lenght of ${my_row.length}`,
        this.file_line_num
      );
    }
    const keyRegex = /^[a-zA-Z+-]+$/;
    if (!keyRegex.test(my_key)) {
      this.logger.validation_error(
        `A feature in a feature-field must be of lowercase letters only.`,
        this.file_line_num
      );
    }
    const my_pro_graphemes = [];
    const my_anti_graphemes = [];
    const row_length = top_row.length;
    for (let i = 0; i < row_length; ++i) {
      if (my_row[i] === ".") {
        continue;
      } else if (my_row[i] === "+") {
        my_pro_graphemes.push(top_row[i]);
      } else if (my_row[i] === "-") {
        my_anti_graphemes.push(top_row[i]);
      } else {
        this.logger.validation_error(
          `Feature-field values must be either '+', '-', or '.' -- found '${my_row[i]}' instead.`,
          this.file_line_num
        );
      }
    }
    if (my_pro_graphemes.length > 0) {
      this.feature_pending.set(`+${my_key}`, {
        content: my_pro_graphemes.join(","),
        line_num: this.file_line_num
      });
    }
    if (my_anti_graphemes.length > 0) {
      this.feature_pending.set(`-${my_key}`, {
        content: my_anti_graphemes.join(","),
        line_num: this.file_line_num
      });
    }
  }
  parse_lettercasefield(line, top_row) {
    const my_row = line.split(/[\s]+/).filter(Boolean);
    const my_key = my_row.shift();
    if (my_key !== "uppercase") {
      this.logger.validation_error(
        `Letter-case-field first column must be 'uppercase'`,
        this.file_line_num
      );
    }
    if (my_row.length !== top_row.length || my_key === void 0) {
      this.logger.validation_error(
        `Feature-field row length mismatch with header length -- expected row length of ${top_row.length} but got lenght of ${my_row.length}`,
        this.file_line_num
      );
    }
    const my_map = new Map(
      top_row.map((k, i) => [k, my_row[i]])
    );
    this.lettercase_mapper.create_map(my_map);
  }
  valid_transform_brackets(str) {
    const stack = [];
    const bracket_pairs = {
      ")": "(",
      "}": "{",
      "]": "["
    };
    for (const char of str) {
      if (Object.values(bracket_pairs).includes(char)) {
        stack.push(char);
      } else if (Object.keys(bracket_pairs).includes(char)) {
        if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  }
};
var parser_default = Parser;

// src/word.ts
var Word = class _Word {
  static output_mode = "word-list";
  current_form;
  rejected;
  num_of_transformations;
  steps;
  constructor(action, form) {
    this.rejected = false;
    this.current_form = form;
    this.num_of_transformations = 0;
    this.steps = [];
    if (action === null) {
      this.steps.push({
        type: "nesca-input",
        form
      });
    } else {
      this.steps.push({
        type: "word-creation",
        action,
        form
      });
    }
  }
  get_last_form() {
    return this.current_form;
  }
  get_word() {
    const output = [];
    if (_Word.output_mode == "debug") {
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        if (step.type === "nesca-input") {
          output.push(`\u27E8${step.form}\u27E9`);
        } else if (step.type === "word-creation") {
          output.push(`${step.action} \u27A4 \u27E8${step.form}\u27E9`);
        } else if (step.type === "transformation") {
          output.push(
            `${step.action} \u27A4 \u27E8${step.form}\u27E9 @ ln:${step.line_num}`
          );
        } else if (step.type === "banner") {
          output.push(`${step.action}`);
        } else if (step.type === "output") {
          if (this.num_of_transformations != 0) {
            output.push(`\u27E8${step.form}\u27E9`);
          }
        }
      }
      return output.join("\n");
    }
    if (_Word.output_mode == "old-to-new") {
      const first_step = this.steps[0];
      let first_form = "";
      if (first_form) {
        if (first_step.type === "nesca-input" || first_step.type === "word-creation") {
          first_form = first_step.form;
        }
      }
      output.push(`${first_form} => ${this.current_form}`);
      return output.join("");
    }
    output.push(`${this.current_form}`);
    return output.join("");
  }
  record_transformation(transformation, form, line_num) {
    this.steps.push({
      type: "transformation",
      action: transformation,
      form,
      line_num: line_num + 1
    });
    this.num_of_transformations++;
  }
  record_banner(action) {
    this.steps.push({
      type: "banner",
      action
    });
  }
  record_output() {
    this.steps.push({
      type: "output",
      form: this.get_last_form()
    });
  }
};
var word_default = Word;

// src/transforma/reference_mapper.ts
var Reference_Mapper = class _Reference_Mapper {
  map = /* @__PURE__ */ new Map();
  capture_stream_index = null;
  capture_stream = [];
  is_capturing_sequence = false;
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  reset_capture_stream_index() {
    this.capture_stream_index = null;
  }
  set_capture_stream_index(index) {
    this.capture_stream_index = index;
  }
  capture_reference(key, stream) {
    if (this.capture_stream_index === null) {
      const last_item = get_last(stream);
      if (last_item) {
        this.map.set(key, [last_item]);
      } else {
        this.map.set(key, [""]);
      }
    } else {
      const captured_sequence = stream.slice(this.capture_stream_index);
      this.map.set(key, captured_sequence);
    }
  }
  get_captured_reference(key) {
    return this.map.get(key) ?? [key];
  }
  clone() {
    const clone = new _Reference_Mapper();
    clone.map = new Map(this.map);
    clone.capture_stream_index = this.capture_stream_index;
    return clone;
  }
  absorb(other) {
    for (const [key, value] of other.map.entries()) {
      this.map.set(key, value);
    }
  }
};
var reference_mapper_default = Reference_Mapper;

// src/transforma/xsampa.ts
var xsampa_to_ipa_code_map = {
  "b_<": 595,
  // voiced bilabial implosive [ɓ]
  "d_<": 599,
  // voiced alveolar implosive [ɗ]
  "d`": 598,
  // voiced retroflex plosive [ɖ]
  "g_<": 608,
  // voiced velar implosive [ɠ]
  "h\\": 614,
  // voiced glottal fricative [ɦ]
  "j\\": 669,
  // voiced palatal fricative [ʝ]
  "l\\": 634,
  // alveolar lateral flap [ɺ]
  "l`": 621,
  // retroflex lateral approximant [ɭ]
  "n`": 627,
  // retroflex nasal [ɳ]
  "p\\": 632,
  // voiceless bilabial fricative [ɸ]
  "r\\": 633,
  // alveolar approximant [ɹ]
  "r\\`": 635,
  // retroflex approximant [ɻ]
  "r`": 637,
  // retroflex flap [ɽ]
  "s\\": 597,
  // voiceless alveolo-palatal fricative [ɕ]
  "s`": 642,
  // voiceless retroflex fricative [ʂ]
  "t`": 648,
  // voiceless retroflex plosive [ʈ]
  "x\\": 615,
  // voiceless palatal-velar fricative [ɧ]
  "z\\": 657,
  // voiced alveolo-palatal fricative [ʑ]
  "z`": 656,
  // voiced retroflex fricative [ʐ]
  A: 593,
  // open back unrounded vowel [ɑ]
  B: 946,
  // voiced bilabial fricative [β]
  "B\\": 665,
  // bilabial trill [ʙ]
  C: 231,
  // voiceless palatal fricative [ç]
  D: 240,
  // voiced dental fricative [ð]
  E: 603,
  // open-mid front unrounded vowel [ɛ]
  F: 625,
  // labiodental nasal [ɱ]
  G: 611,
  // voiced velar fricative [ɣ]
  "G\\": 610,
  // voiced uvular plosive [ɢ]
  "G\\_<": 667,
  // voiced uvular implosive [ʛ]
  H: 613,
  // labial-palatal approximant [ɥ]
  "H\\": 668,
  // voiceless epiglottal fricative [ʜ]
  I: 618,
  // near-close front unrounded vowel [ɪ]
  J: 626,
  // palatal nasal [ɲ]
  "J\\": 607,
  // voiced palatal plosive [ɟ]
  "J\\_<": 644,
  // voiced palatal implosive [ʄ]
  K: 620,
  // voiceless alveolar lateral fricative [ɬ]
  "K\\": 622,
  // voiced alveolar lateral fricative [ɮ]
  L: 654,
  // palatal lateral approximant [ʎ]
  "L\\": 671,
  // velar lateral approximant [ʟ]
  M: 623,
  // close back unrounded vowel [ɯ]
  "M\\": 624,
  // velar approximant [ɰ]
  N: 331,
  // velar nasal [ŋ]
  "N\\": 628,
  // uvular nasal [ɴ]
  O: 596,
  // open-mid back rounded vowel [ɔ]
  "O\\": 664,
  // bilabial click [ʘ]
  "v\\": 651,
  // labiodental approximant [ʋ]
  P: 651,
  // labiodental approximant [ʋ]
  Q: 594,
  // open back rounded vowel [ɒ]
  R: 641,
  // voiced uvular fricative [ʁ]
  "R\\": 640,
  // uvular trill [ʀ]
  S: 643,
  // voiceless postalveolar fricative [ʃ]
  T: 952,
  // voiceless dental fricative [θ]
  U: 650,
  // near-close back rounded vowel [ʊ]
  V: 652,
  // open-mid back unrounded vowel [ʌ]
  W: 653,
  // voiceless labial-velar fricative [ʍ]
  X: 967,
  // voiceless uvular fricative [χ]
  "X\\": 295,
  // voiceless pharyngeal fricative [ħ]
  Y: 655,
  // near-close front rounded vowel [ʏ]
  Z: 658,
  // voiced postalveolar fricative [ʒ]
  '"': 712,
  // primary stress [ˈ◌]
  "%": 716,
  // secondary stress [ˌ◌]
  ":": 720,
  // long [◌ː]
  ":\\": 721,
  // half long [◌ˑ]
  "@": 601,
  // schwa [ə]
  "@\\": 600,
  // close-mid central unrounded vowel [ɘ]
  "@`": 602,
  // r-coloured schwa [ɚ]
  "{": 230,
  // near-open front unrounded vowel [æ]
  "}": 649,
  // close central rounded vowel [ʉ]
  "1": 616,
  // close central unrounded vowel [ɨ]
  "2": 248,
  // close-mid front rounded vowel [ø]
  "3": 604,
  // open-mid central unrounded vowel [ɜ]
  "3\\": 606,
  // open-mid central rounded vowel [ɞ]
  "4": 638,
  // alveolar flap [ɾ]
  "5": 619,
  // velarized alveolar lateral approximant [ɫ]
  "6": 592,
  // near-open central vowel [ɐ]
  "7": 612,
  // close-mid back unrounded vowel [ɤ]
  "8": 629,
  // close-mid central rounded vowel [ɵ]
  "9": 339,
  // open-mid front rounded vowel [œ]
  "&": 630,
  // open front rounded vowel [ɶ]
  "?": 660,
  // glottal stop [ʔ]
  "?\\": 661,
  // voiced pharyngeal fricative [ʕ]
  "<\\": 674,
  // voiced epiglottal fricative [ʢ]
  ">\\": 673,
  // epiglottal plosive [ʡ]
  "^": 42779,
  // upstep [ꜛ]
  "!": 42780,
  // downstep [ꜜ]
  "!\\": 451,
  // (post)alveolar click [ǃ]
  "|": 124,
  // minor (foot) group [|]
  "|\\": 448,
  // dental click [ǀ]
  "||": 8214,
  // major (intonation) group [‖]
  "|\\|\\": 449,
  // alveolar lateral click [ǁ]
  "=\\": 450,
  // palatal click [ǂ]
  "-\\": 8255,
  // linking mark [‿]
  '_"': 776,
  // centralized [◌̈]
  "_+": 799,
  // advanced [◌̟]
  "_-": 800,
  // retracted [◌̠]
  _0: 805,
  // voiceless [◌̥]
  "_>": 700,
  // ejective [◌ʼ]
  "_?\\": 740,
  // pharyngealized [◌ˤ]
  "_^": 815,
  // non-syllabic [◌̯]
  "_}": 794,
  // no audible release [◌̚]
  "`": 734,
  // retroflexion & rhoticity [◌˞]
  "=": 809,
  // syllabic [◌̩]
  "_=": 809,
  // syllabic [◌̩]
  "~": 771,
  // anasalized [◌̃]
  "_~)": 771,
  // anasalized [◌̃]
  _A: 792,
  // advanced tongue root [◌̘]
  _a: 826,
  // apical [◌̺]
  _B: 783,
  // extra low tone [◌̏]
  _B_L: 7622,
  // low rising tone [◌᷆]
  _c: 796,
  // less rounded [◌̜]
  _d: 810,
  // dental [◌̪]
  _e: 820,
  // velarized or pharyngealized; also see 5 [◌̴]
  "<F>": 8600,
  // global fall [↘︎]
  _G: 736,
  // velarized [◌ˠ]
  _H: 769,
  // high tone [◌́]
  _H_T: 7620,
  // high rising tone [◌᷄]
  _h: 688,
  // aspirated [◌ʰ]
  _j: 690,
  // palatalized [◌ʲ]
  "'": 690,
  // palatalized [◌ʲ]
  _k: 816,
  // creaky voice [◌̰]
  _L: 768,
  // low tone [◌̀]
  _l: 737,
  // lateral release [◌ˡ]
  _M: 772,
  // mid tone [◌̄]
  _m: 827,
  // laminal [◌̻]
  _N: 828,
  // linguolabial [◌̼]
  _n: 8319,
  // nasal release [◌ⁿ]
  _O: 825,
  // more rounded [◌̹]
  _o: 798,
  // lowered [◌̞]
  _q: 793,
  // retracted tongue root [◌̙]
  "<R>": 8599,
  // global rise [↗︎]
  _R_F: 7624,
  // rising-falling tone [◌᷈]
  _r: 797,
  // raised [◌̝]
  _T: 779,
  // extra high tone [◌̋]
  _t: 804,
  // breathy voice [◌̤]
  _v: 812,
  // voiced [◌̬]
  _w: 695,
  // labialized [◌ʷ]
  _X: 774,
  // extra-short [◌̆]
  _x: 829,
  // mid-centralized [◌̽]
  _F: 770,
  // falling tone [◌̂]
  "_\\": 770,
  // falling tone [◌̂]
  _R: 780,
  // rising tone [◌̌]
  "_/": 780,
  // rising tone [◌̌]
  "b\\": 11377,
  // voiced labiodental flap [ⱱ]
  "!\\!\\": 8252,
  // retroflex click "ad hoc digraph" [‼︎]
  _f: 846,
  // whistled [◌͎]
  _i: 8595,
  // ingressive [◌↓]
  _s: 845,
  // spread lips [◌͍]
  _u: 840,
  // tenseness [◌͈]
  _W: 841,
  // weak articulation [◌͉]
  _z: 842
  // denasalisation [◌͊]
};
var ipa_code_map_to_xsampa = {
  595: "b_<",
  // voiced bilabial implosive [ɓ]
  599: "d_<",
  // voiced alveolar implosive [ɗ]
  598: "d`",
  // voiced retroflex plosive [ɖ]
  608: "g_<",
  // voiced velar implosive [ɠ]
  614: "h\\",
  // voiced glottal fricative [ɦ]
  669: "j\\",
  // voiced palatal fricative [ʝ]
  634: "l\\",
  // alveolar lateral flap [ɺ]
  621: "l`",
  // retroflex lateral approximant [ɭ]
  627: "n`",
  // retroflex nasal [ɳ]
  632: "p\\",
  // voiceless bilabial fricative [ɸ]
  633: "r\\",
  // alveolar approximant [ɹ]
  635: "r\\`",
  // retroflex approximant [ɻ]
  637: "r`",
  // retroflex flap [ɽ]
  597: "s\\",
  // voiceless alveolo-palatal fricative [ɕ]
  642: "s`",
  // voiceless retroflex fricative [ʂ]
  648: "t`",
  // voiceless retroflex plosive [ʈ]
  615: "x\\",
  // voiceless palatal-velar fricative [ɧ]
  657: "z\\",
  // voiced alveolo-palatal fricative [ʑ]
  656: "z`",
  // voiced retroflex fricative [ʐ]
  593: "A",
  // open back unrounded vowel [ɑ]
  946: "B",
  // voiced bilabial fricative [β]
  665: "B\\",
  // bilabial trill [ʙ]
  231: "C",
  // voiceless palatal fricative [ç]
  240: "D",
  // voiced dental fricative [ð]
  603: "E",
  // open-mid front unrounded vowel [ɛ]
  625: "F",
  // labiodental nasal [ɱ]
  611: "G",
  // voiced velar fricative [ɣ]
  610: "G\\",
  // voiced uvular plosive [ɢ]
  667: "G\\_<",
  // voiced uvular implosive [ʛ]
  613: "H",
  // labial-palatal approximant [ɥ]
  668: "H\\",
  // voiceless epiglottal fricative [ʜ]
  618: "I",
  // near-close front unrounded vowel [ɪ]
  626: "J",
  // palatal nasal [ɲ]
  607: "J\\",
  // voiced palatal plosive [ɟ]
  644: "J\\_<",
  // voiced palatal implosive [ʄ]
  620: "K",
  // voiceless alveolar lateral fricative [ɬ]
  622: "K\\",
  // voiced alveolar lateral fricative [ɮ]
  654: "L",
  // palatal lateral approximant [ʎ]
  671: "L\\",
  // velar lateral approximant [ʟ]
  623: "M",
  // close back unrounded vowel [ɯ]
  624: "M\\",
  // velar approximant [ɰ]
  331: "N",
  // velar nasal [ŋ]
  628: "N\\",
  // uvular nasal [ɴ]
  596: "O",
  // open-mid back rounded vowel [ɔ]
  664: "O\\",
  // bilabial click [ʘ]
  651: "v\\",
  // labiodental approximant [ʋ]
  594: "Q",
  // open back rounded vowel [ɒ]
  641: "R",
  // voiced uvular fricative [ʁ]
  640: "R\\",
  // uvular trill [ʀ]
  643: "S",
  // voiceless postalveolar fricative [ʃ]
  952: "T",
  // voiceless dental fricative [θ]
  650: "U",
  // near-close back rounded vowel [ʊ]
  652: "V",
  // open-mid back unrounded vowel [ʌ]
  653: "W",
  // voiceless labial-velar fricative [ʍ]
  967: "X",
  // voiceless uvular fricative [χ]
  295: "X\\",
  // voiceless pharyngeal fricative [ħ]
  655: "Y",
  // near-close front rounded vowel [ʏ]
  658: "Z",
  // voiced postalveolar fricative [ʒ]
  712: '"',
  // primary stress [ˈ◌]
  716: "%",
  // secondary stress [ˌ◌]
  720: ":",
  // long [◌ː]
  721: ":\\",
  // half long [◌ˑ]
  601: "@",
  // schwa [ə]
  600: "@\\",
  // close-mid central unrounded vowel [ɘ]
  602: "@`",
  // r-coloured schwa [ɚ]
  230: "{",
  // near-open front unrounded vowel [æ]
  649: "}",
  // close central rounded vowel [ʉ]
  616: "1",
  // close central unrounded vowel [ɨ]
  248: "2",
  // close-mid front rounded vowel [ø]
  604: "3",
  // open-mid central unrounded vowel [ɜ]
  606: "3\\",
  // open-mid central rounded vowel [ɞ]
  638: "4",
  // alveolar flap [ɾ]
  619: "5",
  // velarized alveolar lateral approximant [ɫ]
  592: "6",
  // near-open central vowel [ɐ]
  612: "7",
  // close-mid back unrounded vowel [ɤ]
  629: "8",
  // close-mid central rounded vowel [ɵ]
  339: "9",
  // open-mid front rounded vowel [œ]
  630: "&",
  // open front rounded vowel [ɶ]
  660: "?",
  // glottal stop [ʔ]
  661: "?\\",
  // voiced pharyngeal fricative [ʕ]
  674: "<\\",
  // voiced epiglottal fricative [ʢ]
  673: ">\\",
  // epiglottal plosive [ʡ]
  42779: "^",
  // upstep [ꜛ]
  42780: "!",
  // downstep [ꜜ]
  451: "!\\",
  // (post)alveolar click [ǃ]
  124: "|",
  // minor (foot) group [|]
  448: "|\\",
  // dental click [ǀ]
  8214: "||",
  // major (intonation) group [‖]
  449: "|\\|\\",
  // alveolar lateral click [ǁ]
  450: "=\\",
  // palatal click [ǂ]
  8255: "-\\",
  // linking mark [‿]
  776: '_"',
  // centralized [◌̈]
  799: "_+",
  // advanced [◌̟]
  800: "_-",
  // retracted [◌̠]
  805: "_0",
  // voiceless [◌̥]
  700: "_>",
  // ejective [◌ʼ]
  740: "_?\\",
  // pharyngealized [◌ˤ]
  815: "_^",
  // non-syllabic [◌̯]
  794: "_}",
  // no audible release [◌̚]
  734: "`",
  // retroflexion & rhoticity [◌˞]
  809: "=",
  // syllabic [◌̩]
  771: "~",
  // anasalized [◌̃]
  792: "_A",
  // advanced tongue root [◌̘]
  826: "_a",
  // apical [◌̺]
  783: "_B",
  // extra low tone [◌̏]
  7622: "_B_L",
  // low rising tone [◌᷆]
  796: "_c",
  // less rounded [◌̜]
  810: "_d",
  // dental [◌̪]
  820: "_e",
  // velarized or pharyngealized; also see 5 [◌̴]
  8600: "<F>",
  // global fall [↘︎]
  736: "_G",
  // velarized [◌ˠ]
  769: "_H",
  // high tone [◌́]
  7620: "_H_T",
  // high rising tone [◌᷄]
  688: "_h",
  // aspirated [◌ʰ]
  690: "_j",
  // palatalized [◌ʲ]
  816: "_k",
  // creaky voice [◌̰]
  768: "_L",
  // low tone [◌̀]
  737: "_l",
  // lateral release [◌ˡ]
  772: "_M",
  // mid tone [◌̄]
  827: "_m",
  // laminal [◌̻]
  828: "_N",
  // linguolabial [◌̼]
  8319: "_n",
  // nasal release [◌ⁿ]
  825: "_O",
  // more rounded [◌̹]
  798: "_o",
  // lowered [◌̞]
  793: "_q",
  // retracted tongue root [◌̙]
  8599: "<R>",
  // global rise [↗︎]
  7624: "_R_F",
  // rising-falling tone [◌᷈]
  797: "_r",
  // raised [◌̝]
  779: "_T",
  // extra high tone [◌̋]
  804: "_t",
  // breathy voice [◌̤]
  812: "_v",
  // voiced [◌̬]
  695: "_w",
  // labialized [◌ʷ]
  774: "_X",
  // extra-short [◌̆]"_w"
  829: "_x",
  // mid-centralized [◌̽]
  770: "_F",
  // falling tone [◌̂]
  780: "_R",
  // rising tone [◌̌]
  11377: "b\\",
  // voiced labiodental flap [ⱱ]
  8252: "!\\!\\",
  // retroflex click "ad hoc digraph" [‼︎]
  846: "_f",
  // whistled [◌͎]
  8595: "_i",
  // ingressive [◌↓]
  845: "_s",
  // spread lips [◌͍]
  840: "_u",
  // tenseness [◌͈]
  841: "_W",
  // weak articulation [◌͉]
  842: "_z"
  // denasalisation [◌͊]
};
function xsampa_to_ipa(input) {
  const tokens = Object.keys(xsampa_to_ipa_code_map).sort(
    (a, b) => b.length - a.length
  );
  let result = "";
  let i = 0;
  while (i < input.length) {
    let matched = false;
    for (const token of tokens) {
      if (input.startsWith(token, i)) {
        const code = xsampa_to_ipa_code_map[token];
        result += String.fromCharCode(code);
        i += token.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += input[i];
      i++;
    }
  }
  return result;
}
function ipa_to_xsampa(ipa_in) {
  let result = "";
  for (let i = 0; i < ipa_in.length; i++) {
    const code = ipa_in.charCodeAt(i);
    const xsampa = ipa_code_map_to_xsampa[code];
    result += xsampa !== void 0 ? xsampa : ipa_in[i];
  }
  return result;
}

// src/transforma/hangul.ts
var initials = {
  gk: 1,
  // ㄲ
  dt: 4,
  // ㄸ
  bp: 8,
  // ㅃ
  ch: 13,
  // ㅊ
  kh: 14,
  // ㅋ
  th: 15,
  // ㅌ
  ph: 17,
  // ㅍ
  k: 0,
  // ㄱ
  n: 2,
  // ㄴ
  t: 3,
  // ㄷ
  r: 5,
  // ㄹ
  m: 6,
  // ㅁ
  p: 7,
  // ㅂ
  s: 9,
  // ㅅ
  z: 10,
  // ㅆ
  c: 12,
  // ㅈ
  j: 13,
  // ㅉ
  x: 18
  // ㅎ
};
var finals = {
  gk: 2,
  // ㄲ
  gn: 21,
  // ㅇ
  ch: 23,
  // ㅊ
  kh: 24,
  // ㅋ
  th: 25,
  // ㅌ
  ph: 26,
  // ㅍ
  k: 1,
  // ㄱ
  n: 4,
  // ㄴ
  t: 7,
  // ㄷ
  r: 8,
  // ㄹ
  m: 16,
  // ㅁ
  p: 17,
  // ㅂ
  s: 19,
  // ㅅ
  z: 20,
  // ㅆ
  c: 22,
  // ㅈ
  x: 27
  // ㅎ
};
var medials = {
  u\u00ED: 16,
  // ㅟ
  \u1EE5\u00ED: 19,
  // ㅢ
  yo: 12,
  // ㅛ
  yu: 17,
  // ㅠ
  y\u1EB9: 3,
  // ㅒ
  ya: 2,
  // ㅑ
  ye: 7,
  // ㅖ
  y\u1ECD: 6,
  // ㅕ
  wa: 9,
  // ㅘ
  w\u1EB9: 10,
  // ㅙ
  w\u1ECD: 14,
  // ㅝ
  we: 15,
  // ㅞ
  wi: 11,
  // ㅚ
  o: 8,
  // ㅗ
  u: 13,
  // ㅜ
  \u1EB9: 1,
  // ㅐ
  a: 0,
  // ㅏ
  \u1ECD: 4,
  // ㅓ
  e: 5,
  // ㅔ
  \u1EE5: 18,
  // ㅡ
  i: 20
  // ㅣ
};
var compatibility_jamos = [
  12593,
  12594,
  12596,
  12599,
  12600,
  12601,
  12609,
  12610,
  12611,
  12613,
  12614,
  12615,
  12616,
  12617,
  12618,
  12619,
  12620,
  12621,
  12622
];
function latin_to_hangul(input) {
  let output = "";
  const init_tokens = Object.keys(initials);
  const medial_tokens = Object.keys(medials);
  const final_tokens = Object.keys(finals);
  while (input.length > 0) {
    let consumed = 0;
    let initial_index = null;
    for (const token of init_tokens) {
      if (input.startsWith(token)) {
        initial_index = initials[token];
        consumed += token.length;
        break;
      }
    }
    let medial_index = null;
    for (const token of medial_tokens) {
      if (input.slice(consumed).startsWith(token)) {
        medial_index = medials[token];
        consumed += token.length;
        break;
      }
    }
    if (initial_index === null && medial_index === null) {
      output += input[0];
      input = input.slice(1);
      continue;
    }
    if (initial_index !== null && medial_index === null) {
      const jamo2 = String.fromCharCode(
        compatibility_jamos[initial_index]
      );
      output += jamo2;
      input = input.slice(consumed);
      continue;
    }
    let final_index = null;
    let final_token = null;
    for (const token of final_tokens) {
      if (input.slice(consumed).startsWith(token)) {
        const lookahead = input.slice(consumed + token.length);
        const has_medial_ahead = medial_tokens.some(
          (m) => lookahead.startsWith(m)
        );
        if (!has_medial_ahead) {
          final_index = finals[token];
          final_token = token;
        }
        break;
      }
    }
    if (final_token !== null) {
      consumed += final_token.length;
    }
    const jamo = combine_jamo(
      initial_index !== null ? initial_index : 11,
      // use ㅇ if no initial
      medial_index,
      // guaranteed to exist here
      final_index ?? 0
      // use 0 if no final
    );
    output += jamo;
    input = input.slice(consumed);
  }
  return output;
}
function combine_jamo(initial, medial, final) {
  const base_code = 44032;
  const initial_offset = initial >= 0 ? initial : 0;
  const medial_offset = medial >= 0 ? medial : 0;
  const final_offset = final >= 0 ? final : 0;
  const syllable_code = base_code + initial_offset * 588 + medial_offset * 28 + final_offset;
  return String.fromCharCode(syllable_code);
}
var inv_initials = {};
for (const [k, v] of Object.entries(initials)) inv_initials[v] = k;
var inv_medials = {};
for (const [k, v] of Object.entries(medials)) inv_medials[v] = k;
var inv_finals = {};
for (const [k, v] of Object.entries(finals)) inv_finals[v] = k;
function hangul_to_latin(input) {
  let out = "";
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code < 44032 || code > 55203) {
      out += ch;
      continue;
    }
    const S = code - 44032;
    const initial_index = Math.floor(S / 588);
    const medial_index = Math.floor(S % 588 / 28);
    const final_index = S % 28;
    const initial_token = initial_index === 11 ? "" : inv_initials[initial_index] ?? "";
    const medial_token = inv_medials[medial_index] ?? "";
    const final_token = final_index === 0 ? "" : inv_finals[final_index] ?? "";
    out += initial_token + medial_token + final_token;
  }
  return out;
}

// src/transforma/greek.ts
var latin_to_greek_code_map = {
  a: "\u03B1",
  \u00E1: "\u03AC",
  \u00E0: "\u1F70",
  e: "\u03B5",
  \u00E9: "\u03AD",
  \u00E8: "\u1F72",
  \u1EB9: "\u03B7",
  \u1EB9\u0301: "\u03AE",
  \u1EB9\u0300: "\u1F74",
  i: "\u03B9",
  \u00ED: "\u03AF",
  \u00EC: "\u1F76",
  o: "\u03BF",
  \u00F3: "\u03CC",
  \u00F2: "\u1F78",
  \u1ECD: "\u03C9",
  \u1ECD\u0301: "\u03CE",
  \u1ECD\u0300: "\u1F7C",
  u: "\u03C5",
  \u00FA: "\u03CD",
  \u00F9: "\u1F7A",
  b: "\u03B2",
  d: "\u03B4",
  f: "\u03C6",
  g: "\u03B3",
  k: "\u03BA",
  l: "\u03BB",
  m: "\u03BC",
  n: "\u03BD",
  p: "\u03C0",
  r: "\u03C1",
  s: "\u03C3",
  t: "\u03C4",
  x: "\u03C7",
  z: "\u03B6",
  h: "\u0371",
  \u010D: "\u0377",
  c: "\u03DB",
  q: "\u03BE",
  \u00FE: "\u03B8",
  \u1E55: "\u03C8",
  \u0161: "\u03F8",
  w: "\u03DD",
  j: "\u03F3"
};
var greek_to_latin_code_map = Object.fromEntries(
  Object.entries(latin_to_greek_code_map).map(([latin, greek]) => [
    greek,
    latin
  ])
);
function latin_to_greek(input) {
  let out = "";
  for (const char of input) {
    out += latin_to_greek_code_map[char] ?? char;
  }
  return out;
}
function greek_to_latin(input) {
  let out = "";
  for (const char of input) {
    out += greek_to_latin_code_map[char] ?? char;
  }
  return out;
}

// src/transforma/carryover_associator.ts
var Carryover_Associator = class {
  caryover_list;
  constructor() {
    this.caryover_list = [];
  }
  // Called when a word's grapheme in TARGET matches a rule's grapheme with based-mark
  set_item(entry_id, variant_id) {
    this.caryover_list.push({ entry_id, variant_id });
  }
  // Get grapheme from
  // result token base and
  // first item in carryover_list entry and variant
  // If not null, removes first item from carryover_list
  // return null or found grapheme
  get_result_associateme(association, associateme_mapper) {
    const item = this.find_first_item();
    if (!item) {
      return null;
    }
    const [entry_id, variant_id] = item;
    const base_id = association.base_id;
    const my_grapheme = this.find_grapheme(
      entry_id,
      base_id,
      variant_id,
      associateme_mapper
    );
    if (!my_grapheme) {
      return null;
    }
    if (entry_id != association.entry_id) {
      return null;
    }
    this.remove_first_item();
    return my_grapheme;
  }
  find_first_item() {
    const item = get_first(this.caryover_list);
    return item ? [item.entry_id, item.variant_id] : void 0;
  }
  remove_first_item() {
    this.caryover_list.shift();
  }
  find_grapheme(entry_id, base_id, variant_id, associateme_mapper) {
    if (entry_id < 0 || entry_id >= associateme_mapper.length) {
      return null;
    }
    const entry = associateme_mapper[entry_id];
    if (variant_id < 0 || variant_id >= entry.variants.length) {
      return null;
    }
    const variantGroup = entry.variants[variant_id];
    if (base_id < 0 || base_id >= variantGroup.length) {
      return null;
    }
    return variantGroup[base_id];
  }
};
var carryover_associator_default = Carryover_Associator;

// src/transforma/transformer.ts
var Transformer = class {
  logger;
  stages = [];
  substages = [];
  //public transforms: Transform[];
  graphemes;
  lettercase_mapper;
  syllable_boundaries;
  debug = false;
  associateme_mapper;
  constructor(logger, graphemes, lettercase_mapper2, syllable_boundaries, stages, substages, output_mode, associateme_mapper) {
    this.logger = logger;
    this.graphemes = graphemes;
    this.lettercase_mapper = lettercase_mapper2;
    this.syllable_boundaries = syllable_boundaries;
    this.associateme_mapper = associateme_mapper;
    this.debug = output_mode === "debug";
    this.stages = stages;
    this.substages = substages;
  }
  run_routine(routine, word, word_stream, line_num) {
    const full_word = word_stream.join("");
    let modified_word = "";
    switch (routine) {
      case "decompose":
        modified_word = full_word.normalize("NFD");
        break;
      case "compose":
        modified_word = full_word.normalize("NFC");
        break;
      case "capitalise":
        modified_word = this.lettercase_mapper.capitalise(full_word);
        break;
      case "decapitalise":
        modified_word = this.lettercase_mapper.decapitalise(full_word);
        break;
      case "to-uppercase":
        modified_word = this.lettercase_mapper.to_uppercase(full_word);
        break;
      case "to-lowercase":
        modified_word = this.lettercase_mapper.to_lowercase(full_word);
        break;
      case "reverse":
        modified_word = reverse_items(word_stream).join("");
        break;
      case "xsampa-to-ipa":
        modified_word = xsampa_to_ipa(full_word);
        break;
      case "ipa-to-xsampa":
        modified_word = ipa_to_xsampa(full_word);
        break;
      case "latin-to-hangul":
        modified_word = latin_to_hangul(full_word);
        break;
      case "hangul-to-latin":
        modified_word = hangul_to_latin(full_word);
        break;
      case "latin-to-greek":
        modified_word = latin_to_greek(full_word);
        break;
      case "greek-to-latin":
        modified_word = greek_to_latin(full_word);
        break;
      default:
        this.logger.validation_error("This should not have happened");
    }
    word.record_transformation(
      `<routine = ${routine}>`,
      modified_word,
      line_num
    );
    return graphemosis(modified_word, this.graphemes);
  }
  target_to_word_match(word_tokens, raw_target, reference_mapper, carryover_associator) {
    for (let j = 0; j <= word_tokens.length; j++) {
      const result = this.match_pattern_at(
        word_tokens,
        raw_target,
        j,
        reference_mapper,
        carryover_associator,
        word_tokens.length
      );
      if (result !== null) {
        return [result.start, result.end - result.start, result.matched];
      }
    }
    return [0, 0, []];
  }
  result_former(raw_result, target_stream, reference_mapper, carryover_associator) {
    const replacement_stream = [];
    for (let j = 0; j < raw_result.length; j++) {
      const my_result_token = raw_result[j];
      if (my_result_token.type === "grapheme") {
        if (my_result_token.association) {
          const my_grapheme = carryover_associator.get_result_associateme(
            my_result_token.association,
            this.associateme_mapper
          );
          if (my_grapheme === null) {
            if (my_result_token.max === Infinity) {
              this.logger.validation_error(
                "This should not have happened: infinite max grapheme??"
              );
            }
            for (let k = 0; k < my_result_token.max; k++) {
              replacement_stream.push(my_result_token.base);
            }
          } else {
            for (let k = 0; k < my_result_token.min; k++) {
              replacement_stream.push(my_grapheme);
            }
          }
        } else {
          for (let k = 0; k < my_result_token.min; k++) {
            replacement_stream.push(my_result_token.base);
          }
        }
      } else if (my_result_token.type === "target-mark") {
        for (let k = 0; k < target_stream.length; k++) {
          replacement_stream.push(target_stream[k]);
        }
      } else if (my_result_token.type === "metathesis-mark") {
        const my_metathesis_graphemes = swap_first_last_items([
          ...target_stream
        ]);
        replacement_stream.push(...my_metathesis_graphemes);
      } else if (my_result_token.type === "reference-start-capture") {
        reference_mapper.set_capture_stream_index(
          replacement_stream.length
        );
      } else if (my_result_token.type === "reference-capture") {
        reference_mapper.capture_reference(
          my_result_token.key,
          replacement_stream
        );
      } else if (my_result_token.type === "reference-mark") {
        const reference_value = reference_mapper.get_captured_reference(my_result_token.key);
        replacement_stream.push(...reference_value);
      }
    }
    reference_mapper.reset_capture_stream_index();
    return replacement_stream;
  }
  resolve_association(mapper, grapheme) {
    for (let entry_id = 0; entry_id < mapper.length; entry_id++) {
      const entry = mapper[entry_id];
      for (let variant_id = 0; variant_id < entry.variants.length; variant_id++) {
        const group = entry.variants[variant_id];
        for (let base_id = 0; base_id < group.length; base_id++) {
          if (group[base_id] === grapheme) {
            return { entry_id, base_id, variant_id };
          }
        }
      }
    }
    return null;
  }
  get_variant_id_for_base(mapper, entry_id, base_id, grapheme) {
    if (entry_id < 0 || entry_id >= mapper.length) return null;
    const entry = mapper[entry_id];
    if (base_id < 0 || base_id >= entry.bases.length) return null;
    for (let variant_id = 0; variant_id < entry.variants.length; variant_id++) {
      if (entry.variants[variant_id][base_id] === grapheme) {
        return variant_id;
      }
    }
    return null;
  }
  // BEFORE and AFTER and TARGET use this
  match_pattern_at(stream, pattern, start, reference_mapper, carryover_associator, max_end, target_stream) {
    let i = start;
    let j = 0;
    const matched = [];
    while (j < pattern.length) {
      const token = pattern[j];
      if (token.type !== "grapheme" && token.type !== "wildcard" && token.type !== "anythings-mark" && token.type !== "target-mark" && token.type !== "metathesis-mark" && token.type !== "syllable-boundary" && token.type !== "word-boundary" && token.type !== "empty-mark" && token.type !== "reference-capture" && token.type !== "reference-mark" && token.type !== "reference-start-capture") {
        j++;
        continue;
      }
      const min = token.min;
      const max = token.max;
      const max_available = max_end !== void 0 ? Math.min(max, max_end - i) : max;
      if (token.type === "grapheme") {
        if (token.association) {
          let count = 0;
          const baseEntryId = token.association.entry_id;
          const baseBaseId = token.association.base_id;
          while (count < token.max && i + count < stream.length) {
            const grapheme = stream[i + count];
            const variant_id = this.get_variant_id_for_base(
              this.associateme_mapper,
              baseEntryId,
              baseBaseId,
              grapheme
            );
            if (variant_id !== null) {
              if (token.association.is_target && carryover_associator) {
                carryover_associator.set_item(baseEntryId, variant_id);
              }
              count++;
            } else {
              break;
            }
          }
          if (count < token.min) {
            return null;
          }
          matched.push(...stream.slice(i, i + count));
          i += count;
        } else {
          let count = 0;
          while (count < max_available && stream[i + count] === token.base) {
            count++;
          }
          if (count < min) {
            return null;
          }
          matched.push(...stream.slice(i, i + count));
          i += count;
        }
      } else if (token.type === "target-mark") {
        if (!target_stream || target_stream.length === 0) {
          this.logger.validation_error(
            "Target-mark requires a non-empty target_stream"
          );
        }
        const unit = target_stream;
        const unit_length = unit.length;
        const min2 = token.min;
        const max2 = token.max;
        const max_available2 = max_end !== void 0 ? Math.min(max2, Math.floor((max_end - i) / unit_length)) : max2;
        let repetitions = 0;
        while (repetitions < max_available2 && stream.slice(
          i + repetitions * unit_length,
          i + (repetitions + 1) * unit_length
        ).every((val, idx) => val === unit[idx])) {
          repetitions++;
        }
        if (repetitions < min2) {
          return null;
        }
        const total_length = repetitions * unit_length;
        matched.push(...stream.slice(i, i + total_length));
        i += total_length;
      } else if (token.type === "metathesis-mark") {
        if (!target_stream || target_stream.length === 0) {
          this.logger.validation_error(
            "Metathesis-mark requires a non-empty target_stream"
          );
        }
        const unit = swap_first_last_items([...target_stream]);
        const unit_length = unit.length;
        const min2 = token.min;
        const max2 = token.max;
        const max_available2 = max_end !== void 0 ? Math.min(max2, Math.floor((max_end - i) / unit_length)) : max2;
        let repetitions = 0;
        while (repetitions < max_available2 && stream.slice(
          i + repetitions * unit_length,
          i + (repetitions + 1) * unit_length
        ).every((val, idx) => val === unit[idx])) {
          repetitions++;
        }
        if (repetitions < min2) {
          return null;
        }
        const total_length = repetitions * unit_length;
        matched.push(...stream.slice(i, i + total_length));
        i += total_length;
      } else if (token.type === "empty-mark") {
        matched.push("");
        i += 0;
      } else if (token.type === "wildcard") {
        const available = Math.min(max_available, stream.length - i);
        if (available < min) {
          return null;
        }
        matched.push(...stream.slice(i, i + available));
        i += available;
      } else if (token.type === "syllable-boundary") {
        let count = 0;
        if (this.syllable_boundaries.includes(stream[i])) {
          while (count < max_available && stream[i + count] === stream[i]) {
            count++;
          }
          if (count < min) {
            return null;
          }
          matched.push(...stream.slice(i, i + count));
          i += count;
        } else if (i === 0 || i === stream.length) {
          if (min > 1) return null;
          matched.push("$");
        } else {
          return null;
        }
      } else if (token.type === "word-boundary") {
        if (i === 0 || i === stream.length) {
          if (min > 1) return null;
          matched.push("#");
        } else {
          return null;
        }
      } else if (token.type === "anythings-mark") {
        const blocked = token.blocked_by ?? [];
        const consume = token.consume ?? [];
        let count = 0;
        outer: while (count < max_available && stream[i + count] !== void 0) {
          for (const group of blocked) {
            const group_len = group.length;
            const slice = stream.slice(i + count, i + count + group_len);
            if (slice.length === group_len && slice.every((val, idx) => val === group[idx])) {
              break outer;
            }
          }
          for (const group of consume) {
            const group_len = group.length;
            const slice = stream.slice(i + count, i + count + group_len);
            if (slice.length === group_len && slice.every((val, idx) => val === group[idx])) {
              count += group_len;
              break outer;
            }
          }
          count++;
        }
        if (count < token.min) {
          return null;
        }
        matched.push(...stream.slice(i, i + count));
        i += count;
      } else if (token.type === "reference-start-capture") {
        reference_mapper.set_capture_stream_index(matched.length);
      } else if (token.type === "reference-capture") {
        reference_mapper.capture_reference(token.key, matched);
      } else if (token.type === "reference-mark") {
        const reference_value = reference_mapper.get_captured_reference(token.key);
        const unit_length = reference_value.length;
        if (unit_length === 0) {
          return null;
        }
        const max_available2 = max_end !== void 0 ? Math.min(token.max, Math.floor((max_end - i) / unit_length)) : token.max;
        let repetitions = 0;
        while (repetitions < max_available2 && stream.slice(
          i + repetitions * unit_length,
          i + (repetitions + 1) * unit_length
        ).every((val, idx) => val === reference_value[idx])) {
          repetitions++;
        }
        if (repetitions < token.min) {
          return null;
        }
        const total_length = repetitions * unit_length;
        matched.push(...stream.slice(i, i + total_length));
        i += total_length;
      }
      j++;
    }
    reference_mapper.reset_capture_stream_index();
    return {
      start,
      end: i,
      matched
    };
  }
  environment_match(word_stream, target_stream, startIdx, raw_target, before, after, reference_mapper) {
    const human_readable_condition_match = [" / "];
    const target_len = raw_target.length;
    const before_tokens = before;
    let before_matched = false;
    for (let i = 0; i <= startIdx; i++) {
      const result2 = this.match_pattern_at(
        word_stream,
        before_tokens,
        i,
        reference_mapper,
        null,
        startIdx,
        target_stream
      );
      if (result2 !== null && result2.end === startIdx) {
        before_matched = true;
        human_readable_condition_match.push(...result2.matched);
        break;
      }
    }
    if (!before_matched) return [false, ""];
    human_readable_condition_match.push("_");
    const after_tokens = after;
    const after_start = startIdx + target_len;
    const result = this.match_pattern_at(
      word_stream,
      after_tokens,
      after_start,
      reference_mapper,
      null,
      word_stream.length,
      target_stream
    );
    if (result === null) {
      return [false, ""];
    }
    human_readable_condition_match.push(...result.matched);
    return [true, human_readable_condition_match.join("")];
  }
  // Non destructively apply replacements
  replacementa(word_stream, replacements, word, exceptions, line_num) {
    replacements.sort((a, b) => a.index_span - b.index_span);
    const blocked = /* @__PURE__ */ new Set();
    const insertion_map = /* @__PURE__ */ new Map();
    const replacement_map = /* @__PURE__ */ new Map();
    for (const r of replacements) {
      if (r.length_span === 0) {
        if (!insertion_map.has(r.index_span))
          insertion_map.set(r.index_span, []);
        insertion_map.get(r.index_span).push(...r.replacement_stream);
      } else {
        replacement_map.set(r.index_span, {
          length_span: r.length_span,
          replacement_stream: r.replacement_stream
        });
      }
    }
    const result_tokens = [];
    const applied_targets = [];
    const applied_results = [];
    let i = 0;
    while (i < word_stream.length) {
      if (insertion_map.has(i)) {
        for (const rep of insertion_map.get(i)) {
          applied_targets.push("^");
          applied_results.push(rep);
          result_tokens.push(rep);
        }
      }
      const replacement = replacement_map.get(i);
      if (replacement && ![...Array(replacement.length_span).keys()].some(
        (k) => blocked.has(i + k)
      )) {
        const replaced_chunk = word_stream.slice(
          i,
          i + replacement.length_span
        );
        if (replacement.replacement_stream.length > 0) {
          result_tokens.push(...replacement.replacement_stream);
        }
        applied_targets.push(replaced_chunk.join(""));
        applied_results.push(
          replacement.replacement_stream.length === 0 ? "\u2205" : replacement.replacement_stream.join("")
        );
        for (let k = 0; k < replacement.length_span; k++) {
          blocked.add(i + k);
        }
        i += replacement.length_span;
      } else {
        result_tokens.push(word_stream[i]);
        i++;
      }
    }
    if (insertion_map.has(word_stream.length)) {
      for (const rep of insertion_map.get(word_stream.length)) {
        applied_targets.push("^");
        applied_results.push(rep);
        result_tokens.push(rep);
      }
    }
    const normalized = result_tokens;
    if (applied_targets.length > 0 && this.debug) {
      let my_exceptions = "";
      for (const e of exceptions) {
        const my_before = e.before.map((t) => t.base).join("");
        const my_after = e.after.map((t) => t.base).join("");
        my_exceptions += ` ! ${my_before}_${my_after}`;
      }
      let my_conditions = "";
      for (const r of replacements) {
        if (r.matched_conditions.length != 0) {
          for (const c of r.matched_conditions) {
            my_conditions += c;
          }
        }
      }
      const transformation_str = `${applied_targets.join(", ")} \u2192 ${applied_results.join(", ")}`;
      word.record_transformation(
        `${transformation_str}${my_conditions}${my_exceptions}`,
        normalized.join(" "),
        line_num
      );
    }
    return normalized;
  }
  apply_transform(word, word_stream, transform) {
    const {
      t_type,
      target,
      result,
      conditions,
      exceptions,
      chance,
      line_num
    } = transform;
    if (chance != null && Math.random() * 100 >= chance) {
      return word_stream;
    }
    if (t_type != "rule" && t_type != "cluster-field") {
      word_stream = this.run_routine(t_type, word, word_stream, line_num);
      return word_stream;
    }
    if (target.length !== result.length) {
      this.logger.validation_error(
        "Mismatched target/result concurrent set lengths in a transform",
        line_num
      );
    }
    const replacements = [];
    for (let i = 0; i < target.length; i++) {
      const reference_mapper = new reference_mapper_default();
      const carryover_associator = new carryover_associator_default();
      const raw_target = target[i];
      const raw_result = result[i];
      let mode = "replacement";
      if (raw_result[0].type === "deletion") {
        mode = "deletion";
      } else if (raw_result[0].type === "reject") {
        mode = "reject";
      } else {
        this.target_to_word_match(
          word_stream,
          raw_target,
          reference_mapper,
          carryover_associator
        );
      }
      if (raw_target[0].type === "insertion") {
        if (mode === "deletion" || mode === "reject") {
          this.logger.validation_error(
            `Inserion of ${mode} is not valid`,
            line_num
          );
        }
        if (conditions.length === 0) {
          this.logger.validation_error(
            "Insertion without a condition is not valid",
            line_num
          );
        }
        mode = "insertion";
        for (let insert_index = 0; insert_index <= word_stream.length; insert_index++) {
          const my_replacement_stream = this.result_former(
            raw_result,
            word_stream,
            reference_mapper,
            carryover_associator
          );
          const matched_conditions = [];
          let passes = conditions.length === 0;
          for (const c of conditions) {
            const temp_mapper = reference_mapper.clone();
            const [pass, result2] = this.environment_match(
              word_stream,
              my_replacement_stream,
              insert_index,
              [],
              c.before,
              c.after,
              temp_mapper
            );
            if (pass) {
              matched_conditions.push(result2);
              reference_mapper.absorb(temp_mapper);
              passes = true;
            }
          }
          const blocked = exceptions.some((e) => {
            const temp_mapper = reference_mapper.clone();
            const [block] = this.environment_match(
              word_stream,
              my_replacement_stream,
              insert_index,
              [],
              e.before,
              e.after,
              temp_mapper
            );
            return block;
          });
          if (!passes || blocked) continue;
          const second_replacement_stream = this.result_former(
            raw_result,
            word_stream,
            reference_mapper,
            carryover_associator
          );
          replacements.push({
            index_span: insert_index,
            length_span: 0,
            target_stream: ["^"],
            // symbolic marker for insertion
            replacement_stream: second_replacement_stream,
            matched_conditions
          });
        }
      } else {
        let cursor = 0;
        while (cursor <= word_stream.length) {
          const [match_index, match_length, matched_stream] = this.target_to_word_match(
            word_stream.slice(cursor),
            raw_target,
            reference_mapper,
            carryover_associator
          );
          if (match_length === 0) {
            cursor++;
            continue;
          }
          const global_index = cursor + match_index;
          const matched_conditions = [];
          let passes = conditions.length === 0;
          for (const c of conditions) {
            const temp_mapper = reference_mapper.clone();
            const [pass, result2] = this.environment_match(
              word_stream,
              matched_stream,
              global_index,
              matched_stream,
              c.before,
              c.after,
              temp_mapper
            );
            if (pass) {
              matched_conditions.push(result2);
              reference_mapper.absorb(temp_mapper);
              passes = true;
            }
          }
          const blocked = exceptions.some((e) => {
            const temp_mapper = reference_mapper.clone();
            const [block] = this.environment_match(
              word_stream,
              matched_stream,
              global_index,
              matched_stream,
              e.before,
              e.after,
              temp_mapper
            );
            return block;
          });
          if (!passes || blocked) {
            cursor = global_index + 1;
            continue;
          }
          if (mode === "reject") {
            word.rejected = true;
            word.record_transformation(
              `${matched_stream.join("")} \u2192 0`,
              "\u2205",
              line_num
            );
            return word_stream;
          } else if (mode === "deletion") {
            replacements.push({
              index_span: global_index,
              length_span: match_length,
              target_stream: matched_stream,
              replacement_stream: [],
              matched_conditions
            });
          } else {
            const my_replacement_stream = this.result_former(
              raw_result,
              matched_stream,
              reference_mapper,
              carryover_associator
            );
            replacements.push({
              index_span: global_index,
              length_span: match_length,
              target_stream: matched_stream,
              replacement_stream: my_replacement_stream,
              matched_conditions
            });
          }
          cursor = global_index + match_length;
        }
      }
    }
    word_stream = this.replacementa(
      word_stream,
      replacements,
      word,
      exceptions,
      line_num
    );
    return word_stream;
  }
  do_transforms(word, transforms) {
    if (word.get_last_form() == "") {
      word.rejected = true;
      return word;
    }
    if (transforms.length == 0) {
      return word;
    }
    let tokens = graphemosis(word.get_last_form(), this.graphemes);
    for (const t of transforms) {
      if (word.rejected) {
        break;
      }
      if (t.target.length == 0 && (t.t_type === "rule" || t.t_type === "cluster-field")) {
        continue;
      }
      tokens = this.apply_transform(word, tokens, t);
      word.current_form = tokens.join("");
      if (tokens.length === 0) {
        word.rejected = true;
        if (this.debug) {
          word.record_banner("REJECT-NULL-WORD");
        }
      }
    }
    if (!word.rejected) {
      word.record_output();
    }
    return word;
  }
  do_stages(word) {
    for (const stage of this.stages) {
      if (stage.name) {
        word.record_banner(`STAGE: ${stage.name}`);
      }
      word = this.do_transforms(word, stage.transforms);
    }
    return word;
  }
  get_variant_id(mapper, grapheme, baseToken) {
    const { entry_id, base_id } = baseToken;
    if (entry_id < 0 || entry_id >= mapper.length) return null;
    const entry = mapper[entry_id];
    if (base_id < 0 || base_id >= entry.bases.length) return null;
    for (let variant_id = 0; variant_id < entry.variants.length; variant_id++) {
      if (entry.variants[variant_id][base_id] === grapheme) {
        return variant_id;
      }
    }
    return null;
  }
};
var transformer_default = Transformer;

// src/collator.ts
function collator(logger, words, custom_alphabet, invisible = []) {
  if (custom_alphabet.length === 0) {
    if (invisible.length == 0) {
      return words.sort(Intl.Collator().compare);
    } else {
      const invisible_set2 = new Set(invisible);
      const collator2 = Intl.Collator();
      const stripped_words = words.map((w) => ({
        original: w,
        stripped: strip_invisible(w, invisible_set2)
      }));
      return stripped_words.sort((a, b) => collator2.compare(a.stripped, b.stripped)).map((entry) => entry.original);
    }
  }
  custom_alphabet.push("\uFFFD");
  const order_map = /* @__PURE__ */ new Map();
  custom_alphabet.forEach((char, index) => order_map.set(char, index));
  const invisible_set = new Set(invisible);
  const unknown_set = /* @__PURE__ */ new Set();
  function tokenize(input) {
    const tokens = [];
    const graphemes = Array.from(order_map.keys()).concat(Array.from(invisible_set)).sort((a, b) => b.length - a.length);
    let i = 0;
    while (i < input.length) {
      let matched = false;
      for (const g of graphemes) {
        if (input.startsWith(g, i)) {
          tokens.push(g);
          i += g.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push(input[i]);
        i += 1;
      }
    }
    return tokens;
  }
  function custom_compare(a, b) {
    const aTokens = tokenize(a).filter((t) => !invisible_set.has(t));
    const bTokens = tokenize(b).filter((t) => !invisible_set.has(t));
    for (let i = 0; i < Math.max(aTokens.length, bTokens.length); i++) {
      const aTok = aTokens[i];
      const bTok = bTokens[i];
      if (aTok === void 0) return -1;
      if (bTok === void 0) return 1;
      const aIndex = order_map.get(aTok);
      const bIndex = order_map.get(bTok);
      if (aIndex === void 0) unknown_set.add(aTok);
      if (bIndex === void 0) unknown_set.add(bTok);
      if ((aIndex ?? Infinity) !== (bIndex ?? Infinity)) {
        return (aIndex ?? Infinity) - (bIndex ?? Infinity);
      }
    }
    return 0;
  }
  function strip_invisible(word, invisible_set2) {
    const graphemes = Array.from(invisible_set2).sort(
      (a, b) => b.length - a.length
    );
    let result = "";
    let i = 0;
    while (i < word.length) {
      let matched = false;
      for (const g of graphemes) {
        if (word.startsWith(g, i)) {
          i += g.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result += word[i];
        i += 1;
      }
    }
    return result;
  }
  const sorted = [...words].sort(custom_compare);
  if (unknown_set.size > 0) {
    logger.warn(
      `The custom order stated in 'alphabet' was ignored because words had unknown graphemes: '${Array.from(unknown_set).join(", ")}' missing from 'alphabet'`
    );
    return words.sort(Intl.Collator().compare);
  }
  return sorted;
}
var collator_default = collator;

// src/logger.ts
var Logger = class {
  errors;
  warnings;
  infos;
  diagnostics;
  payload;
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
    this.diagnostics = [];
    this.payload = "";
  }
  Uncaught_Error = class Uncaught_Error extends Error {
    constructor(original) {
      super(original.message);
      this.name = original.name || "Error";
      Object.setPrototypeOf(this, new.target.prototype);
      if (original.stack) {
        this.stack = original.stack;
      }
    }
  };
  uncaught_error(original) {
    const err = new this.Uncaught_Error(original);
    const location = this.extract_location(err.stack);
    const log_message = `${err.name}: ${err.message}${location ? " @ " + location : ""}`;
    this.errors.push(log_message);
  }
  Validation_Error = class Validation_Error extends Error {
    constructor(message) {
      super(message);
      this.name = "Validation_Error";
      Object.setPrototypeOf(this, new.target.prototype);
    }
  };
  validation_error(message, line_num = null) {
    const err = new this.Validation_Error(message);
    if (line_num || line_num === 0) {
      this.errors.push(`Error: ${message} @ line ${line_num + 1}.`);
    } else {
      this.errors.push(`Error: ${message}.`);
    }
    throw err;
  }
  extract_location(stack) {
    if (!stack) return null;
    const lines = stack.split("\n");
    for (const line of lines) {
      const match = line.match(/(?:\(|\bat\s+)?(.*?):(\d+):(\d+)\)?/);
      if (match) {
        let file_path = match[1].replace(/\?.*$/, "");
        file_path = file_path.replace(/^.*\/src\//, "modules/");
        file_path = file_path.replace(/(\bmodules\b\/)\1/, "$1");
        return `${file_path}:${match[2]}`;
      }
    }
    return null;
  }
  warn(warn, line_num = null) {
    if (line_num || line_num === 0) {
      this.warnings.push(`Warning: ${warn} @ line ${line_num + 1}.`);
    } else {
      this.warnings.push(`Warning: ${warn}.`);
    }
  }
  info(info) {
    this.infos.push(`${info}.`);
  }
  diagnostic(diagnostic) {
    this.diagnostics.push(diagnostic);
  }
  set_payload(payload) {
    this.payload = payload;
  }
  create_log() {
    return {
      payload: this.payload,
      errors: this.errors,
      warnings: this.warnings,
      infos: this.infos,
      diagnostics: this.diagnostics
    };
  }
};
var logger_default = Logger;

// src/escape_mapper.ts
var escapeMap = {
  "&[Space]": " ",
  "&[Tab]": "	",
  "&[Newline]": "\n",
  "&[Acute]": "\u0301",
  "&[DoubleAcute]": "\u030B",
  "&[Grave]": "\u0300",
  "&[DoubleGrave]": "\u030F",
  "&[Circumflex]": "\u0302",
  "&[Caron]": "\u030C",
  "&[Breve]": "\u0306",
  "&[BreveBelow]": "\u032E",
  // ◌̮
  "&[InvertedBreve]": "\u0311",
  "&[InvertedBreveBelow]": "\u032F",
  // ◌̯
  "&[TildeAbove]": "\u0303",
  "&[TildeBelow]": "\u0330",
  "&[Macron]": "\u0304",
  "&[MacronBelow]": "\u0331",
  // ◌̠
  "&[MacronBelowStandalone]": "\u02D7",
  // ˗
  "&[Dot]": "\u0307",
  "&[DotBelow]": "\u0323",
  "&[Diaeresis]": "\u0308",
  "&[DiaeresisBelow]": "\u0324",
  "&[Ring]": "\u030A",
  "&[RingBelow]": "\u0325",
  "&[Horn]": "\u031B",
  "&[Hook]": "\u0309",
  "&[CommaAbove]": "\u0313",
  "&[CommaBelow]": "\u0326",
  "&[Cedilla]": "\u0327",
  "&[Ogonek]": "\u0328",
  "&[VerticalLineBelow]": "\u0329",
  // ◌̩
  "&[VerticalLineAbove]": "\u030D",
  // ◌̍
  "&[DoubleVerticalLineBelow]": "\u0348",
  // ◌͈
  "&[PlusSignBelow]": "\u031F",
  // ◌̟
  "&[PlusSignStandalone]": "\u02D6",
  // ˖
  "&[uptackBelow]": "\u031D",
  // ◌̝
  "&[UpTackStandalone]": "\u02D4",
  // ˔
  "&[LeftTackBelow]": "\u0318",
  // ◌̘
  "&[rightTackBelow]": "\u0319",
  // ◌̙
  "&[DownTackBelow]": "\u031E",
  // ◌̞
  "&[DownTackStandalone]": "\u02D5",
  // ˕
  "&[BridgeBelow]": "\u032A",
  // ◌̪
  "&[BridgeAbove]": "\u0346",
  // ◌͆
  "&[InvertedBridgeBelow]": "\u033A",
  // ◌̺
  "&[SquareBelow]": "\u033B",
  // ◌̻
  "&[SeagullBelow]": "\u033C",
  // ◌̼
  "&[LeftBracketBelow]": "\u0349"
  // ◌͉
};
var Escape_Mapper = class {
  map;
  counter;
  constructor() {
    this.map = /* @__PURE__ */ new Map();
    this.map.set(String.fromCharCode(917504), " ");
    this.counter = 1;
  }
  escape_backslash_pairs(input) {
    const reverse = /* @__PURE__ */ new Map();
    const result = input.replace(/\\(.)/g, (_, char) => {
      if (reverse.has(char)) {
        return reverse.get(char);
      }
      const placeholder = String.fromCharCode(57344 + this.counter);
      reverse.set(char, placeholder);
      this.map.set(placeholder, char);
      this.counter++;
      return placeholder;
    });
    return result;
  }
  escape_special_chars(input) {
    const special_chars = new Set(SYNTAX_CHARS);
    const reverse = /* @__PURE__ */ new Map();
    const result = input.split("").map((char) => {
      if (special_chars.has(char)) {
        if (reverse.has(char)) {
          return reverse.get(char);
        }
        const placeholder = String.fromCharCode(57344 + this.counter);
        reverse.set(char, placeholder);
        this.map.set(placeholder, char);
        this.counter++;
        return placeholder;
      }
      return char;
    }).join("");
    return result;
  }
  escape_named_escape(input) {
    return input.replace(
      /&\[[A-Za-z]+\]/g,
      (match) => escapeMap[match] ?? match
    );
  }
  restore_escaped_chars(input) {
    return input.split("").map((c) => this.map.has(c) ? this.map.get(c) : c).join("");
  }
  // Restore but append a backslash before each character that was escaped
  restore_preserve_escaped_chars(input) {
    return input.split("").map((c) => this.map.has(c) ? "\\" + this.map.get(c) : c).join("");
  }
};
var escape_mapper_default = Escape_Mapper;

// src/transforma/lettercase_mapper.ts
var lettercase_mapper = class {
  map;
  reverse_map;
  constructor() {
    this.map = /* @__PURE__ */ new Map();
    this.reverse_map = /* @__PURE__ */ new Map();
  }
  create_map(new_map) {
    const entries = Array.from(new_map.entries());
    const sorted = entries.sort(
      ([a], [b]) => b.length - a.length
    );
    this.map = new Map(sorted);
    const reversed = sorted.slice().sort(([, vA], [, vB]) => vB.length - vA.length).map(([k, v]) => [v, k]);
    this.reverse_map = new Map(reversed);
  }
  tokenise(word) {
    const tokens = [];
    let i = 0;
    while (i < word.length) {
      let matched = false;
      for (const [key] of this.map) {
        if (key && word.startsWith(key, i)) {
          tokens.push(key);
          i += key.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push(word[i]);
        i++;
      }
    }
    return tokens;
  }
  capitalise(word) {
    if (!word) return word;
    const tokens = this.tokenise(word);
    const first = tokens[0] ?? "";
    const cap = this.map.get(first) ?? (first ? first[0].toUpperCase() + first.slice(1) : "");
    return cap + tokens.slice(1).join("");
  }
  decapitalise(word) {
    if (!word) return word;
    const tokens = this.tokenise(word);
    const first = tokens[0] ?? "";
    const cap = this.reverse_map.get(first) ?? (first ? first[0].toUpperCase() + first.slice(1) : "");
    return cap + tokens.slice(1).join("");
  }
  to_uppercase(word) {
    if (!word) return word;
    return this.tokenise(word).map((tok) => this.map.get(tok) ?? tok.toUpperCase()).join("");
  }
  to_lowercase(word) {
    if (!word) return word;
    return this.tokenise(word).map((tok) => this.reverse_map.get(tok) ?? tok.toLowerCase()).join("");
  }
};
var lettercase_mapper_default = lettercase_mapper;

// src/resolvers/transform_resolver.ts
var Transform_Resolver = class {
  logger;
  output_mode;
  nesca_grammar_stream;
  categories;
  //public transform_pending: Transform_Pending[];
  //public transforms: Transform[] = [];
  stages_pending;
  stages;
  substages_pending;
  substages;
  ////////////////////////////////////
  syllable_boundaries;
  features = /* @__PURE__ */ new Map();
  line_num;
  constructor(logger, output_mode, nesca_grmmar_stream, categories, stages_pending, substages_pending, features, syllable_boundaries) {
    this.logger = logger;
    this.output_mode = output_mode;
    this.nesca_grammar_stream = nesca_grmmar_stream;
    this.categories = categories;
    this.stages_pending = stages_pending;
    this.substages_pending = substages_pending;
    this.stages = [];
    this.substages = [];
    this.features = features;
    this.syllable_boundaries = syllable_boundaries.length === 0 ? ["."] : syllable_boundaries;
    this.line_num = 0;
    this.resolve_stages();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  resolve_stages() {
    for (const stage_pending of this.stages_pending) {
      this.stages.push({
        transforms: this.resolve_transforms(
          stage_pending.transforms_pending
        ),
        name: stage_pending.name
      });
    }
  }
  resolve_transforms(transform_pending) {
    const output_transforms = [];
    for (let i = 0; i < transform_pending.length; i++) {
      this.line_num = transform_pending[i].line_num;
      if (transform_pending[i].t_type === "cluster-field") {
        output_transforms.push({
          t_type: transform_pending[i].t_type,
          target: this.get_cluser_field_graphemes(
            transform_pending[i].target,
            "TARGET"
          ),
          result: this.get_cluser_field_graphemes(
            transform_pending[i].result,
            "RESULT"
          ),
          conditions: [],
          exceptions: [],
          chance: null,
          line_num: this.line_num
        });
        continue;
      } else if (transform_pending[i].t_type !== "rule") {
        output_transforms.push({
          t_type: transform_pending[i].t_type,
          target: [],
          result: [],
          conditions: [],
          exceptions: [],
          chance: null,
          line_num: this.line_num
        });
        continue;
      }
      const target = transform_pending[i].target;
      const target_with_cat = this.categories_into_transform(target);
      const target_with_fea = this.features_into_transform(target_with_cat);
      const target_altors = this.resolve_alt_opt(target_with_fea);
      const result = transform_pending[i].result;
      const result_with_cat = this.categories_into_transform(result);
      const result_with_fea = this.features_into_transform(result_with_cat);
      const result_altors = this.resolve_alt_opt(result_with_fea);
      const { result_array, target_array } = this.normaliseTransformLength(
        target_altors,
        result_altors
      );
      const result_length_match = result_array.flat();
      const target_length_match = target_array.flat();
      const tokenised_target_array = [];
      for (let j = 0; j < target_length_match.length; j++) {
        tokenised_target_array.push(
          this.nesca_grammar_stream.main_parser(
            target_length_match[j],
            "TARGET",
            this.line_num
          )
        );
      }
      const tokenised_result_array = [];
      for (let j = 0; j < result_length_match.length; j++) {
        tokenised_result_array.push(
          this.nesca_grammar_stream.main_parser(
            result_length_match[j],
            "RESULT",
            this.line_num
          )
        );
      }
      const chance = transform_pending[i].chance;
      const new_conditions = [];
      const new_exceptions = [];
      for (let j = 0; j < transform_pending[i].conditions.length; j++) {
        let my_condition = transform_pending[i].conditions[j];
        my_condition = this.categories_into_transform(my_condition);
        my_condition = this.features_into_transform(my_condition);
        if (!this.valid_transform_brackets(my_condition)) {
          this.logger.validation_error(
            `Invalid brackets in condition "${my_condition}"`,
            this.line_num
          );
        }
        if (!this.valid_environment(my_condition)) {
          this.logger.validation_error(
            `Found separators outside sets in condition "${my_condition}"`,
            this.line_num
          );
        }
        const alt_opt_condition = this.resolve_alt_opt(my_condition);
        for (let k = 0; k < alt_opt_condition[0].length; k++) {
          const [before_str, after_str] = this.environment_helper(
            alt_opt_condition[0][k]
          );
          const before = this.nesca_grammar_stream.main_parser(
            before_str,
            "BEFORE",
            this.line_num
          );
          const after = this.nesca_grammar_stream.main_parser(
            after_str,
            "AFTER",
            this.line_num
          );
          new_conditions.push({
            before,
            after
          });
        }
      }
      for (let j = 0; j < transform_pending[i].exceptions.length; j++) {
        let my_exception = transform_pending[i].exceptions[j];
        my_exception = this.categories_into_transform(my_exception);
        my_exception = this.features_into_transform(my_exception);
        if (!this.valid_transform_brackets(my_exception)) {
          this.logger.validation_error(
            `Invalid brackets in exception "${my_exception}"`,
            this.line_num
          );
        }
        if (!this.valid_environment(my_exception)) {
          this.logger.validation_error(
            `Found separators outside sets in condition "${my_exception}"`,
            this.line_num
          );
        }
        const alt_opt_exception = this.resolve_alt_opt(my_exception);
        for (let k = 0; k < alt_opt_exception[0].length; k++) {
          const [before_str, after_str] = this.environment_helper(
            alt_opt_exception[0][k]
          );
          const before = this.nesca_grammar_stream.main_parser(
            before_str,
            "BEFORE",
            this.line_num
          );
          const after = this.nesca_grammar_stream.main_parser(
            after_str,
            "AFTER",
            this.line_num
          );
          new_exceptions.push({
            before,
            after
          });
        }
      }
      output_transforms.push({
        t_type: transform_pending[i].t_type,
        target: tokenised_target_array,
        result: tokenised_result_array,
        conditions: new_conditions,
        exceptions: new_exceptions,
        chance,
        line_num: this.line_num
      });
    }
    return output_transforms;
  }
  environment_helper(input) {
    const [left = "", right = ""] = input.split("_", 2);
    return [left.trim(), right.trim()];
  }
  // 🧱 Internal: Split input into top-level chunks
  split_top_level(str) {
    const chunks = [];
    let depth = 0;
    let buffer = "";
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "[" || char === "(" || char === "{") depth++;
      else if (char === "]" || char === ")" || char === "}") depth--;
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
  check_grammar_rules(str) {
    const stack = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "{" || char === "(") {
        if (stack.length >= 1) {
          this.logger.validation_error(
            "Nested alternator / optionalator not allowed",
            this.line_num
          );
        }
        stack.push({ char, index: i });
      }
      if (char === "}" || char === ")") {
        if (stack.length === 0) {
          this.logger.validation_error(
            "Mismatched closing bracket",
            this.line_num
          );
        }
        const { char: open_char, index: open_index } = stack.pop();
        const is_matching = open_char === "{" && char === "}" || open_char === "(" && char === ")";
        if (!is_matching) {
          this.logger.validation_error(
            "Mismatched bracket types",
            this.line_num
          );
        }
        const inner = str.slice(open_index + 1, i).trim();
        if (!/[^\s,]/.test(inner)) {
          this.logger.validation_error(
            "Alternator / optionalator must not be empty",
            this.line_num
          );
        }
        const before = str.slice(0, open_index).trim();
        const after = str.slice(i + 1).trim();
        const has_outside_content = /[^\s,]/.test(before) || /[^\s,]/.test(after);
        if (!has_outside_content && char === ")") {
          this.logger.validation_error(
            "Optionalator must be part of a larger sequence",
            this.line_num
          );
        }
      }
    }
    if (stack.length !== 0) {
      this.logger.validation_error("Unclosed bracket", this.line_num);
    }
  }
  expand_chunk(chunk) {
    this.check_grammar_rules(chunk);
    const regex = /([^{(})]+)|(\{[^}]+\})|(\([^)]+\))/g;
    const parts = [...chunk.matchAll(regex)].map((m) => m[0]);
    const expansions = parts.map((part) => {
      if (part.startsWith("{")) {
        return part.slice(1, -1).split(/[\s,]+/);
      }
      if (part.startsWith("(")) {
        const vals = part.slice(1, -1).split(/[\s,]+/);
        return ["", ...vals];
      }
      return [part];
    });
    return expansions.reduce(
      (acc, curr) => {
        const combo = [];
        for (const a of acc) {
          for (const c of curr) {
            combo.push(a + c);
          }
        }
        return combo;
      },
      [""]
    );
  }
  resolve_alt_opt(input) {
    const chunks = this.split_top_level(input);
    return chunks.map((chunk) => this.expand_chunk(chunk));
  }
  getTransformLengths(target, result) {
    if (result.length === 1 && target.length > 1) {
      result = Array(target.length).fill(result[0]);
    }
    if (result.length !== target.length) {
      this.logger.validation_error(
        `Concurrent change length mismatch: target has ${target.length}, result has ${result.length}`,
        this.line_num
      );
    }
    return result.map((resItem, i) => {
      const target_item = target[i];
      if (resItem.length === 1 && target_item.length > 1) {
        resItem = Array(target_item.length).fill(resItem[0]);
      }
      if (resItem.length !== target_item.length) {
        this.logger.validation_error(
          `Alternator / optionalator length mismatch at index ${i}: target has ${target_item.length}, result has ${resItem.length}`,
          this.line_num
        );
      }
      return resItem;
    });
  }
  categories_into_transform(input) {
    let output = "";
    const length = input.length;
    for (let i = 0; i < length; i++) {
      const char = input[i];
      if (char === "<" && /^[A-Z]$/.test(input[i + 1])) {
        output += char + input[i + 1];
        i += 1;
        continue;
      }
      if (this.categories.has(char)) {
        const entry = this.categories.get(char);
        const expanded = entry.filter((g) => !g.includes("^")).join(", ");
        const isParenWrapped = this.check_bracket_context(
          input,
          i,
          i,
          "category"
        );
        if (isParenWrapped) {
          output += `${expanded}`;
          continue;
        }
        output += `{${expanded}}`;
        continue;
      }
      output += char;
    }
    return output;
  }
  features_into_transform(stream) {
    const length = stream.length;
    const output = [];
    let feature_mode = false;
    let feature_matrix = "";
    let sq_start_index = 0;
    for (let i = 0; i < length; i++) {
      const char = stream[i];
      if (feature_mode) {
        if (char === "]") {
          feature_mode = false;
          if (feature_matrix.length !== 0) {
            const resolved = this.get_graphemes_from_matrix(feature_matrix);
            const isParenWrapped = this.check_bracket_context(
              stream,
              sq_start_index,
              i,
              "feature"
            );
            if (isParenWrapped) {
              output.push(`${resolved}`);
              continue;
            }
            output.push(`{${resolved}}`);
            continue;
          }
          feature_matrix = "";
          continue;
        }
        feature_matrix += char;
        continue;
      }
      if (char === "[") {
        sq_start_index = i;
        const next = stream[i + 1];
        if (next === "+" || next === "-") {
          feature_mode = true;
          continue;
        }
      }
      output.push(char);
    }
    if (feature_mode) {
      this.logger.validation_error(
        "Unclosed feature-matrix missing ']'",
        this.line_num
      );
    }
    return output.join("");
  }
  check_bracket_context(stream, start, end, mode) {
    const length = stream.length;
    const stack = [];
    for (let i = 0; i < length; i++) {
      const ch = stream[i];
      if (ch === "(" || ch === "{") {
        stack.push({ kind: ch, index: i });
      } else if (ch === ")" || ch === "}") {
        stack.pop();
      }
      if (i === start) break;
    }
    const inside = stack.at(-1);
    if (!inside) return false;
    const open = inside.index;
    const close = this.find_matching_bracket(stream, open);
    const tokenStart = start;
    const tokenEnd = end;
    const left = tokenStart - 1;
    const right = tokenEnd + 1;
    const leftIsBoundary = left <= open || stream[left] === "," || stream[left] === " ";
    const rightIsBoundary = right >= close || stream[right] === "," || stream[right] === " ";
    if (!leftIsBoundary || !rightIsBoundary) {
      this.logger.validation_error(
        `A ${mode} is adjacent to other content inside a set`,
        this.line_num
      );
    }
    return true;
  }
  find_matching_bracket(stream, openIndex) {
    const open = stream[openIndex];
    const close = open === "(" ? ")" : open === "{" ? "}" : "";
    let depth = 0;
    for (let i = openIndex; i < stream.length; i++) {
      if (stream[i] === open) depth++;
      else if (stream[i] === close) depth--;
      if (depth === 0) return i;
    }
    return -1;
  }
  get_graphemes_from_matrix(feature_matrix) {
    const keys = feature_matrix.split(",").map((k) => k.trim());
    const grapheme_sets = [];
    for (const key of keys) {
      const entry = this.features.get(key);
      if (!entry) {
        this.logger.validation_error(
          `Unknown feature '${key}'`,
          this.line_num
        );
      }
      grapheme_sets.push(entry.graphemes);
    }
    if (grapheme_sets.length === 0) return "";
    const intersection = grapheme_sets.slice(1).reduce(
      (acc, set) => acc.filter((g) => set.includes(g)),
      grapheme_sets[0]
    );
    return intersection.join(", ");
  }
  normaliseTransformLength(target, result) {
    if (result.length === 1 && target.length > 1) {
      result = Array(target.length).fill(result[0]);
    }
    if (result.length !== target.length) {
      this.logger.validation_error(
        `Concurrent change length mismatch: target has ${target.length}, result has ${result.length}`,
        this.line_num
      );
    }
    result = result.map((resItem, i) => {
      const target_item = target[i];
      if (resItem.length === 1 && target_item.length > 1) {
        resItem = Array(target_item.length).fill(resItem[0]);
      }
      if (resItem.length !== target_item.length) {
        this.logger.validation_error(
          `An alternator / optionalator length mismatch occured: target has ${target_item.length}, result has ${resItem.length}`,
          this.line_num
        );
      }
      return resItem;
    });
    const target_array = target;
    const result_array = result;
    return { target_array, result_array };
  }
  valid_transform_brackets(str) {
    const stack = [];
    const bracket_pairs = {
      ")": "(",
      "}": "{",
      "]": "["
    };
    for (const char of str) {
      if (Object.values(bracket_pairs).includes(char)) {
        stack.push(char);
      } else if (Object.keys(bracket_pairs).includes(char)) {
        if (stack.length === 0 || stack.pop() !== bracket_pairs[char]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  }
  valid_environment(input) {
    let depth = 0;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if ("{(".includes(ch)) depth++;
      else if ("})".includes(ch)) depth--;
      if (depth === 0) {
        if (ch === " ") {
          const prev = input[i - 1];
          const next = input[i + 1];
          const allowedAroundUnderscore = prev === "_" || next === "_";
          if (!allowedAroundUnderscore) {
            return false;
          }
        }
        if (ch === ",") {
          return false;
        }
      }
    }
    return true;
  }
  valid_cat_fea(stream) {
    const out = [];
    const stack = [];
    const length = stream.length;
    let sq_mode = false;
    let sq_content = "";
    let sq_start_index = 0;
    for (let i = 0; i < length; i++) {
      const ch = stream[i];
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
      if (!sq_mode && ch === "[") {
        sq_mode = true;
        sq_content = "";
        sq_start_index = i;
        continue;
      }
      if (sq_mode) {
        if (ch === "]") {
          sq_mode = false;
          const inside = stack.at(-1);
          if (inside === "(" || inside === "{") {
            const prev = stream[sq_start_index - 1];
            const next = stream[i + 1];
            const looks_like_paren_wrapper = inside === "(" && prev === "(" && next === ")";
            if (!looks_like_paren_wrapper) {
              this.logger.validation_error(
                `Square bracket set "[${sq_content}]" is not allowed inside ${inside}`,
                this.line_num
              );
            }
            out.push(sq_content);
            continue;
          }
          out.push(`{${sq_content}}`);
          continue;
        }
        sq_content += ch;
        continue;
      }
      out.push(ch);
    }
    if (sq_mode) {
      this.logger.validation_error(
        "Unclosed square bracket set",
        this.line_num
      );
    }
    return out.join("");
  }
  format_tokens(seq) {
    return seq.map((t) => {
      let s = t.base;
      if (t.type === "anythings-mark") {
        if ("consume" in t && t.consume) {
          const groups = t.consume.map((group) => group.join("")).join(", ");
          s += `[${groups}]`;
        }
        if ("blocked_by" in t && t.blocked_by) {
          const groups = t.blocked_by.map((group) => group.join("")).join(", ");
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
    }).join(" ");
  }
  get_cluser_field_graphemes(input, mode) {
    const streams = input.split(/[,]+/).filter(Boolean);
    const tokenised_array = [];
    for (let j = 0; j < streams.length; j++) {
      const stream = streams[j].trim();
      const tokens = this.nesca_grammar_stream.cluster_parser(
        stream,
        mode,
        this.line_num
      );
      tokenised_array.push(tokens);
    }
    return tokenised_array;
  }
  show_debug() {
    const format_stages = [];
    for (const stage of this.stages) {
      const format_transforms = [];
      const my_transforms = stage.transforms;
      for (let i = 0; i < my_transforms.length; i++) {
        const my_transform = my_transforms[i];
        if (my_transform.t_type != "rule" && my_transform.t_type != "cluster-field") {
          format_transforms.push(
            `  <routine = ${my_transform.t_type}> @ ln:${my_transform.line_num + 1}`
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
        const chance = my_transform.chance ? ` CHANCE ${my_transform.chance}` : "";
        let exceptions = "";
        for (let j = 0; j < my_transform.exceptions.length; j++) {
          exceptions += ` ! ${this.format_tokens(my_transform.exceptions[j].before)}_${this.format_tokens(my_transform.exceptions[j].after)}`;
        }
        let conditions = "";
        for (let j = 0; j < my_transform.conditions.length; j++) {
          conditions += ` / ${this.format_tokens(my_transform.conditions[j].before)}_${this.format_tokens(my_transform.conditions[j].after)}`;
        }
        format_transforms.push(
          `  ${my_target.join(", ")} \u2192 ${my_result.join(", ")}${conditions}${exceptions}${chance} @ ln:${my_transform.line_num + 1}`
        );
      }
      format_stages.push({
        transforms: format_transforms,
        name: stage.name
      });
    }
    const features = [];
    for (const [key, value] of this.features) {
      features.push(`  ${key} = ${value.graphemes.join(", ")}`);
    }
    const parts = [];
    for (const entry of this.nesca_grammar_stream.associateme_mapper) {
      const variantStrings = entry.variants.map(
        (group) => `{${group.join(",")}}`
      );
      const chain = "  " + variantStrings.join("<");
      parts.push(chain);
    }
    const associatemes = parts.join("\n");
    const info = `Graphemes: ` + this.nesca_grammar_stream.graphemes.join(", ") + `
Syllable Boundaries: ` + this.syllable_boundaries.join(", ") + `
Associatemes: 
` + associatemes + `
Features {
` + features.join("\n") + `
}
` + format_stages.map(
      (stage) => `stage "${stage.name}" {
  ` + stage.transforms.join("\n  ")
    ).join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
};
var transform_resolver_default = Transform_Resolver;

// src/resolvers/nesca_grammar_stream.ts
var Nesca_Grammar_Stream = class {
  logger;
  graphemes;
  associateme_mapper;
  escape_mapper;
  constructor(logger, graphemes, associateme_mapper, escape_mapper) {
    this.logger = logger;
    this.graphemes = graphemes;
    this.associateme_mapper = associateme_mapper;
    this.escape_mapper = escape_mapper;
  }
  main_parser(stream, mode, line_num) {
    let i = 0;
    const tokens = [];
    if (stream.startsWith("@routine")) {
      const routine = stream.slice(8);
      return [{ type: "routine", base: routine, routine }];
    } else if (stream === "^") {
      if (mode === "RESULT") {
        return [{ type: "deletion", base: "^" }];
      } else if (mode === "TARGET") {
        return [{ type: "insertion", base: "^" }];
      } else {
        this.logger.validation_error(
          `Unexpected character '${stream}' in mode '${mode}'`,
          line_num
        );
      }
    } else if (stream === "0") {
      if (mode !== "RESULT") {
        this.logger.validation_error(
          `Reject not allowed in '${mode}'`,
          line_num
        );
      }
      return [{ type: "reject", base: "0" }];
    }
    while (i < stream.length) {
      let new_token = { type: "pending", base: "", min: 1, max: 1 };
      const char = stream[i];
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      if (char === "%") {
        if (mode === "RESULT") {
          this.logger.validation_error(
            `Anythings-mark not allowed in '${mode}'`,
            line_num
          );
        }
        new_token = {
          type: "anythings-mark",
          base: "%",
          min: 1,
          max: Infinity
        };
        let look_ahead = i + 1;
        if (stream[look_ahead] !== "[") {
          this.logger.validation_error(
            `Expected '[' after '%' for anythings-mark`,
            line_num
          );
        } else {
          look_ahead++;
          let garde_stream = "";
          while (look_ahead < stream.length) {
            const next_char = stream[look_ahead];
            if (next_char === "]") break;
            garde_stream += next_char;
            look_ahead++;
          }
          if (look_ahead >= stream.length || stream[look_ahead] !== "]") {
            this.logger.validation_error(`Unclosed blocker`, line_num);
          }
          const consume = [];
          const blocked_by = [];
          const parts = garde_stream.split("|").map((part) => part.trim()).filter(Boolean);
          if (parts.length > 2) {
            throw new Error(
              "Invalid garde_stream: more than one '|' found"
            );
          }
          const [consume_part, blocked_part] = parts;
          if (consume_part) {
            const consume_groups = consume_part.split(",").map((group) => group.trim()).filter(Boolean);
            for (const group of consume_groups) {
              const graphemes = graphemosis(group, this.graphemes).map((g) => this.escape_mapper.restore_escaped_chars(g)).filter(Boolean);
              if (graphemes.length > 0) {
                consume.push(graphemes);
              }
            }
          }
          if (blocked_part) {
            const blocked_groups = blocked_part.split(",").map((group) => group.trim()).filter(Boolean);
            for (const group of blocked_groups) {
              const graphemes = graphemosis(group, this.graphemes).map((g) => this.escape_mapper.restore_escaped_chars(g)).filter(Boolean);
              if (graphemes.length > 0) {
                blocked_by.push(graphemes);
              }
            }
          }
          if (consume.length !== 0) {
            new_token.consume = consume;
          }
          if (blocked_by.length !== 0) {
            new_token.blocked_by = blocked_by;
          }
          look_ahead++;
          i = look_ahead;
        }
      } else if (char === "*") {
        if (mode == "RESULT") {
          this.logger.validation_error(
            `Wildcard not allowed in '${mode}'`,
            line_num
          );
        }
        new_token = { type: "wildcard", base: "*", min: 1, max: 1 };
        i++;
      } else if (char == "#") {
        if (mode !== "BEFORE" && mode !== "AFTER") {
          this.logger.validation_error(
            `Word-boundary not allowed in '${mode}'`,
            line_num
          );
        }
        if (i !== 0 && i + 1 !== stream.length) {
          this.logger.validation_error(
            `Hash must be at the start or end of '${mode}'`,
            line_num
          );
        }
        new_token = { type: "word-boundary", base: "#", min: 1, max: 1 };
        tokens.push(new_token);
        i++;
        continue;
      } else if (char == "$") {
        if (mode !== "BEFORE" && mode !== "AFTER") {
          this.logger.validation_error(
            `Syllable-boundary not allowed in '${mode}'`,
            line_num
          );
        }
        new_token = {
          type: "syllable-boundary",
          base: "$",
          min: 1,
          max: 1
        };
        tokens.push(new_token);
        i++;
        continue;
      } else if (char == "&") {
        const look_ahead = i + 1;
        if (stream[look_ahead] === "T") {
          if (mode === "TARGET") {
            this.logger.validation_error(
              `Target-mark not allowed in '${mode}'`,
              line_num
            );
          }
          new_token = { type: "target-mark", base: "&T", min: 1, max: 1 };
          i = look_ahead;
        } else if (stream[look_ahead] === "M") {
          if (mode === "TARGET") {
            this.logger.validation_error(
              `Metathesis-mark not allowed in '${mode}'`,
              line_num
            );
          }
          new_token = {
            type: "metathesis-mark",
            base: "&M",
            min: 1,
            max: 1
          };
          i = look_ahead;
        } else if (stream[look_ahead] === "E") {
          if (mode !== "TARGET") {
            this.logger.validation_error(
              `Empty-mark only allowed in 'TARGET'`,
              line_num
            );
          }
          new_token = { type: "empty-mark", base: "&E", min: 1, max: 1 };
          i = look_ahead;
        } else if (stream[look_ahead] === "=") {
          new_token = {
            type: "reference-start-capture",
            base: "&=",
            min: 1,
            max: 1
          };
          i = look_ahead + 1;
          tokens.push(new_token);
          continue;
        } else {
          this.logger.validation_error(
            `A 'T', 'M' or '=' did not follow '&' in '${mode}'`,
            line_num
          );
        }
        i++;
      } else if (char === "=") {
        const look_ahead = i + 1;
        const digit = stream[look_ahead];
        if (/^[1-9]$/.test(digit)) {
          new_token = {
            type: "reference-capture",
            base: `=${digit}`,
            key: digit,
            min: 1,
            max: 1
          };
          tokens.push(new_token);
          i = look_ahead + 1;
          continue;
        } else {
          this.logger.validation_error(
            `Invalid reference capture syntax in '${mode}'`,
            line_num
          );
        }
      } else if (/^[1-9]$/.test(char)) {
        if (mode === "TARGET") {
          this.logger.validation_error(
            "Reference-mark not allowed in 'TARGET'",
            line_num
          );
        }
        new_token = {
          type: "reference-mark",
          base: char,
          key: char,
          min: 1,
          max: 1
        };
        i++;
      } else if (char === "~") {
        i++;
      } else if (
        // Syntax character used wrongly
        SYNTAX_CHARS_AND_CARET.includes(char)
      ) {
        this.logger.validation_error(
          `Unexpected syntax character '${char}' in ${mode}`,
          line_num
        );
      } else {
        const escaped_stream = this.escape_mapper.restore_escaped_chars(stream);
        let is_escaped = false;
        if (escaped_stream[i] !== stream[i]) {
          is_escaped = true;
        }
        let matched = false;
        for (const g of this.graphemes.sort(
          (a, b) => b.length - a.length
        )) {
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
            max: 1
          };
          i++;
        }
        if (is_escaped && new_token.type === "grapheme") {
          new_token.escaped = true;
        }
      }
      if (stream[i] === ":") {
        new_token.min = 2;
        new_token.max = 2;
        i++;
      } else if (stream[i] === "+") {
        if (mode === "RESULT") {
          this.logger.validation_error(
            `Quantifier not allowed in '${mode}'`,
            line_num
          );
        }
        new_token.min = 1;
        new_token.max = Infinity;
        i++;
      } else if (stream[i] === "?") {
        let look_ahead = i + 1;
        if (stream[look_ahead] !== "[") {
          this.logger.validation_error(
            `Expected '[' after '?' for quantifier`,
            line_num
          );
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
                line_num
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
                line_num
              );
            }
            if (maxStr !== "" && max !== null && isNaN(max)) {
              this.logger.validation_error(
                `Invalid max value: "${maxStr}"`,
                line_num
              );
            }
            if (max === Infinity && mode === "RESULT") {
              this.logger.validation_error(
                `In '${mode}', '${new_token.base}' cannot be reproduced an infinite amount of times`,
                line_num
              );
            }
            new_token.min = min;
            new_token.max = max;
          } else {
            this.logger.validation_error(
              `Invalid quantifier format: "${quantifier}"`,
              line_num
            );
          }
          i = look_ahead + 1;
        }
        if (new_token.max != Infinity) {
          if (new_token.min > new_token.max) {
            this.logger.validation_error(
              `Invalid quantifier: min '${new_token.min}' cannot be greater than max '${new_token.max}'`,
              line_num
            );
          }
        }
      }
      if (stream[i] === "~") {
        if (new_token.type !== "grapheme") {
          this.logger.validation_error(
            `Based-mark only allowed after grapheme token`,
            line_num
          );
        }
        const location = this.find_base_location(
          this.associateme_mapper,
          new_token.base
        );
        if (!location) {
          this.logger.validation_error(
            `Grapheme "${new_token.base}" with a based-mark was not an associateme base`,
            line_num
          );
        }
        const [entry_id, base_id] = location;
        new_token.association = {
          entry_id,
          base_id,
          variant_id: 0,
          // Placeholder; to be filled during generation
          is_target: mode === "TARGET"
        };
        i++;
      }
      if (new_token.type !== "pending") {
        tokens.push(new_token);
      }
    }
    return tokens;
  }
  cluster_parser(stream, mode, line_num) {
    let i = 0;
    const tokens = [];
    if (stream === "^") {
      if (mode === "RESULT") {
        return [{ type: "deletion", base: "^" }];
      } else {
        this.logger.validation_error(
          `Unexpected character '${stream}' in mode '${mode}'`,
          line_num
        );
      }
    } else if (stream === "0") {
      if (mode !== "RESULT") {
        this.logger.validation_error(
          `Reject not allowed in '${mode}'`,
          line_num
        );
      }
      return [{ type: "reject", base: "0" }];
    }
    while (i < stream.length) {
      let new_token = { type: "pending", base: "", min: 1, max: 1 };
      const char = stream[i];
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      if (char === "^" || char === "0") {
        this.logger.validation_error(
          `Unexpected character '${char}' in cluster-field`,
          line_num
        );
      }
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
          max: 1
        };
        i++;
      }
      if (is_escaped && new_token.type === "grapheme") {
        new_token.escaped = true;
      }
      if (new_token.type !== "pending") {
        tokens.push(new_token);
      }
    }
    return tokens;
  }
  find_base_location(mapper, grapheme) {
    for (let entry_id = 0; entry_id < mapper.length; entry_id++) {
      const entry = mapper[entry_id];
      for (let base_id = 0; base_id < entry.bases.length; base_id++) {
        if (entry.bases[base_id] === grapheme) {
          return [entry_id, base_id];
        }
      }
    }
    return null;
  }
};
var nesca_grammar_stream_default = Nesca_Grammar_Stream;

// src/resolvers/trans_category_resolver.ts
var Category_Resolver = class {
  logger;
  output_mode;
  category_pending;
  trans_categories;
  constructor(logger, output_mode, category_pending) {
    this.logger = logger;
    this.output_mode = output_mode;
    this.category_pending = category_pending;
    this.trans_categories = /* @__PURE__ */ new Map();
    this.resolve_categories();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  resolve_categories() {
    for (const [key, value] of this.category_pending.entries()) {
      const expanded_content = recursive_expansion(
        value.content,
        this.category_pending
      );
      this.category_pending.set(key, {
        content: expanded_content,
        line_num: value.line_num
        // Preserve original line_num
      });
    }
    for (const [key, value] of this.category_pending) {
      const new_category_field = value.content.split(/[,\s]+/).filter(Boolean);
      this.trans_categories.set(key, new_category_field);
    }
  }
  show_debug() {
    const categories = [];
    for (const [key, value] of this.trans_categories) {
      const cat_field = [];
      for (let i = 0; i < value.length; i++) {
        cat_field.push(`${value[i]}`);
      }
      const category_field = `${cat_field.join(", ")}`;
      categories.push(`  ${key} = ${category_field}`);
    }
    const info = `~ CATEGORIES ~

Categories {
` + categories.join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
};
var trans_category_resolver_default = Category_Resolver;

// src/resolvers/feature_resolver.ts
var Feature_Resolver = class {
  logger;
  escape_mapper;
  output_mode;
  feature_pending;
  features;
  graphemes;
  constructor(logger, output_mode, escape_mapper, feature_pending, graphemes) {
    this.logger = logger;
    this.output_mode = output_mode;
    this.escape_mapper = escape_mapper;
    this.graphemes = graphemes;
    this.feature_pending = feature_pending;
    this.features = /* @__PURE__ */ new Map();
    this.resolve_features();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  resolve_features() {
    for (const [key, value] of this.feature_pending) {
      if (key.startsWith(">")) {
        this.feature_pending.delete(key);
        const to_delete = value.content.split(",").map((str) => "^" + str);
        const anti_graphemes = to_delete.join(",") + this.graphemes.join(",");
        this.feature_pending.set(key.replace(">", "-"), {
          content: anti_graphemes,
          line_num: value.line_num
        });
        this.feature_pending.set(key.replace(">", "+"), {
          content: value.content,
          line_num: value.line_num
        });
      }
    }
    for (const [key, value] of this.feature_pending) {
      const expanded_content = recursive_expansion(
        value.content,
        this.feature_pending
      );
      this.feature_pending.set(key, {
        content: expanded_content,
        line_num: value.line_num
        // Preserve original line_num
      });
    }
    for (const [key, value] of this.feature_pending) {
      const unique_graphemes = Array.from(new Set(value.content.split(",")));
      const filtered_graphemes = [];
      const graphemes_to_remove = [];
      for (const item of unique_graphemes) {
        if (item.startsWith("^")) {
          const modified = item.slice(1);
          graphemes_to_remove.push(modified);
          continue;
        }
        if (item.includes("^")) {
          this.logger.validation_error(
            `Invalid grapheme '${item}' has a misplaced caret`,
            value.line_num
          );
        }
        if (item.startsWith("+") || item.startsWith("-") || item.startsWith(">")) {
          this.logger.validation_error(
            `Referenced feature '${item}' not found`,
            value.line_num
          );
        }
        filtered_graphemes.push(item);
      }
      const x_filtered = filtered_graphemes.filter(
        (item) => !graphemes_to_remove.includes(item)
      );
      if (x_filtered.length === 0) {
        this.logger.validation_error(
          `Feature '${key}' had zero graphemes`,
          value.line_num
        );
      }
      for (let i = 0; i < x_filtered.length; i++) {
        x_filtered[i] = this.escape_mapper.escape_special_chars(
          x_filtered[i]
        );
      }
      this.features.set(key, { graphemes: x_filtered });
    }
  }
  show_debug() {
    const features = [];
    for (const [key, value] of this.features) {
      features.push(`  ${key} = ${value.graphemes.join(", ")}`);
    }
    const info = `Features {
` + features.join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
};
var feature_resolver_default = Feature_Resolver;

// src/resolvers/canon_graphemes_resolver.ts
var Canon_Graphemes_Resolver = class {
  logger;
  escape_mapper;
  graphemes_pending;
  graphemes;
  associateme_mapper;
  constructor(logger, escape_mapper, graphemes_pending) {
    this.logger = logger;
    this.escape_mapper = escape_mapper;
    this.graphemes_pending = graphemes_pending;
    this.graphemes = [];
    this.associateme_mapper = [];
    this.resolve_canon_graphemes();
    this.resolve_associatemes();
  }
  resolve_canon_graphemes() {
    const new_graphemes = this.graphemes_pending.replace(/(<\{|\})/g, ",");
    const graphemes = new_graphemes.split(/[,\s]+/).filter(Boolean);
    for (let i = 0; i < graphemes.length; i++) {
      graphemes[i] = this.escape_mapper.restore_escaped_chars(graphemes[i]);
    }
    this.graphemes = Array.from(new Set(graphemes));
  }
  resolve_associatemes() {
    const mapper = [];
    const input = this.graphemes_pending ?? "";
    const setRegex = /\{[^}]+\}(?:\s*<\s*\{[^}]+\})*/g;
    const matches = [...input.matchAll(setRegex)];
    let scrubbed = input;
    for (const m of matches) {
      scrubbed = scrubbed.replace(m[0], "");
    }
    if (scrubbed.includes("<")) {
      this.logger.validation_error(
        `Stray "<" found outside of a valid associateme entry`
      );
    }
    for (const m of matches) {
      const segment = m[0];
      const groups = segment.split("<").map(
        (g) => g.replace(/[{}]/g, "").trim().split(/[,\s]+/).map((x) => x.trim()).filter((x) => x.length > 0)
      );
      if (groups.length === 0) {
        this.logger.validation_error(
          `A base associateme was empty in the graphemes directive`
        );
      }
      const bases = groups[0];
      if (bases.length === 0) {
        this.logger.validation_error(
          `A base associateme was empty in the graphemes directive`
        );
      }
      const expectedLen = bases.length;
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        if (g.length !== expectedLen) {
          const label = i === 0 ? "bases" : `variant ${i}`;
          this.logger.validation_error(
            `Mismatched associateme entry variant group length in "${segment}": ${label} had a length of ${g.length} -- expected length of ${expectedLen}`
          );
        }
      }
      const variants = [...groups];
      mapper.push({ bases, variants });
    }
    this.associateme_mapper = mapper;
  }
};
var canon_graphemes_resolver_default = Canon_Graphemes_Resolver;

// src/word_bank.ts
var Word_Bank = class {
  logger;
  lettercase_mapper;
  build_start;
  words;
  input_divider;
  output_divider;
  num_of_rejects = 0;
  num_of_transformed = 0;
  num_of_passed = 0;
  output_mode;
  sort_words;
  alphabet;
  invisible;
  constructor(logger, lettercase_mapper2, build_start, input_words, input_divider, output_mode, output_divider, sort_words, alphabet, invisible) {
    this.logger = logger;
    this.lettercase_mapper = lettercase_mapper2;
    this.build_start = build_start;
    this.num_of_rejects = 0;
    this.input_divider = input_divider;
    this.output_divider = output_divider;
    this.words = [];
    this.output_mode = output_mode;
    word_default.output_mode = output_mode;
    if (input_words == "") {
      this.logger.validation_error("No input words to transform");
    }
    this.sort_words = sort_words;
    this.alphabet = alphabet;
    this.invisible = invisible;
    const input_word_array = input_words.split(this.input_divider);
    for (let i = 0; i < input_word_array.length; i++) {
      if (input_word_array[i] === "") {
        continue;
      }
      const word = new word_default(null, input_word_array[i].trim());
      this.words.push(word);
    }
  }
  make_text() {
    let word_list = [];
    for (let i = 0; i < this.words.length; i++) {
      const my_word = this.words[i];
      if (my_word.rejected) {
        this.num_of_rejects++;
        if (this.output_mode === "debug") {
          word_list.push(my_word.get_word());
        }
      } else {
        word_list.push(my_word.get_word());
        if (my_word.num_of_transformations > 0) {
          this.num_of_transformed++;
        } else {
          this.num_of_passed++;
        }
      }
    }
    this.create_record();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
    if (this.sort_words) {
      word_list = collator_default(
        this.logger,
        word_list,
        this.alphabet,
        this.invisible
      );
    }
    if (this.output_mode === "paragraph") {
      const paragraph_words = [];
      let capitalize_next = true;
      for (let i = 0; i < word_list.length; i++) {
        let word = word_list[i];
        if (capitalize_next) {
          word = this.lettercase_mapper.capitalise(word);
          capitalize_next = false;
        }
        paragraph_words.push(word);
        const last_char = word.charAt(word.length - 1);
        if ([".", "!", "?"].includes(last_char)) {
          capitalize_next = true;
        }
      }
      return paragraph_words.join(" ");
    }
    return word_list.join(this.output_divider);
  }
  create_record() {
    const ms = Date.now() - this.build_start;
    const seconds = Math.ceil(ms / 100) / 10;
    const s = seconds.toFixed(seconds % 1 === 0 ? 0 : 1);
    const display = s === "1" ? `${s} second` : `${s} seconds`;
    const records = [];
    if (this.num_of_transformed == 1) {
      records.push(`1 word had transformations`);
    } else if (this.num_of_transformed > 1) {
      records.push(`${this.num_of_transformed} words had transformations`);
    }
    if (this.num_of_passed == 1) {
      records.push(`1 word unchanged`);
    } else if (this.words.length > 1) {
      records.push(`${this.num_of_passed} words unchanged`);
    }
    if (this.num_of_rejects == 1) {
      records.push(`1 word was rejected`);
    } else if (this.num_of_rejects > 1) {
      records.push(`${this.num_of_rejects} words rejected`);
    }
    this.logger.info(`${final_sentence(records)} -- in ${display}`);
  }
  show_debug() {
    const info = `~ CREATING TEXT ~

Num of words: ` + this.words.length + `
Mode: ` + this.output_mode;
    this.logger.diagnostic(info);
  }
};
var word_bank_default = Word_Bank;

// src/main.ts
function nesca({
  file,
  input_words,
  output_mode = "word-list",
  input_divider = "\n",
  output_divider = "\n",
  sort_words = true
}) {
  const logger = new logger_default();
  try {
    const build_start = Date.now();
    const escape_mapper = new escape_mapper_default();
    const lettercase_mapper2 = new lettercase_mapper_default();
    const p = new parser_default(
      logger,
      "nesca",
      escape_mapper,
      lettercase_mapper2,
      1,
      //numwords
      output_mode,
      sort_words,
      false,
      // remove duplicates
      false,
      // force word limit
      input_divider,
      output_divider
    );
    p.parse_file(file);
    const category_resolver = new trans_category_resolver_default(
      logger,
      p.output_mode,
      p.category_pending
    );
    const canon_graphemes_resolver = new canon_graphemes_resolver_default(
      logger,
      escape_mapper,
      p.graphemes_pending
    );
    const feature_resolver = new feature_resolver_default(
      logger,
      p.output_mode,
      escape_mapper,
      p.feature_pending,
      canon_graphemes_resolver.graphemes
    );
    const nesca_grammar_stream = new nesca_grammar_stream_default(
      logger,
      canon_graphemes_resolver.graphemes,
      canon_graphemes_resolver.associateme_mapper,
      escape_mapper
    );
    const transform_resolver = new transform_resolver_default(
      logger,
      p.output_mode,
      nesca_grammar_stream,
      category_resolver.trans_categories,
      p.stages_pending,
      p.substages_pending,
      feature_resolver.features,
      p.syllable_boundaries
    );
    const transformer = new transformer_default(
      logger,
      canon_graphemes_resolver.graphemes,
      p.lettercase_mapper,
      transform_resolver.syllable_boundaries,
      transform_resolver.stages,
      transform_resolver.substages,
      p.output_mode,
      canon_graphemes_resolver.associateme_mapper
    );
    const b = new word_bank_default(
      logger,
      p.lettercase_mapper,
      build_start,
      input_words,
      p.input_divider,
      p.output_mode,
      p.output_divider,
      p.sort_words,
      p.alphabet,
      p.invisible
    );
    for (let i = 0; i < b.words.length; i++) {
      b.words[i] = transformer.do_stages(b.words[i]);
    }
    logger.set_payload(b.make_text());
  } catch (e) {
    if (!(e instanceof logger.Validation_Error)) {
      logger.uncaught_error(e);
    }
  }
  return logger.create_log();
}

// src/utils/version.ts
var VERSION = "1.0.2";

// bin/nesca/index.ts
var encodings = [
  "ascii",
  "binary",
  "latin1",
  "ucs-2",
  "ucs2",
  "utf-8",
  "utf16le",
  "utf8"
];
var argv = yargs(hideBin(process.argv)).usage("Usage: $0 <path> [options]").alias({ help: "?", version: "v" }).option("output_mode", {
  alias: "m",
  describe: "Output mode",
  choices: ["word-list", "debug", "old-to-new"],
  default: "word-list"
}).option("sort_words", {
  alias: "s",
  describe: "Sort generated words",
  type: "boolean",
  default: true
}).option("input_words", {
  alias: "iw",
  describe: "Input words to transform",
  type: "string",
  default: ""
}).option("input_divider", {
  alias: "id",
  describe: "Divider between words",
  type: "string",
  default: " "
}).option("output_divider", {
  alias: "od",
  describe: "Divider between words",
  type: "string",
  default: " "
}).option("encoding", {
  alias: "e",
  choices: encodings,
  describe: "What file encoding to use",
  default: "utf8",
  requiresArg: true,
  coerce: (enc) => {
    const littleEnc = enc.toLowerCase();
    if (littleEnc === "utf-16le") {
      return "utf16le";
    } else if (!encodings.includes(littleEnc)) {
      let errorString = `Invalid values:
  Argument: encoding, Given: "${enc}", Choices: `;
      for (let i = 0; i < encodings.length; ++i) {
        if (i !== 0) {
          errorString += ", ";
        }
        errorString += `"${encodings[i]}"`;
      }
      throw new Error(errorString);
    }
    return littleEnc;
  }
}).check((argv2) => {
  return true;
}).parseSync();
var filePath = argv._[0];
if (!filePath) {
  console.error("Error: No file path provided.");
  process.exitCode = 1;
  process.exit();
}
var file_text = fs.readFileSync(filePath, argv.encoding);
try {
  console.log(`Transforming words with Nesca version ${VERSION}...`);
  const run = nesca({
    file: file_text,
    input_words: argv.input_words,
    output_mode: argv.output_mode,
    input_divider: argv.input_divider,
    output_divider: argv.output_divider,
    sort_words: argv.sort_words
  });
  for (const warning of run.warnings) {
    console.warn(warning);
  }
  for (const error of run.errors) {
    console.error(error);
  }
  for (const info of run.infos) {
    console.info(info);
  }
  if (run.payload.length === 0) {
    console.log(
      run.payload
    );
  }
} catch {
  process.exitCode = 1;
  console.error(`Error: Could not find file '${argv._[0]}'.`);
}
