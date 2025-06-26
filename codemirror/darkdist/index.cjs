'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var highlight = require('@lezer/highlight');
var codemirrorThemes = require('@uiw/codemirror-themes');
var codemirror = require('codemirror');

/**
 * @name Xcode
 */
const Darky = codemirror.EditorView.theme({
    "&": {
        fontSize: "12pt",
        color: '#eee'
    },
    ".cm-gutters": {
        color: "#777",
        minWidth: "25.6px",
        userSelect: "none"
    },
    ".cm-gutter": {
        minWidth: "100%"
    },
    "&.cm-editor": {
        colorScheme: "dark;",
        border: "1px solid #555;",
        height: "100%;",
        width: "100%;"
    },
    "&.cm-editor.cm-focused": {
        outline: "none",
        border: "1px dotted #3295a8;"
    },
    "@media only screen and (max-width: 500px)": {
        ".cm-gutters": {
            display: "none!important"
        }
    }
}, { dark: true });
const Lighty = codemirror.EditorView.theme({
    "&": {
        fontSize: "12pt",
        color: '#000'
    },
    ".cm-gutters": {
        color: "#999",
        minWidth: "25.6px",
        userSelect: "none"
    },
    ".cm-gutter": {
        minWidth: "100%"
    },
    "&.cm-editor": {
        border: "1px solid #AAA;",
        height: "100%;",
        width: "100%;"
    },
    "&.cm-editor.cm-focused": {
        outline: "none",
        border: "1px dotted #001299;"
    },
    "@media only screen and (max-width: 500px)": {
        ".cm-gutters": {
            display: "none!important"
        }
    }
});
const defaultSettingsXcodeLight = {
    background: '#fff',
    foreground: '#3D3D3D',
    selection: '#BBDFFF',
    selectionMatch: '#fae098',
    gutterBackground: '#eee',
    gutterForeground: '#AFAFAF',
    lineHighlight: '#d5e6ff69',
};
const xcodeLightStyle = [
    // Comment / GREEN / #
    { tag: highlight.tags.comment, color: "#277022" },
    { tag: highlight.tags.variableName, color: "#000000" },
    // Directive / BLUE / words: categories: with: letters: random-rate:
    { tag: [highlight.tags.meta, highlight.tags.name], color: "#024bba" },
    // Keyword / BROWN / std-ipa-features std-assimilations coronal-metathesis
    // RegExp / BROWN / . + * ? ^ $ | \ ( ) [ ] { }
    // Operator / BROWN / = > : 
    { tag: highlight.tags.regexp, color: "#ad5005" },
    { tag: highlight.tags.operator, color: "#ad5005", fontWeight: "bold" },
    // Filter / PURPLE / filter: reject: %
    { tag: highlight.tags.keyword, color: "#7a0099" },
    // Classes / RED /
    { tag: highlight.tags.className, color: "#726969" }
];
function xcodeLightInit(options) {
    const { theme = 'light', settings = {}, styles = [] } = options || {};
    return codemirrorThemes.createTheme({
        theme: theme,
        settings: Object.assign(Object.assign({}, defaultSettingsXcodeLight), settings),
        styles: [...xcodeLightStyle, ...styles],
    });
}
const xcodeLight = [Lighty, xcodeLightInit()];
const defaultSettingsXcodeDark = {
    background: '#23272e',
    foreground: '#23272e',
    gutterBackground: '#1e2227',
    caret: '#fff',
    selection: '#22528b',
    selectionMatch: '#594406',
    lineHighlight: '#ffffff0f',
};
const xcodeDarkStyle = [
    // Comment / GREEN / #
    { tag: highlight.tags.comment, color: "#bee79d" },
    { tag: highlight.tags.variableName, color: "#eeeeee" },
    // Directive / BLUE / words: categories: with: letters: random-rate: name:
    { tag: [highlight.tags.meta, highlight.tags.name], color: "#a6d3f7" },
    // RegExp / Brown / . + * ? ^ $ | \ ( ) [ ] { }
    // Operator / Brown / = > : 
    { tag: highlight.tags.regexp, color: "#ffcd90" },
    { tag: highlight.tags.operator, color: "#ffcd90", fontWeight: "bold" },
    // Filter / PURPLE / filter: reject: % std-ipa-features std-assimilations coronal-metathesis
    { tag: highlight.tags.keyword, color: "#e687e4" },
    // Classes / RED /
    { tag: highlight.tags.className, color: "#ff6969" }
];
const xcodeDarkInit = (options) => {
    const { theme = 'dark', settings = {}, styles = [] } = options || {};
    return codemirrorThemes.createTheme({
        theme: theme,
        settings: Object.assign(Object.assign({}, defaultSettingsXcodeDark), settings),
        styles: [...xcodeDarkStyle, ...styles],
    });
};
const xcodeDark = [Darky, xcodeDarkInit()];

exports.defaultSettingsXcodeDark = defaultSettingsXcodeDark;
exports.defaultSettingsXcodeLight = defaultSettingsXcodeLight;
exports.xcodeDark = xcodeDark;
exports.xcodeDarkInit = xcodeDarkInit;
exports.xcodeDarkStyle = xcodeDarkStyle;
exports.xcodeLight = xcodeLight;
exports.xcodeLightInit = xcodeLightInit;
exports.xcodeLightStyle = xcodeLightStyle;
