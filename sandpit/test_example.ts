const examples: { [key: string]: string } = {
  test: 
`
; This is a comment.
abcdefg ; And this is a comment following junk.

() {} {} ; <- These should self close.
"" ''   ; <- These should not self close.
; This should say it is the 6th line.
  ; Tab should indent by 2 spaces
  ; Enter after tab should repeat the indent on the next line

category-distribution: gusein-zade zipfian flat
wordshape-distribution: zipfian gusein-zade flat
optionals-weight: 10 ; How often optionals are selected
alphabet: a b c d e f ; A custom sort order if Sort words is turned on
graphemes: ch sch ; For transforms
alphabet-and-graphemes: a b ch ; Does both
invisible: . |
words: a, b, c
BEGIN words:
  a, b, c
END

; CATEGORIES
  C = p, t, k

  ; Category set and category-in-category
  V = a, i, o, e, u, {aa, ee, ii, oo, uu}, C

  ; escape characters
  C = \\^, \\{, \\}

  ; Weights
  C = p*7, t*6, k*4

  ; syntax characters
  C = ^

; UNITS
  $S = CVCVCV

  ; Units-in-units
  $H = $S

  ; Escape characters
  $C = \\^, \\{, \\}

  ; Weights
  $C = p*7, t*6, k*4

  ; Syntax characters
  $C = ^

  ; Pick-ones
  $C = p{t, k, s}
  ; ==> pt, pk, ps

  ; Optionals
  $C = p(t, k, s)
  ; ==> p, pt, pk, ps

  ; Inter-pick-ones
  $C = CV{D*4}CV{E*5}
  ; ==> pe'ta, peta'

; BUILDING WORDS
  words* $S*5, $SsC*5 $S, $S$S, {foo, bar}

; TRANSFORM:
BEGIN transform:

  ; Simple replacement:
    o -> x ; bodido ==> bxdidx

  ; Concurrent set:
  ; Switch {o} and {e} around
    o a -> a o ; boda ==> bado

  ; CLUSTERFIELD
    % k k R F
    a á + ^ â 
    ā - ā̀ ā̌ ā̂

; ~~~~~~~~~~~~
  
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
    {x ħ}(w j) > {s h}(w j) ; xwaxaħa ==> hahaħa

; CONDTION
  ; Simple multiple condion:
    a -> e / p_p , t_t ; apaptat ==> apeptet

  ; Sets in a condition:
    a -> e / k(p)_{p t k}

  ; Word boundaries:
    a -> e / #_ , p_p#

  ; Syllable boundaries:
    a -> e / $_ , p_p$

; EXCEPTIONS
    a > e ! #_, _# ! swo
  ; apappap > apappep

; CATEGORIES
    plosive = p, t, k
    fricative = f, θ, x
    vowel = a, e, i, o, u
  ; Lenition of voiceless stops to fricatives
    {plosive} > {fricative} / {vowel}_{vowel};
  ; papatakak ==> pafaθaxak

; FEATURESET
  ; Used for engine filters and for features
    feature-set: ipa
    {nasal -labial} -> n
  ; amaŋaɲ > amanan
    feature-set: ansx-sampa
    {nasal}
  ; amaNaJ -> amanan
    feature-set: digraphian
    {nasal}
  ; amaNaJ -> amanan

; CARDS
  ; Wildcard:
    a > e / _*
  ; apappap > apappep

  ; Ditto-Card:
    a > e / r"_
  ; rarra > rarre

  ; Multituder
    a > e / r<{3}_
  ; rrrarra > rrrerra

  ; Greedy wildcard:
    a > e / r*+_
  ; apappap > apappep

  ; Positioning
    a@{2} > o / b@{2}_
  ; baba > babo

; GEMINATION:
  ; Gemination:
  p > p" / a_a

  ; Degemination:
  " > ^ / @_

; DELETION
  ; Deletion from interior:
    a > ^ / t_t ; atata ==> atta

  ; Deletion from end of word:
    a > ^ / _# ; atta ==> att

  ; Deletion from beginning of word:
    a > ^ / #_ ; atta ==> tta

; INSERTION
  ; Insertion at interior:
    ^ > a / t_t ; atta ==> atata

  ; Insertion at end of word:
    ^ > a / _# ; att ==> atta

  ; Insertion at beginning of word:
    ^ > a / #_ ; att ==> aatt

; METATHESIS
  x&y&z > &&321 ; xaayooz ==> aaoozyx

; CONDITIONAL BLOCKS
  if:
  then:
  else:

  chance: 50%

; CLUSTERFIELD
  % k k R F
  a á à ǎ â 
  ā ā́ ā̀ ā̌ ā̂

; ENGINES
  engine: normalise coronal-metathesis std-assimilations

; REJECT
  reject: aeiou

; MORE TESTS
  ; Compensatory Lengthening

  ; Rhotacism: {z} goes to {r} between vowels or glides

  ; Haplology, repeated sequence is deleted

  ; Diphthongization

  ; Monophthongization

  ; Vowel Rasing

  ; Vowel Lowering

  ; Nasalization

  ; Affrication

  ; Deaffrication

  ; Lengthening

  ; Shortening

  ; word or syllable-final sounds devoice

  ; voicing between vowels

  ; nasals agree in place with following sound

  ; Palatalization:
    k*t s > tʃ ʃ / _i

  ; Tonogenesis:

  ; Sandhi: impossible?

  ; /r/ dissimilation: [sərˈpraiz] -> [səˈpraiz].   [ˈfeb.ru.e.ri] -> [ˈfeb.ju.e.ri]

END
`

};

export { examples };