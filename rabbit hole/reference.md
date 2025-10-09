## Nesca

`=$1` `$2`

## ASCA

### References
References allow us to invoke the value of a previously matched element. References are declared by using the `=` operator, followed by a number. This number can then be used later in the rule to invoke the reference.
Currently; matrices, groups, and syllables can be referenced.

Using references, we can implement metathesis without need of the `&` operator:
```
Old English R metathesis

[+rho]=1 V=2 > 2 1 / _s

/hros/ => /hors/
```

It can also be used to define a simple haplology rule:
```
%=1 > * / 1_    ;; A syllable is deleted if preceded by an identical syllable
```

References can be modified with diacritics or a feature matrix as if they were a segment or syllable:

```
%=1 > * / 1:[+str]_ 
;; A syllable is deleted if preceded by a stressed syllable that is otherwise identical
```

## Brassica

### Category references

References allow explicitly specifying the correspondence between categories.
Two forms of reference exist: identifier references, and numeric references.

An **identifier reference** is written as `@#id` followed by a category,
  where the identifier `id` can be any grapheme except `#` which is not followed by a tilde.
Identifier references extend over the entirety of a rule:
  any two categories with the same identifier
  must match or produce an element at the same index as each other.

```brassica
@#example [p t k] / ʔ / @#example [p t k] _ @#example [u i a]

; ppu → pʔu
; tti → tʔi
; kka → kʔa
; pta → pta (no change)
; kpu → kpu (no change)
```

```brassica
@#first [a b] [a b] @#second [a b] / @#first [x y] @#second [x y]

; aaa → xx
; aba → xx
; aab → xy
; abb → xy
; baa → yx
; bba → yx
; bab → yy
; bbb → yy
```

```brassica
@#stop [p t k] / @#stop [p t k] @#stop [f s x] / _ @#stop [i i u]

; api → apfi
; apu → apu (no change)
; ati → atsi
; atu → atu (no change)
; aki → aki (no change)
; aku → akxu
```

A **numeric reference** is written as `@n` followed by a category,
  where `n` can be any number greater than 0.
Unlike identifier references,
  the meaning of a numeric reference depends on which sound change part it is in:
  
- In the target, a numeric reference `@n Category`
    refers to the `n`th element of the list of matched category indices in the target.
  The `n`th element of `Category` must then match successfully.
- In an environment or exception, a reference has the same meaning,
    except that it refers to the list of matched category indices
    in the environment or exception in which the reference is placed.
  The scope of references extends across the underscore representing the target.
- In the replacement, a numeric reference `@n Category`
    refers to the `n`th element of the list of matched category indices in the *target* (not the replacement).
  The `n`th element of `Category` is then produced.
  
Note that, as lexemes are traversed from right to left in a sound change flagged as `-rtl`,
  numeric references naturally operate in the same order in such rules.
  
```brassica
[m n ŋ] [b d g] / @2 [m n ŋ] @2 [b d g]

; anbe → ambe
; aŋde → ande
; amge → aŋge
```

## Lexurgy

Captures
A capture consists of a $ followed by any positive integer: $1, $2, $3, etc.

If a capture is attached directly to a matcher (a capture binding), it saves whatever sounds that matcher matches. A capture can't be attached directly to an emitter in this way.

If a capture on its own (a capture reference) is used as a matcher, it matches exactly the sounds saved by the matcher with the same number.

If a capture on its own is used as an emitter, it produces exactly the sounds saved by the matcher with the same number.

Either way, if nothing has been saved by a capture binding with the same number, the rule fails with an error.

Inexact Captures
An inexact capture ignores floating diacritics when used as a matcher. It's written with a preceding ~: ~$1, ~$2, ~$3, etc.

Inexact captures can't be used as emitters.

Syllable Captures
New in 1.2.0
Normal captures only copy sounds, not syllable information. To copy syllable information, you need a syllable capture, written with a . between the $ and number: $.1, $.2, $.3, etc.

As an emitter, a syllable capture produces exactly the sounds and syllable information saved by the capture binding with the same number.

Syllable captures can't be used as matchers.