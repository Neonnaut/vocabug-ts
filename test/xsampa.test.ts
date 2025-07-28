import { test, expect } from 'vitest';
import  { xsampa_to_ipa } from "../src/modules/xsampa";

let my_xsampa = "b b_< c d d_< d` e f g g_< h h\\ i j j\\ k l l\\ l` m n n` o p p\\ q r r\\ r\\` r` s s\\ s` t t` u v v\\ w x x\\ y z z\\ z` A B B\\ C D E F G G\\ G\\_< H H\\ I J J\\ J\\_< K K\\ L L\\ M M\\ N N\\ O O\\ P Q R R\\ S T U V W X X\\ Y Z . \"◌ %◌ ◌' ◌: ◌:\\ @ @\\ @` { } 1 2 3 3\\ 4 5 6 7 8 9 & ? ?\\ <\\ >\\ ^ ! !\\ | |\\ || |\\|\\ =\\ -\\ ◌_\" ◌_+ ◌_- ◌_0 ◌= ◌_> ◌_?\\ ◌_^ ◌_} ◌` ◌~ ◌_= ◌_~) ◌_A ◌_a ◌_B ◌_B_L ◌_c ◌_d ◌_e <F> ◌_F ◌_G ◌_H ◌_H_T ◌_h ◌_j ◌_k ◌_L ◌_l ◌_M ◌_m ◌_N ◌_n ◌_O ◌_o ◌_q <R> ◌_R ◌_R_F ◌_r ◌_T ◌_t ◌_v ◌_w ◌_X ◌_x ◌_\\ ◌_/"

let my_ipa = "b ɓ c d ɗ ɖ e f g ɠ h ɦ i j ʝ k l ɺ ɭ m n ɳ o p ɸ q r ɹ ɻ ɽ s ɕ ʂ t ʈ u v ʋ w x ɧ y z ʑ ʐ ɑ β ʙ ç ð ɛ ɱ ɣ ɢ ʛ ɥ ʜ ɪ ɲ ɟ ʄ ɬ ɮ ʎ ʟ ɯ ɰ ŋ ɴ ɔ ʘ ʋ ɒ ʁ ʀ ʃ θ ʊ ʌ ʍ χ ħ ʏ ʒ . ˈ◌ ˌ◌ ◌ʲ ◌ː ◌ˑ ə ɘ ɚ æ ʉ ɨ ø ɜ ɞ ɾ ɫ ɐ ɤ ɵ œ ɶ ʔ ʕ ʢ ʡ ꜛ ꜜ ǃ | ǀ ‖ ǁ ǂ ‿ ◌̈ ◌̟ ◌̠ ◌̥ ◌̩ ◌ʼ ◌ˤ ◌̯ ◌̚ ◌˞ ◌̃ ◌̩ ◌̃ ◌̘ ◌̺ ◌̏ ◌᷆ ◌̜ ◌̪ ◌̴ ↘ ◌̂ ◌ˠ ◌́ ◌᷄ ◌ʰ ◌ʲ ◌̰ ◌̀ ◌ˡ ◌̄ ◌̻ ◌̼ ◌ⁿ ◌̹ ◌̞ ◌̙ ↗ ◌̌ ◌᷈ ◌̝ ◌̋ ◌̤ ◌̬ ◌ʷ ◌̆ ◌̽ ◌̂ ◌̌"

/*test('ipa_to_xsampa', () => {
  expect(
    ipa_to_xsampa(my_ipa)).toBe(
        my_xsampa
    );
});*/

test('xsampa_to_ipa', () => {
  expect(
    xsampa_to_ipa(my_xsampa)).toBe(
        my_ipa
    );
});
