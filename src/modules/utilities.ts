
const cappa = "[A-Z" +
    // Latin acute
    "\u00C1\u0106\u00C9\u01F4\u00CD\u1E30\u0139\u1E3E\u0143\u00D3\u1E54\u0154\u015A\u00DA\u1E82\u00DD\u0179" +
    // Diaeresis
    "\u00C4\u00CB\u1E26\u00CF\u00D6\u00DC\u1E84\u1E8C\u0178" +
    // Caron
    "\u01CD\u010C\u010E\u011A\u01E6\u021E\u01CF\u01E8\u013D\u0147\u01D1\u0158\u0160\u0164\u01D3\u017D" +
    // Grave
    "\u00C0\u00C8\u00CC\u01F8\u00D2\u00D9\u1E80\u1EF2" +
    // Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω
    "\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9]";

// This thing fetches the last item of an array
const get_last = <T = never>(arr: ArrayLike<T> | null | undefined) =>
  arr?.[arr.length - 1];

function capitalise(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
}

const make_percentage = (input: string): number | null => {
  const num = Number(input);
  return Number.isInteger(num) && num >= 1 && num <= 100 ? num : null;
};

function get_cat_seg_fea(input: string): [string, string, 'category'|'segment'|'feature'|'trash'] {
    const divider = "=";
  
    if (input === "") {
        return ['', '', 'trash']; // Handle invalid inputs
    }
    const divided = input.split(divider);
    if (divided.length !== 2) {
        return [input, '', 'trash']; // Ensure division results in exactly two parts
    }
    const key = divided[0].trim();
    const field = divided[1].trim();
    if (key === "" || field === "") {
        return [input, '', 'trash']; // Handle empty parts
    }

    // Construct dynamic regexes using cappa
    const categoryRegex = new RegExp(`^${cappa}$`);
    const segmentRegex = new RegExp(`^\\$${cappa}$`);
    const featureRegex = /^(\+|-|>)[a-zA-Z+-]+$/;

    if (categoryRegex.test(key)) {
        return [key, field, 'category'];
    }
    if (segmentRegex.test(key)) {
        return [key, field, 'segment'];
    }
    if (featureRegex.test(key)) {
        return [key, field, 'feature'];
    }
    return [input, '', 'trash'];
}

function weighted_random_pick(items:string[], weights:number[]): string {
    const total_weight = weights.reduce((acc, w) => acc + w, 0);
    let random_value = Math.random() * total_weight;

    for (let i = 0; i < items.length; i++) {
        if (random_value < weights[i]) {
            return items[i];
        }
        random_value -= weights[i];
    }
    return '';
}

function supra_weighted_random_pick(items: string[], weights: (number|'s')[]): string {
    for (let i = 0; i < items.length; i++) {
        if (weights[i] === "s") {
            return items[i]; // override: pick first 's'
        }
    }

    const total_weight = weights.reduce<number>((sum, w) =>
    typeof w === "number" && w > 0 ? sum + w : sum
    , 0);

    if (total_weight === 0) return '';

    let random_value = Math.random() * total_weight;

    for (let i = 0; i < items.length; i++) {
        const w = weights[i];
        if (typeof w !== "number" || w <= 0) continue;
        if (random_value < w) return items[i];
        random_value -= w;
    }

    return '';
}

function guseinzade_distribution(no_of_items: number): number[] {
    const weights: number[] = [];
    for (let i = 0; i < no_of_items; ++i) {
        weights.push(Math.log(no_of_items + 1) - Math.log(i + 1));
    }
    return weights;
}

function zipfian_distribution(no_of_items: number): number[] {
    const weights: number[] = [];
    for (let i = 0; i < no_of_items; ++i) {
        weights.push(10 / Math.pow(i + 1, 0.9)); // exponent can be 0.9
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

/*
function normalise(weights: number[]): number[] {
    const total = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => w / total);
}
*/


function get_distribution(n: number, default_distribution:string): number[] {
  // Essentially get weights for a distribution based on the number of items
  if (n == 1) return [1]; // Special case of 1 item, avoids 0/0 error
  if (default_distribution === "zipfian") return zipfian_distribution(n);
  if (default_distribution === "gusein-zade") return guseinzade_distribution(n);
  if (default_distribution === "shallow") return shallow_distribution(n);

  return flat_distribution(n);
}

function swap_first_last_items(array: any[]): any[] {
  if (array.length >= 2) {
    const first_item = array[0];
    const last_item_index = array.length - 1;
    const last_item = array[last_item_index];

    array[0] = last_item;
    array[last_item_index] = first_item;
  }
  return array;
}

function final_sentence(items: string[]): string {
  const len = items.length;

  if (len === 0) return '';
  if (len === 1) return items[0];

  const all_but_last = items.slice(0, len - 1).join(', ');
  const last = items[len - 1];

  return `${all_but_last} and ${last}`;
}

function recursive_expansion(
   input: string,
   mappings: Map<string, { content: string, line_num: number }>,
   enclose_in_brackets: boolean = false
): string {
   const mapping_keys = [...mappings.keys()].sort((a, b) => b.length - a.length);

   const resolve_mapping = (str: string, history: string[] = []): string => {
      let result = '', i = 0;

      while (i < str.length) {
            let matched = false;

            for (const key of mapping_keys) {
               if (str.startsWith(key, i)) {
                  if (history.includes(key)) {
                        result += '�';
                  } else {
                        const entry = mappings.get(key);
                        const resolved = resolve_mapping(entry?.content || '', [...history, key]);
                        result += enclose_in_brackets ? `[${resolved}]` : resolved;
                  }
                  i += key.length;
                  matched = true;
                  break;
               }
            }

            if (!matched) result += str[i++];
      }

      return result;
   };

   return resolve_mapping(input);
}

export {
  get_last, capitalise, make_percentage, weighted_random_pick, get_distribution,
  supra_weighted_random_pick, recursive_expansion,
  get_cat_seg_fea, cappa, swap_first_last_items, final_sentence
};