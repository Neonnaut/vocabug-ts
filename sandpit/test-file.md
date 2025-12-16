; This is a comment.

; () {} {} <- These should self close.
; "" '' <- These should not self close.
; This should say it is the 6th line.
  ; Tab should indent by 2 spaces
  ; Enter after tab should repeat the indent on the next line

@categories.distribution = flat
categories:  ;comment
  Z = e&[Acute]pigs^\^, {horses nested}
  B = Z

units:
 A-uNZit$$ = {wiggy B}(eagle)
 B = <A-uNZit$$>

@words.optionals-weight = 10%
@words.distribution = flat
words:
  woggy eggs <A-uNZit$$> Z ^

graphemes:
; Associatemes / variantemes
  {a e ẹ i o ọ u}<{á é ẹ́ í ó ọ́ ú}<{à è ẹ̀ ì ò ọ̀ ù} kp gb

alphabet:
  e, w

invisible:
  ., -

features:
; Pro feature
  +voice = b, d, g, v, z
; Anti-feature
  -voice = p, t, k, f, s
; Parafeature
  >vowel = a, i, o

  +non-yod = +vowel, ^i

feature-field:
           m n p b t d k g s h l j
voice      + + - + - + - + - - + +
plosive    - - + + + + + + - - - -
nasal      + + - - - - - - - - - -
fricative  - - - - - - - - + + - -
approx     - - - - - - - - - - + +
labial     + - + + - - - - - - - -
alveolar   - + - - + + - - + - + -
palatal    - - - - - - - - - - - +
velar      - - - - - - + + - - - -
glottal    - - - - - - - - - + - -

stage:
; REPLACEMENT
  ; Simple replacement:
    o -> x ; bodido ==> bxdidx

  ; Concurrent set:
  ; Switch {o} and {e} around
    o a -> a o ; boda ==> bado

  ; Merging set:
  ; Three phonemes becoming two phonemes
    {ʃ,z} dz -> s, d ; zeʃadzas ==> sesadas

  ; Optional set:
  ; Merge {xw} and {x} into {h}
    {x ħ}(w j) -> {s h}(w j) ; xwaxaħa ==> hahaħa

; Reject
  aga => 0

; DELETION
  ; Deletion from interior:
    a -> ^ / t_t ; atata ==> atta

  ; Deletion from end of word:
    a -> ^ / _# ; atta ==> att

  ; Deletion from beginning of word:
    a -> ^ / #_ ; atta ==> tta

; INSERTION
  ; Insertion at interior:
    ^ -> a / t_t ; atta ==> atata

  ; Insertion at end of word:
    ^ -> a / _# ; att ==> atta

  ; Insertion at beginning of word:
    ^ -> a / #_ ; att ==> aatt

; CONDTION
  ; Simple multiple condion:
    a -> e / p_p / t_t ; apaptat ==> apeptet

  ; Sets in a condition:
    a -> e / k(p)_{p t k}

  ; Word boundaries:
    a -> e / #_ / p_p#

  ; Syllable boundaries:
    a -> e / $_ / p_p$

; EXCEPTIONS
    a -> e ! #_ / _#
  ; apappap > apappep

; Using category
  B => d

; Feature matrix

; Alternator
; Optionalator

; Cluster-field
< k k R F
a á + ^ â 
ā - ā̀ ā̌ ā̂
>

; Quantifier
  a -> e / r+_
    
; Bounded quantifier
  a -> e / r?[3]_

; GEMINATE_MARK
  ; Gemination:
    p -> p: / a_a

  ; Degemination:
    p: -> p / #_

; Wildcard
  a -> e / _*
  
; Anythings-mark
a -> e / r%[]_

; Blocked Anythings-mark
a -> e / r%[|yoog]_

; ROUTINE
  <routine = compose>
  <routine = decompose>
  <routine = capitalise>
  <routine = decapitalise>
  <routine = to-uppercase>
  <routine = to-lowercase>

  <routine = latin-to-hangul>
  <routine = hangul-to-latin>
  <routine = latin-to-greek>
  <routine = greek-to-latin>
  <routine = xsampa-to-ipa>
  <routine = ipa-to-xsampa>

  <routine = reverse>

; Target-mark
  %[] -> &T&T

; Metathesis-mark
  %[] -> &M&M

; Empty-mark
  &El -> x
  
; Reference
  l=3 -> 333

; Reference sequence
  &=llll=1 -> 11

; Use associatemes / variantemes
  a~ -> e~