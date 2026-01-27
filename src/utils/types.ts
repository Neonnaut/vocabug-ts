export type App = "vocabug" | "nesca";

export type Log = {
   payload: string;
   errors: string[];
   warnings: string[];
   infos: string[];
   diagnostics: string[];
};

export type Association = {
   entry_id: number;
   base_id: number;
   variant_id: number;
   is_target: boolean;
};

export type Word_Step =
   | {
        type: "transformation";
        action: string;
        form: string;
        line_num: number;
     }
   | {
        type: "banner";
        action: string;
     }
   | {
        type: "word-creation";
        action: string;
        form: string;
     }
   | {
        type: "nesca-input";
        form: string;
     }
   | {
        type: "output";
        form: string;
     };

export type Token =
   | {
        type: "pending";
        base: string;
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "grapheme"; // ch, a, \*
        base: string;
        min: number;
        max: number | typeof Infinity;
        escaped?: boolean;
        named_reference_bind?: string;
        association?: Association;
     }
   | {
        type: "wildcard"; // *
        base: "*";
        min: number;
        max: number | typeof Infinity;
        named_reference_bind?: string;
     }
   | {
        type: "anythings-mark"; // &
        base: "%";
        min: number;
        max: number | typeof Infinity;
        consume?: string[][];
        blocked_by?: string[][];
     }
   | {
        type: "deletion"; // ^
        base: "^";
     }
   | {
        type: "insertion"; // ^
        base: "^";
     }
   | {
        type: "reject"; // 0
        base: "0";
     }
   | {
        type: "word-boundary"; // #
        base: "#";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "syllable-boundary"; // #
        base: "$";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "routine"; // @routine
        base: string;
        routine: string;
        // the routine
     }
   | {
        type: "target-mark";
        base: "&T";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "metathesis-mark";
        base: "&M";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "empty-mark";
        base: "&E";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "based-mark";
        base: "~";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "reference-start-capture";
        base: "&=";
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "reference-capture";
        base: string;
        key: string;
        min: number;
        max: number | typeof Infinity;
     }
   | {
        type: "reference-mark";
        base: string;
        key: string;
        min: number;
        max: number | typeof Infinity;
     };

export type Transform = {
   t_type: "rule" | "cluster-field" | Routine;
   target: Token[][];
   result: Token[][];
   conditions: { before: Token[]; after: Token[] }[];
   exceptions: { before: Token[]; after: Token[] }[];
   chance: number | null;
   line_num: number;
};

export type Transform_Pending = {
   t_type: "rule" | "cluster-field" | Routine;
   target: string;
   result: string;
   conditions: string[];
   exceptions: string[];
   chance: number | null;
   line_num: number;
};

export type Stage = {
   name: string;
   transforms: Transform[];
};

export type Sub_Stage = {
   name: string;
   transforms: Transform[];
};

export type Token_Stream_Mode = "TARGET" | "RESULT" | "BEFORE" | "AFTER";

export type Output_Mode = "word-list" | "debug" | "paragraph" | "old-to-new";

export type Distribution = "gusein-zade" | "zipfian" | "shallow" | "flat";

export type Directive =
   | "categories"
   | "words"
   | "units"
   | "alphabet"
   | "invisible"
   | "graphemes"
   | "syllable-boundaries"
   | "features"
   | "feature-field"
   | "stage"
   | "letter-case-field"
   | "none";

export const directive_check = [
   "categories",
   "words",
   "units",
   "alphabet",
   "invisible",
   "graphemes",
   "syllable-boundaries",
   "features",
   "feature-field",
   "stage",
];

export type Routine =
   | "decompose"
   | "compose"
   | "capitalise"
   | "decapitalise"
   | "to-uppercase"
   | "to-lowercase"
   | "xsampa-to-ipa"
   | "ipa-to-xsampa"
   | "latin-to-hangul"
   | "hangul-to-latin"
   | "greek-to-latin"
   | "latin-to-greek"
   | "reverse";

export const SYNTAX_CHARS = [
   "<",
   ">",
   "@",
   "⇒",
   "→",
   "->",
   ">>",
   "_",
   "{",
   "}",
   "[",
   "]",
   "(",
   ")",
   "0",
   "/",
   "!",
   "#",
   "$",
   "+",
   "?",
   ":",
   "*",
   "&",
   "%",
   "|",
   "~",
   "=",
   "1",
   "2",
   "3",
   "4",
   "5",
   "6",
   "7",
   "8",
   "9",
];

export const SYNTAX_CHARS_AND_CARET: string[] = [...SYNTAX_CHARS, "^"];

export type Carryover_Associations = {
   entry_id: number;
   base_id: number;
   variant_id: number;
}[];

interface Associateme_Entry {
   bases: string[]; // e.g. ["a","i","u"]
   variants: string[][]; // includes bases as first variant, e.g. [ ["a","i","u"], ["á","í","ú"], ["à","ì","ù"] ]
}

export type Associateme_Mapper = Associateme_Entry[];
