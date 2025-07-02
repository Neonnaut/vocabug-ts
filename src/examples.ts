function get_example(example:string):string {
    var choice = '';

if (example == "basic") {
  choice = `C = [t:9, tr] n [k:13, kr] m r s [p:12, pr] h w j
V = a i e o u L
L = ee oo aa ii uu
F = n r s

$S = CV(F)
$I = (C)V(F)
words: $I$S, [$S, $I], $I$S$S, $I$S$S$S

BEGIN transform:
  ji tu → ci cu
  nn nm np sh ss → nj m mp s s
END`;

} else if (example == "australian") {
  choice = `; This does not represent a single Australian language, it does something
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

Z = lk rk ɻk ŋk ɻm lm rm ɻɳ lc rc ɻc ɲc kp mp lp rp ɻp tp lŋ rŋ ɻŋ nt ɻʈ ṅṫ lṫ ṅʔ ṫʔ lṅ
X = ɻŋk ɻmp ɻɳʈ ɻɲc lŋk lmp lɲc lṅṫ ɻŋk ɻmp ɻɳʈ ɻɲc rŋk rmp rɲc
; Initials:
I = k, p, m, w, x, c, ŋ, j, t, ɲ, n, ʎ, ṫ
J = k, p, m, w, c, ŋ, j, t, ɲ, n, ʎ, ṫ ; For disyllabic words
; Medials
C = k, m, ɻ, l, r, n, c, p, ŋ, t, ɲ, ṫ, w, j, ṅ, ʎ, ʔ
; Finals
F = @n, @l, @r, @ɻ, @x, @ɲ, @lq, @rq, @ɻq

; VOWELS: <a aa i ii u uu ee oo>; and diphthong <ai>
; things happen to <ee> and <oo> later on.
V = a:45, i:39, u:37, oR:2, eR:2, aR:2, iR:2, uR:2, ai:1

; Syllable shapes: (C)V(F), CVFNCV. (C is optional ONLY word initially).
; <l r ɻ ṅ> DON'T occur word initially. ONLY <n ɲ l r ɻ> occur word finally.
; Disylabic words DON'T begin with a vowel. NO monosyllabic words
$S = CV(F)
$T = IV(F)
$X = JV(F)

words: $T$S$S$S $T$S$S$S$S $T$S$S $X$S $T$S$S$S$S$S $T$S$S$S$S$S$S

graphmes: a eR i iR o oR u uR p ṫ t c k ʔ m ṅ n ɲ ŋ r ɻ j w l ʎ
alphabet: a e h i j k l m n o p r r t u w y ꞌ

BEGIN transform:

x -> ^ ; Get vowel initial words

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

kp  ṫʔ  tp      ṅʔ 
ŋk  mp  nt  ɲc  ṅṫ

ɻk  ɻp  ɻʈ  ɻc  
ɻŋ  ɻm  ɻɳ      


lk  lp      lc  lṫ
lŋ  lm          lṅ


rk  rp      rc
rŋ  rm         



%   p    ṫ    t    c    k    m   ṅ   ŋ   n   ɲ ʔ y w ʎ r ɻ l
@n  @mp  @ṅṫ  @nt  @ɲc  @ŋk  m   ṅ   ŋ   n   ɲ ʔ y w ʎ r ɻ l
@ɲ  p    ṫ    t    c    k    m   ṅ   ŋ   n   ɲ ʔ y w ʎ r ɻ l
@l  @lp  @lṫ  t    @lc  @lk  @lm @lṅ @lŋ n   ɲ ʔ y w ʎ r ɻ l
@r  @rp  ṫ    t    @rc  @rk  @rm ṅ   @rŋ n   ɲ ʔ y w ʎ r ɻ l
@ɻ  @ɻp  @ɻṫ  @ɻt  @ɻc  @ɻk  @ɻm @ɻṅ @ɻŋ @ɻn ɲ ʔ y w ʎ r ɻ l
@x  p    @ṫʔ  @tp  @c   @kp  m   @ṅʔ ŋ   n   ɲ ʔ y w ʎ r ɻ l
@lq @lmp @lṅṫ t    @lɲc @lŋk m   ṅ   ŋ   n   ɲ ʔ y w ʎ r ɻ l
@rq @rmp ṫ    t    @rɲc @rŋk m   ṅ   ŋ   n   ɲ ʔ y w ʎ r ɻ l
@ɻq @ɻmp @ɻṅṫ @ɻnt @ɻɲc @ɻŋk m   ṅ   ŋ   n   ɲ ʔ y w ʎ r ɻ l

k, m, ɻ, l, r, n, c, p, ŋ, t, ɲ, ṫ, w, j, ṅ, ʎ, ʔ

; <ee> and <oo> cannot be word initial or final.
eR, oR -> i, u / #_, _#

; Long vowels become short before a consonant cluster or <ʔ>
%  @  ʔ
oR o@ oʔ
eR e@ eʔ
iR i@ iʔ
aR a@ aʔ

; Restrict the occurance of <ai>
%  ʔ  c  ŋ  ɲ  j  w  ʎ  r  ɻ  @
ai aʔ ac aŋ aɲ aj aw aʎ ar aɻ a@

; Long vowels become short at the beginning of a word
aR iR uR -> a i u

; An interesting sound change
i -> e / #{+palatal}a{+consonant -palatal}_
a -> i / {+palatal}[vowel -long]{+consonant -palatal}_

; <ji>, <ʎi> and <wu> become <je>, <ʎe> and <wo>
ji ʎi wu jiR ʎiR wuR -> i i u e e u / #_
ji ʎi wu jiR ʎiR wuR -> je ʎe wo jeR ʎeR woR
je wo ʎe -> ju ŋu ʎa / _#
e o eR oR -> i u i u / _#

; Remove leftover markup
@x q @ -> ^

; Romaniser:
oR eR iR uR aR -> oo ee ii uu aa
r, ɻ, ṅ, ṫ, ʔ, ŋ -> rr, r, nh, th, ꞌ, ng
ɲ ʎ j c -> ny ly y j`;

} else if (example == "btx") {
  choice = `; A language based on Tuvan and Blackfoot, hence 'BTX'.
; Tu-foot shows complex consonant clusters,
; two types of vowel harmony, pitch accent.

    p, pː, tː, k, kː, ʔ,
    ts, tts, ks, kks,
    s, sː, x,
    m, mː, n, nː,
    w, j,

    a, ɯ, o, u,
    e, i, ø, y

`;

    } else if (example == "japanese") {
        choice = `; Japanese-like based on interpreting wikipedia.org/wiki/Japanese_phonology 
; and link.springer.com/content/pdf/10.3758/BF03195600.pdf

; <X> gives me onsetless morae.    <R> gives me long vowels
; <N> is the syllable final nasal. <Q> gives me geminate consonants

C = k, t, s, r, n, ^, h, m, d, g, z, b, w, p
I = k, ^, t, s, n, m, h, d, g, r, z, b, w, p
V = a, i, u, o, e, [oR, aR, iR, eR, uR, yu, yo, ya, [yoR, yuR, yaR]]
F = N, Q

$S = CV(F) ; Gives type C(y)V(R)(N,Q).
$A = IV(F) ; First syllable of slightly different consonant distribution.

# Where light syllable is (C)V, and heavy is (C)[VF,VR(F)].
# The final two syllables are least likely to be light + heavy.

words: $S $A$S$S $A$S$S$S $A$S$S$S$S $A$S

graphemes: a b ch d e f g h i j k l m n o p r s sh t ts u w y z

BEGIN transform:

; "Yotsugana": <dz> and <dj> neutralise to <z> and <j>
%  i   u   e   o   ya   yu  yo
s  shi +   +   +   sha  shu sho
z  ji  +   +   +   ja   ju  jo 
t  chi tsu +   +   cha  chu cho
d  ji  zu  +   +   ja   ju  jo
h  hi  fu  +   +   +    +   +
w  i   wa  e   o   ya   yu  yo

Na Ne Ni No Nu -> n'a n'e n'i n'o n'u

; <N> assimilation, and <Q> gemination.
% ch   sh    ts   j  k   g  s   z  t   d  n  h   b  p   m  r  l  f   w
Q Qtch Qshsh Qtts j  Qkk g  Qss z  Qtt d  n  Qpp b  Qpp m  r  l  Qpp Qpp
N nch  nsh   nts  nj nk  ng ns  nz nt  nd nn nh  mb mp  mm nr nl nf  nw

RQ N Q -> ^ n ^ ; <R> + <Q> is illegal.

; Vowel sequences:
%  a   i   u   e  o
a  a   ai  oo  ae ai
i  ya  i   yuu ie io
u  wa  ui  u   ai ai
e  ee  ei  yoo e  yo
o  oo  oi  ou  oe o

aR eR iR oR uR -> aa ee ii oo uu ; Get long vowels

; Collapse aa ee ii oo uu words into short vowels.
#aa# #ee# #ii# #oo# #uu# -> aa ee ii oo uu
`;

} else if (example == "romance") {
  choice = `; # Spanish-like

; Initial-cluster: pl pr tr cl cr bl br dr gl gr
; All-consonant: t s k q d n b m p l r g h č f z

; Vowels: a e i o u
; Diphthongs: aj aw ej ew oj ja je jo ju wa we wi
; Hiato: ea eo oa
; Triphthong = jaj jej joj jaw jew jow waj wej waw

; Word-internal coda: n r l s m
; Word-final coda: n r l s d z

; rare: ywi, yoi, yaw, od#, yja, yje, yjo, yju

C = t s ^ k d n p l m r b q g h č f z
V = a i o u e
F = n r l s m
T = '
$S = CV(F)

$X = C{T:6}V(F) ; third last: 6%
$Y = C{^:85}V(F) ; 2nd last 85% 
$Z = C{T:9}V(F) ; last: 9%
words: $Y$Z $X$Y$Z $S$X$Y$Z

  

BEGIN transform:

%  a  e  i  o  u
'  á é í ó ú

; Enlace y Hiato
; [a,e,i,o,u]+ -> [a,e,i,o,u]
%   a  e  i  o  u
a   a  aj aj o  aw
e   ea e  ej eo ew
i   ja je i  jo ju
o   oa e  oj o  u
u   wa we wi wo u

%  m  n  j  l  g  y  s 
m  m  ň  +  +  +  +  +
n  ň  ň  ň  +  +  ň  +
j  +  ň  j  ʎ  ʎ  ʎ  +
l  +  ʎ  ʎ  ʎ  +  ʎ  +
g  +  +  ʎ  +  +  +  +
y  +  +  y  +  +  y  +
s  +  +  +  +  +  +  s
r  +  +  +  +  +  y  +  

; q -> c / _(w)[a,o,u]

%  b  k  q  g  č  d  f  h  l  m  n  p  r  s  t  y  z  
m  +  nk nq ng nč nd nf h  nl m  +  +  r  +  nt y  nz 
n  mb +  +  +  +  +  +  h  +  ň  ň  +  +  +  +  ň  +  
r  +  +  +  +  +  +  +  +  +  +  +  +  rr +  +  y  +  
l  +  +  +  +  +  +  +  +  ʎ  +  ʎ  +  +  +  +  y  +  
s  +  +  +  +  +  +  +  +  +  +  +  +  +  s  +  +  +  
j  +  +  +  ň  +  +  +  +  ʎ  +  ň  +  +  +  +  ʎ  +  
w  +  +  +  +  +  +  +  +  +  +  +  +  +  +  +  y  +

% j  w
n ň  +
l ʎ  +
g ň  +
y ʎ  +
q +  q

Taco-taco, burrito-burrito
k q  č  h  ň ʎ  j  w > c qu ch j  ñ ll i  u

`;

} else if (example == "yoruba") {
  choice = `; # Tonal Yoruba

; a e ẹ i o ọ u ṵ o̰ ḛ ḭ 

; b	 t     k  kp
;    d     g  gb
; mb nd    ŋg ŋgb
;    c  ç
; f  s  ş         h
; m  l  j  ŋ  w
;    r

; Ol' dead consonant trick:
  l -> n / N_N
  p -> f / V_V
  ɓ	ɗ -> p l


`;

} else if (example == "tests") {
  choice = `; This is a comment.
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

; CATEGORIES
  C = p, t, k

  ; Category set and category-in-category
  V = a, i, o, e, u, [aa, ee, ii, oo, uu], C

  ; escape characters
  C = \\^, \\[, \\]

  ; Weights
  C = p:7, t:6, k:4

  ; syntax characters
  C = ^

; SEGMENTS
  $S = CVCVCV

  ; Segments-in-segments
  $H = $S

  ; Escape characters
  $C = \\^, \\[, \\]

  ; Weights
  $C = p:7, t:6, k:4

  ; Syntax characters
  $C = ^

  ; Pick-ones
  $C = p[t, k, s]
  ; ==> pt, pk, ps

  ; Optionals
  $C = p(t, k, s)
  ; ==> p, pt, pk, ps

  ; Inter-pick-ones
  $C = CV{D:4}CV{E:5}
  ; ==> pe'ta, peta'

; BUILDING WORDS
  words: $S:5, $SsC:5 $S, $S$S, [foo, bar]

; TRANSFORM:
BEGIN transform

  ; Simple replacement:
    o -> x ; bodido ==> bxdidx

  ; Concurrent set:
  ; Switch [o] and [e] around
    o a -> a o ; boda ==> bado

  ; CLUSTERFIELD
    % k k R F
    a á à ǎ â 
    ā ā́ ā̀ ā̌ ā̂

    graphemes: ts pf
; ~~~~~~~~~~~~

  t -> ʡ
  atsota ==> atsoʡa

    ; A custom sort order for generated words if Sort words is turned on
  graphs: a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z
  graphs: a <[á à ǎ â] b d e <[é è ě ê] g h i <[í ì ǐ î] j k l m n o <[ó ò ǒ ô] p r s t u <[ú ù ǔ û] w
  alphabet: a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z
  invisible: . 
  
; REPLACEMENT
  ; Simple replacement:
    o -> x ; bodido ==> bxdidx

  ; Concurrent set:
  ; Switch [o] and [e] around
    o a -> a o ; boda ==> bado

  ; Merging set:
  ; Three phonemes becoming two phonemes
    ʃ:z dz -> s, d ; zeʃadzas ==> sesadas

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
    k:t s > tʃ ʃ / _i

  ; Tonogenesis:

  ; Sandhi: impossible

`;
    }

    if (choice == '' || choice == null || choice == undefined) {
        return '?';
    } else {
        return choice;
    }

}

export { get_example };