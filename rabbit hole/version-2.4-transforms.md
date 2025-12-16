# Version 2 transforms

## 1. Stage decorators

@stage.name = "Latin to Italian"

### Change the syllable dividers in a decorator:

@stage.syllable-dividers = {., '}

## 1. Decorator for individual transform

### Give name for each transform

@"Name here yeah yeah"

These printed out in debug mode

### left-to-right

@"Name" -left-to-right -ltr

### right-to-left

@"Name" -right-to-left -rtl     

### replace once

@"Name" -replace-once -ro

### No overlap

@"Name" -no-overlap -no


## 2. Routine

### Cyrillic

### Katakana

### Hiragana

### IPA featurefield set


## 3. Long form category keys

Somehow, you could use arbitrary lengths for category keys, like `nasal = m, n`.

## 4. Positioner

Positioners, enclosed in `@[` and `]`, allows a grapheme to the left of it to be captured only when it is the Nth in the word:

```
; Change the second /o/ in a word to /x/ after the second /s/
  o@[2] -> x / s@[2]_
; sososo ==> sosxso
```
If we want to match the last occurence of a grapheme in a word, use `-1`. For the second last occurence of a grapheme in a word, use `-2`, and so forth:
```
; Change the last /o/ in a word to /x/
  o@[-1] -> x
; sososo ==> sososx
```

## 5. If then else block

If block
Using an If block, You can make transformations execute on a word if, or if not, other transformation(s) were applied to the word.

It should feel familiar to anyone who knows a bit about programming languages

- `<if` starts the if block and where transforms will be listened to and trigger other events on the word if, or if not, it is executed on that word.
- `<then` is where you put transforms that will execute if the transformations in if: did apply
- `<else` is is where you put transforms that will execute if the transformations in if: did not meet a `CONDITION` or were blocked by an `EXCEPTION`
- `>` Ends

For example:

```
@if {
  ; Deletion of schwa before r
  ə -> ^ / _r
} @then {
  ; Then do metathesis of r and l
  r|l -> 2|1 / _|[plosive]_
} @else {
  ; Schwa becomes e if the first rule did not apply
  ə -> e
}
```

Note: The above example is actually quite bogus if it were a historical sound change. Sound change in natural diachronics has no memory. We can have "two-part" sound-changes such as this triggered metathesis, but a sound change executing on a word because another sound change did not apply to the word does not occur, at least not in real-life natural human languages.

## 6. Rule macro

Rule macro saves rules to be used later in the definition-build as many times as needed. The rules inside the define-rule-macro: block do not run until invoked using do-rule-macro:

```
macro "resyllabify":
  i -> j / _[a,e,o,u]
  u -> w / _[a,e,i,o]
```

```
  do-rule-macro: resyllabify
  ʔ -> ^
  do-rule-macro: resyllabify
; iaruʔitua ==> jaruʔitwa ==> jaruitwa  ==> jarwitwa
```
In the above example we saved two rules as a macro under the name "resyllabify" and used that macro twice.

## 7. Invisible graphemes

This would "skip" graphemes in the TARGET, CONDITION and EXCEPTION, like so:

```
invisible-graphemes: .

  tt > d
  bat.ta > ba.da
; 'tt' becomes 'd'. Ignore any '.' between 't's
```

## 8. word class

generated words would have meta information that they were in a pos or word class

Tranforms could then have a condition that targets the class of word

`<word-class-condition = noun`
`x -> y

## 9. Automatic Syllables 

C . V V . C

reluctance - makes 

multiple syllable shapes

## 10. Clean-up

A cleanup rule, marked with the modifier cleanup after the rule name, applies after every subsequent rule:

Ability to deactivate cleanup, or temporarily deactivate on a transform


## syllable reference

## Probably do spaces between graphemes and tokens to do sequences

## Able to chain changes: a -> e -> i

## A way to do sandhi. For example: ^ -> n / a_#a 

## feature bundles... %manner = velar, labial

## root-nodes and nodes

## Change reference

equals sign in-between tokens

now I can have infinite number of references

## Headers

Feature geometry

Autosegmental phonology

Word-and-paradigm morphology

`N -> [+nasal, b=PLACE] / _[+consonant a=PLACE]`
`a -> b,`

## reference factory
`| a -> b, a -> shift-right, `



## A way to do sandhi. For example: ^ -> n / a_#a 

## feature geometry

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

[voiced, stop] -> [nasal]

stage {
  @cluster-field {
    EXAMPLE
  }

  @routine {
    EXAMPLE
  }

  @transform.chance = 40%:
  @transform.name = "thingy":
}

supraseme

#5d4472


Feature geometry

Autosegmental phonology

Word-and-paradigm morphology

`N -> [+nasal, b=PLACE] / _[+consonant a=PLACE]`
`a -> b,`

## word based exceptions

