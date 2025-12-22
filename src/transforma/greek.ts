const latin_to_greek_code_map: Record<string, string> = {
   a: "α",
   á: "ά",
   à: "ὰ",
   e: "ε",
   é: "έ",
   è: "ὲ",
   ẹ: "η",
   ẹ́: "ή",
   ẹ̀: "ὴ",
   i: "ι",
   í: "ί",
   ì: "ὶ",
   o: "ο",
   ó: "ό",
   ò: "ὸ",
   ọ: "ω",
   ọ́: "ώ",
   ọ̀: "ὼ",
   u: "υ",
   ú: "ύ",
   ù: "ὺ",

   b: "β",
   d: "δ",
   f: "φ",
   g: "γ",
   k: "κ",
   l: "λ",
   m: "μ",
   n: "ν",
   p: "π",
   r: "ρ",
   s: "σ",
   t: "τ",
   x: "χ",
   z: "ζ",

   h: "ͱ",
   č: "ͷ",
   c: "ϛ",
   q: "ξ",
   þ: "θ",
   ṕ: "ψ",
   š: "ϸ",
   w: "ϝ",
   j: "ϳ",
};

// Build inverse map automatically
const greek_to_latin_code_map: Record<string, string> = Object.fromEntries(
   Object.entries(latin_to_greek_code_map).map(([latin, greek]) => [
      greek,
      latin,
   ]),
);

export function latin_to_greek(input: string): string {
   let out = "";
   for (const char of input) {
      out += latin_to_greek_code_map[char] ?? char;
   }
   return out;
}

export function greek_to_latin(input: string): string {
   let out = "";
   for (const char of input) {
      out += greek_to_latin_code_map[char] ?? char;
   }
   return out;
}
