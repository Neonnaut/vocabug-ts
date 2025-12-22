# Version 2 word-creation

## Word classes

Like the so called "categories" in lexifer.ts. I could put them in the Words: block.

They're not that useful here as you can just comment out a line in the words: block

generated words would have meta information that they were in a pos or word class

Tranforms could then have a condition that targets that word with a word class

@words.class = nouns

>

## 2. Long form category keys

Somehow, you could use arbitrary lengths for category keys, like `nasal = m, n`.

## 9. Chance for individual optionals

## 10. Promises

This would ensure that if a the optional `y` appears, The only graphemes that would be in the pool for `V` would be `a,o,a`, avoiding a `yi` syllable inside generation.

This would also work backwards and forwards:

`words: C(j->{u,o,a})V`, `C({p,b,t,d,k,g}<-r)a`

This represents an almost idealist view on word generation