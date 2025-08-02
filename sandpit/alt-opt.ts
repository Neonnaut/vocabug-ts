function resolve_alt_opt(input: string): string[][] {
  // ⚙️ Internal: Check for bracket rules
  function checkGrammarRules(str: string): void {
    const stack: string[] = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (char === '[' || char === '(') {
        if (stack.length >= 1) throw new Error("❌ Nested brackets not allowed.");
        stack.push(char);

        const prev = str[i - 1];
        const next = str[i + 1];
        const startsAlone = i === 0 || /[\s,]/.test(prev);
        const endsAlone = i === str.length - 1 || /[\s,]/.test(next);
        if (startsAlone && endsAlone) {
          throw new Error(`❌ Bracket at index ${i} must be part of a token — not isolated.`);
        }
      }

      if (char === ']' || char === ')') {
        if (stack.length === 0) throw new Error("❌ Mismatched closing bracket.");
        const last = stack.pop();
        if ((char === ']' && last !== '[') || (char === ')' && last !== '(')) {
          throw new Error("❌ Mismatched bracket types.");
        }
      }
    }

    if (stack.length !== 0) throw new Error("❌ Unclosed bracket.");
  }

  // 🧱 Internal: Split input into top-level chunks
  function splitTopLevel(str: string): string[] {
    const chunks: string[] = [];
    let depth = 0;
    let buffer = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '[' || char === '(') depth++;
      else if (char === ']' || char === ')') depth--;
      
      if ((char === ',' || /\s/.test(char)) && depth === 0) {
        if (buffer.trim()) chunks.push(buffer.trim());
        buffer = '';
      } else {
        buffer += char;
      }
    }

    if (buffer.trim()) chunks.push(buffer.trim());
    return chunks;
  }

  // 🔄 Internal: Expand a single chunk
  function expandChunk(chunk: string): string[] {
    checkGrammarRules(chunk);

    const regex = /([^\[\(\]\)]+)|(\[[^\]]+\])|(\([^\)]+\))/g;
    const parts = [...chunk.matchAll(regex)].map(m => m[0]);

    const expansions: string[][] = parts.map(part => {
      if (part.startsWith("[")) {
        return part.slice(1, -1).split(/[\s,]+/);
      } else if (part.startsWith("(")) {
        const val = part.slice(1, -1);
        return [val, ""];
      } else {
        return [part];
      }
    });

    return expansions.reduce<string[]>((acc, curr) => {
      const combo: string[] = [];
      for (const a of acc) {
        for (const c of curr) {
          combo.push(a + c);
        }
      }
      return combo;
    }, [""]);
  }

  // 🎯 Final: Resolve full input
  const chunks = splitTopLevel(input);
  return chunks.map(expandChunk);
}