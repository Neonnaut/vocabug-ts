
// This thing fetches the last item of an array
const get_last = <T = never>(arr: ArrayLike<T> | null | undefined) =>
  arr?.[arr.length - 1];

function capitalise(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
}

const makePercentage = (input: string): number | null => {
  const num = Number(input);
  return Number.isInteger(num) && num >= 1 && num <= 100 ? num : null;
};

function validateCatSegName(str: string): [boolean, boolean] {
    const regex = /^[A-Z\u00C1\u0106\u00C9\u01F4\u00CD\u1E30\u0139\u1E3E\u0143\u00D3\u1E54\u0154\u015A\u00DA\u1E82\u00DD\u0179\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9]$|^\$[A-Z\u00C1\u0106\u00C9\u01F4\u00CD\u1E30\u0139\u1E3E\u0143\u00D3\u1E54\u0154\u015A\u00DA\u1E82\u00DD\u0179\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9]$/u;
    const hasDollarSign = str.includes("$");

    return [regex.test(str), hasDollarSign];
}

function validateSegment(str: string): boolean {
  let insideSquare = false;
  let insideParen = false;

  // We don't want random space or comma inside segment

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === "[") insideSquare = true;
    else if (char === "]") insideSquare = false;

    else if (char === "(") insideParen = true;
    else if (char === ")") insideParen = false;

    if ((char === "," || char === " ") && !insideSquare && !insideParen) {
      return false;
    }
  }

  return true;
}


function getCatSeg(input: string): [string, string, boolean, boolean, boolean] {
    const divider = "=";
  
    if (input === "") {
        return ['', '', false, false, false]; // Handle invalid inputs
    }

    const divided = input.split(divider);
    if (divided.length !== 2) {
        return ['', '', false, false, false]; // Ensure division results in exactly two parts
    }

    const word = divided[0].trim();
    const field = divided[1].trim();
    if (word === "" || field === "") {
        return ['', '', false, false, false]; // Handle empty parts
    }

    const [isValid, hasDollarSign] = validateCatSegName(word);

    return [word, field, true, isValid, hasDollarSign]; // Return word, field, valid, isCapital, hasDollarSign
}

function GetTransform(input: string): [string[], string[], boolean] {
    if (input === "") {
        return [[], [], false]; // Handle invalid inputs
    }

    const divided = input.split(/->|>|→/); 
    if (divided.length !== 2) {
        return [[], [], false]; // Ensure division results in exactly two parts
    }

    let target:any = divided[0].trim();
    let result:any = divided[1].trim();

    if (target === "" || result === "") {
        return [[], [], false]; // Handle empty parts
    }

    target = target.split(/[,\s]+/).filter(Boolean);
    result = result.split(/[,\s]+/).filter(Boolean);

    return [target, result, true]; // Return word, field, valid
}



function valid_words_brackets(str: string): boolean {
  const stack: string[] = [];
  const bracketPairs: Record<string, string> = {
    ')': '(',
    '>': '<',
    ']': '[',
  };
  for (const char of str) {
    if (Object.values(bracketPairs).includes(char)) {
      stack.push(char); // Push opening brackets onto stack
    } else if (Object.keys(bracketPairs).includes(char)) {
      if (stack.length === 0 || stack.pop() !== bracketPairs[char]) {
        return false; // Unmatched closing bracket
      }
    }
  }
  return stack.length === 0; // Stack should be empty if balanced
}

function valid_category_brackets(str: string): boolean {
  const stack: string[] = [];
  const bracketPairs: Record<string, string> = {
    ']': '['
  };
  for (const char of str) {
    if (Object.values(bracketPairs).includes(char)) {
      stack.push(char); // Push opening brackets onto stack
    } else if (Object.keys(bracketPairs).includes(char)) {
      if (stack.length === 0 || stack.pop() !== bracketPairs[char]) {
        return false; // Unmatched closing bracket
      }
    }
  }
  return stack.length === 0; // Stack should be empty if balanced
}

function valid_weights(str: string): boolean {

  // Rule 1: asterisk must be followed by a number (integer or decimal)
  const asteriskWithoutNumber = /\*(?!\d+(\.\d+)?)/g;

  // Rule 2: asterisk must not appear at the start
  const asteriskAtStart = /^\*/; // Returns false if follows rule

  // Rule 3: asterisk must not be preceded by space or comma
  const asteriskAfterSpaceOrComma = /[ ,]\*/g; // Returns false if follows rule

  // Rule 4: asterisk-number (int or decimal) pair
  // must be followed by space, comma, }, ], ), or end of string
  const asteriskNumberBadSuffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,}\]\)\n]|$)/g;

  // If any are true return false
  if (
    asteriskWithoutNumber.test(str) ||
    asteriskAtStart.test(str) ||
    asteriskAfterSpaceOrComma.test(str) ||
    asteriskNumberBadSuffix.test(str)
  ) {
    return false;
  }
  return true;
}

