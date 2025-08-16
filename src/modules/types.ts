export type Token =
  | {
      type: "grapheme"; // ch, a, \*
      base: string;
      min: number;
      max: number|typeof Infinity;
      escaped?: boolean
    }
  | {
      type: "wildcard"; // *
      base: "*";
      min: number;
      max: number|typeof Infinity;
    }
  | {
      type: "anythings-mark"; // ~
      base: "…";
      min: number;
      max: number|typeof Infinity;
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
      type: "reject"; // ^REJECT or ^R
      base: "^REJECT";
    }
  | {
      type: "word-boundary"; // #
      base: "#";
    }
  | {
      type: "engine"; // $
      base: string;
    }
  | {
      type: "pending";
      base: string;
      min: number;
      max: number|typeof Infinity;
    };

    export type Token_Stream_Mode = "TARGET" | "RESULT" | "BEFORE" | "AFTER";

    export type Generation_Mode = "word-list" | "debug" | "paragraph"