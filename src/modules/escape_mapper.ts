class Escape_Mapper {
    private map: Map<string, string>;
    public counter: number;

    constructor() {
        this.map = new Map;
        this.map.set(String.fromCharCode(0xE0000), " "); // Store the placeholder → original
        this.counter = 1;
    }

    escapeBackslashPairs(input: string): string {
      const reverse = new Map<string, string>(); // original char → placeholder

      const result = input.replace(/\\(.)/g, (_, char) => {
        if (reverse.has(char)) {
          return reverse.get(char)!; // reuse existing placeholder
        }

        const placeholder = String.fromCharCode(0xE000 + this.counter);
        reverse.set(char, placeholder);
        this.map.set(placeholder, char); // Store the placeholder → original
        this.counter++;
        return placeholder;
      });

      return result;
    }

escapeBackslashSpace(input: string): string {
      const reverse = new Map<string, string>(); // original char → placeholder

      const result = input.replace(/\\(\\| )/g, (_, char) => {
        if (reverse.has(char)) {
          return reverse.get(char)!; // reuse existing placeholder
        }

        const placeholder = String.fromCharCode(0xE000 + this.counter);
        reverse.set(char, placeholder);
        this.map.set(placeholder, char); // Store the placeholder → original
        this.counter++;
        return placeholder;
      });

      return result;
    }

    restoreEscapedChars(input: string): string {
      return input.split("").map(c => this.map.has(c) ? this.map.get(c)! : c).join("");
    }

    restorePreserveEscapedChars(input: string): string {
      return input
      .split("")
      .map(c => this.map.has(c) ? "\\" + this.map.get(c) : c)
      .join("");
    }

}

export default Escape_Mapper;