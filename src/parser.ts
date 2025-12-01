import type Escape_Mapper from "./escape_mapper";
import Logger from "./logger";
import Supra_Builder from "./generata/supra_builder";

import { make_percentage, cappa } from "./utils/utilities";
import type { Output_Mode, Distribution, Directive } from "./utils/types";

import Associateme_Mapper from "./transforma/associateme_mapper";

class Parser {
  private logger: Logger;
  private escape_mapper: Escape_Mapper;
  public supra_builder: Supra_Builder;

  public num_of_words: number;
  public output_mode: Output_Mode;
  public remove_duplicates: boolean;
  public force_word_limit: boolean;
  public sort_words: boolean;
  public word_divider: string;

  public directive: Directive = "none";

  public category_distribution: Distribution;
  public category_pending: Map<string, { content: string; line_num: number }>;

  public units: Map<string, { content: string; line_num: number }>;
  public optionals_weight: number;
  public wordshape_distribution: Distribution;
  public wordshape_pending: { content: string; line_num: number };

  public feature_pending: Map<string, { content: string; line_num: number }>;

  public transform_pending: {
    target: string;
    result: string;
    conditions: string[];
    exceptions: string[];
    chance: number | null;
    line_num: number;
  }[];

  public graphemes: string[];

  public associateme_mapper: Associateme_Mapper;

  public alphabet: string[];
  public invisible: string[];

  private file_line_num = 0;
  private file_array: string[] = [];


