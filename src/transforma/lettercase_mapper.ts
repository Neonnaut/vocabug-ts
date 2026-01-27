class lettercase_mapper {
   private map: Map<string, string>;
   private reverse_map: Map<string, string>;

   constructor() {
      this.map = new Map();
      this.reverse_map = new Map();
   }

   create_map(new_map: Map<string, string>): void {
      // Convert Map → array of [key, value]
      const entries: [string, string][] = Array.from(new_map.entries());

      // Sort entries longest-first by key
      const sorted: [string, string][] = entries.sort(
         ([a], [b]) => b.length - a.length,
      );

      // Rebuild map in sorted order
      this.map = new Map<string, string>(sorted);

      // Build reverse map (longest-first by value)
      const reversed: [string, string][] = sorted
         .slice() // avoid mutating sorted
         .sort(([, vA], [, vB]) => vB.length - vA.length)
         .map(([k, v]): [string, string] => [v, k]);

      this.reverse_map = new Map<string, string>(reversed);
   }

   private tokenise(word: string): string[] {
      const tokens: string[] = [];
      let i = 0;

      while (i < word.length) {
         let matched = false;

         for (const [key] of this.map) {
            if (key && word.startsWith(key, i)) {
               tokens.push(key);
               i += key.length;
               matched = true;
               break;
            }
         }

         if (!matched) {
            tokens.push(word[i]);
            i++;
         }
      }

      return tokens;
   }

   capitalise(word: string): string {
      if (!word) return word;

      const tokens = this.tokenise(word);
      const first = tokens[0] ?? "";

      const cap =
         this.map.get(first) ??
         (first ? first[0].toUpperCase() + first.slice(1) : "");

      return cap + tokens.slice(1).join("");
   }
   decapitalise(word: string): string {
      if (!word) return word;

      const tokens = this.tokenise(word);
      const first = tokens[0] ?? "";

      const cap =
         this.reverse_map.get(first) ??
         (first ? first[0].toUpperCase() + first.slice(1) : "");

      return cap + tokens.slice(1).join("");
   }
   to_uppercase(word: string): string {
      if (!word) return word;

      return this.tokenise(word)
         .map((tok) => this.map.get(tok) ?? tok.toUpperCase())
         .join("");
   }
   to_lowercase(word: string): string {
      if (!word) return word;

      return this.tokenise(word)
         .map((tok) => this.reverse_map.get(tok) ?? tok.toLowerCase())
         .join("");
   }
}

export default lettercase_mapper;
