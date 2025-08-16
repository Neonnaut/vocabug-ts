# Version 2

## 1. PRIORITY Backrefernce

A backreference is a reference to the target. It can only be used in conditions or exceptions.

```
<1 <2
```

## 2. PRIORITY Metathesis

Metathesis in this program refers to the reordering of graphemes in a word. Metathesis in real-world diachronics is usually sporadic, but can be regular.

To make a rule a metathesis rule, use these symbols:

The ampersand `&` marks the content (if any) between the targets we want to reorder. You must use the same amount of `&`s in `TARGET` as in `RESULT`

Numbers in `RESULT` refer to the targets. Reordering these numbers, reorders the targets. It is possible to have up to nine
Underscores `_` in a condition or exception, are references to the targets. Unlike a normal rule, we can have multiple
Local metathesis

### Local two-place metathesis:

```
; An intervocalic stop + nasal sequence becomes nasal + stop
  [stop]|[nasal] -> 2|1 / V__V 
; watna ==> wanta
```

### Long-distance metathesis

The example below approximates metathesis that occured in Spanish:

```
r|l -> 2|1 / _(…)[plosive]_
; parabla ==> palabra
```

### One-place metathesis

To simulate one-place metathesis, move `|`s.

The example below is metathesis where words beginning with stop + vowel will try and move an r in a stop + r cluster to form a word initial stop + r cluster:

```
{stop}|r -> 12| / #_{vowel}…{stop}_ 
; kabatros ==> krabatos
```

### Metathesis madness

Three or more items, to a maximum of 9, switching places, are possible, also with shuffling of any `|`:

```
  x|y|z -> ||321
; xaayooz ==> aaoozyx
```

## 3. PRIORITY Features

Let's say you had the grapheme, or rather, phoneme /i/ and wanted to capture it by its distinctive vowel features, `+high` and `+front`, and turn it into a phoneme marked with `+high` and `+back` features, perhaps /ɯ/. The features: directive block lets you do this:

A feature prepended with a plus sign `+` is a 'pro-feature'. For example `+voice`. We can define a set of graphemes that are marked by this feature by using this pro-feature. For example: `+voice = b, d, g, v, z`
A feature prepended with a minus sign `-` is an 'anti-feature'. For example `-voice`. We can define a set of graphemes that are marked by a lack of this feature by using this anti-feature. For example: `-voice = p, t, k, f, s`

Where does this leave graphemes that are not marked by either the pro-feature or the anti-feature of a feature?, you might ask. Such graphemes are *unmarked* by that feature.

To capture graphemes that are marked by features in a transform, the features must be listed in a 'feature-matrix' using curly brackets `{` and `}`. The graphemes in a word must be marked by each pro-/anti-feature in the feature-matrix to be captured. For example if a feature-matrix `{+high, +back}` captures the graphemes: `u, ɯ`, another feature-matrix `{+high, +back, -round}` would capture `ɯ` only.
The very simple example below is written to change all voiceless graphemes that have a voiced counterpart into their voiced counterparts:

```
-voice = p, t, k, f, s
+voice = b, d, g, v, z
```

```
  {-voice} -> {+voice}
; tamefa ==> dameva
```

In this rule, in `RESULT`, `{+voice}` has a symmetrical one-to-one change of graphemes from the graphemes in `{-voice}` in `TARGET`, leading to a concurrent change. Let's quickly imagine a scenario where the only `{+voice}` grapheme was `b`. The result will be a merging of all `-voice` graphemes into `b`: `tamepfa ==> bamebba`. Similarly, in a different scenario where the only `-voice` grapheme was `p`, `p` would become the first grapheme in `{+voice}`, which happens to be `b`: `tamepfa ==> tamebfa`

### Para-feature

A feature defined without a prepended plus or minus sign is a 'para-feature'. A para-feature is a pro-feature without a listed anti-feature counterpart. Instead, the graphemes marked as the anti-feature are the graphemes in the graphs: directive that are not not marked by the para-feature.

