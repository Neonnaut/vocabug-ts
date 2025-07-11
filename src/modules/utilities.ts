
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

export {
  get_last, capitalise, makePercentage, weightedRandomPick, get_distribution,
  getCatSeg, GetTransform,
};