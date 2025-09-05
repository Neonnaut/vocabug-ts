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

const get_last = <T = never>(arr: ArrayLike<T> | null | undefined) =>
    // This thing fetches the last item of an array
    arr?.[arr.length - 1];

function capitalise(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
}

const make_percentage = (input: string): number | null => {
  const num = Number(input);
  return Number.isInteger(num) && num >= 1 && num <= 100 ? num : null;
};

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
    cappa,
    get_last, capitalise, make_percentage, swap_first_last_items, final_sentence,
    recursive_expansion
};