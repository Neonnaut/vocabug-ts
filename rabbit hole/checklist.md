# Version 1

## Generic

- [ ] Comments
- [ ] Escape character
- [ ] Named escape

## Word-gen

- [ ] @words.distribution = flat
- [ ] @categories.distribution = flat
- [ ] words Optionals weight

- [ ] Categories
- [ ] Category sets
- [ ] Category distribution
- [ ] Category weights
- [ ] Null grapheme

- [ ] Units

- [ ] Words directive

- [ ] Pick-one-set
- [ ] Optional-set

- [ ] Supra-set
- [ ] Supra-set weights
- [ ] Supra-set 's' weight

## Before transforms

- [ ] Graphemes directive
- [ ] Associatemes / variantemes

- [ ] Alphabet
- [ ] Invisible

- [ ] Parafeature
- [ ] Pro feature
- [ ] Anti-feature

- [ ] Feature-field

## Stage

- [ ] Single change
- [ ] Concurrent change
- [ ] A merging, concurent change. e.g: `a, e -> 0`

- [ ] Reject

- [ ] Insertion
- [ ] Deletion

- [ ] Conditions
- [ ] Multiple conditions
- [ ] Word boundaries
- [ ] Syllable boundary
- [ ] Exceptions
- [ ] Multiple exceptions

- [ ] Using category

- [ ] Feature matrix

- [ ] Alternator
- [ ] Optionalator

- [ ] Cluster-field
- [ ] Cluster-field condition and exception

- [ ] Quantifier
- [ ] Bound quantifier
- [ ] Geminate-mark

- [ ] Wildcard
- [ ] Anythings-mark
- [ ] Blocked Anythings-mark

- [ ] Routine, decompose
- [ ] Routine, compose
- [ ] Routine, Capitalise
- [ ] Routine, Decapitalise
- [ ] Routine, To-upper-case
- [ ] Routine, To-lower-case
- [ ] Routine, Xsampa-to-ipa
- [ ] Routine, Ipa-to-Xsampa
- [ ] roman-to-hangul

- [ ] Target-mark
- [ ] Metathesis-mark
- [ ] Empty-mark
- [ ] Reference
- [ ] Reference sequence

- [ ] Use associatemes / variantemes

----

- [ ] Multiple generate buttons


; Comments
; Escape character
; Named escape

@categories.distribution = flat
categories:
; Category sets
; Category distribution
; Category weights
; Null grapheme

units:
 A-uNZit$$ = wiggy

@words.optionals-weight = 10
@words.distribution = flat
words:
  wiggy eggs

graphemes:
; Associatemes / variantemes

alphabet:

invisible:

features:
; Parafeature
; Pro feature
; Anti-feature

feature-field:

words:
 eggs

stage:
; Single change
  s -> z

; Concurrent change
  e g -> g e
  
; A merging, concurent change. e.g: `a, e -> 0`

; Reject

; Insertion
; Deletion

; Conditions
; Multiple conditions
; Word boundaries
; Syllable boundary
; Exceptions
; Multiple exceptions

; Using category

; Feature matrix

; Alternator
; Optionalator

; Cluster-field
; Cluster-field condition and exception

; Quantifier
; Bounded quantifier
; Geminate-mark

; Wildcard
; Anythings-mark
; Blocked Anythings-mark

<routine = compose>
<routine = decompose>
<routine = capitalise>
<routine = decapitalise>
<routine = to-uppercase>
<routine = to-lowercase>
<routine = xsampa-to-ipa>
<routine = ipa-to-xsampa>
<routine = roman-to-hangul>
<routine = reverse>

; Target-mark
; Metathesis-mark
; Empty-mark
; Reference
; Reference sequence

; Use associatemes / variantemes