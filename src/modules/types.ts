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
      type: "wildcard"; // *
      base: "*";
      min: number;
      max: number|typeof Infinity;
      named_reference_bind?: string;
    }
  | {
      type: "anythings-mark"; // &
      base: "&";
      min: number;
      max: number|typeof Infinity;
      blocked_by?: string[][];
    }
  | {
      type: "syllable-mark"; // %
      base: "%";
      min: number;
      max: number|typeof Infinity;
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
      type: "reject"; // 0
      base: "0";
    }
  | {
      type: "word-boundary"; // #
      base: "#";
      min: number;
      max: number|typeof Infinity;
    }
  | {
      type: "syllable-boundary"; // #
      base: "$";
      min: number;
      max: number|typeof Infinity;
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
      base: '<T';
      min: number;
      max: number|typeof Infinity;
    }
    | {
      type: "metathesis-reference";
      base: "<M";
      min: number;
      max: number|typeof Infinity;
    }
    | {
      type: "empty-mark";
      base: "<E";
      min: number;
      max: number|typeof Infinity;
    }
    | {
      type: "based-mark";
      base: "~";
      min: number;
      max: number|typeof Infinity;
    }
    | {
      type: "br-start-capture";
      base: "<=";
      min: number;
      max: number|typeof Infinity;
    }
    | {
      type: "br-end-capture";
      base: "=1"|"=2"|"=3"|"=4"|"=5"|"=6"|"=7"|"=8"|"=9";
      name: "1"|"2"|"3"|"4"|"4"|"5"|"6"|"7"|"8"|"9"|"0"
      min: number;
      max: number|typeof Infinity;
    }
    | {
      type: "backreference";
      base: "1"|"2"|"3"|"4"|"4"|"5"|"6"|"7"|"8"|"9"|"0";
      name: "1"|"2"|"3"|"4"|"4"|"5"|"6"|"7"|"8"|"9"|"0"
      min: number;
      max: number|typeof Infinity;
    };

    export type Token_Stream_Mode = "TARGET" | "RESULT" | "BEFORE" | "AFTER";

    export type Output_Mode = "word-list" | "debug" | "paragraph" | "old-to-new"

    export type Distribution = "gusein-zade" | "zipfian" | "shallow" | "flat"