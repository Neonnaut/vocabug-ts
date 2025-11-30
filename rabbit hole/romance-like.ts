const examples: { [key: string]: string } = {
  romance:
`; This should produce simplified Spanish-looking words

; Initial-cluster: pl pr tr cl cr bl br dr gl gr
; All-consonant: t s k q d n b m p l r g h č f z
; Vowels: a e i o u
; Diphthongs: aj aw ej ew oj ja je jo ju wa we wi wo
; Hiato: ea eo oa
; Word-internal coda: n r l s m
; Word-final coda: n r l s
; If stressing the penultimate syllable, don't show stress.
; Stress can also appear on the last or third-from-last syllable

categories:
  C = {t*9,tr} s ^ {k*12,kr*2,kl} {d*12,dr} n {p*12,pr*2,pl} l m r {b*9,br*2,bl} q g h {č*12 f z}
  V = a i o u e
  F = n r l s m
  X = n r l s
  T = &[Acute]

units:
  $ = CV(F)
  <X> = CV{[T:1]*9,[T:3]F} ; 3rd last syllable
  <Y> = CV{[^*80]*9,[^:95]F} ; 2nd last syllable
  <Z> = CV{[T*3]*10,[T:9]X} ; last syllable

@words.optionals-weight = 15%
words:
  <Y><Z> <X><Y><Z> $<X><Y><Z>

stage:
<routine = compose> ; Get stressed vowels
u:+, u~u~> o, e / _# ; /u/ final vowels should be less prominant
{a,e,i,o,u}:+ -> {a,e,i,o,u} ; Vowels of 2+ length become 1
áa,ée,íi,óo,úu -> á,é,í,ó,ú
{a,e,o,u,á,é,í,ó,ú}{Σ} > 0 / #_#

; Enlace y Hiato
<  a  e  i  o  u
a  +  aj aj o  aw
e  +  +  ej +  ew
i  ja je +  jo ju
o  +  e  oj +  ju
u  wa we wi wo +
>

qw -> kw / _{a~,o~}
q -> k / _{a~,o~}

nj gj gn gl qw -> ň ň ň ʎ q
jg jn jj jl ww -> ň ň j ʎ w

<  b  k  q  g  č  d  f  h  l  m  n  p  r  s  t  z  
m  +  nk nq ng nč nd nf h  nl m  ň  +  r  +  nt nz 
n  mb +  +  +  +  +  +  h  l  ň  ň  mp +  +  +  +  
r  +  +  +  +  +  +  +  h  l  +  +  +  +  +  +  z  
l  +  +  +  +  +  +  +  h  ʎ  +  ʎ  +  r  +  +  z
s  +  +  +  +  +  +  f  h  +  +  +  +  +  s  +  z 
>

; Taco-taco, burrito-burrito
k q č h ň ʎ j w -> c qu ch j ñ ll i u

i > y / #_{V}~ / {V}~_{V}~`

};

export { examples };