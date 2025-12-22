const initials: Record<string, number> = {
   gk: 1, // ㄲ
   dt: 4, // ㄸ
   bp: 8, // ㅃ
   ch: 13, // ㅊ
   kh: 14, // ㅋ
   th: 15, // ㅌ
   ph: 17, // ㅍ
   k: 0, // ㄱ
   n: 2, // ㄴ
   t: 3, // ㄷ
   r: 5, // ㄹ
   m: 6, // ㅁ
   p: 7, // ㅂ
   s: 9, // ㅅ
   z: 10, // ㅆ
   c: 12, // ㅈ
   j: 13, // ㅉ
   x: 18, // ㅎ
};

const finals: Record<string, number> = {
   gk: 2, // ㄲ
   gn: 21, // ㅇ
   ch: 23, // ㅊ
   kh: 24, // ㅋ
   th: 25, // ㅌ
   ph: 26, // ㅍ
   k: 1, // ㄱ
   n: 4, // ㄴ
   t: 7, // ㄷ
   r: 8, // ㄹ
   m: 16, // ㅁ
   p: 17, // ㅂ
   s: 19, // ㅅ
   z: 20, // ㅆ
   c: 22, // ㅈ
   x: 27, // ㅎ
};

const medials: Record<string, number> = {
   uí: 16, // ㅟ
   ụí: 19, // ㅢ
   yo: 12, // ㅛ
   yu: 17, // ㅠ
   yẹ: 3, // ㅒ
   ya: 2, // ㅑ
   ye: 7, // ㅖ
   yọ: 6, // ㅕ
   wa: 9, // ㅘ
   wẹ: 10, // ㅙ
   wọ: 14, // ㅝ
   we: 15, // ㅞ
   wi: 11, // ㅚ
   o: 8, // ㅗ
   u: 13, // ㅜ
   ẹ: 1, // ㅐ
   a: 0, // ㅏ
   ọ: 4, // ㅓ
   e: 5, // ㅔ
   ụ: 18, // ㅡ
   i: 20, // ㅣ
};

const compatibility_jamos = [
   0x3131, 0x3132, 0x3134, 0x3137, 0x3138, 0x3139, 0x3141, 0x3142, 0x3143,
   0x3145, 0x3146, 0x3147, 0x3148, 0x3149, 0x314a, 0x314b, 0x314c, 0x314d,
   0x314e,
];

function latin_to_hangul(input: string): string {
   let output: string = "";

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
         const jamo = String.fromCharCode(
            compatibility_jamos[initial_index as number],
         ); // compatibility jamo
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
            const has_medial_ahead = medial_tokens.some((m) =>
               lookahead.startsWith(m),
            );

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
         final_index ?? 0, // use 0 if no final
      );

      output += jamo;
      input = input.slice(consumed); // consume all matched tokens
   }

   return output;
}

function combine_jamo(initial: number, medial: number, final: number): string {
   const base_code = 0xac00;

   const initial_offset = initial >= 0 ? initial : 0;
   const medial_offset = medial >= 0 ? medial : 0;
   const final_offset = final >= 0 ? final : 0;

   const syllable_code =
      base_code + initial_offset * 588 + medial_offset * 28 + final_offset;
   return String.fromCharCode(syllable_code);
}

// Build inverse maps
const inv_initials: Record<number, string> = {};
for (const [k, v] of Object.entries(initials)) inv_initials[v] = k;

const inv_medials: Record<number, string> = {};
for (const [k, v] of Object.entries(medials)) inv_medials[v] = k;

const inv_finals: Record<number, string> = {};
for (const [k, v] of Object.entries(finals)) inv_finals[v] = k;

function hangul_to_latin(input: string): string {
   let out = "";

   for (const ch of input) {
      const code = ch.charCodeAt(0);

      // If not a Hangul syllable block, pass through
      if (code < 0xac00 || code > 0xd7a3) {
         out += ch;
         continue;
      }

      const S = code - 0xac00;

      const initial_index = Math.floor(S / 588);
      const medial_index = Math.floor((S % 588) / 28);
      const final_index = S % 28;

      // Map back to roman tokens
      const initial_token =
         initial_index === 11 ? "" : (inv_initials[initial_index] ?? "");

      const medial_token = inv_medials[medial_index] ?? "";

      const final_token =
         final_index === 0 ? "" : (inv_finals[final_index] ?? "");

      out += initial_token + medial_token + final_token;
   }

   return out;
}

export { hangul_to_latin, latin_to_hangul };
