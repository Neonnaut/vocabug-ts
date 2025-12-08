import Word from "../word";
import Logger from "../logger";
import {
  swap_first_last_items,
  reverse_items,
  graphemosis,
} from "../utils/utilities";
import type {
  Token,
  Output_Mode,
  Routine,
  Transform,
  Associateme_Mapper,
} from "../utils/types";
import Reference_Mapper from "./reference_mapper";

import { xsampa_to_ipa, ipa_to_xsampa } from "./xsampa";
import { roman_to_hangul } from "./hangul";
import Carryover_Associator from "./carryover_associator";

type Match_Result = {
  start: number; // actual match start
  end: number; // exclusive end index
  matched: string[]; // matched tokens
};

type Replacement = {
  index_span: number;
  length_span: number;
  target_stream: string[];
  replacement_stream: string[];
  matched_conditions: string[];
};

class Transformer {
  public logger: Logger;

  public transforms: Transform[];

  public graphemes: string[];

  private debug: boolean = false;

  private associateme_mapper: Associateme_Mapper;

  constructor(
    logger: Logger,
    graphemes: string[],
    transforms: Transform[],
    output_mode: Output_Mode,
    associateme_mapper: Associateme_Mapper,
  ) {
    this.logger = logger;
    this.graphemes = graphemes;
    this.transforms = transforms;
    this.associateme_mapper = associateme_mapper;
    this.debug = output_mode === "debug";
  }

