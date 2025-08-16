import Logger from "./logger";

function collator(
  logger: Logger,
  words: string[],
  custom_alphabet: string[],
  invisible: string[] = []
): string[] {
  if (custom_alphabet.length === 0) {
    return words.sort(Intl.Collator().compare);
  }

  custom_alphabet.push("�");

  const order_map = new Map<string, number>();
  custom_alphabet.forEach((char, index) => order_map.set(char, index));

  const invisible_set = new Set<string>(invisible);
  const unknown_set = new Set<string>();

  function tokenize(input: string): string[] {
    const tokens: string[] = [];
    const graphemes = Array.from(order_map.keys())
      .concat(Array.from(invisible_set)) // So invisible graphemes get matched as units
      .sort((a, b) => b.length - a.length);

    let i = 0;
    while (i < input.length) {
      let matched = false;

      for (const g of graphemes) {
        if (input.startsWith(g, i)) {
          tokens.push(g);
          i += g.length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        tokens.push(input[i]);
        i += 1;
      }
    }

    return tokens;
  }

  function custom_compare(a: string, b: string): number {
    const aTokens = tokenize(a).filter(t => !invisible_set.has(t));
    const bTokens = tokenize(b).filter(t => !invisible_set.has(t));

    for (let i = 0; i < Math.max(aTokens.length, bTokens.length); i++) {
      const aTok = aTokens[i];
      const bTok = bTokens[i];
      if (aTok === undefined) return -1;
      if (bTok === undefined) return 1;

      const aIndex = order_map.get(aTok);
      const bIndex = order_map.get(bTok);

      if (aIndex === undefined) unknown_set.add(aTok);
      if (bIndex === undefined) unknown_set.add(bTok);

      if ((aIndex ?? Infinity) !== (bIndex ?? Infinity)) {
        return (aIndex ?? Infinity) - (bIndex ?? Infinity);
      }
    }

    return 0;
  }

  const sorted = [...words].sort(custom_compare);

  if (unknown_set.size > 0) {
    logger.warn(
      `The custom order stated in 'alphabet' was ignored because words had unknown graphemes: '${Array.from(unknown_set).join(", ")}' missing from 'alphabet'`
    );
    return words.sort(Intl.Collator().compare);
  }

  return sorted;
}


export default collator;