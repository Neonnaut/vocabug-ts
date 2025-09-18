# Version 1.1

## 1. Named-reference

Sometimes graphemes must be moved, copied, or asserted to be a certain grapheme between sounds. This is the purpose of named-reference.

Firstly, a grapheme is bound to a name with a 'named-capture', to the right of the grapheme. A named-capture looks like `=[` + the name + `]`. The name can only consist of lowercase letters a to z, `.`, `-`, or `+`.

The bound grapheme can then be copied, or rather, inserted, somewhere else in the transform with a 'named-reference', even before the named-capture. However, a named-reference cannot be used in `TARGET`. A named reference looks like `[<` + the-name + `]`

Here are some examples:

```
; Delete [ʔ] between identical vowels
ʔ > ^ / [+vowel]=[identical]_[<indentical]
```

In this rule, we are binding the `V` category to the name `identical`, by appending `=[` + `identical` + `]` to it. Whatever this grapheme is when the condition is met, is the value of `identical`.

```
; Insert an 'echo vowel' at the end of [ʔ] final words
  ^ -> [<identical] / {V}=[identical]ʔ_#
; foobaʔ ==> foobaʔa
```

In this rule, we are binding the `V` category to the name `identical`, by appending `=[` + `identical` + `]` to it. Whatever this grapheme is when the condition is met is the value of `identical`.

Then the value of `identical` is inserted into `RESULT`.


## 2. Word classes

Like the so called "categories" in lexifer.ts. I could put them in the Words: block.

They're not that useful here as you can just comment out a line in the words: block


## 3. Then

If block
Using an If block, You can make transformations execute on a word if, or if not, other transformation(s) were applied to the word.

It should feel familiar to anyone who knows a bit about programming languages

`BEGIN if:` starts the if block and where transforms will be listened to and trigger other events on the word if, or if not, it is executed on that word.
`then:` is where you put transforms that will execute if the transformations in if: did apply
`else:` is is where you put transforms that will execute if the transformations in if: did not meet a `CONDITION` or were blocked by an `EXCEPTION`
END is the end of the block
For example:

```
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
```

Note: The above example is actually quite bogus if it were a historical sound change. Sound change in natural diachronics has no memory. We can have "two-part" sound-changes such as this triggered metathesis, but a sound change executing on a word because another sound change did not apply to the word does not occur, at least not in real-life natural human languages.

## 4. Else

If block
Using an If block, You can make transformations execute on a word if, or if not, other transformation(s) were applied to the word.

It should feel familiar to anyone who knows a bit about programming languages

`BEGIN if:` starts the if block and where transforms will be listened to and trigger other events on the word if, or if not, it is executed on that word.
`then:` is where you put transforms that will execute if the transformations in if: did apply
`else:` is is where you put transforms that will execute if the transformations in if: did not meet a `CONDITION` or were blocked by an `EXCEPTION`
END is the end of the block
For example:

```
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
```

Note: The above example is actually quite bogus if it were a historical sound change. Sound change in natural diachronics has no memory. We can have "two-part" sound-changes such as this triggered metathesis, but a sound change executing on a word because another sound change did not apply to the word does not occur, at least not in real-life natural human languages.

## 4. Rule macro

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

## 5. Alternative graphs

Tells what character + combining diacritic sequences to be treated as alternatives of another grapheme

The left-most precomposed character is the thing being modified

```
graphemes: a <[á à ǎ â] b d e <[é è ě ê] f g h i <[í ì ǐ î] k l m n o <[ó ò ǒ ô] p r s t u <[ú ù ǔ û] w y
```

now `a > o` will target `a` with an acute accent.

## 6. Invisible graphemes

This would "skip" graphemes in the TARGET, CONDITION and EXCEPTION, like so:

```
invisible-graphemes: .

  tt > d
  bat.ta > ba.da
; 'tt' becomes 'd'. Ignore any '.' between 't's
```

## 7. Grapheme stream

Uses tilde `~` between graphemes

## 8. Gloss for word in nesca