const examples: { [key: string]: string } = {
  default: 
`; A Category is a group of graphemes assigned to a key.
; By default, graphemes in a category furthest to the right
; are picked more often than graphemes to the left.
categories:
  C = {t*9, tr} n {k*13, kr} m r s {p*12, pr} ch h w y
  L = ee oo aa ii uu
  V = a i e o u
  F = n r s

; A Unit provides abbreviation of parts of a word-shape.
; Here we are using <S> to define the main syllable.
; Items enclosed in '(' and ')' only appear 10% of the time by default.
units:
  $ = C{V(F)*10,L}

; The first word-shape is picked the most often, the last, the least often.
words:
  (V)<$>, (V)<$><$>, (V)<$><$><$>, (V)<$><$><$><$>, V

; The 'graphemes' directive prevents transforms targeting
; only part of a grapheme. It also has additional uses.
graphemes:
  ee, oo, aa, ii, uu, ch

; Vocabug uses 'transforms' to change words, or outright reject them.
; Transforms are all placed inside the 'stage' directive
stage:
nn, nm, np, sh, ss -> ny, m, mp, s, s
aa, ee, ii, oo, uu -> a, e, i, o, u / #_#
yi -> 0

; Click the green 'Generate' button in the taskbar below to generate words!!
; Read the instructions linked above, or by clicking '?' in the taskbar below`,
  tonal:
`; A somewhat Yoruba-like tonal language
categories:
  I = k t ^ {p f} n r b m s l d c ç ş h y w g {kp gb}
  C = t k {f p} n r b m s d h l ŋ g c ş ç l y w {mb nd ŋg} {kp gb ŋgb}
  V = a i e o u
  W = a i ẹ ọ u
  T = ^*3.7 &[Acute]*3.3 &[Grave]*3 ; Gives mid-tone, low-tone, high-tone

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
; Palatalise c after <i> and its tonal variants
  c -> ç / _i~`,
  japanese: 
`; Japanese-like based on interpreting wikipedia.org/wiki/Japanese_phonology 
; and Phonological Unit Frequencies in Japanese... by Katsuo Tamaoka.

categories:
  I = k ^ t s n m h d g r z b w p
  C = k t s r n ^ h m d g z b w p
; <ʀ> yields long vowels.
  V = a i u o e {oʀ aʀ iʀ eʀ uʀ yu yo ya {yoʀ yuʀ yaʀ}}
; <ɴ> is the syllable final nasal.
; <ꞯ> yields geminate consonants.
  F = ɴ ꞯ

units:
  F = IV(F) ; First syllable of slightly different consonant distribution.
  $ = CV(F) ; Gives type C(y)V(ʀ)(ɴ,ꞯ).

; Where light syllable is (C)V, and heavy is (C){VF,Vʀ(F)}.
; The final two syllables are least likely to be light + heavy...

words:
  <F><$><$> <F><$><$><$> <F> <F><$><$><$><$> <F><$>

graphemes:
  a b ch d e f g h i j k l m n o p r s sh t ts u w y z

stage:
{a,e,i,o,u}+ -> ^ / ʀ_ ; No vowels after a long vowel
{a,e,i,o,u}?[3,] -> {a,e,i,o,u}: ; Sequence of 3+ vowels becomes 2

; "Yotsugana": <dz> and <dj> neutralise to <z> and <j>
<  i   u   e   o   ya   yu   yo
s  shi +   +   +   sha  shu  sho
z  ji  +   +   +   ja   ju   jo 
t  chi tsu +   +   cha  chu  cho
d  ji  zu  +   +   ja   ju   jo
h  +   fu  +   +   +    +    +
w  i   yu  yo  yo  ya   yu   yo
ɴ  n'a n'u n'e n'o n'ya n'yu n'yo
>

; <ɴ> assimilation, and <ꞯ> gemination.
< ch   sh    ts   j  k   g  s   z  t   d  n  h   b  p   m  r  l  f   w
ꞯ ꞯtch ꞯshsh ꞯtts j  ꞯkk g  ꞯss z  ꞯtt d  n  ꞯpp b  ꞯpp m  r  l  ꞯpp ꞯpp
ɴ nch  nsh   nts  nj nk  ng ns  nz nt  nd nn nh  mb mp  mm nr nl nf  nw
>

ʀꞯ ɴ ꞯ -> ^ n ^ ; <ʀ> + <ꞯ> is illegal.

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

aʀ eʀ iʀ oʀ uʀ -> aa ee ii oo uu ; Get long vowels

; Collapse aa ee ii oo uu words into short vowels.
aa ee ii oo uu -> a e i o u / #_#`,
  australian: 
`; This does not represent a single Australian language, it does something
; Australian looking. The glottal stop and lack of retroflex stops make it
; not an 'average' Australian language word list, but not unusual.

; <ʀ> is vowel length and <\`> is for coda-matching.

; CONSONANTS:
; p t̪ t   č k ꞌ
; m n̪ n   ň ŋ
;     r ṛ y w
;     l   ʎ

; VOWELS:
; i ii    u uu
;   ee      oo
; a aa ai

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

; No monosyllabic words.

; Words begin with a consonant that is not <l, r, ṛ, n̪> or <a>.
; Disylabic words DON'T begin with <a>.
; Medial syllables are unrestricted
; There are intervocalic clusters.
; Words end with <a, i, u> or <n, ň, l, r, ṛ,>.

units:
  First = {IW*12, a}
  Di-first = IW
  Medial = {C*19,\`X*2,\`Y,\`Z}V
  Last = {C*22,\`X*2,\`Y,\`Z}W(F)

words:
  <First><Medial><Last>, <First><Medial><Medial><Last>,
  <First><Medial><Medial><Medial><Last>, <Di-first><Last>,
  <First><Medial><Medial><Medial><Medial><Last>

graphemes:
  a aʀ e eʀ i iʀ o oʀ u uʀ p t̪ t č k ꞌ m n̪ n ň ŋ r ṛ y w l ʎ }

stage:
; ʀestrict the occurance of <ai>.
<  ꞌ  č  ŋ  ň  y  w  ʎ  ṛ  \`
ai aꞌ ač aŋ aň ay aw aʎ aṛ a\`
>

; Long vowels become short before a consonant cluster or <ꞌ>.
ʀ -> ^ / _\` / _ꞌ

; <yi>, <ʎi> and <wu> are rejected.
yi ʎi wu yiʀ ʎiʀ wuʀ -> 0

; ʀomaniser:
\` -> ^
oʀ eʀ iʀ uʀ aʀ -> oo ee ii uu aa
r ṛ n̪ t̪ -> rr r nh th
ň ʎ č ŋ -> ny ly j ng`,
};

export { examples };