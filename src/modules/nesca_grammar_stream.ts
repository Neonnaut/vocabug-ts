import Logger from './logger.js';

type Token =
  | {
      type: "grapheme"; // ch, a, \*
      base: string;
      min?: number;
      max?: number|null;
      position?: number;
    }
  | {
      type: "wildcard"; //*
      base: "*";
      min?: number;
      max?: number|null;
      position?: number;
    }
  | {
      type: "pending"; //*
      base: string;
      min?: number;
      max?: number|null;
      position?: number;
    }
  | {
      type: "anythings-mark"; //^
      base: "~";
      min?: number;
      max?: number;
      position?: number;
      blocked_by?: string[];
    };


class Nesca_Grammar_Stream {
    private graphemes: string[];
    public logger: Logger;

    constructor(
        graphemes: string[],
        logger: Logger
    ) {
        this.graphemes = graphemes
        this.logger = logger;
    }

    main_parser(stream:string): Token[] {
      let i = 0;
      const tokens: Token[] = [];

      while (i < stream.length) {
        let new_token: Token = {
          type: "pending",
          base: ""
        };

        const char = stream[i];
        // Skip whitespace
        if (/\s/.test(char)) {
          i++;
          continue;
        }
        
        // GET THE BASE. ALL ABOUT THAT BASE

        // Parse anything-mark
        if (char === "~") {
          new_token = {
            type: "anythings-mark",
            base: "~"
          };
          i++;
        } else if (char === "*") {
          new_token = {
            type: "wildcard",
            base: "*"
          };
          i++;
        } else if (char === "+" || char === ":" || char === "@") {
          throw new Error(`Unexpected character '${char}' at position ${i}`);

        } else {
          // Default: grapheme
          let matched = false;
          for (const g of this.graphemes.sort((a, b) => b.length - a.length)) {
              if (stream.startsWith(g, i)) {
                  new_token = {
                    type: "grapheme",
                    base: g
                  };
                  i += g.length;
                  matched = true;
                  break;
              }
          }
          if (!matched) {
            new_token = {
              type: "grapheme",
              base: stream[i] // Fallback to single character
            };
            i++;
        }

        // NOW DO MODIFY
        const char = stream[i];
        if (char === "+") {
          if (stream[i + 1] != '{') {
            new_token.min = 1;  new_token.max = null;
          }
        } else if (char == ":") {

        } else if (char == "@") {

        } else {
          // Grapheme mithout modification
          if (new_token.type != 'pending') {
            tokens.push(new_token);
          }
          
        }



      }
    }
    return tokens;
  }  
}