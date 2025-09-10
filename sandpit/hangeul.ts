
let e = " \
a   ɛ   ɔ   e   o   i   u    ú   ya   yɛ   yɔ   ye   yo   yú   wa   wɛ   wɔ   we   wi   úy   uy      \
ㅏ  ㅐ  ㅓ  ㅔ  ㅗ   ㅣ  ㅡ   ㅜ  ㅑ    ㅒ   ㅕ   ㅖ   ㅛ    ㅠ   ㅘ   ㅙ   ㅝ   ㅞ   ㅚ   ㅟ    ㅢ ";

let v = " \
Hangul	ㄱ   ㄲ   ㄴ   ㄷ   ㄸ   ㄹ   ㅁ   ㅂ   ㅃ   ㅅ   ㅆ   ㅇ   ㅈ   ㅉ   ㅊ   ㅋ   ㅌ   ㅍ   ㅎ \
Initial k    gk   n    t   dt   r    m    p    bp   s    zs       c    jc   ch   kh   th  ph   x \
Final   k    gk   n    t        r    m    p         s    zs  gn   c         ch   kh   th  ph   x";


function combine_jamo(initial: number, medial: number, final: number): string {
    if (initial === -1 && medial === -1 && final === -1) {
        // Nothing to combine, return empty or placeholder
        return ""; // or "�" for visible fallback
    }
    if (medial === -1) {
        // Return standalone consonant jamo
        return initial >= 0 ? String.fromCharCode(0x3131 + initial) : "";
    }

    const base_code = 0xAC00;
    const final_offset = final >= 0 ? final : 0;
    const syllable_code = base_code + initial * 588 + medial * 28 + final_offset;
    return String.fromCharCode(syllable_code);
}
