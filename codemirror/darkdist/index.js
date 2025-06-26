import { tags } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
import { EditorView } from 'codemirror';

/**
 * @name Xcode
 */
const Darky = EditorView.theme({
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
const Lighty = EditorView.theme({
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
    { tag: tags.comment, color: "#277022" },
    { tag: tags.variableName, color: "#000000" },
    // Directive / BLUE / words: categories: with: letters: random-rate:
    { tag: [tags.meta, tags.name], color: "#024bba" },
    // Keyword / BROWN / std-ipa-features std-assimilations coronal-metathesis
    // RegExp / BROWN / . + * ? ^ $ | \ ( ) [ ] { }
    // Operator / BROWN / = > : 
    { tag: tags.regexp, color: "#ad5005" },
    { tag: tags.operator, color: "#ad5005", fontWeight: "bold" },
    // Filter / PURPLE / filter: reject: %
    { tag: tags.keyword, color: "#7a0099" },
    // Classes / RED /
    { tag: tags.className, color: "#726969" }
];
function xcodeLightInit(options) {
    const { theme = 'light', settings = {}, styles = [] } = options || {};
    return createTheme({
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
    { tag: tags.comment, color: "#bee79d" },
    { tag: tags.variableName, color: "#eeeeee" },
    // Directive / BLUE / words: categories: with: letters: random-rate: name:
    { tag: [tags.meta, tags.name], color: "#a6d3f7" },
    // RegExp / Brown / . + * ? ^ $ | \ ( ) [ ] { }
    // Operator / Brown / = > : 
    { tag: tags.regexp, color: "#ffcd90" },
    { tag: tags.operator, color: "#ffcd90", fontWeight: "bold" },
    // Filter / PURPLE / filter: reject: % std-ipa-features std-assimilations coronal-metathesis
    { tag: tags.keyword, color: "#e687e4" },
    // Classes / RED /
    { tag: tags.className, color: "#ff6969" }
];
const xcodeDarkInit = (options) => {
    const { theme = 'dark', settings = {}, styles = [] } = options || {};
    return createTheme({
        theme: theme,
        settings: Object.assign(Object.assign({}, defaultSettingsXcodeDark), settings),
        styles: [...xcodeDarkStyle, ...styles],
    });
};
const xcodeDark = [Darky, xcodeDarkInit()];

export { defaultSettingsXcodeDark, defaultSettingsXcodeLight, xcodeDark, xcodeDarkInit, xcodeDarkStyle, xcodeLight, xcodeLightInit, xcodeLightStyle };