Notice: If there is no graphs: directive in the definition-build, there will be zero anti-feature phonemes. If you define an anti-feature as the counterpart of a para-feature, your anti-feature will be ignored.
graphs: a, b, h, i, k, n, o, t

BEGIN features:
  ~vowel = a, i, o
END
In the above example, the matrix {-vowel} captures the graphemes b, h, k, n, t

Combining features

We can 'combine' features. Or to be more accurate, a feature's graphemes can mirror the graphemes of other features by defining a feature with features in it. The combined features must be a pro-feature or anti-feature:

BEGIN features:
  labial = p, b, m
  alveolar = t, d, s, l, n
  palatal = j
  velar = k, g
  glottal = h
  consonant = +labial, +alveolar, +palatal, +velar, +glottal
END
Feature-field
Feature-fields allow graphemes to be easily marked by multiple features at the same time.

The feature-field begins with a % followed by a para-feature. Think of this para-feature as the parent feature of the other features in that feature-cluster. The graphemes marked by this para-feature are listed in the first row. The graphemes marked by the anti-feature counterpart are the graphemes in the graphs: directive that are not not marked by the para-feature.
The graphemes being marked by the features are listed on the first row
The features are listed in the first column
A + means to mark the grapheme by that feature's pro-feature
A - means to mark the grapheme by that feature's anti-feature
A . means to leave the grapheme unmarked by that feature
Here is an example of comprehensive features of consonants and vowels:

graphs: a, e, i, o, p, b, t, d, k, g, s, h, l, j, m, n
BEGIN features:
  %consonant m n p b t d k g s h l j
  voice      + + - + - + - + - - + +
  plosive    - - + + + + + + - - - -
  nasal      + + - - - - - - - - - -
  fricative  - - - - - - - - + + - -
  approx     - - - - - - - - - - + +
  labial     + - + + - - - - + + - -
  alveolar   - + - - + + - - - - + -
  palatal    - - - - - - - - - - - +
  velar      - - - - - - + + - - - -
  glottal    - - - - - - - - - + - -

  %vowel a e i o
  high   - - + -
  mid    - + - +
  low    + - - -
  front  - + + -
  back   + - - +
  round  - - - +
END
Here are some matrices of these features and which graphemes they would capture:

{+plosive} captures the graphemes b, d, g, p, t, k
{+voiced, +plosive} captures the graphemes b, d, g
{+voiced, +labial, +plosive} captures the grapheme b
{+vowel} captures the graphemes a, e, i, o
{-vowel} captures the graphemes p, b, t, d, k, g, f, v, s, z, h, l, r, j
Notice a problem that could occur with the above example? The above example has no overlapping features between consonants and vowels, which is fine. But the example below describes a language that has overlapping features between vowels and consonants, namely, syllabic consonants that carry tone. The solution here is to list all phonemes in just one feature-field:

BEGIN features:
  %phoneme   m n p b t d k g s h l j n̩ ń̩ ǹ̩ a á à e é è i í ὶ o ó ὸ
  syllabic   - - - - - - - - - - - - + + + + + + + + + + + + + + +
  vowel      - - - - - - - - - - - - - - - + + + + + + + + + + + +
  high       . . . . . . . . . . . . . . . - - - - - - + + + - - - 
  mid        . . . . . . . . . . . . . . . - - - + + + - - - + + +
  low        . . . . . . . . . . . . . . . + + + - - - - - - - - -
  front      . . . . . . . . . . . . . . . - - - + + + + + + - - - 
  back       . . . . . . . . . . . . . . . + + + - - - - - - + + +
  round      . . . . . . . . . . . . . . . - - - - - - - - - + + +
  low_tone   . . . . . . . . . . . . . . - - - + - - + - - + - - +
  mid_tone   . . . . . . . . . . . . + - - + - - + - - + - - + - -
  high_tone  . . . . . . . . . . . . . . + - + - - + - - + - - + -
  consonant  + + + + + + + + + + + + + + + - - - - - - - - - - - -
  voice      + + - + - + - + - - + + + + + + + + + + + + + + + + +
  plosive    - - + + + + + + - - - - - - . . . . . . . . . . . . .
  nasal      + + - - - - - - - - - - + + . . . . . . . . . . . . .
  fricative  - - - - - - - - + + - - - - . . . . . . . . . . . . .
  approx     - - - - - - - - - - + + - - . . . . . . . . . . . . .
  labial     + - + + - - - - + + - - + - . . . . . . . . . . . . .
  alveolar   - + - - + + - - - - + - - + . . . . . . . . . . . . .
  palatal    - - - - - - - - - - - + - - . . . . . . . . . . . . .
  velar      - - - - - - + + - - - - - - . . . . . . . . . . . . .
  glottal    - - - - - - - - - + - - - - . . . . . . . . . . . . .
