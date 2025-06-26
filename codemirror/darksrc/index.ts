
/**
 * @name Xcode
 */
import { tags as t } from '@lezer/highlight';

import { createTheme, type CreateThemeOptions } from '@uiw/codemirror-themes';
import { EditorView } from 'codemirror';

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

export const defaultSettingsXcodeLight: CreateThemeOptions['settings'] = {
  background: '#fff',
  foreground: '#3D3D3D',
  selection: '#BBDFFF',
  selectionMatch: '#fae098',
  gutterBackground: '#eee',
  gutterForeground: '#AFAFAF',
  lineHighlight: '#d5e6ff69',
};

export const xcodeLightStyle: CreateThemeOptions['styles'] = [
  // Comment / GREEN / #
  { tag: t.comment, color: "#277022" },

  { tag: t.variableName, color: "#000000" },

  // Directive / BLUE / words: categories: with: letters: random-rate:
  { tag: [t.meta, t.name], color: "#024bba" },

  // Keyword / BROWN / std-ipa-features std-assimilations coronal-metathesis
  // RegExp / BROWN / . + * ? ^ $ | \ ( ) [ ] { }
  // Operator / BROWN / = > : 
  { tag: t.regexp, color: "#ad5005" },

  { tag: t.operator, color: "#ad5005", fontWeight: "bold"},

  // Filter / PURPLE / filter: reject: %
  { tag: t.keyword, color: "#7a0099" },

  // Classes / RED /
  { tag: t.className, color: "#726969" }
];

export function xcodeLightInit(options?: Partial<CreateThemeOptions>) {
  const { theme = 'light', settings = {}, styles = [] } = options || {};
  return createTheme({
    theme: theme,
    settings: {
      ...defaultSettingsXcodeLight,
      ...settings,
    },
    styles: [...xcodeLightStyle, ...styles],
  });
}

export const xcodeLight = [Lighty, xcodeLightInit()];

export const defaultSettingsXcodeDark: CreateThemeOptions['settings'] = {
  background: '#23272e',
  foreground: '#23272e',
  gutterBackground: '#1e2227',
  caret: '#fff',
  selection: '#22528b',
  selectionMatch: '#594406',
  lineHighlight: '#ffffff0f',
};

export const xcodeDarkStyle: CreateThemeOptions['styles'] = [
  // Comment / GREEN / #
  { tag: t.comment, color: "#bee79d"},

  { tag: t.variableName, color: "#eeeeee" },

  // Directive / BLUE / words: categories: with: letters: random-rate: name:
  { tag: [t.meta, t.name], color: "#a6d3f7" },

  // RegExp / Brown / . + * ? ^ $ | \ ( ) [ ] { }
  // Operator / Brown / = > : 
  { tag: t.regexp, color: "#ffcd90" },
  { tag: t.operator, color: "#ffcd90" , fontWeight: "bold" },

  // Filter / PURPLE / filter: reject: % std-ipa-features std-assimilations coronal-metathesis
  { tag: t.keyword, color: "#e687e4" },

  // Classes / RED /
  { tag: t.className, color: "#ff6969" }
];

export const xcodeDarkInit = (options?: Partial<CreateThemeOptions>) => {
  const { theme = 'dark', settings = {}, styles = [] } = options || {};
  return createTheme({
    theme: theme,
    settings: {
      ...defaultSettingsXcodeDark,
      ...settings,
    },
    styles: [...xcodeDarkStyle, ...styles],
  });
};

export const xcodeDark = [Darky, xcodeDarkInit()];