function valid_category_weights(str: string): boolean {

  // Rule 1: asterisk must be followed by a number (integer or decimal)
  const asteriskWithoutNumber = /\*(?!\d+(\.\d+)?)/g;

  // Rule 2: asterisk must not appear at the start
  const asteriskAtStart = /^\*/; // Returns false if follows rule

  // Rule 3: asterisk must not be preceded by space or comma
  const asteriskAfterSpaceOrComma = /[ ,\[\]]\*/g; // Returns false if follows rule

  // Rule 4: asterisk-number (int or decimal) pair
  // must be followed by space, comma, ], or end of string
  const asteriskNumberBadSuffix = /\*(\d+\.\d+|\d+)(?=[^.\d]|$)(?![ ,\]\n]|$)/g;

  // If any are true return false
  if (
    asteriskWithoutNumber.test(str) ||
    asteriskAtStart.test(str) ||
    asteriskAfterSpaceOrComma.test(str) ||
    asteriskNumberBadSuffix.test(str)
  ) {
    return false;
  }
  return true;
}

function extract_value_and_weight(
    input_list: string[],
    default_distribution: string
): [string[], number[]] {
    let my_values: string[] = [];
    let my_weights: number[] = [];

    // Check if all items lack a weight (i.e., none contain "*")
    const allDefaultWeights = input_list.every(item => !item.includes("*"));

    if (allDefaultWeights) {
        my_values = input_list;

        my_weights = get_distribution(input_list.length, default_distribution);

        return [my_values, my_weights];
    }

    input_list.forEach(item => {
        let [value, weightStr] = item.split("*");
        const weight = weightStr && !isNaN(Number(weightStr)) ? parseFloat(weightStr) : 1;
        my_values.push(value);
        my_weights.push(weight);
    });

    return [my_values, my_weights];
}

function extract_complex_value_and_weight(
    input_list: string[],
    default_distribution: string
): [string[], number[]] {
    const my_values: string[] = [];
    const my_weights: number[] = [];

    const combine_adjacent_chunks = (str: string): string[] => {
        const chunks: string[] = [];
        let buffer = '';
        let bracketDepth = 0;
        let parenDepth = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            buffer += char;

            if (char === '[') bracketDepth++;
            if (char === ']') bracketDepth--;
            if (char === '(') parenDepth++;
            if (char === ')') parenDepth--;

            const atEnd = i === str.length - 1;

            if ((char === ',' && bracketDepth === 0 && parenDepth === 0) || atEnd) {
                if (char !== ',' && atEnd) {
                    // Final character is part of buffer
                } else {
                    buffer = buffer.slice(0, -1); // remove comma
                }
                if (buffer.trim()) chunks.push(buffer.trim());
                buffer = '';
            }
        }

        return chunks;
    };

    const all_parts = input_list.flatMap(combine_adjacent_chunks);

    const all_default_weights = all_parts.every(part =>
        !/^(?:\[.*\]|[^*]+)\*[\d.]+$/.test(part)
    );

    if (all_default_weights) {
      const trimmed_values = all_parts.map(part => part.trim());
      const total_items = trimmed_values.length;

      let chosen_distribution: number[];
      chosen_distribution = get_distribution(total_items, default_distribution);

      my_values.push(...trimmed_values);
      my_weights.push(...chosen_distribution);

      return [my_values, my_weights];
    }


    for (const part of all_parts) {
        const trimmed = part.trim();
        const match = trimmed.match(/^(.*)\*([\d.]+)$/);

        if (match && !/\[.*\*.*\]$/.test(match[1])) {
            my_values.push(match[1]);
            my_weights.push(parseFloat(match[2]));
        } else if (/^\[.*\]\*[\d.]+$/.test(trimmed)) {
            const i = trimmed.lastIndexOf("*");
            my_values.push(trimmed.slice(0, i));
            my_weights.push(parseFloat(trimmed.slice(i + 1)));
        } else {
            my_values.push(trimmed);
            my_weights.push(1);
        }
    }

    return [my_values, my_weights];
}

function weightedRandomPick(items:string[], weights:number[]): string {
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let randomValue = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        if (randomValue < weights[i]) {
            return items[i];
        }
        randomValue -= weights[i];
    }

    return '';
}

