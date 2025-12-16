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

const escapeRegex = /\\[^\s]|&\[(?:Space|Tab|Newline|Acute|DoubleAcute|Grave|DoubleGrave|Circumflex|Caron|Breve|InvertedBreve|TildeAbove|TildeBelow|Macron|Dot|DotBelow|Diaeresis|DiaeresisBelow|Ring|RingBelow|Horn|Hook|CommaAbove|CommaBelow|Cedilla|Ogonek|VerticalLineBelow|VerticalLineAbove|DoubleVerticalLineBelow|PlusSignBelow|PlusSignStandalone|uptackBelow|UpTackStandalone|LeftTackBelow|rightTackBelow|DownTackBelow|DownTackStandalone|BreveBelow|InvertedBreveBelow|MacronBelow|MacronBelowStandalone|BridgeBelow|BridgeAbove|InvertedBridgeBelow|SquareBelow|SeagullBelow|LeftBracketBelow)\]/;

const routineRules = [
  {
    token: "attributeName", regex: /\s+(compose|decompose|capitalise|decapitalise|capitalize|decapitalize|to-uppercase|to-lowercase|xsampa-to-ipa|ipa-to-xsampa|latin-to-hangul|latin-to-hangeul|hangul-to-latin|hangeul-to-latin|greek-to-latin|latin-to-greek|reverse)/
  },
  { token: "link", regex: /=/ },
  { token: "meta", regex: />/}
];
const listRules = [
  { token: "escape",   regex: escapeRegex},
  { token: "link",     regex: /,/ }
];

const decoratorRules = [
  { token: "link",     regex: /\.|=/ },
  { token: "meta", regex: /words|categories|distribution|optionals-weight/ },
  { token: "attributeName", regex: /flat|zipfian|gusein-zade|shallow|\d{1,2}%/ }
];

const graphemesRules = [
  { token: "escape",   regex: escapeRegex},
  { token: "link",     regex: /,/ },
  { token: "regexp",   regex: /\<{|\}|\{/ },
];

const categoryRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^/ },
  { token: "regexp",   regex: /\{|\}/ },
  { token: "strong",   regex: /(\*\d+(\.\d+)?)/ } // Weights
];

const featureRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^/ }
];

const wordRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /,|=/ },
  { token: "operator", regex: /\^/ },
  { token: "regexp",   regex: /\[|\]|\(|\)|\{|\}|>/ },
  { token: "strong",   regex: /(\*(\d+(\.\d+)?|s))/ } // Weights
];

const transformRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: />>|->|=>|⇒|→|\/|!|,|_/ },
  { token: "operator", regex: /0|\^/ }, 
  { token: "regexp",   regex: /&=|=[1-9]|\]|\(|\)|\{|\}|#|\$|\+|\?\[|\*|:|%\[|~|\|/ },
  { token: "tagName",  regex: /1|2|3|4|5|6|7|8|9|&T|&M|&E/ }
];

const clusterRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "operator", regex: /0|\^/ },
  { token: "bitwiseOperator",   regex: /\+/ },
];

const featureFieldRules = [
  { token: "escape",   regex: escapeRegex },
  { token: "link",     regex: /\./ },
  { token: "attributeName", regex: /\+/ },
  { token: "processingInstruction",   regex: /-/ }
];

type State = {
  directive: ('none'|'decorator'|'categories'|'words'|'units'|'list'|'graphemes'|'stage'|'features'|'feature-field'|'feature-field-header'
  );
  sub_directive: ('none'|'routine'|'cluster-block');
  feature_matrix: boolean;
  transform: boolean;
  doIndent: boolean;
  catList: string[];
  unitList: string[];
  featureList: string[];

  we_on_newline: boolean;
header_for_feature_field: number;
  insideUnit: boolean;
};

