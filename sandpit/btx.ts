const examples: { [key: string]: string } = {
  btx:
`
; A language based on Tuvan and Blackfoot, hence 'BTX'.
; Tu-foot shows complex consonant clusters,
; two types of vowel harmony, pitch accent.

; p, t, k, ʔ,
; ts, ks,
; s, h,
; m, n,
; r
; w, j,

C0 is <s>

C1 starts with a consonant that is not <h, ʔ, r>
c2 is <j>
V is <a, e, i, o, u, ɯ, ø, y>


pp, tt, kk,
tts, kks,
ss,
mm, nn,

; a, ɯ, o, u,
; e, i, ø, y,

(s)CVMXs

#(s)CV                                                   sksa
-(N, s, h, ', r)XV                                       kamkka, kaska
-(N, s, h, ', r)CV(t, k, ts, ks, s, n, nt, nk, nts)#     skank

`

};

export { examples };


