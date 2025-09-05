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
      base: "~";
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
      base: string;
      min: number;
      max: number|typeof Infinity;
    }
    /*
  | {
      type: "named-reference";
      base: string;
      name: string;
      mode: 'assertion'|'declaration'|'insertion';
      min: number;
      max: number|typeof Infinity;
    }*/;

    export type Token_Stream_Mode = "TARGET" | "RESULT" | "BEFORE" | "AFTER";

    export type Output_Mode = "word-list" | "debug" | "paragraph"

    export type Distribution = "gusein-zade" | "zipfian" | "shallow" | "flat"