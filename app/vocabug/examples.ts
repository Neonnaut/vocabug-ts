const examples: { [key: string]: string } = {
  default: 
`; Anything after a semicolon is a comment until the end of the line.

; A Category is a group of graphemes assigned to a key.
; By default, graphemes in a category furthest to the right
; are picked more often than graphemes to the left.
categories:
  C = {t*9, tr} n {k*13, kr} m r s {p*12, pr} ch h w y
  L = ee oo aa ii uu
  V = a i e o u L
  F = n r s

; A Unit provides abbreviation of parts of a word-shape.
; Here we are using <$> to define the main syllable.
; Items enclosed in '(' and ')' only appear 10% of the time by default.
units:
  $ = CV(F)

; The first word-shape is picked the most often, the last, the least often.
words:
  (V)<$>, (V)<$><$>, (V)<$><$><$>, (V)<$><$><$><$>, V

; The 'graphemes' directive prevents transforms targeting
; only part of a grapheme. It also has additional uses.
graphemes:
  ee, oo, aa, ii, uu, ch

; Vocabug uses 'transforms' to change words, or outright reject them.
; Transforms are all placed inside the 'stage' directive.
stage:
nn, nm, np, sh, ss -> ny, m, mp, s, s
V: -> V / #_# ; Words that are a long vowel become short.
yi -> 0 ; Remove words with <yi>

; Click the green 'Generate' button in the taskbar below to generate words!!
; Read the instructions linked above, or by clicking '?' in the taskbar below`,
  tonal:
`; A somewhat Yoruba-like tonal language
categories:
  I = k t ^ {p f} n r b m s l d c ç ş h y w g {kp gb}
  C = t k {f p} n r b m s d h l ŋ g c ş ç l y w {mb nd ŋg} {kp gb ŋgb}
  V = a i e o u
  W = a i ẹ ọ u
  T = ^*3.7 &[Acute]*3.3 &[Grave]*3 ; Gives mid-tone, high-tone, low-tone

units:
; + ATR harmony 
  A = IVT
  B = CVT
  C = CVT(n)

; - ATR harmony
  X = IWT
  Y = CWT
  Z = CWT(n)

words:
  <A><C> <A><B><C> <A><B><B><C>
  <X><Z> <X><Y><Z> <X><Y><Y><Z>
  <A>    <Z>

graphemes:
  {a e ẹ i o ọ u}<{á é ẹ́ í ó ọ́ ú}<{à è ẹ̀ ì ò ọ̀ ù} kp gb

stage:
; Combine vowels and diacritics into one character, if possible.
  <routine = compose>
; Palatalise <c> and <s> after <i> and its tonal variants.
  c s -> ç ş / _i~`,
  japanese: 
`; Japanese-like based on interpreting wikipedia.org/wiki/Japanese_phonology 
; and Phonological Unit Frequencies in Japanese... by Katsuo Tamaoka.

categories:
  I = k ^ t s n m h d g r z b w p
  C = k t s r n ^ h m d g z b w p
  V = a i u o e ; - The short vowels.
; <ʀ> yields long vowels.
  W = a i u o e {oʀ aʀ iʀ eʀ uʀ yu yo ya {yoʀ yuʀ yaʀ}}
; <ɴ> is the syllable final nasal.
; <ɢ> yields geminate consonants.
  F = ɴ ɢ

units:
  F = IW(F) ; First syllable of slightly different consonant distribution.
  $ = CW(F) ; Gives type C(y)V(ʀ)(ɴ,ɢ)
  L = CW(ɴ) ; Last syllable of type C(y)V(ʀ)(ɴ)

; Where light syllable is (C)V, and heavy is (C){VF,Vʀ(F)}
; The final two syllables are least likely to be light + heavy...

words:
  <F><$><L> <F><$><$><L> <F> <F><$><$><$><L> <F><L>

graphemes:
  a b ch d e f g h i j k l m n o p r s sh t ts u w y z

stage:
V+ -> ^ / ʀ_ ; No vowels after a long vowel.
V?[3,] -> V: ; Sequence of 3+ vowels becomes 2.

ɢ -> ɴ / _V

; "Yotsugana": <dz> and <dy> neutralise to <z> and <j>.
<  i   u   e   o   ya   yu   yo
s  shi +   +   +   sha  shu  sho
z  ji  +   +   +   ja   ju   jo 
t  chi tsu +   +   cha  chu  cho
d  ji  zu  +   +   ja   ju   jo
h  +   fu  +   +   +    +    +
w  i   yu  yo  yo  ya   yu   yo
ɴ  n'a n'u n'e n'o n'ya n'yu n'yo
>

; <ɴ> assimilation, and <ɢ> gemination.
< ch   sh    ts   j  k   g  s   z  t   d  n  h   b  p   m  r  l  f   w
ɢ ɢtch ɢshsh ɢtts j  ɢkk g  ɢss z  ɢtt d  n  ɢpp b  ɢpp m  r  l  ɢpp ɢpp
ɴ nch  nsh   nts  nj nk  ng ns  nz nt  nd nn nh  mb mp  mm nr nl nf  nw
>

ʀɢ ɴ ɢ -> ^ n ^ ; <ʀ> + <ɢ> is illegal.

; Vowel sequences:
<  a   i   u   e  o
a  ai  +   oʀ  +  +
i  ya  ui  yuʀ +  yo
u  uʀ  +   ui  ai ai
e  eʀ  eʀ  yoʀ ai yo
o  oʀ  +   +   +  o
ʀ  ʀ   ʀ   ʀ   ʀ  ʀ
>

y -> ^ / sh_ / j_ / ch_

ʀ -> ^ / #*_# ; Collapse long vowel words into short vowel words.

Vʀ -> V: ; Get long vowels.`,
  australian: 
`; This does not represent a single Australian language, it does something
; Australian looking. The glottal stop and lack of retroflex stops make it
; not an 'average' Australian language word list, but not unusual.

; CONSONANTS:
; p t̪ t   č k ꞌ
; m n̪ n   ň ŋ
;     r ṛ y w
;     l   ʎ

; VOWELS:
; i ii    u uu
;   ee      oo
; a aa ai

; <ʀ> is vowel length and <\`> is for coda-matching.
; Words begin with <a> or a consonant that is not <l, r, ṛ, n̪>
; No monosyllabic words. Disylabic words DON'T begin with <a>
; Medial Singleton consonants are unrestricted.
; There are intervocalic clusters.
; Words end with <a, i, u> or <n, ň, l, r, ṛ>

categories:
; Initials:
  I = k p m w č ŋ y t ň n ʎ t̪
; Medials
  C = k m ṛ l r n č p ŋ t ň t̪ w y {n̪*5 ʎ*5 ꞌ}
; Clusters
  X = lk rk ṛk ŋk ṛm lm rm ṛn lč rč ṛč ňč kp mp lp rp ṛp tp
  Y = lŋ rŋ ṛŋ nt ṛt n̪t̪ lt̪ ln̪ n̪ꞌ t̪ꞌ
  Z = ṛŋk ṛmp ṛnt ṛňč lŋk lmp lňč ln̪t̪ ṛŋk ṛmp ṛnt ṛňč rŋk rmp rňč
; Finals
  F = n l r ṛ 
; Vowels
  V = a i u {oʀ eʀ aʀ iʀ uʀ ai}
  W = a i u

units:
  First = {IW*12, a}
  Di-first = IW
  Clusters = {\`X*2,\`Y,\`Z}
  Medial = {C*19, <Clusters>}V
  Last = {C*22,<Clusters>}{W*11,VF}

words:
  <First><Medial><Last>, <First><Medial><Medial><Last>,
  <First><Medial><Medial><Medial><Last>, <Di-first><Last>,
  <First><Medial><Medial><Medial><Medial><Last>

graphemes:
  t̪ č n̪ ň ṛ

stage:
i -> ^ / a_{\`,ꞌ,č,ŋ,ň,y,w,ʎ,ṛ} ; ʀestrict the occurance of <ai>

ʀ -> ^ / _{\`,ꞌ} ; Long vowels are short before a cluster or <ꞌ>

{y,ʎ}i(ʀ) wu(ʀ) -> 0 ; <yi>, <ʎi> and <wu> are rejected.

\` -> ^ ; Remove coda separator

*=1ʀ -> 11 ; Yield long vowels

r ṛ n̪ t̪ ň ʎ č ŋ -> rr r nh th ny ly j ng ; ʀomaniser`,
};

export { examples };