  run_routine(
    routine: string,
    word: Word,
    word_stream: string[],
    line_num: number,
  ) {
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
      case "roman-to-hangul":
        modified_word = roman_to_hangul(full_word);
        break;
      default:
        this.logger.validation_error("This should not have happened");
    }
    word.record_transformation(
      `<routine = ${routine}>`,
      modified_word,
      line_num,
    );
    return graphemosis(modified_word, this.graphemes);
  }

  target_to_word_match(
    word_tokens: string[],
    raw_target: Token[],
    reference_mapper: Reference_Mapper,
    carryover_associator: Carryover_Associator,
  ): [number, number, string[]] {
    for (let j = 0; j <= word_tokens.length; j++) {
      const result = this.match_pattern_at(
        word_tokens,
        raw_target,
        j,
        reference_mapper,
        carryover_associator,
        word_tokens.length,
      );
      if (result !== null) {
        return [result.start, result.end - result.start, result.matched];
      }
    }
    return [0, 0, []];
  }

  result_former(
    raw_result: Token[],
    target_stream: string[],
    reference_mapper: Reference_Mapper,
    carryover_associator: Carryover_Associator,
  ): string[] {
    const replacement_stream: string[] = [];
    for (let j = 0; j < raw_result.length; j++) {
      const my_result_token: Token = raw_result[j];

      if (my_result_token.type === "grapheme") {
        if (my_result_token.association) {
          // Has association
          // THIS
          const my_grapheme: string | null =
            carryover_associator.get_result_associateme(
              my_result_token.association,
              this.associateme_mapper,
            );

          // No grapheme found in associateme_mapper, push unaltered base
          if (my_grapheme === null) {
            for (let k: number = 0; k < my_result_token.min; k++) {
              replacement_stream.push(my_result_token.base);
            }
            // Else push found grapheme
          } else {
            for (let k: number = 0; k < my_result_token.min; k++) {
              replacement_stream.push(my_grapheme);
            }
          }
        } else {
          for (let k: number = 0; k < my_result_token.min; k++) {
            replacement_stream.push(my_result_token.base);
          }
        }
      } else if (my_result_token.type === "target-mark") {
        for (let k: number = 0; k < target_stream.length; k++) {
          replacement_stream.push(target_stream[k]);
        }
      } else if (my_result_token.type === "metathesis-mark") {
        const my_metathesis_graphemes = swap_first_last_items([
          ...target_stream,
        ]);
        replacement_stream.push(...my_metathesis_graphemes);
      } else if (my_result_token.type === "reference-start-capture") {
        // looks like `<=`
        reference_mapper.set_capture_stream_index(replacement_stream.length);
      } else if (my_result_token.type === "reference-capture") {
        // Looks like `=1`
        reference_mapper.capture_reference(
          my_result_token.key,
          replacement_stream,
        );
      } else if (my_result_token.type === "reference-mark") {
        // It's a reference mark
        const reference_value: string[] =
          reference_mapper.get_captured_reference(my_result_token.key);

        replacement_stream.push(...reference_value);
      }
    }
    reference_mapper.reset_capture_stream_index();
    return replacement_stream;
  }

  resolve_association(
    mapper: Associateme_Mapper,
    grapheme: string,
  ): { entry_id: number; base_id: number; variant_id: number } | null {
    for (let entry_id = 0; entry_id < mapper.length; entry_id++) {
      const entry = mapper[entry_id];
      for (
        let variant_id = 0;
        variant_id < entry.variants.length;
        variant_id++
      ) {
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

  get_variant_id_for_base(
    mapper: Associateme_Mapper,
    entry_id: number,
    base_id: number,
    grapheme: string,
  ): number | null {
    // bounds guard
    if (entry_id < 0 || entry_id >= mapper.length) return null;
    const entry = mapper[entry_id];
    if (base_id < 0 || base_id >= entry.bases.length) return null;

    // check all variants in the same column (includes bases at variant_id = 0)
    for (let variant_id = 0; variant_id < entry.variants.length; variant_id++) {
      if (entry.variants[variant_id][base_id] === grapheme) {
        return variant_id;
      }
    }
    return null;
  }

  // BEFORE and AFTER and TARGET use this
  match_pattern_at(
    stream: string[],
    pattern: Token[],
    start: number,
    reference_mapper: Reference_Mapper,
    carryover_associator: Carryover_Associator | null,
    max_end?: number,
    target_stream?: string[],
  ): Match_Result | null {
    let i = start;
    let j = 0;
    const matched: string[] = [];

    while (j < pattern.length) {
      const token = pattern[j];
      if (
        token.type !== "grapheme" &&
        token.type !== "wildcard" &&
        token.type !== "anythings-mark" &&
        token.type !== "target-mark" &&
        token.type !== "metathesis-mark" &&
        token.type !== "syllable-boundary" &&
        token.type !== "word-boundary" &&
        token.type !== "empty-mark" &&
        token.type !== "reference-capture" &&
        token.type !== "reference-mark" &&
        token.type !== "reference-start-capture"
      ) {
        j++;
        continue;
      }
      const min = token.min;
      const max = token.max;
      const max_available =
        max_end !== undefined ? Math.min(max, max_end - i) : max;

      if (token.type === "grapheme") {
        if (token.association) {
          // Association branch: consume only if stream[i + count] is a valid variant
          let count = 0;

          // Require token.association to supply the base coordinates
          const baseEntryId = token.association.entry_id;
          const baseBaseId = token.association.base_id;

          while (count < token.max && i + count < stream.length) {
            const grapheme = stream[i + count];

            // Is this grapheme a variant of the given base column?
            const variant_id = this.get_variant_id_for_base(
              this.associateme_mapper,
              baseEntryId,
              baseBaseId,
              grapheme,
            );

            if (variant_id !== null) {
              // record entry_id/variant_id if the associator wants targets
              if (token.association.is_target && carryover_associator) {
                carryover_associator.set_item(baseEntryId, variant_id);
              }
              count++; // consume this grapheme
            } else {
              break; // stop on first non-variant
            }
          }

          // enforce minimum requirement
          if (count < token.min) {
            return null;
          }

          // push consumed graphemes and advance index
          matched.push(...stream.slice(i, i + count));
          i += count;
        } else {
          // no association
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
            "Target-mark requires a non-empty target_stream",
          );
        }

        const unit = target_stream;
        const unit_length = unit.length;
        const min = token.min;
        const max = token.max;

        const max_available =
          max_end !== undefined
            ? Math.min(max, Math.floor((max_end - i) / unit_length))
            : max;

        let repetitions = 0;

        while (
          repetitions < max_available &&
          stream
            .slice(
              i + repetitions * unit_length,
              i + (repetitions + 1) * unit_length,
            )
            .every((val, idx) => val === unit[idx])
        ) {
          repetitions++;
        }

        if (repetitions < min) {
          return null;
        }

        const total_length = repetitions * unit_length;
        matched.push(...stream.slice(i, i + total_length));
        i += total_length;
      } else if (token.type === "metathesis-mark") {
        if (!target_stream || target_stream.length === 0) {
          this.logger.validation_error(
            "Metathesis-mark requires a non-empty target_stream",
          );
        }

        const unit = swap_first_last_items([...target_stream]);
        const unit_length = unit.length;
        const min = token.min;
        const max = token.max;

        const max_available =
          max_end !== undefined
            ? Math.min(max, Math.floor((max_end - i) / unit_length))
            : max;

        let repetitions = 0;

        while (
          repetitions < max_available &&
          stream
            .slice(
              i + repetitions * unit_length,
              i + (repetitions + 1) * unit_length,
            )
            .every((val, idx) => val === unit[idx])
        ) {
          repetitions++;
        }

        if (repetitions < min) {
          return null;
        }

        const total_length = repetitions * unit_length;
        matched.push(...stream.slice(i, i + total_length));
        i += total_length;
      } else if (token.type === "empty-mark") {
        matched.push(""); // matches nothing
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

        if (stream[i] === ".") {
          // syllable-boundary in pattern represents a '.'
          while (count < max_available && stream[i + count] === ".") {
            count++;
          }
          if (count < min) {
            return null;
          }
          matched.push(...stream.slice(i, i + count));
          i += count;
        } else if (i === 0 || i === stream.length) {
          // syllable-boundary in pattern represents a word boundary
          // doesn't consume stream characters, just validates position
          if (min > 1) return null;
          matched.push("$"); // symbolic trace marker (optional)
          // no increment to i
        } else {
          return null; // neither '.' nor word boundary
        }
      } else if (token.type === "word-boundary") {
        if (i === 0 || i === stream.length) {
          // valid word boundary position
          if (min > 1) return null;
          matched.push("#"); // symbolic trace marker (optional)
          // no increment to i
        } else {
          return null; // not a word boundary
        }
      } else if (token.type === "anythings-mark") {
        const blocked = token.blocked_by ?? [];
        const consume = token.consume ?? [];

        let count = 0;

        outer: while (
          count < max_available &&
          stream[i + count] !== undefined
        ) {
          // Check for blocked sequences
          for (const group of blocked) {
            const group_len = group.length;
            const slice = stream.slice(i + count, i + count + group_len);

            if (
              slice.length === group_len &&
              slice.every((val, idx) => val === group[idx])
            ) {
              break outer; // Blocker matched → halt traversal
            }
          }

          // Check for consume sequence match
          for (const group of consume) {
            const group_len = group.length;
            const slice = stream.slice(i + count, i + count + group_len);

            if (
              slice.length === group_len &&
              slice.every((val, idx) => val === group[idx])
            ) {
              count += group_len; // Consume the group
              break outer; // Stop traversal after consuming
            }
          }

          count++; // Advance if no blocker or consume match
        }

        if (count < token.min) {
          return null;
        }

        matched.push(...stream.slice(i, i + count));
        i += count;
      } else if (token.type === "reference-start-capture") {
        // looks like `<=`
        reference_mapper.set_capture_stream_index(matched.length);
      } else if (token.type === "reference-capture") {
        // Looks like `=1`
        reference_mapper.capture_reference(token.key, matched);
      } else if (token.type === "reference-mark") {
        const reference_value: string[] =
          reference_mapper.get_captured_reference(token.key);
        const unit_length = reference_value.length;

        if (unit_length === 0) {
          return null; // nothing to match
        }

        const max_available =
          max_end !== undefined
            ? Math.min(token.max, Math.floor((max_end - i) / unit_length))
            : token.max;

        let repetitions = 0;

        while (
          repetitions < max_available &&
          stream
            .slice(
              i + repetitions * unit_length,
              i + (repetitions + 1) * unit_length,
            )
            .every((val, idx) => val === reference_value[idx])
        ) {
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
      matched,
    };
  }

  environment_match(
    word_stream: string[],
    target_stream: string[],
    startIdx: number,
    raw_target: string[],
    before: Token[],
    after: Token[],
    reference_mapper: Reference_Mapper,
  ): [boolean, string] {
    const human_readable_condition_match: string[] = [" / "];

    const target_len = raw_target.length;

    // BEFORE logic
    const before_tokens = before;

    let before_matched = false;
    for (let i = 0; i <= startIdx; i++) {
      const result = this.match_pattern_at(
        word_stream,
        before_tokens,
        i,
        reference_mapper,
        null,
        startIdx,
        target_stream,
      );
      if (result !== null && result.end === startIdx) {
        before_matched = true;
        human_readable_condition_match.push(...result.matched);
        break;
      }
    }
    if (!before_matched) return [false, ""];

    human_readable_condition_match.push("_");

    // AFTER logic
    const after_tokens = after;
    const after_start = startIdx + target_len;

    const result = this.match_pattern_at(
      word_stream,
      after_tokens,
      after_start,
      reference_mapper,
      null,
      word_stream.length,
      target_stream,
    );

    if (result === null) {
      return [false, ""];
    }
    human_readable_condition_match.push(...result.matched);
    return [true, human_readable_condition_match.join("")];
  }

  // Non destructively apply replacements
  replacementa(
    word_stream: string[],
    replacements: Replacement[],
    word: Word,
    exceptions: { before: Token[]; after: Token[] }[],
    line_num: number,
  ): string[] {
    // Sort replacements by index to apply left-to-right
    replacements.sort((a, b) => a.index_span - b.index_span);

    const blocked = new Set<number>();
    const insertion_map = new Map<number, string[]>();
    const replacement_map = new Map<
      number,
      { length_span: number; replacement_stream: string[] }
    >();

    for (const r of replacements) {
      if (r.length_span === 0) {
        if (!insertion_map.has(r.index_span))
          insertion_map.set(r.index_span, []);
        insertion_map.get(r.index_span)!.push(...r.replacement_stream);
      } else {
        replacement_map.set(r.index_span, {
          length_span: r.length_span,
          replacement_stream: r.replacement_stream,
        });
      }
    }

    const result_tokens: string[] = [];
    const applied_targets: string[] = [];
    const applied_results: string[] = [];

    let i = 0;

    while (i < word_stream.length) {
      // 🪛 Insert before i
      if (insertion_map.has(i)) {
        for (const rep of insertion_map.get(i)!) {
          applied_targets.push("^");
          applied_results.push(rep);
          result_tokens.push(rep);
        }
      }

      // 🔁 Replace current token span
      const replacement = replacement_map.get(i);
      if (
        replacement &&
        ![...Array(replacement.length_span).keys()].some((k) =>
          blocked.has(i + k),
        )
      ) {
        const replaced_chunk = word_stream.slice(
          i,
          i + replacement.length_span,
        );
        if (replacement.replacement_stream.length > 0) {
          result_tokens.push(...replacement.replacement_stream);
        }

        applied_targets.push(replaced_chunk.join(""));
        applied_results.push(
          replacement.replacement_stream.length === 0
            ? "∅"
            : replacement.replacement_stream.join(""),
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

    // Handle insertions after the last token
    if (insertion_map.has(word_stream.length)) {
      for (const rep of insertion_map.get(word_stream.length)!) {
        applied_targets.push("^");
        applied_results.push(rep);
        result_tokens.push(rep);
      }
    }

    const normalized = result_tokens;

    // 🧾 Log transformation summary
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

      const transformation_str = `${applied_targets.join(", ")} → ${applied_results.join(", ")}`;

      word.record_transformation(
        `${transformation_str}${my_conditions}${my_exceptions}`,
        normalized.join(" "),
        line_num,
      );
    }
    return normalized;
  }

  apply_transform(
    word: Word,
    word_stream: string[],
    transform: {
      routine: null | Routine;
      target: Token[][];
      result: Token[][];
      conditions: { before: Token[]; after: Token[] }[];
      exceptions: { before: Token[]; after: Token[] }[];
      chance: number | null;
      line_num: number;
    },
  ): string[] {
    const {
      routine,
      target,
      result,
      conditions,
      exceptions,
      chance,
      line_num,
    } = transform;

    // CHANCE CONDITION
    if (chance != null && Math.random() * 100 >= chance) {
      return word_stream;
    } // 🎲 Roll failed

    // ROUTINE
    if (routine != null) {
      word_stream = this.run_routine(routine, word, word_stream, line_num);
    }

    if (target.length !== result.length) {
      this.logger.validation_error(
        "Mismatched target/result concurrent set lengths in a transform",
        line_num,
      );
    }

    const replacements: Replacement[] = []; ///

    for (let i = 0; i < target.length; i++) {
      const reference_mapper = new Reference_Mapper(); // New mapper for each transform application

      const carryover_associator = new Carryover_Associator();

      const raw_target: Token[] = target[i]; // like 'abc' of 'abc, hij > y, z'
      const raw_result: Token[] = result[i]; // like 'y' of 'abc, hij > y, z'

      let mode: "deletion" | "insertion" | "reject" | "replacement" =
        "replacement";

      // NOW, build-up REPLACEMENT STREAM from RESULT tokens.
      if (raw_result[0].type === "deletion") {
        // DELETION
        mode = "deletion";
      } else if (raw_result[0].type === "reject") {
        // REJECT
        mode = "reject";
      } else {
        // NORMAL GRAPHEME STREAM
        // Just get the references in replace_stream
        this.target_to_word_match(
          word_stream,
          raw_target,
          reference_mapper,
          carryover_associator,
        );
      }

      // NOW, Go through TARGET
      if (raw_target[0].type === "insertion") {
        // INSERTION
        if (mode === "deletion" || mode === "reject") {
          this.logger.validation_error(
            `Inserion of ${mode} is not valid`,
            line_num,
          );
        }
        if (conditions.length === 0) {
          this.logger.validation_error(
            "Insertion without a condition is not valid",
            line_num,
          );
        }
        mode = "insertion";
        for (
          let insert_index = 0;
          insert_index <= word_stream.length;
          insert_index++
        ) {
          // CREATE REPLACEMENT STREAM
          const my_replacement_stream = this.result_former(
            raw_result,
            word_stream,
            reference_mapper,
            carryover_associator,
          );

          // Get environment bindings 1

          const matched_conditions: string[] = [];
          let passes = conditions.length === 0;

          for (const c of conditions) {
            const temp_mapper = reference_mapper.clone();
            const [pass, result] = this.environment_match(
              word_stream,
              my_replacement_stream,
              insert_index,
              [],
              c.before,
              c.after,
              temp_mapper,
            );
            if (pass) {
              matched_conditions.push(result);
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
              temp_mapper,
            );
            return block;
          });

          if (!passes || blocked) continue;

          const second_replacement_stream = this.result_former(
            raw_result,
            word_stream,
            reference_mapper,
            carryover_associator,
          );

          replacements.push({
            index_span: insert_index,
            length_span: 0,
            target_stream: ["^"], // symbolic marker for insertion
            replacement_stream: second_replacement_stream,
            matched_conditions: matched_conditions,
          });
        }
      } else {
        // TARGET is normal stream of grapheme, wildcard, anythings-mark, syllable ...
        let cursor = 0;

        while (cursor <= word_stream.length) {
          const [match_index, match_length, matched_stream] =
            this.target_to_word_match(
              word_stream.slice(cursor),
              raw_target,
              reference_mapper,
              carryover_associator,
            );

          if (match_length === 0) {
            cursor++;
            continue;
          }

          const global_index = cursor + match_index;

          // Condition match and exception not match 2

          const matched_conditions: string[] = [];
          let passes = conditions.length === 0;

          for (const c of conditions) {
            const temp_mapper = reference_mapper.clone();
            const [pass, result] = this.environment_match(
              word_stream,
              matched_stream,
              global_index,
              matched_stream,
              c.before,
              c.after,
              temp_mapper,
            );
            if (pass) {
              matched_conditions.push(result);
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
              temp_mapper,
            );
            return block;
          });

          if (!passes || blocked) {
            cursor = global_index + 1;
            continue; // skip this match
          }

          if (mode === "reject") {
            word.rejected = true;

            word.record_transformation(
              `${matched_stream.join("")} → 0`,
              "∅",
              line_num,
            );
            return word_stream;
          } else if (mode === "deletion") {
            replacements.push({
              index_span: global_index,
              length_span: match_length,
              target_stream: matched_stream,
              replacement_stream: [],
              matched_conditions: matched_conditions,
            });
          } else {
            // Get replacement bindings

            // CREATE REPLACEMENT STREAM
            const my_replacement_stream = this.result_former(
              raw_result,
              matched_stream,
              reference_mapper,
              carryover_associator,
            );

            replacements.push({
              index_span: global_index,
              length_span: match_length,
              target_stream: matched_stream,
              replacement_stream: my_replacement_stream,
              matched_conditions: matched_conditions,
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
      line_num,
    );
    return word_stream;
  }

  do_transforms(word: Word): Word {
    if (word.get_last_form() == "") {
      word.rejected = true;
      return word;
    }
    if (this.transforms.length == 0) {
      return word;
    } // No transforms

    let tokens = graphemosis(word.get_last_form(), this.graphemes);

    for (const t of this.transforms) {
      if (word.rejected) {
        break;
      }
      if (t.target.length == 0) {
        continue;
      }
      tokens = this.apply_transform(word, tokens, t);
      if (tokens.length == 0) {
        word.rejected = true;
        if (this.debug) {
          word.record_transformation(`<reject-null-word>`, `∅`);
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

  get_variant_id(
    mapper: Associateme_Mapper,
    grapheme: string,
    baseToken: { entry_id: number; base_id: number },
  ): number | null {
    const { entry_id, base_id } = baseToken;

    // Guard against out-of-range entry
    if (entry_id < 0 || entry_id >= mapper.length) return null;

    const entry = mapper[entry_id];

    // Guard against out-of-range base index
    if (base_id < 0 || base_id >= entry.bases.length) return null;

    // Check each variant group at the same column (base_id)
    for (let variant_id = 0; variant_id < entry.variants.length; variant_id++) {
      if (entry.variants[variant_id][base_id] === grapheme) {
        return variant_id; // return the variant index
      }
    }
    return null; // not found
  }
}

export default Transformer;
