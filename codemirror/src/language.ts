import { StreamLanguage } from '@codemirror/language';
import { StreamParser } from '@codemirror/language';


/***********************
 * Syntax highlighting *
 ***********************/

const cappa = "[A-Z" +
    // Latin acute
    "\u00C1\u0106\u00C9\u01F4\u00CD\u1E30\u0139\u1E3E\u0143\u00D3\u1E54\u0154\u015A\u00DA\u1E82\u00DD\u0179" +
  
    // Diaeresis
    "\u00C4\u00CB\u1E26\u00CF\u00D6\u00DC\u1E84\u1E8C\u0178" +

    // Caron
    "\u01CD\u010C\u010E\u011A\u01E6\u021E\u01CF\u01E8\u013D\u0147\u01D1\u0158\u0160\u0164\u01D3\u017D" +

    // Grave
    "\u00C0\u00C8\u00CC\u01F8\u00D2\u00D9\u1E80\u1EF2" +

    // Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω
    "\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9]";

const escapeRegex = /\\.|\[@(?:Space|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek|VerticalLineBelow|VerticalLineAbove|DoubleVerticalLineBelow|PlusSignBelow|PlusSignStandalone|uptackBelow|UpTackStandalone|LeftTackBelow|rightTackBelow|DownTackBelow|DownTackStandalone|BreveBelow|InvertedBreveBelow|MacronBelow|MacronBelowStandalone|BridgeBelow|BridgeAbove|InvertedBridgeBelow|SquareBelow|SeagullBelow|LeftBracketBelow)\]/;

const distroRules = [
  { token: "operator",     regex: /\s+(zipfian|flat|gusein-zade|shallow)(?!\S)/ }
];
const engineRules = [
  {
    token: "operator",
    regex: /\s+(compose|decompose|capitalise|decapitalise|capitalize|decapitalize|to-uppercase|to-lowercase|xsampa-to-ipa|ipa-to-xsampa|roman-to-hangul|reverse)(?!\S)/
  }
];
const listRules = [
  { token: "escape",   regex: escapeRegex},
  { token: "link",     regex: /,/ }
];

const categoryRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^|∅/ },
  { token: "regexp",   regex: /\{|\}/ },
  { token: "strong",   regex: /(\*\d+(\.\d+)?)/ } // Weights
];

const featureRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^|∅/ }
];

const wordRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^|∅/ },
  { token: "regexp",   regex: /\[|\]|\(|\)|\{|\}/ },
  { token: "strong",   regex: /(\*(\d+(\.\d+)?|s))/ } // Weights
];

const transformRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: / >|->|→|=>|⇒|\/|!|\?|,|_/ },
  { token: "operator", regex: /@X|\^|∅/ }, 
  { token: "regexp",   regex: /@=|=[1-9]|\<|\>|\[|\]|\(|\)|\{|\}|#|\$|\+|\*|:|&|%|~/ },
  { token: "tagName",  regex: /1|2|3|4|5|6|7|8|9|@T|@M|@E/ }
];

const clusterRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /,|\/|!|\?|_|\+/ },
  { token: "operator", regex: /@X|\^|∅/ },
  { token: "regexp",   regex: /@=|=[1-9]|\<|\>|\[|\]|\(|\)|\{|\}|#|\$|\+|\*|:|&|%|~/ },
  { token: "tagName",  regex: /1|2|3|4|5|6|7|8|9|@T|@M|@E/ }
];

const featureFieldRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /,|\./ },
  { token: "operator", regex: /\+/ },
  { token : "regexp",   regex: /-/ }
];

type State = {
  mode: ('none'|'cluster-block'|'transform'|'feature-field'|'words-block'|'engine'|'distro-line'|
    'list-line'|'word-line'|'segment-line'|'category-line'|'feature-line'|'graphemes-block'
  );
  feature_matrix: boolean;
  transform: boolean;
  doIndent: boolean;
  blanko: boolean;
  catList: string[];
  catMacList: string[];
  featureList: string[];
};

