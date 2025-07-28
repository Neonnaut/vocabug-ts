class Escape_Mapper {
    private map: Map<string, string>;
    public counter: number;

    constructor() {
        this.map = new Map;
        this.map.set(String.fromCharCode(0xE0000), " "); // Store the placeholder → original
        this.counter = 1;
    }

    escape_backslash_pairs(input: string): string {
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

    escape_backslash_space(input: string): string {
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

    restore_escaped_chars(input: string): string {
      return input.split("").map(c => this.map.has(c) ? this.map.get(c)! : c).join("");
    }

    restore_preserve_escaped_chars(input: string): string {
      return input
      .split("")
      .map(c => this.map.has(c) ? "\\" + this.map.get(c) : c)
      .join("");
    }

}

export default Escape_Mapper;