function guseinzade_distribution(no_of_items: number): number[] {
    const jitter = (val: number, percent: number = 7): number =>
        val * (1 + (percent * (Math.random() - 0.5)) / 100);
    const weights: number[] = [];
    for (let i = 0; i < no_of_items; ++i) {
        weights.push(jitter(Math.log(no_of_items + 1) - Math.log(i + 1)));
    }
    return weights;
}
function zipfian_distribution(no_of_items: number): number[] {
    const jitter = (val: number, percent: number = 2): number =>
        val * (1 + (percent * (Math.random() - 0.5)) / 100);
    const weights: number[] = [];
    for (let i = 0; i < no_of_items; ++i) {
        weights.push(jitter(10 / Math.pow(i + 1, 0.9)));
    }
    return weights;
}
function shallow_distribution(no_of_items: number): number[] {
    const weights: number[] = [];

    for (let i = 0; i < no_of_items; ++i) {
        const rank = i + 1;
        // Interpolated exponent: smooth but doesn't get too flat
        const t = i / (no_of_items - 1); // from 0 to 1
        const exponent = 0.5 - t * 0.07; // interpolates 0.5 → 0.13
        weights.push(1 / Math.pow(rank, exponent));
    }
    return weights
}

function flat_distribution(no_of_items: number): number[] {
    const weights: number[] = [];
    for (let i = 0; i < no_of_items; ++i) {
        weights.push(1);
    }
    return weights;
}

function get_distribution(n: number, default_distribution:string): number[] {
  // Essentially get weights for a distribution based on the number of items
  if (n == 1) return [1]; // Special case of 1 item, avoids 0/0 error
  if (default_distribution === "zipfian") return zipfian_distribution(n);
  if (default_distribution === "gusein-zade") return guseinzade_distribution(n);
  if (default_distribution === "shallow") return shallow_distribution(n);

  return flat_distribution(n);
}


function resolve_nested_categories(
  input: string,
  default_distribution: string
): { graphemes: string[]; weights: number[] } {
  type Entry = { key: string; weight: number };

  // Break expression into string tokens and nested groups with optional weights
  function tokenize(expr: string): (string | { group: string; weight: number })[] {
    const tokens: (string | { group: string; weight: number })[] = [];
    let i = 0;
    let buffer = '';

    // console.log(`🔍 Tokenizing expression: "${expr}"`);

    while (i < expr.length) {
      if (expr[i] === '[') {
        if (buffer.trim()) {
          // console.log(`🔹 Found literal token: "${buffer.trim()}"`);
          tokens.push(buffer.trim());
          buffer = '';
        }

        let depth = 1, j = i + 1;
        while (j < expr.length && depth > 0) {
          if (expr[j] === '[') depth++;
          else if (expr[j] === ']') depth--;
          j++;
        }

        const content = expr.slice(i + 1, j - 1);
        i = j;

        let weight = 1;
        if (expr[i] === '*') {
          i++;
          let w = '';
          while (i < expr.length && /[\d.]/.test(expr[i])) w += expr[i++];
          weight = parseFloat(w || '1');
        }

        // console.log(`🔸 Found nested group: [${content}] with weight ${weight}`);
        tokens.push({ group: content, weight });
      } else if (/[,\s]/.test(expr[i])) {
        if (buffer.trim()) {
          // console.log(`🔹 Found literal token: "${buffer.trim()}"`);
          tokens.push(buffer.trim());
          buffer = '';
        }
        i++;
      } else {
        buffer += expr[i++];
      }
    }

    if (buffer.trim()) {
      // console.log(`🔹 Found literal token at end: "${buffer.trim()}"`);
      tokens.push(buffer.trim());
    }

    return tokens;
  }

  // Evaluate expression tree and assign weights recursively
  function evaluate(expr: string, multiplier = 1): Entry[] {
    // console.log(`🔁 Evaluating expression: "${expr}" (multiplier=${multiplier})`);
    const tokens = tokenize(expr);

    const usesExplicitWeights = tokens.some(t =>
      typeof t === "string" && t.includes("*")
    );

    const dist = usesExplicitWeights
      ? Array(tokens.length).fill(1)
      : get_distribution(tokens.length, default_distribution);

    //if (usesExplicitWeights) {
      // console.log(`📊 Explicit weights detected; using flat distribution`);
    //} else {
      // console.log(`📊 No explicit weights; using distribution "${default_distribution}"`);
    //}

    const entries: Entry[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const tokenWeight = dist[i] * multiplier;

      if (typeof token === 'string') {
        const [key, rawWeight] = token.split('*');
        const hasCustomWeight = rawWeight !== undefined && rawWeight !== '';
        const literalWeight = hasCustomWeight ? parseFloat(rawWeight) : 1;
        const finalWeight = hasCustomWeight ? literalWeight * multiplier : tokenWeight;

        // console.log(`🔹 Literal "${key.trim()}" → weight: ${finalWeight}`);
        entries.push({ key: key.trim(), weight: finalWeight });

      } else {
        // console.log(`🔂 Recursing into nested group: "${token.group}" with weight ${token.weight}`);
        const innerEntries = evaluate(token.group, 1);
        const total = innerEntries.reduce((sum, e) => sum + e.weight, 0);

        for (const { key, weight } of innerEntries) {
          const scaled = (weight / total) * token.weight * tokenWeight;
          // console.log(`  ↪ "${key}" scaled to ${scaled.toFixed(4)}`);
          entries.push({ key, weight: scaled });
        }
      }
    }
    return entries;
  }

  const evaluated = evaluate(input);
  const keys = evaluated.map(e => e.key);
  const weights = evaluated.map(e => e.weight);
  // console.log(`🏁 Final result → Graphemes: ${keys.join(", ")} | Weights: ${weights.map(w => w.toFixed(4)).join(", ")}`);
  return { graphemes: keys, weights: weights };
}

