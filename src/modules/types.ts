export type Token =
  | {
      type: "grapheme"; // ch, a, \*
      base: string;
      min: number;
      max: number|typeof Infinity;
      escaped?: boolean;
      named_reference_bind?: string;
    }
  | {
      type: "grapheme-stream";
      base: string;
      stream: string[];
      min: number;
      max: number|typeof Infinity;
    }
  | {
      type: "wildcard"; // *
      base: "*";
      min: number;
      max: number|typeof Infinity;
      named_reference_bind?: string;
    }
  | {
      type: "anythings-mark"; // &
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
      type: "metathesis"; // ~
      base: "<";
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
    }
  | {
      type: "target-reference";
      base: '$';
      min: number;
      max: number|typeof Infinity;
    }
  | {
      type: "named-capture";
      base: string;
      name: string;
      min: number;
      max: number|typeof Infinity;
    }
  | {
      type: "named-reference";
      base: string;
      name: string;
      min: number;
      max: number|typeof Infinity;
    };

    export type Token_Stream_Mode = "TARGET" | "RESULT" | "BEFORE" | "AFTER";

    export type Output_Mode = "word-list" | "debug" | "paragraph" | "old-to-new"

    export type Distribution = "gusein-zade" | "zipfian" | "shallow" | "flat"