END

## 4. PRIORITY Named escapes

- [] Named escapes, good, keep them in `{}`

## 5. Positioner

Positioners, enclosed in `@{ and }`, allows a grapheme to the left of it to be captured only when it is the Nth in the word:

```
; Change the second /o/ in a word to /x/ after the second /s/
  o@{2} -> x / s@{2}_
; sososo ==> sosxso
```
If we want to match the last occurence of a grapheme in a word, use `-1`. For the second last occurence of a grapheme in a word, use `-2`, and so forth:
```
; Change the last /o/ in a word to /x/
  o@{-1} -> x
; sososo ==> sososx
```

## 6. Word classes

## 7. If then else block

If block
Using an If block, You can make transformations execute on a word if, or if not, other transformation(s) were applied to the word.

It should feel familiar to anyone who knows a bit about programming languages

BEGIN if: starts the if block and where transforms will be listened to and trigger other events on the word if, or if not, it is executed on that word.
then: is where you put transforms that will execute if the transformations in if: did apply
else: is is where you put transforms that will execute if the transformations in if: did not meet a CONDITION or were blocked by an EXCEPTION
END is the end of the block
For example:

BEGIN if:
  ; Deletion of schwa before r
  ə -> ^ / _r
then:
  ; Then do metathesis of r and l
  r|l -> 2|1 / _|[plosive]_
else:
  ; Schwa becomes e if the first rule did not apply
  ə -> e
END
Note: The above example is actually quite bogus if it were a historical sound change. Sound change in natural diachronics has no memory. We can have "two-part" sound-changes such as this triggered metathesis, but a sound change executing on a word because another sound change did not apply to the word does not occur, at least not in real-life natural human languages.

## 8. Syllable dividers and capturing syllables

## 9. Chance for individual optionals

## 10. Alternative graphs

## 11. Rule macro

Rule macro saves rules to be used later in the definition-build as many times as needed. The rules inside the define-rule-macro: block do not run until invoked using do-rule-macro:

```
BEGIN def-rule-macro resyllabify:
  i -> j / _[a,e,o,u]
  u -> w / _[a,e,i,o]
END
```

```
  do-rule-macro: resyllabify
  ʔ -> ^
  do-rule-macro: resyllabify
; iaruʔitua ==> jaruʔitwa ==> jaruitwa  ==> jarwitwa
```
In the above example we saved two rules as a macro under the name "resyllabify" and used that macro twice.

## 12. Promises



`words: Cj->{u,o,a}UV`, `C({p,b,t,d,k,g}<-r)a`

## 13. Invisible graphemes EXTRA

This would "skip" graphemes

```
invisible-graphemes: .

tt > d
bat.ta > ba.da
```

## 14. Lezer grammar

Currently, the interface uses StreamLanguage, instead of the significantly harder to code, "Lezer" grammar syntax

## 15. Static code highlighted snippits in docs

The examples in the doc have no syntax highlighting

## 16. "AI" generate a def file, like Gleb

This would choose a word template, and syllable template, then populate the categories with suitable graphemes. Suitable small transforms would be chosen as well.
