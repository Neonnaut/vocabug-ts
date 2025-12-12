import type Escape_Mapper from "./escape_mapper";
import Logger from "./logger";
import Supra_Builder from "./generata/supra_builder";

import { make_percentage, cappa } from "./utils/utilities";
import type {
  Output_Mode,
  Distribution,
  Directive,
  Routine,
  Transform_Pending,
} from "./utils/types";

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

  public transform_pending: Transform_Pending[];

  public graphemes: string[];

  public graphemes_pending: string = "";

  public alphabet: string[];
  public invisible: string[];

  private file_line_num = 0;

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

    this.transform_pending = [];
    this.feature_pending = new Map();

    this.alphabet = [];
    this.invisible = [];

    this.graphemes_pending = "";
    this.graphemes = [];
  }

  parse_file(file: string) {
    const file_array = file.split("\n");

    let my_decorator: string = "none";
    let my_directive: string = "none";
    let my_subdirective: string = "none";
    let my_header: string[] = [];
    let my_clusterfield_transform: Transform_Pending[] = [];

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
      if (line.startsWith("@")) {
        my_decorator = this.parse_decorator(line, my_decorator);
        if (my_decorator != "none") {
          my_header = [];
          continue; // It's a decorator
        }
      }

      // check for directive change
      const temp_directive = this.parse_directive(line, my_decorator);
      if (temp_directive != "none") {
        if (my_clusterfield_transform.length > 0) {
          //////
        }

        if (my_subdirective != "none") {
          this.logger.validation_error(
            `${my_subdirective} was not closed before directive change`,
            this.file_line_num,
          );
        }
        my_directive = temp_directive;
        my_decorator = "none";
        continue; // It's a directive change
      }

      // NO DIRECTIVE
      if (my_directive === "none") {
        this.logger.validation_error(
          `Invalid syntax -- expected a decorator or directive`,
          this.file_line_num,
        );
      }

      // CATEGORIES
      if (my_directive === "categories") {
        const [key, field, valid] = this.get_cat_seg_fea(line, "category");
        if (!valid) {
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
        const [key, field, valid] = this.get_cat_seg_fea(line, "unit");
        if (!valid) {
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
        this.units.set(`<${key}>`, {
          content: `${field}`,
          line_num: this.file_line_num,
        });
      }

      // FEATURES
      if (my_directive === "features") {
        const [key, field, valid] = this.get_cat_seg_fea(line, "feature");
        if (!valid) {
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
        if (my_header.length === 0) {
          const top_row = line.split(/[\s]+/).filter(Boolean);
          if (top_row.length < 2) {
            this.logger.validation_error(
              `Feature-field header too short`,
              this.file_line_num,
            );
          }
          my_header = top_row;
          continue;
        } else {
          this.parse_featurefield(line, my_header);
        }
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
        this.graphemes_pending += " " + line;
        continue; // Added some graphemes
      }

      // STAGE
      if (my_directive === "stage") {
        if (my_subdirective === "clusterfield") {
          if (line.startsWith(">")) {
            this.transform_pending.push(...my_clusterfield_transform);
            my_subdirective = "none";
            my_header = [];
            my_clusterfield_transform = [];
            continue;
          }

          // Do actual line of clusterfield
          my_clusterfield_transform = this.parse_clusterfield(
            line,
            my_header,
            my_clusterfield_transform,
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
            line_num: this.file_line_num,
          });
          line = line.substring(2).trim(); // Remove '< ' from start
          const top_row = line.split(/[\s]+/).filter(Boolean);
          if (top_row.length < 2) {
            this.logger.validation_error(
              `Feature-field header too short`,
              this.file_line_num,
            );
          }
          my_subdirective = "clusterfield";
          my_header = top_row;
          continue;
        } else if (line.startsWith("<routine")) {
          // Routine
          const my_routine = this.parse_routine(line);
          this.transform_pending.push({
            t_type: my_routine,
            target: "\\",
            result: "\\",
            conditions: [],
            exceptions: [],
            chance: null,
            line_num: this.file_line_num,
          });
          continue;
        } else {
          // Else it's a normal transform rule
          const [target, result, conditions, exceptions] =
            this.get_transform(line);

          this.transform_pending.push({
            t_type: "rule",
            target: target,
            result: result,
            conditions: conditions,
            exceptions: exceptions,
            chance: null,
            line_num: this.file_line_num,
          });
          continue;
        }
      }
    }
    // out of line loop now
    if (my_decorator != "none") {
      this.logger.validation_error(
        `Decorator '${my_decorator}' was not followed by a directive`,
        this.file_line_num,
      );
    }
  }

  get_cat_seg_fea(
    input: string,
    mode: "category" | "unit" | "feature",
  ): [string, string, boolean] {
    const divider = "=";

    if (input === "") {
      return ["", "", false]; // Handle invalid inputs
    }
    const divided = input.split(divider);
    if (divided.length !== 2) {
      return [input, "", false]; // Ensure division results in exactly two parts
    }
    const key = divided[0].trim();
    const field = divided[1].trim();
    if (key === "" || field === "") {
      return [input, "", false]; // Handle empty parts
    }

    // Construct dynamic regexes using cappa
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
    let new_decorator: "none" | "words" | "categories" = "none";
    line = line.substring(1); // remove '@' sign
    line = this.escape_mapper.restore_preserve_escaped_chars(line);

    // Count occurrences
    const dotCount = (line.match(/\./g) || []).length;
    const eqCount = (line.match(/=/g) || []).length;

    if (dotCount !== 1 || eqCount !== 1) {
      this.logger.validation_error(
        `Invalid decorator format`,
        this.file_line_num,
      );
    }

    // Split at the first "."
    const [my_directive, my_thing] = line.split(/\.(.+)/).filter(Boolean);

    // Split the remainder at "="
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
            this.file_line_num,
          );
        }
        my_value = my_value.slice(0, -1).trim(); // Remove '%' sign
        const optionals_weight = make_percentage(my_value);
        if (optionals_weight == null) {
          this.logger.validation_error(
            `Invalid optionals-weight '${my_value}' -- expected a number between 1 and 100`,
            this.file_line_num,
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

    // Errors
    if (new_decorator === "none") {
      this.logger.validation_error(`Invalid decorator`, this.file_line_num);
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
    if (current_decorator != "none" && temp_directive != current_decorator) {
      this.logger.validation_error(
        `Directive mismatch -- expected '${current_decorator}' directive after '${current_decorator}' decorator`,
        this.file_line_num,
      );
    }
    return temp_directive;
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

  private parse_clusterfield(
    line: string,
    my_header: string[],
    my_transforms: Transform_Pending[],
  ): Transform_Pending[] {
    if (my_transforms.length === 0) {
      this.logger.validation_error(
        `Clusterfield transform not started properly`,
        this.file_line_num,
      );
    }
    const my_transform = my_transforms[0];

    my_transform.target += ", ";
    my_transform.result += ", ";

    /// -------------

    //        my_header
    // my_key my_row

    // my_transform

    const my_row = line.split(/[\s]+/).filter(Boolean);
    const my_key = my_row.shift();

    if (my_row.length !== my_header.length || my_key === undefined) {
      this.logger.validation_error(
        `Cluster-field row length mismatch with header length -- expected row length of ${my_header.length} but got lenght of ${my_row.length}`,
        this.file_line_num,
      );
    }

    const my_target: string[] = [];
    const my_result: string[] = [];
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

  private parse_routine(line: string): Routine {
    line = this.escape_mapper.restore_preserve_escaped_chars(line);

    // Count occurrences
    const eqCount = (line.match(/=/g) || []).length;
    if (eqCount !== 1) {
      this.logger.validation_error(
        `Invalid routine format1 '${line}'`,
        this.file_line_num,
      );
    }

    // Split at "="
    let [, right] = line.split("=");
    right = right.trim();

    const gtCount = (right.match(/>/g) || []).length;
    if (gtCount !== 1) {
      this.logger.validation_error(
        `Invalid routine format '${line}'`,
        this.file_line_num,
      );
    }

    // Split at ">"
    let [routine] = right.split(">");
    routine = routine.trim();

    routine = routine.replace(/\bcapitalize\b/g, "capitalise");
    routine = routine.replace(/\broman-to-hangeul\b/g, "roman-to-hangul");

    switch (routine) {
      case "reverse":
      case "compose":
      case "decompose":
      case "capitalise":
      case "roman-to-hangul":
      case "decapitalise":
      case "to-uppercase":
      case "to-lowercase":
      case "xsampa-to-ipa":
      case "ipa-to-xsampa":
        return routine as Routine;
    }
    this.logger.validation_error(
      `Invalid routine '${routine}'`,
      this.file_line_num,
    );
  }

  // TRANSFORMS !!!

  // This is run on parsing file. We then have to run resolve_transforms aftter parse file
  private get_transform(input: string): [string, string, string[], string[]] {
    if (input === "") {
      this.logger.validation_error(`No input`, this.file_line_num);
    }

    input = input.replace(/\/\//g, "!"); // Replace '//' with '!'
    const divided = input.split(/>>|->|→|=>|⇒/);
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

    const delimiter_index = Math.min(
      slash_index === -1 ? Infinity : slash_index,
      bang_index === -1 ? Infinity : bang_index,
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

    const { conditions, exceptions } = this.get_environment(environment);

    return [target, result, conditions, exceptions];
  }

  private get_environment(environment_string: string): {
    conditions: string[];
    exceptions: string[];
  } {
    const conditions: string[] = [];
    const exceptions: string[] = [];

    let buffer = "";
    let mode: "condition" | "exception" = "condition";

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
      conditions: conditions,
      exceptions: exceptions,
    };
  }

  private validate_environment(
    unit: string,
    kind: "condition" | "exception",
  ): string {
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

  private parse_featurefield(line: string, top_row: string[]) {
    const my_row = line.split(/[\s]+/).filter(Boolean);
    const my_key = my_row.shift();
    if (my_row.length !== top_row.length || my_key === undefined) {
      this.logger.validation_error(
        `Feature-field row length mismatch with header length -- expected row length of ${top_row.length} but got lenght of ${my_row.length}`,
        this.file_line_num,
      );
    }

    const keyRegex = /^[a-zA-Z+-]+$/;
    if (!keyRegex.test(my_key)) {
      this.logger.validation_error(
        `A feature in a feature-field must be of lowercase letters only.`,
        this.file_line_num,
      );
    }

    const my_pro_graphemes: string[] = [];
    const my_anti_graphemes: string[] = [];
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
          this.file_line_num,
        );
      }
    }
    if (my_pro_graphemes.length > 0) {
      this.feature_pending.set(`+${my_key}`, {
        content: my_pro_graphemes.join(","),
        line_num: this.file_line_num,
      });
    }
    if (my_anti_graphemes.length > 0) {
      this.feature_pending.set(`-${my_key}`, {
        content: my_anti_graphemes.join(","),
        line_num: this.file_line_num,
      });
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
