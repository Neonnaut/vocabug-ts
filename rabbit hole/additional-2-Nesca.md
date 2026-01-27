
## 9. letter-case-field

Need to write documentation

Capitalise uppercase decapitalise lowercase paragraph-mode

## 8. Naming each stage

```
stage "latin-to-portuguese":
  example -> example
```

When debug mode is on, and the word is being processed on that stage, the stage name is printed out

## 7. Transform sub-stage

sub-stage

Sub-stage saves rules to be used later in a stage to be used as many times as needed. The rules inside the `sub-stage` directive do not run until invoked using `<sub-stage = "the name">` in a stage directive:

```
sub-stage "resyllabify":
  i -> j / _[a,e,o,u]
  u -> w / _[a,e,i,o]

stage:
  <sub-stage = "resyllabify">
  ʔ -> ^
  
  <sub-stage = "resyllabify">
; iaruʔitua ==> jaruʔitwa ==> jaruitwa  ==> jarwitwa
```

In the above example we saved two rules as a macro under the name "resyllabify" and used that macro twice.

## 6. Automatic Syllables 

removes all `.` from a word first

```
auto-syllables:
  initial: (C), medial: V (V), coda: (C)
```

Before -- is the initial, then nucleus, then coda

reluctance in round brackets makes

codas will yield to initials. this will not happen if a coda grapheme is not also an onset grapheme

For example:

```
categories:
  C = m, n, p, t, k
  V = a, i, u
  F = N, t

auto-syllables:
  Onset = (C)
  Nucleus = V
  Coda = (F)

paNapatta ==> paN.a.pat.ta
```
notice that we did not get "pa.Na.pat.ta"

multiple syllable shapes

## 5. Feature bundles

```
features:
  PLACE = velar, labial

stage:
  N -> [+nasal, 2] / _[+consonant 2=PLACE]
  banpadamka ==> bampadaŋka

```

## 4. Naming transforms

Ability to give each transform a name. The name would be printed out in debug mode

When one transform has a transformation, and debug mode is on, the name is printed out before the transformation

```
<@name = "l vocalisation"
  l -> w / _$
>
```

## 3. If, then, else

Using an If block, You can make transformations execute on a word if, or if not, other transformation(s) were applied to the word.

- `<@if` starts the if block and where transforms will be listened to and trigger other events on the word if, or if not, it is executed on that word.

- `><@then` is where you put transforms that will execute if there were no transformations in `if` apply

- `><@else` is is where you put transforms that will execute if there were no transformations in ifS

- `>` is the end of the block

For example:

```
<@if
  ; Deletion of schwa before r
  ə -> ^ / _r
><@then
  ; Then do metathesis of r and l
  r|l -> 2|1 / _|[plosive]_
><@else
  ; Schwa becomes e if the first rule did not apply
  ə -> e
>
```

Note: The above example is actually quite bogus if it were a historical sound change. Sound change in natural diachronics has no memory. We can have "two-part" sound-changes such as this triggered metathesis, but a sound change executing on a word because another sound change did not apply to the word does not occur, at least not in real-life natural human languages.

block
    hook, event, flag, header

## 2. Chance

`<@chance = 10%`

Chance that the transformation will occur, after getting `TARGET` match, and it meets the environment.
This is useful for sporadic sound change.

## 1. Flags

`<@right-to-left`

Word is changed from left to right

`<@replace-once`

One change only per transform

`<@no-overlap`

The target of one change may not be used as the environment of the next

--------------------------

## 11. Word class

generated words would have meta information that they were in a pos or word class

Tranforms could then have a condition that targets a word only when it has that class

`<@class = noun`

## 12. Escapes

Right now, escape chars could interfere with PUA

## 13. Meta tag decorator

@meta.name = languageX

@meta.author = name


## 14. Reverse changes

@stage.reverse-sound-change

## 15. Able to chain changes:

`a -> e -> i`

## 16. Ignore

This would "skip" graphemes in the TARGET, CONDITION and EXCEPTION, like so:

```
<ignore = syllable-dividers
  tt -> d
>
  bat.ta ==> ba.da
; 'tt' becomes 'd'. Ignore any '.' between 't's
```

## 17. Positioner

Positioners, enclosed in `-[` and `]`, allows a grapheme to the left of it to be captured only when it is the Nth in the word:

```
; Change the second /o/ in a word to /x/ after the second /s/
  o-[2] -> x / s-[2]_
; sososo ==> sosxso
```
If we want to match the last occurence of a grapheme in a word, use `-1`. For the second last occurence of a grapheme in a word, use `-2`, and so forth:
```
; Change the last /o/ in a word to /x/
  o-[-1] -> x
; sososo ==> sososx
```



## 18. A way to do sandhi.

For example:
```
  ^ -> n / a_#a 
; da ag ==> dan ag
```

## 19. Association factory

`<factory = shift-right`

Would shift association to left or right

## Schema

Will divide input into the real word, word class

schema:
  word = %[\,]%[\,]%[\,] _ {\, #}
  class = %[\,]%[\,]%[\,] _ {\, #}

## Clean-up

A cleanup rule, marked with the modifier cleanup after the rule name, applies after every subsequent rule:

## Probably do spaces between graphemes and tokens to do sequences

## root-nodes and nodes

## Change reference

equals sign in-between tokens

now I can have infinite number of references

## feature geometry

Feature geometry

Autosegmental phonology

Word-and-paradigm morphology

`N -> [+nasal, p] / _[+consonant p=PLACE]`
`a -> b,`

features {
  voiced = abcde
  unvoiced
}

feature-field {
       |          |  m n p b t d k g s h l j
MANNER | nasal    |  + + . . . . . . . . . .
       | plosive  |  . . + + + + + + . . . .
       | nasal    |  + + . . . . . . . . . .
       | fricative|  . . . . . . . . + + - -
       | approx   |  . . . . . . . . . . + +
         @VOICE   |  Y Y - + - + - + N N Y Y
PLACE  | labial   |  + . . . . . . . . . . .
       | alveolar |  . + . . + + . . + . + .
       | palatal  |  . . . . . . . . . . . +
       | velar    |  . . . . . . + + . . . .
       | glottal  |  . . . . . . . . . + . .
}

Somehow do rule before, after, like auto syllabifying

## Cyrillic

## Katakana

## Hiragana