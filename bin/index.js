#!/usr/bin/env node

// bin/index.ts
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
function capitalise(str) {
  return str[0].toUpperCase() + str.slice(1);
}
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
  const mapping_keys = [...mappings.keys()].sort((a, b) => b.length - a.length);
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

// src/parser.ts
var Parser = class {
  logger;
  escape_mapper;
  supra_builder;
  num_of_words;
  output_mode;
  remove_duplicates;
  force_word_limit;
  sort_words;
  word_divider;
  directive = "none";
  category_distribution;
  category_pending;
  units;
  optionals_weight;
  wordshape_distribution;
  wordshape_pending;
  feature_pending;
  transform_pending;
  graphemes;
  syllable_boundaries;
  graphemes_pending = "";
  alphabet;
  invisible;
  file_line_num = 0;
  constructor(logger, escape_mapper, supra_builder, num_of_words_string, output_mode, sort_words, remove_duplicates, force_word_limit, word_divider) {
    this.logger = logger;
    this.escape_mapper = escape_mapper;
    this.supra_builder = supra_builder;
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
    this.word_divider = word_divider === "" ? " " : word_divider;
    this.word_divider = this.word_divider.replace(
      new RegExp("\\\\n", "g"),
      "\n"
    );
    if (this.output_mode === "paragraph") {
      this.sort_words = false;
      this.remove_duplicates = false;
      this.force_word_limit = false;
      this.word_divider = " ";
    } else if (this.output_mode === "debug") {
      this.sort_words = false;
      this.remove_duplicates = false;
      this.force_word_limit = false;
      this.word_divider = "\n";
    }
    this.category_distribution = "gusein-zade";
    this.category_pending = /* @__PURE__ */ new Map();
    this.optionals_weight = 10;
    this.units = /* @__PURE__ */ new Map();
    this.wordshape_distribution = "zipfian";
    this.wordshape_pending = { content: "", line_num: 0 };
    this.transform_pending = [];
    this.feature_pending = /* @__PURE__ */ new Map();
    this.alphabet = [];
    this.invisible = [];
    this.graphemes_pending = "";
    this.graphemes = [];
    this.syllable_boundaries = [];
  }
  parse_file(file) {
    const file_array = file.split("\n");
    let my_decorator = "none";
    let my_directive = "none";
    let my_subdirective = "none";
    let my_header = [];
    let my_clusterfield_transform = [];
    for (; this.file_line_num < file_array.length; ++this.file_line_num) {
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
            this.transform_pending.push(...my_clusterfield_transform);
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
          const my_routine = this.parse_routine(line);
          this.transform_pending.push({
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
          const [target, result, conditions, exceptions] = this.get_transform(line);
          this.transform_pending.push({
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
    if (dotCount !== 1 || eqCount !== 1) {
      this.logger.validation_error(
        `Invalid decorator format`,
        this.file_line_num
      );
    }
    const [my_directive, my_thing] = line.split(/\.(.+)/).filter(Boolean);
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
        this.wordshape_distribution = this.parse_distribution(my_value);
        new_decorator = "categories";
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
  transformations;
  forms;
  rejected;
  line_nums;
  constructor(first_form, second_form) {
    this.transformations = [first_form];
    this.forms = [second_form];
    this.rejected = false;
    this.line_nums = [""];
  }
  get_last_form() {
    const output = get_last(this.forms);
    if (output == void 0) {
      return "undefined";
    }
    return output;
  }
  get_word() {
    let output = "";
    if (_Word.output_mode == "debug") {
      for (let i = 0; i < this.forms.length; i++) {
        if (i == 0) {
          output += `${this.transformations[i]} \u27A4 \u27E8${this.forms[i]}\u27E9
`;
        } else if (!this.transformations[i]) {
          output += `\u27E8${this.forms[i]}\u27E9
`;
        } else {
          output += `${this.transformations[i]} \u27A4 \u27E8${this.forms[i]}\u27E9 @ ln${this.line_nums[i]}
`;
        }
      }
      return output;
    }
    if (_Word.output_mode == "old-to-new") {
      output = `${this.forms[0]} => ${get_last(this.forms)}`;
      return output;
    }
    output = get_last(this.forms);
    if (output == void 0) {
      return "undefined";
    }
    return output;
  }
  record_transformation(rule, form, line_num = null) {
    this.transformations.push(rule);
    this.forms.push(form);
    let my_line_num = "";
    if (line_num != null) {
      my_line_num = `:${line_num + 1}`;
    }
    this.line_nums.push(my_line_num);
  }
};
var word_default = Word;

// src/utils/picker_utilities.ts
function weighted_random_pick(items, weights) {
  const total_weight = weights.reduce((acc, w) => acc + w, 0);
  let random_value = Math.random() * total_weight;
  for (let i = 0; i < items.length; i++) {
    if (random_value < weights[i]) {
      return items[i];
    }
    random_value -= weights[i];
  }
  return "";
}
function supra_weighted_random_pick(items, weights) {
  for (let i = 0; i < items.length; i++) {
    if (weights[i] === "s") {
      return items[i];
    }
  }
  const total_weight = weights.reduce(
    (sum, w) => typeof w === "number" && w > 0 ? sum + w : sum,
    0
  );
  if (total_weight === 0) return "";
  let random_value = Math.random() * total_weight;
  for (let i = 0; i < items.length; i++) {
    const w = weights[i];
    if (typeof w !== "number" || w <= 0) continue;
    if (random_value < w) return items[i];
    random_value -= w;
  }
  return "";
}
function guseinzade_distribution(no_of_items) {
  const weights = [];
  for (let i = 0; i < no_of_items; ++i) {
    weights.push(Math.log(no_of_items + 1) - Math.log(i + 1));
  }
  return weights;
}
function zipfian_distribution(no_of_items) {
  const weights = [];
  for (let i = 0; i < no_of_items; ++i) {
    weights.push(10 / Math.pow(i + 1, 0.9));
  }
  return weights;
}
function shallow_distribution(no_of_items) {
  const weights = [];
  for (let i = 0; i < no_of_items; ++i) {
    const rank = i + 1;
    const t = i / (no_of_items - 1);
    const exponent = 0.5 - t * 0.07;
    weights.push(1 / Math.pow(rank, exponent));
  }
  return weights;
}
function flat_distribution(no_of_items) {
  const weights = [];
  for (let i = 0; i < no_of_items; ++i) {
    weights.push(1);
  }
  return weights;
}
function get_distribution(n, default_distribution) {
  if (n == 1) return [1];
  if (default_distribution === "zipfian") return zipfian_distribution(n);
  if (default_distribution === "gusein-zade") return guseinzade_distribution(n);
  if (default_distribution === "shallow") return shallow_distribution(n);
  return flat_distribution(n);
}

// src/generata/word_builder.ts
var Word_Builder = class {
  //private logger: Logger;
  escape_mapper;
  supra_builder;
  categories;
  wordshapes;
  category_distribution;
  optionals_weight;
  constructor(escape_mapper, supra_builder, categories, wordshapes, category_distribution, optionals_weight, output_mode) {
    this.escape_mapper = escape_mapper;
    this.supra_builder = supra_builder;
    this.categories = categories;
    this.wordshapes = wordshapes;
    this.category_distribution = category_distribution;
    this.optionals_weight = optionals_weight;
    word_default.output_mode = output_mode;
  }
  make_word() {
    let stage_one = weighted_random_pick(
      this.wordshapes.items,
      this.wordshapes.weights
    );
    const stage_two = this.resolve_wordshape_sets(
      stage_one,
      this.category_distribution,
      this.optionals_weight
    );
    let stage_three = stage_two;
    if (this.supra_builder.id_counter != 1) {
      const [ids, weights] = this.supra_builder.extract_letters_and_weights(stage_two);
      const chosen_id = supra_weighted_random_pick(ids, weights);
      stage_three = this.supra_builder.replace_letter_and_clean(
        stage_two,
        Number(chosen_id)
      );
    }
    let stage_four = "";
    for (let i = 0; i < stage_three.length; i++) {
      let new_char = stage_three[i];
      for (const [category_key, category_field] of this.categories) {
        if (category_key == new_char) {
          new_char = weighted_random_pick(
            category_field.graphemes,
            category_field.weights
          );
          break;
        }
      }
      stage_four += new_char;
    }
    let stage_five = stage_four.replace(/\^/g, "");
    if (this.escape_mapper.counter != 0) {
      stage_one = this.escape_mapper.restore_escaped_chars(stage_one);
      stage_five = this.escape_mapper.restore_escaped_chars(stage_five);
    }
    return new word_default(stage_one, stage_five);
  }
  resolve_wordshape_sets(input_list, distribution, optionals_weight) {
    const curly_pattern = /\{[^{}]*\}/g;
    const round_pattern = /\([^()]*\)/g;
    let matches;
    let items = [];
    let outputs;
    while ((matches = input_list.match(round_pattern)) !== null) {
      const group = matches[matches.length - 1];
      const candidates = group.slice(1, -1).split(/[,\s]+/).filter(Boolean);
      const include = Math.random() * 100 < optionals_weight;
      if (include && candidates.length > 0) {
        const uses_explicit_weights = candidates.some((c) => c.includes("*"));
        const dist_type = uses_explicit_weights ? "flat" : distribution;
        outputs = this.extract_value_and_weight(candidates, dist_type);
        const selected = weighted_random_pick(outputs[0], outputs[1]);
        input_list = input_list.replace(group, selected);
      } else {
        input_list = input_list.replace(group, "");
      }
    }
    while ((matches = input_list.match(curly_pattern)) !== null) {
      const most_nested = matches[matches.length - 1];
      items = most_nested.slice(1, -1).split(/[,\s]+/).filter(Boolean);
      if (items.length === 0) {
        items = ["^"];
      } else {
        const uses_explicit_weights = items.some((c) => c.includes("*"));
        const dist_type = uses_explicit_weights ? "flat" : distribution;
        outputs = this.extract_value_and_weight(items, dist_type);
        const picked = weighted_random_pick(outputs[0], outputs[1]);
        items = [picked];
      }
      input_list = input_list.replace(most_nested, items[0]);
    }
    const final_pick = input_list;
    return final_pick;
  }
  extract_value_and_weight(input_list, default_distribution) {
    let my_values = [];
    let my_weights = [];
    const all_default_weights = input_list.every((item) => !item.includes("*"));
    if (all_default_weights) {
      my_values = input_list;
      my_weights = get_distribution(input_list.length, default_distribution);
      return [my_values, my_weights];
    }
    input_list.forEach((item) => {
      const [value, weight_str] = item.split("*");
      const weight = weight_str && !isNaN(Number(weight_str)) ? parseFloat(weight_str) : 1;
      my_values.push(value);
      my_weights.push(weight);
    });
    return [my_values, my_weights];
  }
};
var word_builder_default = Word_Builder;

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
  transforms;
  graphemes;
  syllable_boundaries;
  debug = false;
  associateme_mapper;
  constructor(logger, graphemes, syllable_boundaries, transforms, output_mode, associateme_mapper) {
    this.logger = logger;
    this.graphemes = graphemes;
    this.syllable_boundaries = syllable_boundaries;
    this.transforms = transforms;
    this.associateme_mapper = associateme_mapper;
    this.debug = output_mode === "debug";
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
        modified_word = full_word.charAt(0).toUpperCase() + full_word.slice(1);
        break;
      case "decapitalise":
        modified_word = full_word.charAt(0).toLowerCase() + full_word.slice(1);
        break;
      case "to-uppercase":
        modified_word = full_word.toUpperCase();
        break;
      case "to-lowercase":
        modified_word = full_word.toLowerCase();
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
                "This should no have happened: infinite max grapheme??"
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
        reference_mapper.set_capture_stream_index(replacement_stream.length);
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
    const { t_type, target, result, conditions, exceptions, chance, line_num } = transform;
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
  do_transforms(word) {
    if (word.get_last_form() == "") {
      word.rejected = true;
      return word;
    }
    if (this.transforms.length == 0) {
      return word;
    }
    let tokens = graphemosis(word.get_last_form(), this.graphemes);
    for (const t of this.transforms) {
      if (word.rejected) {
        break;
      }
      if (t.target.length == 0 && (t.t_type === "rule" || t.t_type === "cluster-field")) {
        continue;
      }
      tokens = this.apply_transform(word, tokens, t);
      if (tokens.length == 0) {
        word.rejected = true;
        if (this.debug) {
          word.record_transformation(`<reject-null-word>`, `\u2205`);
        }
      }
    }
    if (!word.rejected) {
      if (this.debug) {
        if (word.transformations.length > 1) {
          word.record_transformation(null, `${tokens.join("")}`);
        }
      } else {
        word.record_transformation(null, `${tokens.join("")}`);
      }
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

// src/text_builder.ts
var Text_Builder = class {
  logger;
  build_start;
  num_of_words;
  output_mode;
  remove_duplicates;
  force_word_limit;
  sort_words;
  word_divider;
  alphabet;
  invisible;
  terminated;
  words;
  num_of_duplicates;
  num_of_rejects;
  num_of_duds;
  upper_gen_limit;
  constructor(logger, build_start, num_of_words, output_mode, remove_duplicates, force_word_limit, sort_words, word_divider, alphabet, invisible) {
    this.logger = logger;
    this.build_start = build_start;
    this.num_of_words = num_of_words;
    this.output_mode = output_mode;
    this.remove_duplicates = remove_duplicates;
    this.force_word_limit = force_word_limit;
    this.sort_words = sort_words;
    this.word_divider = word_divider;
    this.alphabet = alphabet;
    this.invisible = invisible;
    this.terminated = false;
    this.words = [];
    this.num_of_duplicates = 0;
    this.num_of_rejects = 0;
    this.num_of_duds = 0;
    this.upper_gen_limit = num_of_words * 5;
    if (this.upper_gen_limit > 1e6) {
      this.upper_gen_limit = 1e6;
    }
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  add_word(word) {
    let do_it = false;
    if (word.rejected && word_default.output_mode !== "debug") {
      this.num_of_rejects++;
      this.num_of_duds++;
    } else if (this.remove_duplicates) {
      if (this.words.includes(word.get_last_form())) {
        this.num_of_duplicates++;
        this.num_of_duds++;
      } else {
        do_it = true;
      }
    } else {
      do_it = true;
    }
    if (do_it) {
      this.words.push(word.get_word());
    }
    if (this.words.length >= this.num_of_words) {
      this.terminated = true;
    } else if (Date.now() - this.build_start >= 3e4) {
      this.terminated = true;
      if (this.remove_duplicates) {
        this.logger.warn(
          `Could not generate the requested amount of words. Try adding more unique word-shapes or remove some reject transforms`
        );
      } else {
        this.logger.warn(
          `Could not generate the requested amount of words. Try adding more word-shapes or remove some reject transforms`
        );
      }
    } else if (this.num_of_duds >= this.upper_gen_limit && !this.force_word_limit) {
      this.terminated = true;
      if (this.remove_duplicates) {
        this.logger.warn(
          `Could not generate the requested amount of words. Try adding more unique word-shapes or remove some reject transforms`
        );
      } else {
        this.logger.warn(
          `Could not generate the requested amount of words. Try adding more word-shapes or remove some reject transforms`
        );
      }
    }
  }
  create_record() {
    const ms = Date.now() - this.build_start;
    const seconds = Math.ceil(ms / 100) / 10;
    const s = seconds.toFixed(seconds % 1 === 0 ? 0 : 1);
    const display = s === "1" ? `${s} second` : `${s} seconds`;
    const records = [];
    if (this.words.length == 1) {
      records.push(`1 word generated`);
    } else if (this.words.length > 1) {
      records.push(`${this.words.length} words generated`);
    } else if (this.words.length == 0) {
      records.push(`Zero words generated`);
    }
    if (this.num_of_duplicates == 1) {
      records.push(`1 duplicate word removed`);
    } else if (this.num_of_duplicates > 1) {
      records.push(`${this.num_of_duplicates} duplicate words removed`);
    }
    if (this.num_of_rejects == 1) {
      records.push(`1 word rejected`);
    } else if (this.num_of_rejects > 1) {
      records.push(`${this.num_of_rejects} words rejected`);
    }
    this.logger.info(`${final_sentence(records)} -- in ${display}`);
  }
  make_text() {
    if (this.sort_words) {
      this.words = collator_default(
        this.logger,
        this.words,
        this.alphabet,
        this.invisible
      );
    }
    this.create_record();
    if (this.output_mode === "paragraph") {
      return this.paragraphify(this.words);
    }
    return this.words.join(this.word_divider);
  }
  paragraphify(words) {
    if (words.length === 0) return "";
    if (words.length === 1)
      return capitalise(words[0]) + this.random_end_punctuation();
    const result = [];
    let should_capitalise = true;
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      if (should_capitalise) {
        word = capitalise(word);
        should_capitalise = false;
      }
      if (i === words.length - 1) {
        result.push(word);
      } else if (i % 7 === 0 && i !== 0) {
        const punctuation = this.random_end_punctuation();
        result.push(word + punctuation);
        should_capitalise = true;
      } else if (i % 6 === 0 && i !== 0) {
        result.push(word + ",");
      } else {
        result.push(word);
      }
    }
    let paragraph = result.join(" ");
    paragraph = paragraph.replace(/[,\s]*$/, "");
    paragraph += this.random_end_punctuation();
    return paragraph;
  }
  random_end_punctuation() {
    const roll = Math.random();
    if (roll < 5e-3) return "...";
    if (roll < 0.03) return "!";
    if (roll < 0.08) return "?";
    return ".";
  }
  show_debug() {
    const info = `Num of words: ` + this.num_of_words + `
Mode: ` + this.output_mode + `
Remove duplicates: ` + this.remove_duplicates + `
Force word limit: ` + this.force_word_limit + `
Sort words: ` + this.sort_words + `
Word divider: "` + this.word_divider + `"
Alphabet: ` + this.alphabet.join(", ") + `
Invisible: ` + this.invisible.join(", ");
    this.logger.diagnostic(info);
  }
};
var text_builder_default = Text_Builder;

// src/logger.ts
var Logger = class {
  errors;
  warnings;
  infos;
  diagnostics;
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
    this.diagnostics = [];
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
      this.errors.push(`Error: ${message} @ line ${line_num + 1}`);
    } else {
      this.errors.push(`Error: ${message}`);
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
      this.warnings.push(`Warning: ${warn} @ line ${line_num + 1}`);
    } else {
      this.warnings.push(`Warning: ${warn}`);
    }
  }
  info(info) {
    this.infos.push(`${info}`);
  }
  diagnostic(diagnostic) {
    this.diagnostics.push(diagnostic);
  }
};
var logger_default = Logger;

// src/utils/types.ts
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

// src/generata/supra_builder.ts
var Supra_Builder = class {
  logger;
  weights;
  letters;
  id_counter;
  constructor(logger) {
    this.logger = logger;
    this.weights = {};
    this.letters = {};
    this.id_counter = 1;
  }
  process_string(input, wordshape_line_num) {
    const token_regex = /\[([^\]]*)\]/g;
    const valid_content_regex = new RegExp(
      `^(\\^|${cappa})(?:\\*((\\d+(?:\\.\\d+)?)|s))?$`
    );
    return input.replace(token_regex, (fullMatch, content) => {
      const match = valid_content_regex.exec(content);
      if (!match) {
        this.logger.validation_error(
          `Invalid supra-set item '${fullMatch}' -- expected all supra-set items to look like '[A]', '[^]' or '[A*2]'`,
          wordshape_line_num
        );
      }
      const letter = match[1];
      const raw_weight = match[2];
      const weight = raw_weight === "s" ? "s" : raw_weight ? Number(raw_weight) : 1;
      const id = this.id_counter++;
      this.weights[id] = weight;
      this.letters[id] = letter;
      return `[${id}]`;
    });
  }
  extract_letters_and_weights(input) {
    const id_regex = /\[(\d+)\]/g;
    const ids = [];
    const weights = [];
    let match;
    while ((match = id_regex.exec(input)) !== null) {
      const id = Number(match[1]);
      if (!(id in this.letters) || !(id in this.weights)) {
        this.logger.validation_error(`Missing data for ID '${id}'`, null);
      }
      ids.push(id.toString());
      weights.push(this.weights[id]);
    }
    return [ids, weights];
  }
  replace_letter_and_clean(input, target_ID) {
    const id_regex = /\[(\d+)\]/g;
    return input.replace(id_regex, (_match, id_str) => {
      const id = Number(id_str);
      if (!(id in this.letters)) {
        this.logger.validation_error(
          `Unknown ID '${id}' found in input.`,
          null
        );
      }
      return id === target_ID ? `${this.letters[id]}` : "";
    });
  }
  getWeights() {
    return this.weights;
  }
  getLetters() {
    return this.letters;
  }
};
var supra_builder_default = Supra_Builder;

// src/resolvers/transform_resolver.ts
var Transform_Resolver = class {
  logger;
  output_mode;
  nesca_grammar_stream;
  categories;
  transform_pending;
  transforms = [];
  syllable_boundaries;
  features = /* @__PURE__ */ new Map();
  line_num;
  constructor(logger, output_mode, nesca_grmmar_stream, categories, transform_pending, features, syllable_boundaries) {
    this.logger = logger;
    this.output_mode = output_mode;
    this.nesca_grammar_stream = nesca_grmmar_stream;
    this.categories = categories;
    this.transform_pending = transform_pending;
    this.features = features;
    this.syllable_boundaries = syllable_boundaries.length === 0 ? ["."] : syllable_boundaries;
    this.line_num = 0;
    this.resolve_transforms();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  resolve_transforms() {
    for (let i = 0; i < this.transform_pending.length; i++) {
      this.line_num = this.transform_pending[i].line_num;
      if (this.transform_pending[i].t_type === "cluster-field") {
        this.transforms.push({
          t_type: this.transform_pending[i].t_type,
          target: this.get_cluser_field_graphemes(
            this.transform_pending[i].target,
            "TARGET"
          ),
          result: this.get_cluser_field_graphemes(
            this.transform_pending[i].result,
            "RESULT"
          ),
          conditions: [],
          exceptions: [],
          chance: null,
          line_num: this.line_num
        });
        continue;
      } else if (this.transform_pending[i].t_type !== "rule") {
        this.transforms.push({
          t_type: this.transform_pending[i].t_type,
          target: [],
          result: [],
          conditions: [],
          exceptions: [],
          chance: null,
          line_num: this.line_num
        });
        continue;
      }
      const target = this.transform_pending[i].target;
      const target_with_cat = this.categories_into_transform(target);
      const target_with_fea = this.features_into_transform(target_with_cat);
      const target_altors = this.resolve_alt_opt(target_with_fea);
      const result = this.transform_pending[i].result;
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
      const chance = this.transform_pending[i].chance;
      const new_conditions = [];
      const new_exceptions = [];
      for (let j = 0; j < this.transform_pending[i].conditions.length; j++) {
        let my_condition = this.transform_pending[i].conditions[j];
        my_condition = this.categories_into_transform(my_condition);
        my_condition = this.features_into_transform(my_condition);
        if (!this.valid_transform_brackets(my_condition)) {
          this.logger.validation_error(
            `Invalid brackets in condition "${my_condition}"`,
            this.line_num
          );
        }
        const alt_opt_condition = this.resolve_alt_opt(my_condition);
        for (let k = 0; k < alt_opt_condition[0].length; k++) {
          const split_condition = alt_opt_condition[0][k].split("_");
          const before = this.nesca_grammar_stream.main_parser(
            split_condition[0],
            "BEFORE",
            this.line_num
          );
          const after = this.nesca_grammar_stream.main_parser(
            split_condition[1],
            "AFTER",
            this.line_num
          );
          new_conditions.push({
            before,
            after
          });
        }
      }
      for (let j = 0; j < this.transform_pending[i].exceptions.length; j++) {
        let my_exception = this.transform_pending[i].exceptions[j];
        my_exception = this.categories_into_transform(my_exception);
        my_exception = this.features_into_transform(my_exception);
        if (!this.valid_transform_brackets(my_exception)) {
          this.logger.validation_error(
            `Invalid brackets in exception "${my_exception}"`,
            this.line_num
          );
        }
        const alt_opt_exception = this.resolve_alt_opt(my_exception);
        for (let k = 0; k < alt_opt_exception[0].length; k++) {
          const split_exception = alt_opt_exception[0][k].split("_");
          const before = this.nesca_grammar_stream.main_parser(
            split_exception[0],
            "BEFORE",
            this.line_num
          );
          const after = this.nesca_grammar_stream.main_parser(
            split_exception[1],
            "AFTER",
            this.line_num
          );
          new_exceptions.push({
            before,
            after
          });
        }
      }
      this.transforms.push({
        t_type: this.transform_pending[i].t_type,
        target: tokenised_target_array,
        result: tokenised_result_array,
        conditions: new_conditions,
        exceptions: new_exceptions,
        chance,
        line_num: this.line_num
      });
    }
    return this.transforms;
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
            "Optionalator must be part of a larger token",
            this.line_num
          );
        }
      }
    }
    if (stack.length !== 0) {
      this.logger.validation_error("Unclosed bracket", this.line_num);
    }
  }
  // 🔄 Internal: Expand a single chunk
  expand_chunk(chunk) {
    this.check_grammar_rules(chunk);
    const regex = /([^{(})]+)|(\{[^}]+\})|(\([^)]+\))/g;
    const parts = [...chunk.matchAll(regex)].map((m) => m[0]);
    const expansions = parts.map((part) => {
      if (part.startsWith("{")) {
        return part.slice(1, -1).split(/[\s,]+/);
      } else if (part.startsWith("(")) {
        const val = part.slice(1, -1);
        return [val, ""];
      } else {
        return [part];
      }
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
      if (char === "<") {
        if (/^[A-Z]$/.test(input[i + 1])) {
          output += char + input[i + 1];
          i += 1;
          continue;
        }
      }
      if (this.categories.has(char)) {
        const prev = input[i - 1] ?? "";
        const next = input[i + 1] ?? "";
        const is_boundary_before = i === 0 || " ,([{)}]".includes(prev);
        const is_boundary_after = i === length - 1 || " ,([{)}]".includes(next);
        if (is_boundary_before && is_boundary_after) {
          const entry = this.categories.get(char);
          output += entry.filter((g) => !["^"].some((b) => g.includes(b))).join(", ");
        } else {
          this.logger.validation_error(
            `Category key "${char}" is adjacent to other content`,
            this.line_num
          );
        }
      } else {
        output += char;
      }
    }
    return output;
  }
  features_into_transform(stream) {
    const length = stream.length;
    const output = [];
    let feature_mode = false;
    let feature_matrix = "";
    let feature_begin_index = 0;
    for (let i = 0; i < stream.length; i++) {
      if (feature_mode) {
        if (stream[i] === "]") {
          feature_mode = false;
          if (feature_matrix.length != 0) {
            const prev = stream[feature_begin_index - 1] ?? "";
            const next = stream[i + 1] ?? "";
            const is_boundary_before = i === 0 || " ,([{)}]".includes(prev);
            const is_boundary_after = i === length - 1 || " ,([{)}]".includes(next);
            if (is_boundary_before && is_boundary_after) {
              output.push(`${this.get_graphemes_from_matrix(feature_matrix)}`);
            } else {
              this.logger.validation_error(
                `Feature "[${feature_matrix}]" is adjacent to other content`,
                this.line_num
              );
            }
          }
          feature_matrix = "";
          continue;
        }
        feature_matrix += stream[i];
        continue;
      }
      if (stream[i] === "[") {
        feature_begin_index = i;
        if (stream[i + 1] === "+" || stream[i + 1] === "-") {
          feature_mode = true;
          continue;
        } else {
          output.push("[");
          continue;
        }
      }
      output.push(stream[i]);
    }
    if (feature_mode) {
      this.logger.validation_error(
        "Unclosed feature-matrix missing ']'",
        this.line_num
      );
    }
    return output.join("");
  }
  get_graphemes_from_matrix(feature_matrix) {
    const keys = feature_matrix.split(",").map((k) => k.trim());
    const grapheme_sets = [];
    for (const key of keys) {
      const entry = this.features.get(key);
      if (!entry) {
        this.logger.validation_error(`Unknown feature '${key}'`, this.line_num);
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
    const transforms = [];
    for (let i = 0; i < this.transforms.length; i++) {
      const my_transform = this.transforms[i];
      if (my_transform.t_type != "rule" && my_transform.t_type != "cluster-field") {
        transforms.push(
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
      transforms.push(
        `  ${my_target.join(", ")} \u2192 ${my_result.join(", ")}${conditions}${exceptions}${chance} @ ln:${my_transform.line_num + 1}`
      );
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
Transforms {
` + transforms.join("\n") + `
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
            throw new Error("Invalid garde_stream: more than one '|' found");
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
        new_token = { type: "syllable-boundary", base: "$", min: 1, max: 1 };
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
          new_token = { type: "metathesis-mark", base: "&M", min: 1, max: 1 };
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

// src/resolvers/category_resolver.ts
var Category_Resolver = class {
  logger;
  escape_mapper;
  output_mode;
  category_distribution;
  category_pending;
  categories;
  trans_categories;
  constructor(logger, output_mode, escape_mapper, category_distribution, category_pending) {
    this.logger = logger;
    this.output_mode = output_mode;
    this.escape_mapper = escape_mapper;
    this.category_distribution = category_distribution;
    this.category_pending = category_pending;
    this.categories = /* @__PURE__ */ new Map();
    this.trans_categories = /* @__PURE__ */ new Map();
    this.resolve_categories();
    this.get_trans_categories();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  get_trans_categories() {
    for (const [key, value] of this.categories) {
      this.trans_categories.set(key, value.graphemes);
    }
  }
  resolve_categories() {
    for (const [key, value] of this.category_pending) {
      if (!this.valid_category_brackets(value.content)) {
        this.logger.validation_error(
          `Category '${key}' had missmatched brackets`,
          value.line_num
        );
      }
      if (!this.valid_category_weights(value.content)) {
        this.logger.validation_error(
          `Category '${key}' had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',', a bracket, or ' '`,
          value.line_num
        );
      }
      for (const [key2, value2] of this.category_pending.entries()) {
        const expanded_content = recursive_expansion(
          value2.content,
          this.category_pending,
          true
        );
        this.category_pending.set(key2, {
          content: expanded_content,
          line_num: value2.line_num
          // Preserve original line_num
        });
      }
    }
    for (const [key, value] of this.category_pending) {
      const new_category_field = this.resolve_nested_categories(
        value.content,
        this.category_distribution
      );
      for (let i = 0; i < new_category_field.graphemes.length; i++) {
        new_category_field.graphemes[i] = this.escape_mapper.escape_special_chars(
          new_category_field.graphemes[i]
        );
      }
      this.categories.set(key, new_category_field);
    }
  }
  valid_category_brackets(str) {
    const stack = [];
    const bracket_pairs = { "}": "{" };
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
  valid_category_weights(str) {
    const asterisk_without_number = /\*(?!\d+(\.\d+)?)/g;
    const asterisk_at_start = /^\*/;
    const asterisk_after_space_or_comma = /[ ,{}]\*/g;
    const asterisk_number_bad_suffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,\]\n]|$)/g;
    if (asterisk_without_number.test(str) || asterisk_at_start.test(str) || asterisk_after_space_or_comma.test(str) || asterisk_number_bad_suffix.test(str)) {
      return false;
    }
    return true;
  }
  resolve_nested_categories(input, default_distribution) {
    function tokenize(expr) {
      const tokens = [];
      let i = 0;
      let buffer = "";
      while (i < expr.length) {
        if (expr[i] === "{") {
          if (buffer.trim()) {
            tokens.push(buffer.trim());
            buffer = "";
          }
          let depth = 1, j = i + 1;
          while (j < expr.length && depth > 0) {
            if (expr[j] === "{") depth++;
            else if (expr[j] === "}") depth--;
            j++;
          }
          const content = expr.slice(i + 1, j - 1);
          i = j;
          let weight = 1;
          if (expr[i] === "*") {
            i++;
            let w = "";
            while (i < expr.length && /[\d.]/.test(expr[i])) w += expr[i++];
            weight = parseFloat(w || "1");
          }
          tokens.push({ group: content, weight });
        } else if (/[,\s]/.test(expr[i])) {
          if (buffer.trim()) {
            tokens.push(buffer.trim());
            buffer = "";
          }
          i++;
        } else {
          buffer += expr[i++];
        }
      }
      if (buffer.trim()) {
        tokens.push(buffer.trim());
      }
      return tokens;
    }
    function evaluate(expr, multiplier = 1) {
      const tokens = tokenize(expr);
      const uses_explicit_weights = tokens.some(
        (t) => typeof t === "string" && t.includes("*")
      );
      const dist = uses_explicit_weights ? Array(tokens.length).fill(1) : get_distribution(tokens.length, default_distribution);
      const entries = [];
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const token_weight = dist[i] * multiplier;
        if (typeof token === "string") {
          const [key, raw_weight] = token.split("*");
          const has_custom_weight = raw_weight !== void 0 && raw_weight !== "";
          const literal_weight = has_custom_weight ? parseFloat(raw_weight) : 1;
          const final_weight = has_custom_weight ? literal_weight * multiplier : token_weight;
          entries.push({ key: key.trim(), weight: final_weight });
        } else {
          const inner_entries = evaluate(token.group, 1);
          const total = inner_entries.reduce((sum, e) => sum + e.weight, 0);
          for (const { key, weight } of inner_entries) {
            const scaled = weight / total * token.weight * token_weight;
            entries.push({ key, weight: scaled });
          }
        }
      }
      return entries;
    }
    const evaluated = evaluate(input);
    const keys = evaluated.map((e) => e.key);
    const weights = evaluated.map((e) => e.weight);
    return { graphemes: keys, weights };
  }
  show_debug() {
    const categories = [];
    for (const [key, value] of this.categories) {
      const cat_field = [];
      for (let i = 0; i < value.graphemes.length; i++) {
        cat_field.push(`${value.graphemes[i]}*${value.weights[i]}`);
      }
      const category_field = `${cat_field.join(", ")}`;
      categories.push(`  ${key} = ${category_field}`);
    }
    const info = `Category-distribution: ` + this.category_distribution + `
Categories {
` + categories.join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
};
var category_resolver_default = Category_Resolver;

// src/resolvers/generation_resolver.ts
var Generation_Resolver = class {
  logger;
  supra_builder;
  output_mode;
  optionals_weight;
  units;
  wordshape_distribution;
  wordshape_pending;
  wordshapes;
  constructor(logger, output_mode, supra_builder, wordshape_distribution, units, wordshape_pending, optionals_weight) {
    this.logger = logger;
    this.output_mode = output_mode;
    this.supra_builder = supra_builder;
    this.optionals_weight = optionals_weight;
    this.units = units;
    this.wordshape_distribution = wordshape_distribution;
    this.wordshape_pending = wordshape_pending;
    this.wordshapes = { items: [], weights: [] };
    this.expand_units();
    this.expand_wordshape_units();
    this.set_wordshapes();
    if (this.output_mode === "debug") {
      this.show_debug();
    }
  }
  set_wordshapes() {
    const result = [];
    let buffer = "";
    let inside_brackets = 0;
    if (this.wordshape_pending.content.length == 0) {
      this.logger.validation_error(
        `No word-shapes to choose from -- expected 'words: wordshape1 wordshape2 ...'`,
        this.wordshape_pending.line_num
      );
    }
    this.wordshape_pending.content = this.supra_builder.process_string(
      this.wordshape_pending.content,
      this.wordshape_pending.line_num
    );
    if (!this.valid_words_brackets(this.wordshape_pending.content)) {
      this.logger.validation_error(
        `Word-shapes had missmatched brackets`,
        this.wordshape_pending.line_num
      );
    }
    if (!this.valid_words_weights(this.wordshape_pending.content)) {
      this.logger.validation_error(
        `Word-shapes had invalid weights -- expected weights to follow an item and look like '*NUMBER' followed by either ',' a bracket, or ' '`,
        this.wordshape_pending.line_num
      );
    }
    for (let i = 0; i < this.wordshape_pending.content.length; i++) {
      const char = this.wordshape_pending.content[i];
      if (char === "{" || char === "(") {
        inside_brackets++;
      } else if (char === "}" || char === ")") {
        inside_brackets--;
      }
      if ((char === " " || char === ",") && inside_brackets === 0) {
        if (buffer.length > 0) {
          result.push(buffer);
          buffer = "";
        }
      } else {
        buffer += char;
      }
    }
    if (buffer.length > 0) {
      result.push(buffer);
    }
    const [result_str, result_num] = this.extract_wordshape_value_and_weight(
      result,
      this.wordshape_distribution
    );
    for (let i = 0; i < result_str.length; i++) {
      this.wordshapes.items.push(result_str[i]);
      this.wordshapes.weights.push(result_num[i]);
    }
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
  extract_wordshape_value_and_weight(input_list, default_distribution) {
    const my_values = [];
    const my_weights = [];
    const combine_adjacent_chunks = (str) => {
      const chunks = [];
      let buffer = "";
      let bracket_depth = 0;
      let paren_depth = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        buffer += char;
        if (char === "{") bracket_depth++;
        if (char === "}") bracket_depth--;
        if (char === "(") paren_depth++;
        if (char === ")") paren_depth--;
        const atEnd = i === str.length - 1;
        if (char === "," && bracket_depth === 0 && paren_depth === 0 || atEnd) {
          if (char !== "," && atEnd) {
          } else {
            buffer = buffer.slice(0, -1);
          }
          if (buffer.trim()) chunks.push(buffer.trim());
          buffer = "";
        }
      }
      return chunks;
    };
    const all_parts = input_list.flatMap(combine_adjacent_chunks);
    const all_default_weights = all_parts.every(
      (part) => !/^(?:\{.*\}|[^*]+)\*[\d.]+$/.test(part)
    );
    if (all_default_weights) {
      const trimmed_values = all_parts.map((part) => part.trim());
      const total_items = trimmed_values.length;
      const chosen_distribution = get_distribution(
        total_items,
        default_distribution
      );
      my_values.push(...trimmed_values);
      my_weights.push(...chosen_distribution);
      return [my_values, my_weights];
    }
    for (const part of all_parts) {
      const trimmed = part.trim();
      const match = trimmed.match(/^(.*)\*([\d.]+)$/);
      if (match && !/\{.*\*.*\}$/.test(match[1])) {
        my_values.push(match[1]);
        my_weights.push(parseFloat(match[2]));
      } else if (/^\{.*\}\*[\d.]+$/.test(trimmed)) {
        const i = trimmed.lastIndexOf("*");
        my_values.push(trimmed.slice(0, i));
        my_weights.push(parseFloat(trimmed.slice(i + 1)));
      } else {
        my_values.push(trimmed);
        my_weights.push(1);
      }
    }
    return [my_values, my_weights];
  }
  valid_words_weights(str) {
    const asterisk_without_number = /\*(?!\d+(\.\d+)?)/g;
    const asterisk_at_start = /^\*/;
    const asterisk_after_space_or_comma = /[ ,]\*/g;
    const asterisk_number_bad_suffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,}\])\n]|$)/g;
    if (asterisk_without_number.test(str) || asterisk_at_start.test(str) || asterisk_after_space_or_comma.test(str) || asterisk_number_bad_suffix.test(str)) {
      return false;
    }
    return true;
  }
  expand_wordshape_units() {
    this.wordshape_pending.content = recursive_expansion(
      this.wordshape_pending.content,
      this.units
    );
    const match = this.wordshape_pending.content.match(/<[A-Za-z+$-]+>/);
    if (match) {
      this.logger.validation_error(
        `Nonexistent unit detected: '${match[0]}'`,
        this.wordshape_pending.line_num
      );
    }
  }
  expand_units() {
    for (const [key, value] of this.units.entries()) {
      const expanded_content = recursive_expansion(value.content, this.units);
      this.units.set(key, {
        content: expanded_content,
        line_num: value.line_num
        // Preserve original line_num
      });
    }
  }
  show_debug() {
    const units = [];
    for (const [key, value] of this.units) {
      units.push(`  ${key.slice(1, -1)} = ${value.content}`);
    }
    const wordshapes = [];
    for (let i = 0; i < this.wordshapes.items.length; i++) {
      wordshapes.push(
        `  ${this.wordshapes.items[i]}*${this.wordshapes.weights[i]}`
      );
    }
    const info = `Wordshape-distribution: ` + this.wordshape_distribution + `
Optionals-weight: ` + this.optionals_weight + `
Units {
` + units.join("\n") + `
}
Wordshapes {
` + wordshapes.join("\n") + `
}`;
    this.logger.diagnostic(info);
  }
};
var generation_resolver_default = Generation_Resolver;

// src/resolvers/feature_resolver.ts
var Resolver = class {
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
        x_filtered[i] = this.escape_mapper.escape_special_chars(x_filtered[i]);
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
var feature_resolver_default = Resolver;

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

// src/utils/vocabug-version.ts
var VOCABUG_VERSION = "1.0.1";

// src/core.ts
function generate({
  file,
  num_of_words = 100,
  mode = "word-list",
  remove_duplicates = true,
  force_word_limit = false,
  sort_words = true,
  word_divider = " "
}) {
  const logger = new logger_default();
  let text = "";
  try {
    const build_start = Date.now();
    const escape_mapper = new escape_mapper_default();
    const supra_builder = new supra_builder_default(logger);
    const p = new parser_default(
      logger,
      escape_mapper,
      supra_builder,
      num_of_words,
      mode,
      sort_words,
      remove_duplicates,
      force_word_limit,
      word_divider
    );
    p.parse_file(file);
    const category_resolver = new category_resolver_default(
      logger,
      p.output_mode,
      escape_mapper,
      p.category_distribution,
      p.category_pending
    );
    const generation_resolver = new generation_resolver_default(
      logger,
      p.output_mode,
      supra_builder,
      p.wordshape_distribution,
      p.units,
      p.wordshape_pending,
      p.optionals_weight
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
      p.transform_pending,
      feature_resolver.features,
      p.syllable_boundaries
    );
    const word_builder = new word_builder_default(
      escape_mapper,
      supra_builder,
      category_resolver.categories,
      generation_resolver.wordshapes,
      category_resolver.category_distribution,
      generation_resolver.optionals_weight,
      p.output_mode
    );
    const transformer = new transformer_default(
      logger,
      canon_graphemes_resolver.graphemes,
      transform_resolver.syllable_boundaries,
      transform_resolver.transforms,
      p.output_mode,
      canon_graphemes_resolver.associateme_mapper
    );
    const text_builder = new text_builder_default(
      logger,
      build_start,
      p.num_of_words,
      p.output_mode,
      p.remove_duplicates,
      p.force_word_limit,
      p.sort_words,
      p.word_divider,
      p.alphabet,
      p.invisible
    );
    while (!text_builder.terminated) {
      let word = word_builder.make_word();
      word = transformer.do_transforms(word);
      text_builder.add_word(word);
    }
    text = text_builder.make_text();
  } catch (e) {
    if (!(e instanceof logger.Validation_Error)) {
      logger.uncaught_error(e);
    }
  }
  return {
    text,
    errors: logger.errors,
    warnings: logger.warnings,
    infos: logger.infos,
    diagnostics: logger.diagnostics
  };
}

// bin/index.ts
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
var argv = yargs(hideBin(process.argv)).usage("Usage: $0 <path> [options]").alias({ help: "?", version: "v" }).option("num_of_words", {
  alias: "n",
  describe: "Number of words to generate",
  type: "number",
  default: 100
}).option("output_mode", {
  alias: "m",
  describe: "Output mode",
  choices: ["word-list", "debug", "paragraph"],
  default: "word-list"
}).option("remove_duplicates", {
  alias: "d",
  describe: "Remove duplicate words",
  type: "boolean",
  default: true
}).option("force_word_limit", {
  alias: "l",
  describe: "Force word limit",
  type: "boolean",
  default: false
}).option("sort_words", {
  alias: "s",
  describe: "Sort generated words",
  type: "boolean",
  default: true
}).option("word_divider", {
  alias: "w",
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
  console.log(`Generating words with Vocabug version ${VOCABUG_VERSION}. This may take up to 30 seconds...`);
  const run = generate({
    file: file_text,
    num_of_words: argv.num_of_words,
    mode: argv.output_mode,
    remove_duplicates: argv.remove_duplicates,
    force_word_limit: argv.force_word_limit,
    sort_words: argv.sort_words,
    word_divider: argv.word_divider
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
  if (run.text.length === 0) {
    console.log(
      run.text
    );
  }
} catch {
  process.exitCode = 1;
  console.error(`Error: Could not find file '${argv._[0]}'.`);
}
