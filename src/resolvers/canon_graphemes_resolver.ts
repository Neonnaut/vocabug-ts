import type Escape_Mapper from "../escape_mapper";
import Logger from "../logger";

type Associateme_Mapper = Map<string, string[]>;

class Canon_Graphemes_Resolver {
  private logger: Logger;
  private escape_mapper: Escape_Mapper;

  private graphemes_pending: string;
  graphemes: string[];

  associateme_mapper: Associateme_Mapper = new Map();

  constructor(
    logger: Logger,
    escape_mapper: Escape_Mapper,
    graphemes_pending: string,
  ) {
    this.logger = logger;
    this.escape_mapper = escape_mapper;

    this.graphemes_pending = graphemes_pending;
    this.graphemes = [];
    this.associateme_mapper = new Map();

    this.resolve_canon_graphemes();
    this.resolve_associatemes();
  }

  public resolve_canon_graphemes() {
    const new_graphemes = this.graphemes_pending.replace(/(<\{|\})/g, "");

    const graphemes = new_graphemes.split(/[,\s]+/).filter(Boolean);
    for (let i: number = 0; i < graphemes.length; i++) {
      graphemes[i] = this.escape_mapper.restore_escaped_chars(graphemes[i]);
    }
    this.graphemes = Array.from(new Set(graphemes));
  }

  public resolve_associatemes() {
    const new_graphemes = this.graphemes_pending.replace(/(<\{|\})/g, "");

    const graphemes = new_graphemes.split(/[,\s]+/).filter(Boolean);
    for (let i: number = 0; i < graphemes.length; i++) {
      graphemes[i] = this.escape_mapper.restore_escaped_chars(graphemes[i]);
    }
    this.graphemes = Array.from(new Set(graphemes));
  }
}

export default Canon_Graphemes_Resolver;