const parser: StreamParser<State> = {

    name: "dsl",
    startState: (i): State => { return {
        directive: 'none',
        sub_directive: 'none',
        feature_matrix: false,
        transform: false,
        doIndent: false,
        catList: [],
        unitList: [],
        featureList: [],
        we_on_newline: true,
        header_for_feature_field: 0,
        insideUnit: false
    }},
    token: function (stream, state) {
        // Comments
        if (stream.match(/\s*;.*$/)) {
            return "comment";
        }
        // If directive change
        if (stream.sol()) {
            state.we_on_newline = true;
            state.insideUnit = false;
            state.feature_matrix = false;

            if (state.directive === 'decorator') {
                state.directive = 'none';
            }

            stream.match(/\s*/);

            // Decorators
            if (stream.match(/@/)) {
                state.directive = 'decorator';
                return "link";
            }
            // Categories
            if (stream.match(/(categories)(?=:\s*(?:;|$))/)) {
                state.directive = 'categories';
                state.doIndent = true;
                return "meta";
            }
            // Words
            if (stream.match(/(words)(?=:\s*(?:;|$))/)) {
                state.directive = 'words';
                state.doIndent = true;
                return "meta";
            }
            // Units
            if (stream.match(/(units)(?=:\s*(?:;|$))/)) {
                state.directive = 'units';
                state.doIndent = true;
                return "meta";
            }
            // Alphabet, Invisible
            if (stream.match(/(alphabet|invisible|syllable-boundaries)(?=:\s*(?:;|$))/)) {
                state.directive = 'list';
                state.doIndent = true;
                return "meta";
            }
            // Graphemes
            if (stream.match(/(graphemes)(?=:\s*(?:;|$))/)) {
                state.directive = 'graphemes';
                state.doIndent = true;
                return "meta";
            }
            // Features
            if (stream.match(/(features)(?=:\s*(?:;|$))/)) {
                state.directive = 'features';
                state.doIndent = true;
                return "meta";
            }
            // Feature-field
            if (stream.match(/(feature-field)(?=:\s*(?:;|$))/)) {
                state.directive = "feature-field-header";
                state.doIndent = true;
                state.header_for_feature_field = 0;
                return "meta";
            }
            // Stage
            if (stream.match(/(stage)(?=:\s*(?:;|$))/)) {
                state.directive = 'stage';
                state.doIndent = true;
                return "meta";
            }
        }

        // Okay, return ':' as directive opener
        if (state.doIndent) {
            stream.match(/:/);
            state.doIndent = false;
            return "link";
        }

        if (state.directive == 'none') {
            // Check for nothing
            if (stream.sol()){

            }
        }

        // DECORATOR
        if (state.directive == 'decorator') {
            for (const rule of decoratorRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        // CATEGORIES
        if (state.directive == 'categories') {

            if (state.we_on_newline) {
                stream.match(/\s*/);

                // A new Category
                const catRegex = new RegExp(`(${cappa})(?=\\s*=)`, "u");
                let match = stream.match(catRegex) as RegExpMatchArray;
                if (match) {
                    state.catList.push(match[1]);
                    state.we_on_newline = false;
                    return "tagName";
                }
            } else {
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
        }

        // WORDS
        if (state.directive == 'words') {
            if (state.insideUnit) {
                for (const unito of state.unitList) {
                    const regex = new RegExp(unito.replace(/[-+$/]/g, '\\$&') + "(?=>)");
                    if (stream.match(regex)) {
                        state.insideUnit = false;
                        return "tagName";
                    }
                }
            } else if (stream.match(/</)) {
                state.insideUnit = true
                return "regexp";
            } else {
                // Categories
                for (const cato of state.catList) {
                    if (stream.match(cato)) {
                        state.insideUnit = false;
                        return "tagName";
                    }
                }

                for (const rule of wordRules) {
                    if (stream.match(rule.regex)) {
                        return rule.token;
                    }
                }
            }
        }

        // UNITS
        if (state.directive == 'units') {

            if (state.we_on_newline) {
                stream.match(/\s*/);

                // A new UNIT!!
                let match = stream.match(/([A-Za-z+$\-]+)(?=\s*=)/);
                if (match) {
                    state.unitList.push(match[1]);
                    state.we_on_newline = false;
                    return "tagName";
                }
            } else {
                for (const rule of wordRules) {
                    if (stream.match(rule.regex)) {
                        return rule.token;
                    }
                }

                // THIS

                if (state.insideUnit) {
                    for (const unito of state.unitList) {
                        const regex = new RegExp(unito.replace(/[-+$/]/g, '\\$&') + "(?=>)");
                        if (stream.match(regex)) {
                            state.insideUnit = false;
                            return "tagName";
                        }
                    }
                } else if (stream.match(/</)) {
                    state.insideUnit = true
                    return "regexp";
                } else {

                    for (const cato of state.catList) {
                        if (stream.match(cato)) {
                            return "tagName";
                        }
                    }
                }
            }
        }

        // LISTS
        if (state.directive == 'list') {
            for (const rule of listRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        // GRAPHEMES
        if (state.directive == 'graphemes') {
            for (const rule of graphemesRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        // FEATURES
        if (state.directive == 'features') {
            if (state.we_on_newline) {
                stream.match(/\s*/);
                // A new Feature
                const Fmatch = stream.match(/[-+>][a-zA-Z+-]+(?=\s*=)/)
                if (Fmatch) {
                    if (Fmatch[0][0] === '>') {
                        state.featureList.push('+' + Fmatch[0].slice(1));
                        state.featureList.push('-' + Fmatch[0].slice(1));
                    } else {
                        state.featureList.push(Fmatch[0]);
                    }
                    state.directive = 'features';
                    state.we_on_newline = false;
                    return "tagName";
                }
            } else {

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
        }

        if (state.directive == 'feature-field-header') {

            if (state.header_for_feature_field >= 1) {
                console.log("f-f");
                state.directive = "feature-field";
                // DO NOT return here: let the rest of the tokenizer
                // see this token with the new directive
            } else {
                if (state.we_on_newline) {
                    state.header_for_feature_field += 1;
                }
                state.we_on_newline = false;
                return "variableName";
            }
        }

        // FEATURES-FIELD
        if (state.directive == 'feature-field') {
            if (state.we_on_newline) {
                const Fmatch = stream.match(/[a-zA-Z+-.]+(?=(\s+|,))/)
                if (Fmatch) {
                    state.featureList.push('+' + Fmatch[0]);
                    state.featureList.push('-' + Fmatch[0]);
                    return 'tagName'
                }
            }
            state.we_on_newline = false;
            for (const rule of featureFieldRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        // STAGE
        if (state.directive == 'stage') {

            if (state.we_on_newline) {
                if (state.sub_directive === 'routine') {
                    state.sub_directive = 'none';
                }

                stream.match(/\s*/);

                // Clusterfield
                if (stream.match(/< /)) {
                    state.sub_directive = 'cluster-block';
                    state.we_on_newline = false;
                    return "meta";
                }

                // End of clusterfield
                if (state.sub_directive == 'cluster-block') {
                    if (stream.match(/>(?=\s*($|;))/)) {
                        state.sub_directive = 'none';
                        return "meta";
                    }
                }

                // Routine
                if (stream.match(/<routine/)) {
                    state.sub_directive = 'routine';
                    state.we_on_newline = false;
                    return "meta";
                }
            }

            // ROUTINE
            if (state.sub_directive == 'routine') {
                for (const rule of routineRules) {
                    if (stream.match(rule.regex)) {
                        return rule.token;
                    }
                }
            }
            // CLUSTER-FIELD
            else if (state.sub_directive == 'cluster-block') {
                for (const rule of clusterRules) {
                    if (stream.match(rule.regex)) {
                        return rule.token;
                    }
                }
            }

            // Inside Feature matrix
            else if (state.feature_matrix) {
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
                
            } else { // Syntax etc.

                // Generic tokens
                for (const rule of transformRules) {
                    if (stream.match(rule.regex)) {
                        return rule.token;
                    }
                }

                // Feature matrix
                if (stream.match(/\[/)) {
                    state.feature_matrix = true;
                    return "regexp";
                }

                // Categories into transforms
                for (const cato of state.catList) {
                    if (stream.match(cato)) {
                        return "tagName";
                    }
                }
            }
        }

        // IT'S JUST WISHFUL THINKING
        stream.next();
        return null;
    }
};

const stream = StreamLanguage.define(parser);

export { stream };