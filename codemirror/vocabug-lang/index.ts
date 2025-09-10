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
const vocabugDistroRules = [
  { token: "operator",     regex: /\s+(zipfian|flat|gusein-zade|shallow)(?!\S)/ }
];
const vocabugEngineRules = [
  {
    token: "operator",
    regex: /\s+(compose|decompose|capitalise|decapitalise|capitalize|decapitalize|to-uppercase|to-lowercase|xsampa-to-ipa|ipa-to-xsampa)(?!\S)/
  }
];
const vocabugListRules = [
  { token: "escape",   regex: /\\.|\[@(?:Space|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek)\]/ },
  { token: "link",     regex: /,/ }
];

const vocabugCategoryRules = [
  { token: "escape",   regex: /\\.|\[@(?:Space|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek)\]/ },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^|∅/ },
  { token: "regexp",   regex: /\{|\}/ },
  { token: "strong",   regex: /(\*\d+(\.\d+)?)/ } // Weights
];

const vocabugFeatureRules = [
  { token: "escape",   regex: /\\.|\[@(?:Space|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek)\]/ },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^|∅/ }
];

const vocabugWordRules = [
  { token: "escape",   regex: /\\.|\[@(?:Space|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek)\]/ },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^|∅/ },
  { token: "regexp",   regex: /\[|\]|\(|\)|\{|\}|\<|\>/ },
  { token: "strong",   regex: /(\*(\d+(\.\d+)?|s))/ } // Weights
];

const vocabugTransformRules = [
  { token: "escape",   regex: /\\.|\[@(?:Space|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek)\]/ },
  { token: "link",     regex: />|->|→|=>|⇒|\/|!|\?|,|_/ },
  { token: "operator", regex: /\^REJECT|\^R|\^|∅|~/ }, // > and ;
  { token: "regexp",   regex: /\[|\]|\(|\)|\{|\}|#|\+|\*|:|…|&|</ }
];

const vocabugClusterRules = [
  { token: "escape",   regex: /\\.|\[@(?:Space|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek)\]/ },
  { token: "link",     regex: /,|\/|!|\?|_|\+/ },
  { token: "operator", regex: /\^REJECT|\^R|\^|∅/ }, // > and ;
  { token: "regexp",   regex: /\[|\]|\(|\)|\{|\}|#|\*|:|…|&/ }
];

const vocabugFeatureFieldRules = [
  { token: "escape",   regex: /\\.|\[@(?:Space|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek)\]/ },
  { token: "link",     regex: /,|\./ },
  { token: "operator", regex: /\+/ },
  { token : "regexp",   regex: /-/ }
];

type State = {
  mode: ('none'|'cluster-block'|'transform'|'feature-field'|'words-block'|'engine'|'distro-line'|
    'list-line'|'word-line'|'segment-line'|'category-line'|'feature-line'
  );
  feature_matrix: boolean;
  transform: boolean;
  doIndent: boolean;
  blanko: boolean;
  catList: string[];
  catMacList: string[];
  featureList: string[];
};

const vocabugParser: StreamParser<State> = {

    name: "Vocabug",
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
            } else if (state.mode != 'transform' && state.mode != 'words-block') {
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
            } else if (stream.string.trim() && state.mode != 'cluster-block' && state.mode != 'transform' && state.mode != 'words-block' && state.mode != 'feature-field') {
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
                let Fmatch = stream.match(/[-+>][a-zA-Z+-]+(?=\s*=)/)
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

            for (let rule of vocabugWordRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (let cato of state.catMacList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        //TRANSFORM
        if (state.mode == 'transform') {
            // Inside Feature matrix
            if (state.feature_matrix) {
                for (let featuro of state.featureList) {
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

            // End Transform
            if (stream.match(/END(?=\s*;|\s*$)/)) {
                state.mode = 'none';
                return "meta";
            }
            // Clusterfield
            if (stream.match(/%\s/)) {
                state.mode = 'cluster-block';
                return "meta";
            }
            // Engine
            if (stream.match(/\|(?= )/)) {
                state.mode = 'engine';
                return "meta";
            }

            for (let rule of vocabugTransformRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }

            for (let cato of state.catList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // DEFAULT DISTRIBUTION
        if (state.mode == 'distro-line') {
            for (let rule of vocabugDistroRules) {
                if (stream.match(rule.regex)) {
                    state.mode = 'none';
                    return rule.token;
                }
            }
        }

        // LISTS
        if (state.mode == 'list-line') {
            for (let rule of vocabugListRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        // WORDS DECLARATION
        if (state.mode == 'word-line') {
            for (let rule of vocabugWordRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (let cato of state.catMacList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // CATEGORY
        if (state.mode == 'category-line') {
            for (let rule of vocabugCategoryRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (let cato of state.catList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // SEGMENT
        if (state.mode == 'segment-line') {
            for (let rule of vocabugWordRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (let cato of state.catMacList) {
                if (stream.match(cato)) {
                    return "tagName";
                }
            }
        }

        // FEATURE DECLARATION
        if (state.mode == 'feature-line') {
            for (let rule of vocabugFeatureRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (let featuro of state.featureList) {
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
                let Fmatch = stream.match(/[a-zA-Z+-.]+(?=(\s+|,))/)
                if (Fmatch) {
                    state.featureList.push('+' + Fmatch[0]);
                    state.featureList.push('-' + Fmatch[0]);
                    return 'tagName'
                }
            }

            for (let rule of vocabugFeatureFieldRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        // ENGINE
        if (state.mode == 'engine') {
            state.mode = 'transform';
            for (let rule of vocabugEngineRules) {
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

            for (let rule of vocabugClusterRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }
        stream.next();
        return null;
    }
};

const vocabugStream = StreamLanguage.define(vocabugParser);

export { vocabugStream };