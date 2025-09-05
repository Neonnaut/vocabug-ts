const escapeMap: Record<string, string> = {
  '"{Space}': '\u0020',
  '"{Acute}': '\u0301',
  '"{DoubleAcute}': '\u030B',
  '"{Grave}': '\u0300',
  '"{DoubleGrave}': '\u030F',
  '"{Circumflex}': '\u0302',
  '"{Caron}': '\u030C',
  '"{Breve}': '\u0306',
  '"{InvertedBreve}': '\u0311',
  '"{TildeAbove}': '\u0303',
  '"{TildeBelow}': '\u0330',
  '"{Macron}': '\u0304',
  '"{Dot}': '\u0307',
  '"{DotBelow}': '\u0323',
  '"{Diaeresis}': '\u0308',
  '"{DiaeresisBelow}': '\u0324',
  '"{Ring}': '\u030A',
  '"{RingBelow}': '\u0325',
  '"{Horn}': '\u031B',
  '"{Hook}': '\u0309',
  '"{CommaAbove}': '\u0313',
  '"{CommaBelow}': '\u0326',
  '"{Cedilla}': '\u0327',
  '"{Ogonek}': '\u0328',
};

const transform_syntax_chars = [
    '@','>','⇒','→','[',']','{','}','(',')', '/', '?',
    '!', '_', '#', '+', ':', '*', '&', '…', '|', '<', '~'
];

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

    escape_special_chars(input: string): string {
      const special_chars = new Set(transform_syntax_chars);
      const reverse = new Map<string, string>(); // original char → placeholder

      const result = input.split("").map(char => {
        if (special_chars.has(char)) {
          if (reverse.has(char)) {
            return reverse.get(char)!;
          }
          const placeholder = String.fromCharCode(0xE000 + this.counter);
          reverse.set(char, placeholder);
          this.map.set(placeholder, char); // Store the placeholder → original
          this.counter++;
          return placeholder;
        }
        return char;
      }).join("");

      return result;
    }


    escape_named_escape(input: string): string {
      return input.replace(/"\{[A-Za-z]+\}/g, match => escapeMap[match] ?? match);
    }

    restore_escaped_chars(input: string): string {
      return input.split("").map(c => this.map.has(c) ? this.map.get(c)! : c).join("");
    }

    // Restore but append a backslash before each character that was escaped
    restore_preserve_escaped_chars(input: string): string {
      return input
      .split("")
      .map(c => this.map.has(c) ? "\\" + this.map.get(c) : c)
      .join("");
    }

}

export default Escape_Mapper;