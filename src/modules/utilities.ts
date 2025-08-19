
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

function validate_cat_seg_name(str: string): [boolean, boolean] {

    const regex = new RegExp(`^(${cappa}|\\$${cappa})$`, "u");

    const has_dollar_sign = str.includes("$");

    return [regex.test(str), has_dollar_sign];
}

function get_cat_seg(input: string): [string, string, boolean, boolean, boolean] {
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

    const [is_valid, has_dollar_sign] = validate_cat_seg_name(word);

    return [word, field, true, is_valid, has_dollar_sign]; // Return word, field, valid, isCapital, has_dollar_sign
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

export {
  get_last, capitalise, make_percentage, weighted_random_pick, get_distribution,
  supra_weighted_random_pick,
  get_cat_seg, cappa
};