const parser: StreamParser<State> = {

    name: "dsl",
    startState: (i): State => { return {
        mode: 'none',
        feature_matrix: false,
        transform: false,
        doIndent: false,
        blanko: false,
        catList: [],
        catMacList: [],
        featureList: []
    }},
    blankLine: function (state){
        if (!state.blanko && ( state.mode == 'cluster-block' || state.mode == 'feature-field') ) {
            state.blanko = true;
        };},
    token: function (stream, state) {
        // Comment / GREEN /
        if (stream.match(/\s*;.*$/)) {
            if (state.mode == 'cluster-block'){
                state.mode = 'transform';
            } else if (state.mode != 'transform' && state.mode != 'words-block' && state.mode != 'graphemes-block') {
                state.mode = 'none';
            }
            if (state.blanko) {state.blanko = false};
            return "comment";
        }
        if (stream.sol()) {
            state.feature_matrix = false;
            // No more clusterblock we reached line with blankspaces
            if (stream.string.trim() == "" && ( state.mode == 'cluster-block' || state.mode == 'feature-field' )) { 
                state.blanko = true;
            }

            if (state.mode == 'engine') {
                state.mode = 'transform';
            } else if (stream.string.trim() && state.mode != 'cluster-block' && state.mode != 'transform' && state.mode != 'words-block' && state.mode != 'graphemes-block' && state.mode != 'feature-field') {
                state.mode = 'none';
            }

        }
        if (state.blanko && state.mode == 'cluster-block')  {
            // No more clusterblock we reached blank line
            state.mode = 'transform';
            state.blanko = false;
        }
        if (state.blanko && state.mode == 'feature-field')  {
            // No more clusterblock we reached blank line
            state.mode = 'none';
            state.blanko = false;
        }

        if (state.doIndent) {
            stream.match(/:/);
            state.doIndent = false;
            return "link";
        }

        if (state.mode == 'none') {
            if (stream.sol()){
                stream.match(/\s*/);
                // Distributions
                if (stream.match(/wordshape-distribution|category-distribution(?=:)/)) {
                    state.mode = 'distro-line';
                    state.doIndent = true;
                    return "meta";
                }
                // Graphemes, Alphabet
                if (stream.match(/(graphemes|alphabet|invisible|alphabet-and-graphemes)(?=:)/)) {
                    state.mode = 'list-line';
                    state.doIndent = true;
                    return "meta";
                }
                // Optionals-weight
                if (stream.match(/(optionals-weight)(?=:)/)) {
                    state.doIndent = true;
                    return "meta";
                }
                // Words
                if (stream.match(/(words)(?=:)/)) {
                    state.mode = 'word-line';
                    state.doIndent = true;
                    return "meta";
                }
                // Begin Words
                if (stream.match(/BEGIN words(?=:\s*(?:;|$))/)) {
                    state.mode = 'words-block';
                    state.doIndent = true;
                    return "meta";
                }
                // Begin graphemes
                if (stream.match(/BEGIN graphemes(?=:\s*(?:;|$))/)) {
                    state.mode = 'graphemes-block';
                    state.doIndent = true;
                    return "meta";
                }
                // Transform
                if (stream.match(/BEGIN transform(?=:\s*(?:;|$))/)) {
                    state.mode = "transform";
                    state.doIndent = true;
                    return "meta";
                }
                // Feature-field
                if (stream.match(/\+- /)) {
                    state.mode = "feature-field";
                    return "meta";
                }
                // Segment
                const segmentRegex = new RegExp(`(\\$${cappa})(?=\\s*=)`, "u");
                let match = stream.match(segmentRegex) as RegExpMatchArray;;
                if (match) {
                    state.catMacList.push(match[1]);
                    state.mode = 'segment-line';
                    return "tagName";
                }
                // Category
                const catRegex = new RegExp(`(${cappa})(?=\\s*=)`, "u");
                match = stream.match(catRegex) as RegExpMatchArray;
                if (match) {
                    state.catList.push(match[1]);
                    state.catMacList.push(match[1]);
                    state.mode = 'category-line';
                    return "tagName";
                }
                // Feature
                const Fmatch = stream.match(/[-+>][a-zA-Z+-]+(?=\s*=)/)
                if (Fmatch) {
                    if (Fmatch[0][0] === '>') {
                        state.featureList.push('+' + Fmatch[0].slice(1));
                        state.featureList.push('-' + Fmatch[0].slice(1));
                    } else {
                        state.featureList.push(Fmatch[0]);
                    }
                    state.mode = 'feature-line';
                    return "tagName";
                }
            }
        }

        // WORDS BLOCK
        if (state.mode == 'words-block') {
            //End
            if (stream.match(/END(?=\s*;|\s*$)/)) {
                state.mode = 'none';
                return "meta";
            }

            for (const rule of wordRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (const cato of state.catMacList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // graphemes BLOCK
        if (state.mode == 'graphemes-block') {
            //End
            if (stream.match(/END(?=\s*;|\s*$)/)) {
                state.mode = 'none';
                return "meta";
            }

            for (const rule of listRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        //TRANSFORM
        if (state.mode == 'transform') {

            if (stream.sol()) {
                // End Transform
                if (stream.match(/END(?=\s*;|\s*$)/)) {
                    state.mode = 'none';
                    return "meta";
                }
                // Clusterfield
                if (stream.match(/<\s/)) {
                    state.mode = 'cluster-block';
                    return "meta";
                }
                // Engine
                if (stream.match(/\|(?= )/)) {
                    state.mode = 'engine';
                    return "meta";
                }
            }

            // Inside Feature matrix
            if (state.feature_matrix) {
                for (const featuro of state.featureList) {
                    if (stream.match(featuro, false)) {
                        const start = stream.pos;
                        const end = start + featuro.length;
                        const nextChar = stream.string.charAt(end);

                        if (nextChar === ' ' || nextChar === ',' || nextChar === ']') {
                            stream.match(featuro); // consume it
                            return "tagName";
                        }
                    }
                }
                if (stream.match(/,/)) {
                    return "link";
                }
                if (stream.match(/]/)) {
                    state.feature_matrix = false;
                    return "regexp"
                }
                
            }

            // Feature matrix
            if (stream.match(/\[(?=\+|\-)/)) {
                state.feature_matrix = true;
                return "regexp";
            }

            // Syntax etc.
            for (const rule of transformRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }

            // Categories into transforms
            for (const cato of state.catList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // DEFAULT DISTRIBUTION
        if (state.mode == 'distro-line') {
            for (const rule of distroRules) {
                if (stream.match(rule.regex)) {
                    state.mode = 'none';
                    return rule.token;
                }
            }
        }

        // LISTS
        if (state.mode == 'list-line') {
            for (const rule of listRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        // WORDS DECLARATION
        if (state.mode == 'word-line') {
            for (const rule of wordRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (const cato of state.catMacList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // CATEGORY
        if (state.mode == 'category-line') {
            for (const rule of categoryRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (const cato of state.catList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // SEGMENT
        if (state.mode == 'segment-line') {
            for (const rule of wordRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (const cato of state.catMacList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // FEATURE DECLARATION
        if (state.mode == 'feature-line') {
            for (const rule of featureRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (const featuro of state.featureList) {
                if (stream.match(featuro, false)) {
                    const start = stream.pos;
                    const end = start + featuro.length;
                    const nextChar = stream.string.charAt(end);

                    if (nextChar === ' ' || nextChar === ',' || nextChar === '') {
                        stream.match(featuro); // consume it
                        return "tagName";
                    }
                }
            }
        }

        // FEATURE-FIELD
        if (state.mode == 'feature-field') {
            // End Transform
            if (stream.match(/END(?=\s*;|\s*$)/)) {
                state.mode = 'none';
                return "meta";
            }

            if (stream.sol()) {
                const Fmatch = stream.match(/[a-zA-Z+-.]+(?=(\s+|,))/)
                if (Fmatch) {
                    state.featureList.push('+' + Fmatch[0]);
                    state.featureList.push('-' + Fmatch[0]);
                    return 'tagName'
                }
            }

            for (const rule of featureFieldRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        // ENGINE
        if (state.mode == 'engine') {
            state.mode = 'transform';
            for (const rule of engineRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            return null;
        }

        // CLUSTER-FIELD
        if (state.mode == 'cluster-block') {
            // End Transform
            if (stream.match(/END(?=\s*;|\s*$)/)) {
                state.mode = 'transform';
                return "meta";
            }

            for (const rule of clusterRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }
        stream.next();
        return null;
    }
};

const stream = StreamLanguage.define(parser);

export { stream };