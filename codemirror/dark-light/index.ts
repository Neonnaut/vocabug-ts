
/**
 * @name Xcode
 */
import { tags as t } from "@lezer/highlight";

import { createTheme, type CreateThemeOptions } from "@uiw/codemirror-themes";
import { EditorView } from "codemirror";

export const defaultSettingsXcodeDark: CreateThemeOptions["settings"] = {
  background: "#23272e",
  foreground: "#23272e",
  gutterBackground: "#1e2227",
  caret: "#ffffff",
  selection: "#b4afff35",
  selectionMatch: "#265906b8",
  lineHighlight: "transparent",
};

const Darky = EditorView.theme({
  "&": {
    fontSize: "12pt",
    color: "#eeeeeeff"
  },
  ".cm-gutters": {
    color: "#777777",
    minWidth: "25.6px",
    userSelect: "none"
  },
  ".cm-gutter": {
    minWidth: "100%"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#ffffff14",
    color: "#dddddd"
  },
  "&.cm-editor": {
    colorScheme: "dark;",
    border: "1px solid #555555;",
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

export const xcodeDarkStyle: CreateThemeOptions["styles"] = [
  { tag: t.variableName, color: "#eeeeff" },

  // Comment / GREEN / #
  { tag: t.comment, color: "#bee79d"}, 

  // Escape char / CREAM ON BLACK
  { tag: t.escape, color: "#f0f0f0", backgroundColor:"#5f4418ff" }, 

  // Directive / RED / words: alphabet: etc.
  { tag: [t.meta, t.name], color: "#ff7a7a" },

  // LIGHT BLUE / commas, equals sign, colon
  { tag: t.link, color: "#a6d3f7" , fontWeight: "bold" },
  
  // CYAN / ^REJECT, ->, +, -
  { tag: t.operator, color: "#44ebd0ff" , fontWeight: "bold" },

  // PINK / #, +, *, (, {, [
  { tag: t.regexp, color: "#e687e4" },

  // ORANGE / Categories
  { tag: t.tagName, color: "#ffcd90" },

  // Weights
  { tag: t.strong, color: "#ff7a7a", fontStyle: "italic" }
];

export const xcodeDarkInit = (options?: Partial<CreateThemeOptions>) => {
  const { theme = "dark", settings = {}, styles = [] } = options || {};
  return createTheme({
    theme: theme,
    settings: {
      ...defaultSettingsXcodeDark,
      ...settings,
    },
    styles: [...xcodeDarkStyle, ...styles],
  });
};

export const defaultSettingsXcodeLight: CreateThemeOptions["settings"] = {
  background: "#ffffff",
  foreground: "#3d3d3d",
  selection: "#d6ecffff",
  selectionMatch: "#fae098",
  gutterBackground: "#eee",
  gutterForeground: "#afafaf",
  lineHighlight: "transparent",
};

const Lighty = EditorView.theme({
  "&": {
    fontSize: "12pt",
    color: "#000000"
  },
  ".cm-gutters": {
    color: "#999999",
    minWidth: "25.6px",
    userSelect: "none"
  },
  ".cm-gutter": {
    minWidth: "100%"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#ffffff",
    color: "#666666"
  },
  "&.cm-editor": {
    border: "1px solid #aaaaaa;",
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

export const xcodeLightStyle: CreateThemeOptions["styles"] = [
  { tag: t.variableName, color: "#000000" },

  // Comment / GREEN / #
  { tag: t.comment, color: "#277022"},

  // Escape char / CREAM ON BLACK
  { tag: t.escape, color: "#000000", backgroundColor:"#e8d9cc"}, 

  // Directive / RED / words: alphabet: etc.
  { tag: [t.meta, t.name], color: "#a11c08ff" },

  // LIGHT BLUE / commas, equals sign, colon
  { tag: t.link, color: "#0066b9ff" , fontWeight: "bold" }, 

  // CYAN / ^REJECT, ->, +, -
  { tag: t.operator, color: "#024bba", fontWeight: "bold"}, 

  // PINK / #, +, *, (, {, [
  { tag: t.regexp, color: "#990085ff" },

  // ORANGE / Categories
  { tag: t.tagName, color: "#7f5700ff" },

  // RED ITALIC / Weights
  { tag: t.strong, color: "#a11c08ff", fontWeight: "italic" }
];

export function xcodeLightInit(options?: Partial<CreateThemeOptions>) {
  const { theme = "light", settings = {}, styles = [] } = options || {};
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

export const xcodeDark = [Darky, xcodeDarkInit()];