function resolve_wordshape_sets(
  input_list: string,
  distribution: string,
  optionals_weight: number // percentage chance to include optionals (0–100)
): string {
  const squarePattern = /\[[^\[\]]*\]/g;
  const roundPattern = /\([^\(\)]*\)/g;
  let matches: RegExpMatchArray | null;

  let items: string[] = [];
  let outputs: [string[], number[]];

  // console.log(`🔍 Starting with input: "${input_list}"`);

  // Resolve optional sets in round brackets based on weight
  while ((matches = input_list.match(roundPattern)) !== null) {
    const group = matches[matches.length - 1];
    const candidates = group.slice(1, -1).split(/[,\s]+/).filter(Boolean);

    // console.log(`🌀 Found optional group: (${candidates.join(", ")})`);

    const include = Math.random() * 100 < optionals_weight;
    // console.log(`🔸 Include group? ${include ? "Yes ✅" : "No ❌"} (weight=${optionals_weight}%)`);

    if (include && candidates.length > 0) {
      const usesExplicitWeights = candidates.some(c => c.includes("*"));
      const distType = usesExplicitWeights ? "flat" : distribution;
      // console.log(`📊 Resolving with distribution: ${distType}`);

      outputs = extract_value_and_weight(candidates, distType);
      const selected = weightedRandomPick(outputs[0], outputs[1]);
      // console.log(`🎯 Selected from optional: ${selected}`);
      input_list = input_list.replace(group, selected);
    } else {
      input_list = input_list.replace(group, '');
      // console.log(`🚫 Group excluded`);
    }

    // console.log(`🔄 Updated input: "${input_list}"`);
  }

  // Resolve nested sets in square brackets
  while ((matches = input_list.match(squarePattern)) !== null) {
    const mostNested = matches[matches.length - 1];
    items = mostNested.slice(1, -1).split(/[,\s]+/).filter(Boolean);

    // console.log(`🔧 Resolving nested set: [${items.join(", ")}]`);

    if (items.length === 0) {
      items = ["^"];
      // console.log(`⚠️ Empty set, defaulting to '^'`);
    } else {
      const usesExplicitWeights = items.some(c => c.includes("*"));
      const distType = usesExplicitWeights ? "flat" : distribution;
      // console.log(`📊 Resolving with distribution: ${distType}`);

      outputs = extract_value_and_weight(items, distType);
      const picked = weightedRandomPick(outputs[0], outputs[1]);
      // console.log(`🎯 Selected from nested: ${picked}`);
      items = [picked];
    }

    input_list = input_list.replace(mostNested, items[0]);
    // console.log(`🔄 Updated input: "${input_list}"`);
  }

  // Final resolution
  const finalPick = input_list;
  // console.log(`🧮 Final token: ${finalPick}`);

  return finalPick;
}

function parse_distribution(value:string):string {
  if (value.toLowerCase().startsWith("g")) {
    return "gusein-zade";
  } else if (value.toLowerCase().startsWith("z")) {
    return "zipfian";
  } else if (value.toLowerCase().startsWith("s")) {
    return "shallow";
  }
  return "flat";
}



export {
  get_last, capitalise, makePercentage, extract_value_and_weight, weightedRandomPick,
  resolve_nested_categories, resolve_wordshape_sets, parse_distribution,
  valid_category_brackets, valid_words_brackets, valid_weights, valid_category_weights,
  getCatSeg, GetTransform, extract_complex_value_and_weight, validateSegment };