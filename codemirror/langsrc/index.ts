import { parser } from "./syntax.grammar"
import {
  LRLanguage, LanguageSupport, indentNodeProp,
  foldNodeProp, foldInside, delimitedIndent
} from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"

export const lexiferLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Application: delimitedIndent({ closing: ")", align: false })
      }),
      foldNodeProp.add({
        Application: foldInside
      }),
      styleTags({
        Identifier: t.variableName,
        LineComment: t.lineComment,
        Name: t.name,
        Operator: t.operator,
        Directive: t.className,
        DirectiveKeyword: t.keyword,
        Filter: t.modifier,
        RegExp: t.regexp
      })
    ]
  }),
  languageData: {
    commentTokens: { line: "#" }
  }
})


export function lexifer() {
  return new LanguageSupport(lexiferLanguage)
}
