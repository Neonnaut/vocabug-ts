# Version 2

## Cyrillic

## IPA featurefield set


## 1. Word classes

Like the so called "categories" in lexifer.ts. I could put them in the Words: block.

They're not that useful here as you can just comment out a line in the words: block

## 2. Long form category keys

Somehow, you could use arbitrary lengths for category keys, like `nasal = m, n`.

## 3. Positioner

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

## 4. If then else block

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

## 5. Rule macro

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

## 6. Alternative graphs

Tells what character + combining diacritic sequences to be treated as alternatives of another grapheme

The left-most precomposed character is the thing being modified

```
graphemes: a <[á à ǎ â] b d e <[é è ě ê] f g h i <[í ì ǐ î] k l m n o <[ó ò ǒ ô] p r s t u <[ú ù ǔ û] w y
```

now `a > o` will target `a` with an acute accent.

## 7. Invisible graphemes

This would "skip" graphemes in the TARGET, CONDITION and EXCEPTION, like so:

```
invisible-graphemes: .

  tt > d
  bat.ta > ba.da
; 'tt' becomes 'd'. Ignore any '.' between 't's
```

## 9. Chance for individual optionals

## 10. Promises

This would ensure that if a the optional `y` appears, The only graphemes that would be in the pool for `V` would be `a,o,a`, avoiding a `yi` syllable inside generation.

This would also work backwards and forwards:

`words: C(j->{u,o,a})V`, `C({p,b,t,d,k,g}<-r)a`

This represents an almost idealist view on word generation



## 12. Lezer grammar

Currently, the interface uses StreamLanguage, instead of the significantly harder to code, "Lezer" grammar syntax. A Lezer highlighter would still be nice.

Ability to give each transform a name