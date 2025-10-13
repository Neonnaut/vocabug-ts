const initials: Record<string, number> = {
  "gk": 1,    // ㄲ
  "dt": 4,    // ㄸ
  "bp": 8,    // ㅃ
  "ch": 13,   // ㅊ
  "kh": 14,   // ㅋ
  "th": 15,   // ㅌ
  "ph": 17,   // ㅍ
  "k": 0,     // ㄱ
  "n": 2,     // ㄴ
  "t": 3,     // ㄷ
  "r": 5,     // ㄹ
  "m": 6,     // ㅁ
  "p": 7,     // ㅂ
  "s": 9,     // ㅅ
  "z": 10,    // ㅆ
  "c": 12,    // ㅈ
  "j": 13,    // ㅉ
  "x": 18     // ㅎ
};

const finals: Record<string, number> = {
  "gk": 2,    // ㄲ
  "gn": 21,   // ㅇ
  "ch": 23,   // ㅊ
  "kh": 24,   // ㅋ
  "th": 25,   // ㅌ
  "ph": 26,   // ㅍ
  "k": 1,     // ㄱ
  "n": 4,     // ㄴ
  "t": 7,     // ㄷ
  "r": 8,     // ㄹ
  "m": 16,    // ㅁ
  "p": 17,    // ㅂ
  "s": 19,    // ㅅ
  "z": 20,    // ㅆ
  "c": 22,    // ㅈ
  "x": 27     // ㅎ
};

const medials: Record<string, number> = {
  "uí": 16,   // ㅟ
  "ùí": 19,   // ㅢ
  "yo": 12,   // ㅛ
  "yu": 17,   // ㅠ
  "yè": 3,    // ㅒ
  "ya": 2,    // ㅑ
  "ye": 7,    // ㅖ
  "yò": 6,    // ㅕ
  "wa": 9,    // ㅘ
  "wè": 10,   // ㅙ
  "wò": 14,   // ㅝ
  "we": 15,   // ㅞ
  "wi": 11,   // ㅚ
  "o": 8,     // ㅗ
  "u": 13,    // ㅜ
  "è": 1,     // ㅐ
  "a": 0,     // ㅏ
  "ò": 4,     // ㅓ
  "e": 5,     // ㅔ
  "ù": 18,    // ㅡ
  "i": 20     // ㅣ
};

const compatibility_jamos = [
  0x3131, 0x3132, 0x3134, 0x3137, 0x3138,
  0x3139, 0x3141, 0x3142, 0x3143, 0x3145,
  0x3146, 0x3147, 0x3148, 0x3149, 0x314A,
  0x314B, 0x314C, 0x314D, 0x314E
];


function roman_to_hangul(input: string): string {
    let output: string = '';

    // Preload token lists for greedy matching
    const init_tokens = Object.keys(initials);
    const medial_tokens = Object.keys(medials);
    const final_tokens = Object.keys(finals);

    while (input.length > 0) {
        let consumed = 0; // total characters consumed this cycle

        // Try and find an initial
        let initial_index: number | null = null;
        for (const token of init_tokens) {
            if (input.startsWith(token)) {
                initial_index = initials[token];
                consumed += token.length;
                break;
            }
        }

        // Try and find a medial
        let medial_index: number | null = null;
        for (const token of medial_tokens) {
            if (input.slice(consumed).startsWith(token)) {
                medial_index = medials[token];
                consumed += token.length;
                break;
            }
        }

        // If no initial or medial match, emit raw character
        if (initial_index === null && medial_index === null) {
            output += input[0]; // preserve raw character
            input = input.slice(1);
            continue;
        }

        // If initial matched but no medial, emit standalone jamo
        if (initial_index !== null && medial_index === null) {
            const jamo = String.fromCharCode(compatibility_jamos[initial_index as number]); // compatibility jamo
            output += jamo;
            input = input.slice(consumed); // consume matched initial
            continue;
        }

        // Try and find a final
        let final_index: number | null = null;
        let final_token: string | null = null;
        for (const token of final_tokens) {
            // Check if this token matches at the current stream position
            if (input.slice(consumed).startsWith(token)) {

                // Look ahead beyond this token to see if a medial follows
                const lookahead = input.slice(consumed + token.length);
                const has_medial_ahead = medial_tokens.some(m => lookahead.startsWith(m));

                if (!has_medial_ahead) {
                    // Accept this final only if no medial follows
                    final_index = finals[token];
                    final_token = token;
                }
                // Whether accepted or rejected, stop scanning finals
                break;
            }
        }

        // If final was accepted, consume its token
        if (final_token !== null) {
            consumed += final_token.length;
        }


        // Compose syllable using Hangul formula
        const jamo = combine_jamo(
            initial_index !== null ? initial_index : 11, // use ㅇ if no initial
            medial_index!, // guaranteed to exist here
            final_index ?? 0 // use 0 if no final
        );

        output += jamo;
        input = input.slice(consumed); // consume all matched tokens
    }

    return output;
}

function combine_jamo(initial: number, medial: number, final: number): string {
    const base_code = 0xAC00;

    const initial_offset = initial >= 0 ? initial : 0;
    const medial_offset = medial >= 0 ? medial : 0;
    const final_offset = final >= 0 ? final : 0;

    const syllable_code = base_code + initial_offset * 588 + medial_offset * 28 + final_offset;
    return String.fromCharCode(syllable_code);
}

export { roman_to_hangul };
