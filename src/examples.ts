const examples: { [key: string]: string } = {
  basic: 
`C = [t*9, tr] n [k*13, kr] m r s [p*12, pr] ch h w y
L = ee oo aa ii uu
V = a i e o u L
F = n r s
$S = CV(F)
words: (V)$S, $S, (V)$S$S, (V)$S$S$S, (V)$S$S$S$S, V
graphemes: ee, oo, aa, ii, uu, ch
BEGIN transform:
nn, nm, np, sh, ss → ny, m, mp, s, s
#aa#, #ee#, #ii#, #oo#, #uu# → a, e, i, o, u
yi -> ^REJECT
END`,

  tonal:
`; # Tonal Yoruba-like
I = k t ^ [p,f] n r b m s l d c ç ş h y w g [kp,gb]
C = t k [f,p] n r b m s d h l ŋ g c ş ç l y w [mb,nd,ŋg] [kp,gb,ŋgb]
V = a i e o u
W = a i ẹ ọ u
T = ^*1.1 \` '

$A = ITV
$B = CTV
$C = CTV(n)

$X = ITW
$Y = CTW
$Z = CTW(n)

BEGIN words:
$A$C $A$B$C $A$B$B$C
$X$Z $X$Y$Z $X$Y$Y$Z
$A $Z
END

graphemes: ẹ́ ọ́ ẹ̀ ọ̀ kp gb

BEGIN transform:
% a e ẹ i o ọ u
' á é ẹ́ í ó ọ́ ú
\` à è ẹ̀ ì ò ọ̀ ù

ci -> çi
END`,

  romance:
`; # Spanish-like

; # Spanish-like

; Initial-cluster: pl pr tr cl cr bl br dr gl gr
; All-consonant: t s k q d n b m p l r g h č f z

; Vowels: a e i o u
; Diphthongs: aj aw ej ew oj ja je jo ju wa we wi
; Hiato: ea eo oa
; Triphthong = jaj jej joj jaw jew jow waj wej waw

; Word-internal coda: n r l s m
; Word-final coda: n r l s d z

; rare: ywi, yoi, yaw, od#, yja, yje, yjo, yju

optionals-weight: 30 %

C = [t*9,tr] s ^ [k*12,kr*2,kl] [d*12,dr] n [p*12,pr*2,pl] l m r [b*9,br*2,bl] q g h [č*12 f z]
V = a i o u e
F = n r l s m
X = n r l s
T = '
$S = CV(F)
$X = CV({T*1},{^*3}F) ; 2nd last 85% 
$Y = CV({^*80},{^*95}F) ; 2nd last 85% 
$Z = CV({T*3},{T*9}X) ; last: 9%

BEGIN words:
  $Y$Z $X$Y$Z $S$X$Y$Z
END

BEGIN transform:

a' e' i' o' u' -> á é í ó ú
áa aá ée eé íi ií óo oó úu uú -> á á é é í í ó ó ú ú

; Enlace y Hiato
; [a,e,i,o,u]+ -> [a,e,i,o,u]
%   a  e  i  o  u
a   a  aj aj o  aw
e   ea e  ej eo ew
i   ja je i  jo ju
o   oa e  oj o  u
u   wa we wi wo u

qwa qwo qwu qa qo qu -> kwa kwo kwu ka ko ku

nj gj gn gl qw -> ň ň ň ʎ q

jg jn jj jl ww -> ň ň j ʎ w

%  b  k  q  g  č  d  f  h  l  m  n  p  r  s  t  z  
m  +  nk nq ng nč nd nf h  nl m  ň  +  r  +  nt nz 
n  mb +  +  +  +  +  +  h  l  ň  ň  mp +  +  +  +  
r  +  +  +  +  +  +  +  h  l  +  +  +  +  +  +  z  
l  +  +  +  +  +  +  +  h  ʎ  +  ʎ  +  r  +  +  z
s  +  +  +  +  +  +  f  h  +  +  +  +  +  s  +  z  

; Taco-taco, burrito-burrito
k q č h ň ʎ j w > c qu ch j ñ ll i u

END`,

  japanese: 
`; Japanese-like based on interpreting wikipedia.org/wiki/Japanese_phonology 
; and link.springer.com/content/pdf/10.3758/BF03195600.pdf

; <R> gives me long vowels
; <N> is the syllable final nasal. <Q> gives me geminate consonants

I = k, ^, t, s, n, m, h, d, g, r, z, b, w, p
C = k, t, s, r, n, ^, h, m, d, g, z, b, w, p
V = a, i, u, o, e, [oR, aR, iR, eR, uR, yu, yo, ya, [yoR, yuR, yaR]]
F = N, Q

$A = IV(F) ; First syllable of slightly different consonant distribution.
$S = CV(F) ; Gives type C(y)V(R)(N,Q).

; # Where light syllable is (C)V, and heavy is (C)[VF,VR(F)].
; # The final two syllables are least likely to be light + heavy.

words: $A$S$S $A$S$S$S $A $A$S$S$S$S $A$S

graphemes: a b ch d e f g h i j k l m n o p r s sh t ts u w y z

BEGIN transform:

; "Yotsugana": <dz> and <dj> neutralise to <z> and <j>
%  i   u   e   o   ya   yu   yo
s  shi +   +   +   sha  shu  sho
z  ji  +   +   +   ja   ju   jo 
t  chi tsu +   +   cha  chu  cho
d  ji  zu  +   +   ja   ju   jo
h  +   fu  +   +   +    +    +
w  i   yu  yo  yo  ya   yu   yo
N  n'a n'u n'e n'o n'ya n'yu n'yo

; <N> assimilation, and <Q> gemination.
% ch   sh    ts   j  k   g  s   z  t   d  n  h   b  p   m  r  l  f   w
Q Qtch Qshsh Qtts j  Qkk g  Qss z  Qtt d  n  Qpp b  Qpp m  r  l  Qpp Qpp
N nch  nsh   nts  nj nk  ng ns  nz nt  nd nn nh  mb mp  mm nr nl nf  nw

RQ N Q -> ^ n ^ ; <R> + <Q> is illegal.

; Vowel sequences:
%  a   i   u   e  o
a  ai  +   oR  +  +
i  ya  ui  yuR +  yo
u  uR  +   ui  ai ai
e  eR  eR  yoR ai yo
o  oR  +   +   +  o
R  R   R   R   R  R

shy jy chy -> sh j ch

aR eR iR oR uR -> aa ee ii oo uu ; Get long vowels

; Collapse aa ee ii oo uu words into short vowels.
#aa# #ee# #ii# #oo# #uu# -> a e i o u
END`,

  australian: 
`; This does not represent a single Australian language, it does something
; Australian looking. The glottal stop and lack of retroflex stops make it
; not an 'average' Australian language word list, but not unusual.

; I use <ṫ ṅ> for [t̪ n̪], <R> for length and <@> for coda-matching.
; <ṫ  c ʔ ṅ  ɲ  ŋ  r  ɻ ʎ  j> romanise as...
; <th j ꞌ nh ny ng rr r ly y> at the end.

; CONSONANTS:
; p ṫ t   c k ʔ
; m ṅ n   ɲ ŋ
;     r ɻ j w
;     l   ʎ

; The following consonant clusters are permissible:

; <k / t> + <p>
; <ṫ / ṅ> + <ʔ>

; [nasal] + [homorganic stop]

; <ɻ> + [peripheral stop] / <ʈ>
; <ɻ> + [non-palatal nasal] / <ɳ>
; <ɻ> + [non-palatal nasal] / <ɳ> + [homorganic stop]

; <l> + [non-apical stop]
; <l> + [peripheral nasal]
; <l> + [nonapical nasal] + [homorganic stop]

; <r> + [peripheral stop]
; <r> + [peripheral non-palatal nasal]
; <r> + [peripheral nasal] + [homorganic stop]

; Initials:
I = k, p, m, w, ^, c, ŋ, j, t, ɲ, n, ʎ, t̪
J = k, p, m, w, c, ŋ, j, t, ɲ, n, ʎ, t̪ ; For disyllabic words
; Medials
C = k, m, ɻ, l, r, n, c, p, ŋ, t, ɲ, t̪, w, j, [n̪*5, ʎ*5, ʔ]
; Clusters
X = lk rk ɻk ŋk ɻm lm rm ɻɳ lc rc ɻc ɲc kp mp lp rp ɻp tp
Y = lŋ rŋ ɻŋ nt ɻʈ n̪t̪ lt̪ ln̪ n̪ʔ t̪ʔ
Z = ɻŋk ɻmp ɻɳʈ ɻɲc lŋk lmp lɲc ln̪t̪ ɻŋk ɻmp ɻɳʈ ɻɲc rŋk rmp rɲc
F = n l r ɻ 
; VOWELS: <a aa i ii u uu ee oo>; and diphthong <ai>
V = a, i, u, [oR, eR, aR, iR, uR, ai]
W = a, i, u

; Syllable shapes: (C)V(F), CVFNCV. (C is optional ONLY word initially).
; <l r ɻ ṅ> DON'T occur word initially. ONLY <n ɲ l r ɻ> occur word finally.
; Disylabic words DON'T begin with a vowel. NO monosyllabic words
$I = IV
$S = [C*12,@X*2,@Y,@Z]V
$J = JV
$Z = CW(F)

words: $I$S$Z $I$S$S$Z $I$S$S$S$Z $J$Z $I$S$S$S$S$Z

graphemes: a aR e eR i iR o oR u uR p t̪ t c k ʔ m n̪ n ɲ ŋ r ɻ j w l ʎ

BEGIN transform:
; Restrict the occurance of <ai>
%  ʔ  c  ŋ  ɲ  j  w  ʎ  ɻ  @
ai aʔ ac aŋ aɲ aj aw aʎ aɻ a@

; Long vowels become short before a consonant cluster or <ʔ>
R@ Rʔ @ -> ^ ʔ ^

; <ji>, <ʎi> and <wu> become <je>, <ʎe> and <wo>
ji ʎi wu jiR ʎiR wuR -> ^REJECT ^REJECT ^REJECT ^REJECT ^REJECT ^REJECT

; Romaniser:
oR eR iR uR aR -> oo ee ii uu aa
r ɻ n̪ t̪ ʔ ɳ -> rr r nh th ꞌ n
ɲ ʎ j c ʈ ŋ -> ny ly y j t ng
END`,

/*
  btx:
`; A language based on Tuvan and Blackfoot, hence 'BTX'.
; Tu-foot shows complex consonant clusters,
; two types of vowel harmony, pitch accent.

    p, pː, tː, k, kː, ʔ,
    ts, tts, ks, kks,
    s, sː, x,
    m, mː, n, nː,
    w, j,

    a, ɯ, o, u,
    e, i, ø, y`,

  tests: 
`; This is a comment.
abcdefg ; And this is a comment following junk.

() [] {} ; <- These should self close.
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

; CATEGORIES
  C = p, t, k

  ; Category set and category-in-category
  V = a, i, o, e, u, [aa, ee, ii, oo, uu], C

  ; escape characters
  C = \\^, \\[, \\]

  ; Weights
  C = p*7, t*6, k*4

  ; syntax characters
  C = ^

; SEGMENTS
  $S = CVCVCV

  ; Segments-in-segments
  $H = $S

  ; Escape characters
  $C = \\^, \\[, \\]

  ; Weights
  $C = p*7, t*6, k*4

  ; Syntax characters
  $C = ^

  ; Pick-ones
  $C = p[t, k, s]
  ; ==> pt, pk, ps

  ; Optionals
  $C = p(t, k, s)
  ; ==> p, pt, pk, ps

  ; Inter-pick-ones
  $C = CV{D*4}CV{E*5}
  ; ==> pe'ta, peta'

; BUILDING WORDS
  words* $S*5, $SsC*5 $S, $S$S, [foo, bar]

; TRANSFORM:
BEGIN transform:

  ; Simple replacement:
    o -> x ; bodido ==> bxdidx

  ; Concurrent set:
  ; Switch [o] and [e] around
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
  ; Switch [o] and [e] around
    o a -> a o ; boda ==> bado

  ; Merging set:
  ; Three phonemes becoming two phonemes
    [ʃ,z] dz -> s, d ; zeʃadzas ==> sesadas

  ; Optional set:
  ; Merge [xw] and [x] into [h]
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
    [nasal -labial] -> n
  ; amaŋaɲ > amanan
    feature-set: ansx-sampa
    [nasal]
  ; amaNaJ -> amanan
    feature-set: digraphian
    [nasal]
  ; amaNaJ -> amanan

; CARDS
  ; Wildcard:
    a > e / _*
  ; apappap > apappep

  ; Ditto-Card:
    a > e / r"_
  ; rarra > rarre

  ; Multituder
    a > e / r<[3]_
  ; rrrarra > rrrerra

  ; Greedy wildcard:
    a > e / r*+_
  ; apappap > apappep

  ; Positioning
    a@[2] > o / b@[2]_
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

  ; Rhotacism: [z] goes to [r] between vowels or glides

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

  ; Sandhi: impossible

END`
*/
};

export { examples };