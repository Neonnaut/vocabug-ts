import type Escape_Mapper from "../escape_mapper";
import Logger from "../logger";
import type { Associateme_Mapper } from "../utils/types";



class Canon_Graphemes_Resolver {
  private logger: Logger;
  private escape_mapper: Escape_Mapper;

  private graphemes_pending: string;
  graphemes: string[];

  associateme_mapper: Associateme_Mapper;

  constructor(
    logger: Logger,
    escape_mapper: Escape_Mapper,
    graphemes_pending: string,
  ) {
    this.logger = logger;
    this.escape_mapper = escape_mapper;

    this.graphemes_pending = graphemes_pending;
    this.graphemes = [];
    this.associateme_mapper = [];

    this.resolve_canon_graphemes();
    this.resolve_associatemes();
  }

  public resolve_canon_graphemes() {
    const new_graphemes = this.graphemes_pending.replace(/(<\{|\})/g, ",");

    const graphemes = new_graphemes.split(/[,\s]+/).filter(Boolean);
    for (let i: number = 0; i < graphemes.length; i++) {
      graphemes[i] = this.escape_mapper.restore_escaped_chars(graphemes[i]);
    }
    this.graphemes = Array.from(new Set(graphemes));
  }

  resolve_associatemes() {
    const mapper: Associateme_Mapper = [];
    const input = this.graphemes_pending ?? "";

    // Match sequences like {a,i,u}<{á,í,ú}<{à,ì,ù}
    const setRegex = /\{[^}]+\}(?:\s*<\s*\{[^}]+\})*/g;

    // Gather all matched chains with ranges
    const matches = [...input.matchAll(setRegex)];

    // 1) Detect stray "<" not belonging to a valid chain
    //    Remove matched chains from a copy; any remaining "<" is an error.
    let scrubbed = input;
    for (const m of matches) {
      scrubbed = scrubbed.replace(m[0], "");
    }
    if (scrubbed.includes("<")) {
      this.logger.validation_error(`Stray "<" found outside of a valid associateme entry`);
    }

    // 2) Parse and validate each chain
    for (const m of matches) {
      const segment = m[0];

      // Split into groups
      const groups = segment.split("<").map(g =>
        g
          .replace(/[{}]/g, "")
          .split(",")
          .map(x => x.trim())
          .filter(x => x.length > 0)
      );

      // Must have at least the bases group
      if (groups.length === 0) {
        this.logger.validation_error(`A base assosiateme was empty in the graphemes directive`);
      }

      const bases = groups[0];

      // Bases must be non-empty
      if (bases.length === 0) {
        this.logger.validation_error(`A base assosiateme was empty in the graphemes directive`);
      }

      // All variant groups (including bases) must have equal length
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

      // Include bases as first variant
      const variants = [...groups];

      mapper.push({ bases, variants });
    }

    this.associateme_mapper = mapper;
  }

}

export default Canon_Graphemes_Resolver;
