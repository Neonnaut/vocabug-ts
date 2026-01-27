const examples: { [key: string]: {file:string, input_words:string} } = {
default: {
file:
`graphemes:
  b, d, g, m, n, l, j, p, t, k, ʔ, s, a, i, e, o, u, ə

feature-field:
          p b t d k g ʔ s m n l j
voiced    - + - + - + - - + + + +
plosive   + + + + + + + - - - - -

features:
  +voiced = b, d, g, m, n, l, j
  -voiced = p, t, k, s, 
  +plosive = p, b, t, d, k, g, ʔ
  -plosive = m, n, l, j, s
  +vowel = a i e o u ə ɨ
  +non-yod = +vowel ^i ; all vowels except /i/

stage:
; Do a vowel chain shift.
 ə o u -> o u ɨ

; Delete word initial glottal stop.
 ʔ -> ^ / #_

; Palatalize /k/ and /s/ before /i/.
 k, s -> tʃ, ʃ / _i
 i -> ^ / {tʃ, j, ʃ}_[+non-yod]

; /i/ + vowel that isn't /i/ becomes /j/ + vowel.
 i -> j / _[+non-yod]

; Delete word final /e/ when followed by a vowel and optional grapheme
; except when a consonant before it is a voiced plosive.
 e -> ^ / _# / [+vowel](*)_ ! [+voiced, +plosive]_`,
 input_words: `bade\nbate\nkito\nsiəmuso\nnesca\nʔa`
}
};

export { examples };