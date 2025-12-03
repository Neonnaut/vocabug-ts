# Version 1

## Generic

- [x] Comments
- [x] Examples
- [x] Complete validation error line handling

## Interface

- [x] Syntax highlighting
- [x] Generate words button
- [x] Copy words button
- [x] Clear button
- [x] Number of words
- [x] Modes
- [x] Remove duplicates
- [x] Force word limit
- [x] Sort words
- [x] Show keyboard
- [x] Editor wrap lines
- [x] Word divider
- [x] File save / load
- [x] Examples loading
- [x] Logo
- [x] Introduction paragraph

## Word-gen

- [x] Null grapheme
- [x] Escape characters
- [x] Categories
- [x] Category sets
- [x] Category distribution
- [x] Category weights
- [x] Units
- [x] Words directive
- [x] Words directive block
- [x] Words distribution
- [x] Pick-one-set
- [x] Optional-set
- [x] Optionals weight
- [x] Supra-set
- [x] Supra-set weights
- [x] Supra-set 's' weight

## Before transforms

- [x] Graphemes directive

## Transform

- [x] Transform char escape
- [x] Single change
- [x] Concurrent change
- [x] A merging, concurent change. e.g: `a, e -> 0`
- [x] Using category
- [x] Alternator
- [x] Optionalator
- [x] Reject
- [x] Insertion
- [x] Deletion
- [x] Conditions
- [x] Multiple conditions
- [x] Word boundaries
- [x] Exceptions
- [x] Multiple exceptions
- [x] Chance
- [x] Cluster-field
- [x] Cluster-field condition and exception

- [x] Quantifier
- [x] Bound quantifier
- [x] Geminate-mark

- [x] Wildcard
- [x] Anythings-mark
- [x] Blocked Anythings-mark
- [x] Target-mark

- [x] Engine, decompose
- [x] Engine, compose
- [x] Engine, Capitalise
- [x] Engine, Decapitalise
- [x] Engine, To-upper-case
- [x] Engine, To-lower-case
- [x] Engine, Xsampa-to-ipa
- [x] Engine, Ipa-to-Xsampa

- [x] Named escape
- [x] Metathesis
- [x] Feature

## Collator

- [x] Alphabet directive
- [x] Invisible directive

## More

- [x] graphemes block
- [x] Make the met condition say so in debug
- [x] Deal with metathesis-mark as `<M`
- [x] Deal with target-mark as `<T`
- [x] Add `$` as syllable-boundary

--------------

- [x] Target capture

- [x] Result capture 1 of 2

- [x] Condition capture and Condition insertion

- [x] Result insertion 2 of 2

--------------

- [ ] Associatemes get from graphemes
- [ ] Associatemes hook to getting transforms
- [ ] Get if grapheme is based mark in grammar stream
- [ ] If record based in transformation target, get assosiation for result
