import Logger from "./logger";

function collator(
  logger: Logger,
  words: string[],
  customAlphabet: string[],
  invisible: string[] = []
): string[] {
  if (customAlphabet.length === 0) {
    return words.sort(Intl.Collator().compare);
  }

  customAlphabet.push("🔃","❓");

  const orderMap = new Map<string, number>();
  customAlphabet.forEach((char, index) => orderMap.set(char, index));

  const invisibleSet = new Set<string>(invisible);
  const unknownSet = new Set<string>();

  function tokenize(input: string): string[] {
    const tokens: string[] = [];
    const graphemes = Array.from(orderMap.keys())
      .concat(Array.from(invisibleSet)) // So invisible graphemes get matched as units
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

  function customCompare(a: string, b: string): number {
    const aTokens = tokenize(a).filter(t => !invisibleSet.has(t));
    const bTokens = tokenize(b).filter(t => !invisibleSet.has(t));

    for (let i = 0; i < Math.max(aTokens.length, bTokens.length); i++) {
      const aTok = aTokens[i];
      const bTok = bTokens[i];
      if (aTok === undefined) return -1;
      if (bTok === undefined) return 1;

      const aIndex = orderMap.get(aTok);
      const bIndex = orderMap.get(bTok);

      if (aIndex === undefined) unknownSet.add(aTok);
      if (bIndex === undefined) unknownSet.add(bTok);

      if ((aIndex ?? Infinity) !== (bIndex ?? Infinity)) {
        return (aIndex ?? Infinity) - (bIndex ?? Infinity);
      }
    }

    return 0;
  }

  const sorted = [...words].sort(customCompare);

  if (unknownSet.size > 0) {
    logger.warn(
      `The custom order stated in \`alphabet\` was ignored because words had unknown graphemes: "${Array.from(unknownSet).join(", ")}"; missing from \`alphabet\``
    );
    return words.sort(Intl.Collator().compare);
  }

  return sorted;
}


export default collator;