import { Compartment, EditorState } from '@codemirror/state';
import { highlightSelectionMatches } from '@codemirror/search';
import { indentWithTab, defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { indentUnit, bracketMatching, StreamLanguage, LanguageSupport} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import {
    EditorView, keymap, lineNumbers,
    highlightActiveLineGutter, drawSelection, highlightActiveLine,
} from '@codemirror/view';

// Themes
import { xcodeLight, xcodeDark } from './dist';
const themeConfig = new Compartment();
const lineWrapConfig = new Compartment();

// Language
//import { vocabug } from "./langdist";


/***********************
 * Syntax highlighting *
 ***********************/

const vocabugTransformRules = [
    { token: "escape",
      regex: /\\./
    },
    { token: "operator", // > and ;
      regex: />|->|→|\^REJECT/
    },
    { token: "regexp",  
      regex: /\^|\#|,/
    }
];

const vocabugClusterRules = [
    { token: "escape",
      regex: /\\./
    },
    { token: "operator", // > and ;
      regex: /\+|\-/
    },
    { token: "regexp",  
      regex: /\^|\#|,/
    }
];

const vocabugDistroRules = [
    { token: "meta",
      regex: /\s+(zipfian|flat|gusein-zade|shallow)(?!\S)/
    }
];

const vocabugListRules = [
    { token: "regexp",  
      regex: /,/
    }
];

const vocabugWordRules = [
    { token: "escape",
      regex: /\\./
    },
    { token: "regexp",  
        regex: /\(|\)|\[|\]|\{|\}|\^/
    },
    { token: "operator",
      regex: /=|,/
    },
    { token: "strong", // Weights
      regex: /((:|\?)\d+(\.\d+)?)/
    }
];

const vocabugCategoryRules = [
    { token: "escape",
      regex: /\\./
    },
    { token: "regexp",  
        regex: /\[|\]|\^/
    },
    { token: "operator",
      regex: /,|=/
    },
    { token: "strong", // Weights
      regex: /((:|\?)\d+(\.\d+)?)/
    }
];

const vocabugLang = StreamLanguage.define({
    name: "Vocabug",
    startState: (i) => { return {
        mode: 'none',
        transform: false,
        doIndent: false,
        blanko: false,
        classList: [],
        classMacList: []
    }},
    blankLine: function (state){
        if (!state.blanko && state.mode == 'clusterBlock') {
            state.blanko = true;
        };},
    token: function (stream, state) {
        // Comment / GREEN /
        if (stream.match(/\s*;.*$/)) {
            if (state.mode == 'clusterBlock'){
                state.mode = 'transform';
            } else if (state.mode != 'transform') {
                state.mode = 'none';
            }
            if (state.blanko) {state.blanko = false};
            return "comment";
        }
        if (stream.sol()) {
            // No more clusterblock we reached line with blankspaces
            if (stream.string.trim() == "" && state.mode == 'clusterBlock') { 
                state.blanko = true;
            }

            if (stream.string.trim() && state.mode != 'clusterBlock' && state.mode != 'transform') {
                state.mode = 'none';
            }

        }
        if (state.blanko && state.mode == 'clusterBlock')  {
            // No more clusterblock we reached blank line
            state.mode = 'transform';
            state.blanko = false;
        }

        if (state.doIndent) {
            stream.match(/:/);
            state.doIndent = false;
            return "operator";
        }

        if (state.mode == 'none') {
            if (stream.sol()){
                stream.match(/\s*/);
                // Distributions
                if (stream.match(/wordshape-distribution|category-distribution(?=:)/)) {
                    state.mode = 'distroLine';
                    state.doIndent = true;
                    return "meta";
                }
                // Graphemes, Alphabet
                if (stream.match(/(graphemes|alphabet|invisible|alphabet-and-graphs)(?=:)/)) {
                    state.mode = 'listLine';
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
                    state.mode = 'wordLine';
                    state.doIndent = true;
                    return "meta";
                }
                // Transform
                if (stream.match(/BEGIN\stransform(?=:)/)) {
                    state.mode = "transform";
                    state.doIndent = true;
                    return "meta";
                }

                // Macro
                // Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω
                let match = stream.match(/(\$[A-Z\u00C1\u0106\u00C9\u01F4\u00CD\u1E30\u0139\u1E3E\u0143\u00D3\u1E54\u0154\u015A\u00DA\u1E82\u00DD\u0179\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9])(?=\s*=)/u);
                if (match) {
                    state.classMacList.push(match[1]);
                    state.mode = 'segmentLine';
                    return "className";
                }

                // Class
                match = stream.match(/([A-Z\u00C1\u0106\u00C9\u01F4\u00CD\u1E30\u0139\u1E3E\u0143\u00D3\u1E54\u0154\u015A\u00DA\u1E82\u00DD\u0179\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9])(?=\s*=)/u);
                if (match) {
                    state.classList.push(match[1]);
                    state.classMacList.push(match[1]);
                    state.mode = 'categoryLine';
                    return "className";
                }
            }
        }
        if (state.mode == 'transform') {
            // End Transform
            if (stream.match(/END/)) {
                state.mode = 'none';
                return "meta";
            }
            // Clusterfield
            if (stream.match(/%\s/)) {
                state.mode = 'clusterBlock';
                return "meta";
            }
            for (let rule of vocabugTransformRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }
        if (state.mode == 'distroLine') {
            for (let rule of vocabugDistroRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        if (state.mode == 'listLine') {
            for (let rule of vocabugListRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        if (state.mode == 'wordLine') {
            for (let rule of vocabugWordRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
            for (let classo of state.classMacList) {
                if (stream.match(classo)) {
                    return "className";
                }
            }
        }

        if (state.mode == 'categoryLine') {
            for (let classo of state.classList) {
                if (stream.match(classo)) {
                    return "className";
                }
            }

            for (let rule of vocabugCategoryRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        if (state.mode == 'segmentLine') {
            for (let classo of state.classMacList) {
                if (stream.match(classo)) {
                    return "className";
                }
            }
            for (let rule of vocabugWordRules) {
                if (stream.match(rule.regex)) {
                    return rule.token;
                }
            }
        }

        if (state.mode == 'clusterBlock') {
            // End Transform
            if (stream.match(/END/)) {
                state.mode = 'none';
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
});

function createEditorState(initialContents, myTheme) {
    let extensions = [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        indentUnit.of("  "),
        EditorState.allowMultipleSelections.of(true),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
            indentWithTab,
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
        ]),
        new LanguageSupport(vocabugLang),
        //vocabug(),
        themeConfig.of(themeIdentifier(myTheme)),
        lineWrapConfig.of([])
    ];

    return EditorState.create({
        doc: initialContents,
        extensions
    });
}

function createEditorView(state, parent) {
    return new EditorView({ state, parent });
}

function themeIdentifier(myTheme) {
    switch (myTheme) {
        case 'light':
            return xcodeLight;
        case 'dark':
            return xcodeDark;
        default:
            return xcodeLight;
    }
}

function changeEditorTheme(myEditor, myTheme) {
    myEditor.dispatch({
        effects: themeConfig.reconfigure(themeIdentifier(myTheme))
    })
}

function changeEditorLineWrap(myEditor, wrapping) {
    myEditor.dispatch({
        effects: [lineWrapConfig.reconfigure(
            wrapping ? EditorView.lineWrapping : []
        )]
    })
}

export { createEditorState, createEditorView, changeEditorTheme, changeEditorLineWrap };