  constructor(
    logger: Logger,
    escape_mapper: Escape_Mapper,
    supra_builder: Supra_Builder,

    num_of_words_string: number | string,
    output_mode: Output_Mode,
    sort_words: boolean,
    remove_duplicates: boolean,
    force_word_limit: boolean,
    word_divider: string,
  ) {
    this.logger = logger;
    this.escape_mapper = escape_mapper;
    this.supra_builder = supra_builder;

    if (num_of_words_string === "") {
      num_of_words_string = "100";
    }
    let num_of_words: number = Number(num_of_words_string);
    if (isNaN(num_of_words)) {
      this.logger.warn(
        `Number of words '${num_of_words}' was not a number. Genearating 100 words instead`,
      );
      num_of_words = 100;
    } else if (!Number.isInteger(num_of_words)) {
      this.logger.warn(
        `Number of words '${num_of_words}' was rounded to the nearest whole number`,
      );
      num_of_words = Math.ceil(num_of_words);
    }
    if (num_of_words > 100_000 || num_of_words < 1) {
      this.logger.warn(
        `Number of words '${num_of_words}' was not between 1 and 100,000. Genearating 100 words instead`,
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
      "\n",
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
    this.category_pending = new Map();
    this.optionals_weight = 10;
    this.units = new Map();
    this.wordshape_distribution = "zipfian";
    this.wordshape_pending = { content: "", line_num: 0 };

    this.graphemes = [];

    this.associateme_mapper = new Associateme_Mapper();

    this.transform_pending = [];

    this.feature_pending = new Map();

    this.alphabet = [];
    this.invisible = [];

    this.directive = "none";
  }

  parse_file(file: string) {
    const file_array = file.split("\n");

    let my_decorator: string = "none";
    let my_directive: string = "none";
    let my_subdirective: string = "none";
    let my_header: string[] = [];

    for (; this.file_line_num < file_array.length; ++this.file_line_num) {
      let line = file_array[this.file_line_num];

      line = this.escape_mapper.escape_backslash_pairs(line);
      line = line.replace(/;.*/u, "").trim(); // Remove comment!!
      line = this.escape_mapper.escape_named_escape(line);
      if (line.includes("&[")) {
        this.logger.validation_error(
          `Invalid named escape`,
          this.file_line_num,
        );
      }
      if (line === "") {
        continue; // Blank line !!
      }

      // check for decorator
      if (line.startsWith("@")){
        my_decorator = this.parse_decorator(line, my_decorator);
        if (my_decorator != "none") {
          continue; // It's a decorator
        }
      }

      // check for directive change
      let temp_directive = this.parse_directive(line, my_decorator);
      if (temp_directive != "none") {
        my_directive = temp_directive;
        continue; // It's a directive change
      }

      // CATEGORIES
      if (my_directive === "categories") {
        const [key, field, mode] = this.get_cat_seg_fea(line);
        if (mode === "trash") {
          this.logger.validation_error(
            `${line} is not a category declaration`,
            this.file_line_num,
          );
        }
        this.category_pending.set(key, {
          content: field,
          line_num: this.file_line_num,
        });
      }
      
      // WORDS
      if (my_directive === "words") {
        if (!this.valid_words_brackets(line)) {
          this.logger.validation_error(
            `Wordshapes had missmatched brackets`,
            this.file_line_num,
          );
        }
        this.wordshape_pending.content += " " + line;
        this.wordshape_pending.line_num = this.file_line_num;
        continue; // Added some wordshapes
      }

      // UNITS
      if (my_directive === "units") {
        const [key, field, mode] = this.get_cat_seg_fea(line);
        if (mode === "trash") {
          this.logger.validation_error(
            `${line} is not a unit declaration`,
            this.file_line_num,
          );
        }
        if (!this.validate_unit(field)) {
          this.logger.validation_error(
            `The unit '${key}' had separator(s) outside sets -- expected separators for units to appear only in sets`,
            this.file_line_num,
          );
        }
        if (!this.valid_words_brackets(field)) {
          this.logger.validation_error(
            `The unit '${key}' had missmatched brackets`,
            this.file_line_num,
          );
        }
        this.units.set(key, {
          content: field,
          line_num: this.file_line_num,
        });
      }

      // ALPHABET
      if (my_directive === "alphabet") {
        const alphabet = line.split(/[,\s]+/).filter(Boolean);
        for (let i = 0; i < alphabet.length; i++) {
          alphabet[i] = this.escape_mapper.restore_escaped_chars(alphabet[i]);
        }
        // Add alphabet items to this.alphabet
        this.alphabet.push(...alphabet);
      }

      // INVISIBLE
      if (my_directive === "invisible") {
        const invisible = line.split(/[,\s]+/).filter(Boolean);
        for (let i = 0; i < invisible.length; i++) {
          invisible[i] = this.escape_mapper.restore_escaped_chars(invisible[i]);
        }
        // Add invisible items to this.invisible
        this.invisible.push(...invisible);
      }
      
      // GRAPHEMES
      if (my_directive === "graphemes") {
        
      }

      // FEATURES !!!
      if (my_directive === "features") {
        const [key, field, mode] = this.get_cat_seg_fea(line);
        if (mode === "trash") {
          this.logger.validation_error(
            `${line} is not a feature declaration`,
            this.file_line_num,
          );
        }
        const graphemes = field.split(/[,\s]+/).filter(Boolean);
        if (graphemes.length == 0) {
          this.logger.validation_error(
            `Feature ${key} had no graphemes`,
            this.file_line_num,
          );
        }
        this.feature_pending.set(key, {
          content: graphemes.join(","),
          line_num: this.file_line_num,
        });
      }

      // FEATURE-FIELD
      if (my_directive === "feature-field") {
        if (line.startsWith("+- ")) {
          this.parse_featurefield(file_array);
          continue;
        }
      }


      if (my_directive === "stage") {
        // Lets do transforms !!
        let line_value = line;

        if (line.startsWith("< ")) {
          // Parse clusterfield
          this.parse_clusterfield(file_array);
          continue;
        }

        if (line.startsWith("<routine ")) {
          // Engine. Routine
          line_value = line.substring(9).trim().toLowerCase();

          const engine = line_value.replace(/\bcapitalize\b/g, "capitalise");

          if (
            engine === "decompose" ||
            engine === "compose" ||
            engine === "capitalise" ||
            engine === "decapitalise" ||
            engine === "to-uppercase" ||
            engine === "to-lowercase" ||
            engine === "xsampa-to-ipa" ||
            engine === "ipa-to-xsampa" ||
            engine === "roman-to-hangul" ||
            engine === "reverse"
          ) {
            this.transform_pending.push({
              target: `@routine${engine}`,
              result: "\\",
              conditions: [],
              exceptions: [],
              chance: null,
              line_num: this.file_line_num,
            });
          } else {
            this.logger.validation_error(
              `Trash engine '${this.escape_mapper.restore_preserve_escaped_chars(engine)}' found`,
              this.file_line_num,
            );
          }
          continue;
        }

        // Else it's a normal transform rule
        const [target, result, conditions, exceptions, chance] =
          this.get_transform(line_value);

        this.transform_pending.push({
          target: target,
          result: result,
          conditions: conditions,
          exceptions: exceptions,
          chance: chance,
          line_num: this.file_line_num,
        });
        continue;
      }
    }
  }

  get_cat_seg_fea(
    input: string,
  ): [string, string, "category" | "unit" | "feature" | "trash"] {
    const divider = "=";

    if (input === "") {
      return ["", "", "trash"]; // Handle invalid inputs
    }
    const divided = input.split(divider);
    if (divided.length !== 2) {
      return [input, "", "trash"]; // Ensure division results in exactly two parts
    }
    const key = divided[0].trim();
    const field = divided[1].trim();
    if (key === "" || field === "") {
      return [input, "", "trash"]; // Handle empty parts
    }

    // Construct dynamic regexes using cappa
    const categoryRegex = new RegExp(`^${cappa}$`);
    const unitRegex = new RegExp(`^\\$${cappa}$`);
    const featureRegex = /^(\+|-|>)[a-zA-Z+-]+$/;

    if (categoryRegex.test(key)) {
      return [key, field, "category"];
    }
    if (unitRegex.test(key)) {
      return [key, field, "unit"];
    }
    if (featureRegex.test(key)) {
      return [key, field, "feature"];
    }
    return [input, "", "trash"];
  }

  private parse_distribution(value: string): Distribution {
    if (value.toLowerCase().startsWith("g")) {
      return "gusein-zade";
    } else if (value.toLowerCase().startsWith("z")) {
      return "zipfian";
    } else if (value.toLowerCase().startsWith("s")) {
      return "shallow";
    }
    return "flat";
  }

  private validate_unit(str: string): boolean {
    let inside_square = false;
    let inside_paren = false;

    // We don't want random space or comma inside unit
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

  private parse_decorator(line: string, old_decorator: string): string {
    let new_decorator: "none"|"words"|"categories" = "none"

    line = line.substring(1) // remove at sign
    line = this.escape_mapper.restore_preserve_escaped_chars(line);

    if (line === "words.") {
      line = line.substring(6);
      if (line === "distribution") {
        line = line.substring(12).trim();
        // ignore whitespace up to equals sign
        if (line.startsWith("=")) {
          line = line.substring(1).trim();
          new_decorator = "words";
          this.wordshape_distribution = this.parse_distribution(line);
        }
      } else if (line === "optionals-weight") {
        line = line.substring(16).trim();
        // ignore whitespace up to equals sign
        if (line.startsWith("=")) {
          line = line.substring(1).trim();
          const optionals_weight = make_percentage(line);
          if (optionals_weight == null) {
            this.logger.validation_error(
              `Invalid optionals-weight '${line}' -- expected a number between 1 and 100`,
              this.file_line_num,
            );
          }
          new_decorator = "words";
          this.optionals_weight = optionals_weight;
        }
      }

    } else if (line === "categories.") {
      line = line.substring(11);
      if (line === "distribution") {
        line = line.substring(12).trim();
        // ignore whitespace up to equals sign
        new_decorator = "categories";
        this.category_distribution = this.parse_distribution(line);
      }
    }

    // Errors
    if (new_decorator === "none") {
      this.logger.validation_error(
        `Invalid decorator`,
        this.file_line_num,
      );
    } else if (old_decorator !== "none" && old_decorator !== new_decorator) {
      this.logger.validation_error(
        `Decorator mismatch -- expected '${old_decorator}' decorator after '${old_decorator}' decorator`,
        this.file_line_num,
      );
    }
    return new_decorator;
  }

  private parse_directive(line: string, current_decorator: string): string {
    let temp_directive: Directive = "none";

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
    } else if (line === "features:") {
      temp_directive = "features";
    } else if (line === "feature-field:") {
      temp_directive = "feature-field";
    } else if (line === "stage:") {
      temp_directive = "stage";
    }
    if (temp_directive === "none") {
      return "none"; // Not a directive change
    }

    // Errors
    if (this.directive != "none" && this.directive != current_decorator) {
      this.logger.validation_error(
        `Directive mismatch -- expected '${current_decorator}' directive after '${current_decorator}' decorator`,
        this.file_line_num,
      );
    }
    return temp_directive;
  }

  private parse_graphemes_block(file_array: string[]) {
    let line_value = "";
    this.file_line_num++;

    const my_graphemes: string[] = [];

    for (; this.file_line_num < file_array.length; ++this.file_line_num) {
      line_value = file_array[this.file_line_num];
      line_value = this.escape_mapper.escape_backslash_pairs(line_value);
      line_value = line_value.replace(/;.*/u, "").trim(); // Remove comment!!
      line_value = this.escape_mapper.escape_named_escape(line_value);
      if (line_value === "END") {
        break;
      } // END !!

      const line_graphemes = line_value.split(/[,\s]+/).filter(Boolean);
      for (let i = 0; i < line_graphemes.length; i++) {
        my_graphemes.push(
          this.escape_mapper.restore_escaped_chars(line_graphemes[i]),
        );
      }
    }
    ////
    if (my_graphemes.length == 0) {
      this.logger.validation_error(
        `'graphemes' was introduced but there were no graphemes listed -- expected a list of graphemes`,
        this.file_line_num,
      );
    }
    this.graphemes = Array.from(new Set(my_graphemes));
  }

  private parse_words_block(file_array: string[]) {
    let line_value = "";
    this.file_line_num++;

    let my_first_line_num = 0;
    const done_line_num = false;
    let my_wordshape = "";

    for (; this.file_line_num < file_array.length; ++this.file_line_num) {
      line_value = file_array[this.file_line_num];
      line_value = this.escape_mapper.escape_backslash_pairs(line_value);
      line_value = line_value.replace(/;.*/u, "").trim(); // Remove comment!!
      line_value = this.escape_mapper.escape_named_escape(line_value);
      if (line_value === "END") {
        break;
      } // END !!
      line_value =
        line_value.trimEnd().endsWith(",") || line_value.trimEnd().endsWith(" ")
          ? line_value
          : line_value + " ";
      if (!done_line_num) {
        my_first_line_num = this.file_line_num;
      }

      my_wordshape += line_value;
    }
    this.wordshape_pending = {
      content: my_wordshape,
      line_num: my_first_line_num,
    };
  }

  private valid_words_brackets(str: string): boolean {
    const stack: string[] = [];
    const bracket_pairs: Record<string, string> = {
      ")": "(",
      ">": "<",
      "}": "{",
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

  // TRANSFORMS !!!

  // This is run on parsing file. We then have to run resolve_transforms aftter parse file
  private get_transform(
    input: string,
  ): [string, string, string[], string[], number | null] {
    if (input === "") {
      this.logger.validation_error(`No input`, this.file_line_num);
    }

    input = input.replace(/\/\//g, "!"); // Replace '//' with '!'
    const divided = input.split(/>|->|→|=>|⇒/);
    if (divided.length === 1) {
      this.logger.validation_error(
        `No arrows in transform`,
        this.file_line_num,
      );
    }
    if (divided.length !== 2) {
      this.logger.validation_error(
        `Too many arrows in transform`,
        this.file_line_num,
      );
    }

    const target = divided[0].trim();
    if (target === "") {
      this.logger.validation_error(
        `Target is empty in transform`,
        this.file_line_num,
      );
    }
    if (!this.valid_transform_brackets(target)) {
      this.logger.validation_error(
        `Target had missmatched brackets`,
        this.file_line_num,
      );
    }

    const slash_index = divided[1].indexOf("/");
    const bang_index = divided[1].indexOf("!");
    const question_index = divided[1].indexOf("?");

    const delimiter_index = Math.min(
      slash_index === -1 ? Infinity : slash_index,
      bang_index === -1 ? Infinity : bang_index,
      question_index === -1 ? Infinity : question_index,
    );

    const result =
      delimiter_index === Infinity
        ? divided[1].trim()
        : divided[1].slice(0, delimiter_index).trim();

    if (result == "") {
      this.logger.validation_error(
        `Result is empty in transform`,
        this.file_line_num,
      );
    }
    if (!this.valid_transform_brackets(result)) {
      this.logger.validation_error(
        `Result had missmatched brackets`,
        this.file_line_num,
      );
    }

    const environment =
      delimiter_index === Infinity
        ? ""
        : divided[1].slice(delimiter_index).trim();

    const { conditions, exceptions, chance } =
      this.get_environment(environment);

    return [target, result, conditions, exceptions, chance];
  }

  private get_environment(environment_string: string): {
    conditions: string[];
    exceptions: string[];
    chance: number | null;
  } {
    const conditions: string[] = [];
    const exceptions: string[] = [];
    let chance: number | null = null;

    let buffer = "";
    let mode: "condition" | "exception" | "chance" = "condition";

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
      } else if (ch === "?") {
        if (buffer.trim()) {
          const validated = this.validate_environment(buffer.trim(), mode);
          (mode === "condition" ? conditions : exceptions).push(validated);
        }
        buffer = "";
        mode = "chance";
      } else {
        buffer += ch;
      }
    }

    if (buffer.trim()) {
      const unit = buffer.trim();
      if (mode === "chance") {
        const parsed = parseInt(unit, 10);
        if (chance != null) {
          this.logger.validation_error(
            `Duplicate chance value '${unit}'`,
            this.file_line_num,
          );
        }
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          chance = parsed;
        } else {
          this.logger.validation_error(
            `Chance value "${unit}" must be between 0 and 100`,
            this.file_line_num,
          );
        }
      } else {
        const validated = this.validate_environment(unit, mode);
        (mode === "condition" ? conditions : exceptions).push(validated);
      }
    }

    return {
      conditions: conditions,
      exceptions: exceptions,
      chance: chance,
    };
  }

  private validate_environment(
    unit: string,
    kind: "condition" | "exception" | "chance",
  ): string {
    if (kind === "chance") {
      const parsed = parseInt(unit, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return unit;
      } else {
        this.logger.validation_error(
          `Chance "${unit}" must be a number between 0 and 100`,
          this.file_line_num,
        );
      }
    }

    const parts = unit.split("_");
    if (parts.length !== 2) {
      this.logger.validation_error(
        `${kind} "${unit}" must contain exactly one underscore`,
        this.file_line_num,
      );
    }

    const [before, after] = parts;
    if (!before && !after) {
      this.logger.validation_error(
        `${kind} "${unit}" must have content on at least one side of '_'`,
        this.file_line_num,
      );
    }

    return `${before}_${after}`;
  }

  private parse_clusterfield(file_array: string[]) {
    let line = file_array[this.file_line_num];

    line = this.escape_mapper.escape_backslash_pairs(line);
    line = line.replace(/;.*/u, "").trim(); // Remove comment!!
    line = this.escape_mapper.escape_named_escape(line);

    if (line === "") {
      return;
    } // Blank line. End clusterfield... early !!
    if (line === "END") {
      return;
    } // END ... early !!
    const top_row = line.split(/[,\s]+/).filter(Boolean);
    top_row.shift();
    const row_length = top_row.length;
    this.file_line_num++;

    const concurrent_target: string[] = [];
    const concurrent_result: string[] = [];

    const my_conditions: string[] = [];
    const my_exceptions: string[] = [];
    let my_chance: number | null = null;

    for (; this.file_line_num < file_array.length; ++this.file_line_num) {
      let line = file_array[this.file_line_num];

      line = this.escape_mapper.escape_backslash_pairs(line);
      line = line.replace(/;.*/u, "").trim(); // Remove comment!!
      line = this.escape_mapper.escape_named_escape(line);

      if (line === "") {
        break;
      } // Blank line. End clusterfield !!
      if (line === "END") {
        break;
      } // END !!

      if (line.startsWith("/") || line.startsWith("!")) {
        const { conditions, exceptions, chance } = this.get_environment(line);
        my_conditions.push(...conditions);
        my_exceptions.push(...exceptions);
        my_chance = chance;
        continue;
      }

      const row = line.split(/[,\s]+/).filter(Boolean);
      const column = row[0];
      row.shift();

      if (row.length > row_length) {
        this.logger.validation_error(
          `Cluster-field row too long`,
          this.file_line_num,
        );
      } else if (row.length < row_length) {
        this.logger.validation_error(
          `Cluster-field row too short`,
          this.file_line_num,
        );
      }

      for (let i = 0; i < row_length; ++i) {
        if (row[i] === "+") {
          continue;
        } else {
          concurrent_target.push(column + top_row[i]!);
          concurrent_result.push(row[i]!);
        }
      }
    }
    this.transform_pending.push({
      target: concurrent_target.join(","),
      result: concurrent_result.join(","),
      conditions: my_conditions,
      exceptions: my_exceptions,
      chance: my_chance,
      line_num: this.file_line_num,
    });
  }

  private parse_featurefield(file_array: string[]) {
    let line = file_array[this.file_line_num];

    line = this.escape_mapper.escape_backslash_pairs(line);
    line = line.replace(/;.*/u, "").trim(); // Remove comment!!
    line = this.escape_mapper.escape_named_escape(line);

    if (line === "") {
      return;
    } // Blank line. End clusterfield... early !!
    const top_row = line.split(/[,\s]+/).filter(Boolean);
    top_row.shift(); // Erase +-
    const row_length = top_row.length;
    this.file_line_num++;

    for (; this.file_line_num < file_array.length; ++this.file_line_num) {
      let line = file_array[this.file_line_num];

      line = this.escape_mapper.escape_backslash_pairs(line);
      line = line.replace(/;.*/u, "").trim(); // Remove comment!!
      line = this.escape_mapper.escape_named_escape(line);

      if (line === "") {
        break;
      } // Blank line. End clusterfield !!

      const row = line.split(/[,\s]+/).filter(Boolean);
      const column = row[0];
      row.shift();

      const featureRegex = /^[a-z]+$/;

      if (!featureRegex.test(column)) {
        this.logger.validation_error(
          `A feature in a feature-field must be of lowercase letters only.`,
          this.file_line_num,
        );
      }

      if (row.length > row_length) {
        this.logger.validation_error(
          `Feature-field row too long`,
          this.file_line_num,
        );
      } else if (row.length < row_length) {
        this.logger.validation_error(
          `Feature-field row too short`,
          this.file_line_num,
        );
      }

      const my_pro_graphemes: string[] = [];
      const my_anti_graphemes: string[] = [];

      for (let i = 0; i < row_length; ++i) {
        if (row[i] === ".") {
          continue;
        } else if (row[i] === "+") {
          my_pro_graphemes.push(top_row[i]);
        } else if (row[i] === "-") {
          my_anti_graphemes.push(top_row[i]);
        }
      }
      if (my_pro_graphemes.length > 0) {
        this.feature_pending.set(`+${column}`, {
          content: my_pro_graphemes.join(","),
          line_num: this.file_line_num,
        });
      }
      if (my_anti_graphemes.length > 0) {
        this.feature_pending.set(`-${column}`, {
          content: my_anti_graphemes.join(","),
          line_num: this.file_line_num,
        });
      }
    }
  }

  private valid_transform_brackets(str: string): boolean {
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
}

export default Parser;
