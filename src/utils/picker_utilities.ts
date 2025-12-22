function weighted_random_pick(items: string[], weights: number[]): string {
   const total_weight = weights.reduce((acc, w) => acc + w, 0);
   let random_value = Math.random() * total_weight;

   for (let i = 0; i < items.length; i++) {
      if (random_value < weights[i]) {
         return items[i];
      }
      random_value -= weights[i];
   }
   return "";
}

function supra_weighted_random_pick(
   items: string[],
   weights: (number | "s")[],
): string {
   for (let i = 0; i < items.length; i++) {
      if (weights[i] === "s") {
         return items[i]; // override: pick first 's'
      }
   }

   const total_weight = weights.reduce<number>(
      (sum, w) => (typeof w === "number" && w > 0 ? sum + w : sum),
      0,
   );

   if (total_weight === 0) return "";

   let random_value = Math.random() * total_weight;

   for (let i = 0; i < items.length; i++) {
      const w = weights[i];
      if (typeof w !== "number" || w <= 0) continue;
      if (random_value < w) return items[i];
      random_value -= w;
   }

   return "";
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
   return weights;
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

function get_distribution(n: number, default_distribution: string): number[] {
   // Essentially get weights for a distribution based on the number of items
   if (n == 1) return [1]; // Special case of 1 item, avoids 0/0 error
   if (default_distribution === "zipfian") return zipfian_distribution(n);
   if (default_distribution === "gusein-zade")
      return guseinzade_distribution(n);
   if (default_distribution === "shallow") return shallow_distribution(n);

   return flat_distribution(n);
}

export { weighted_random_pick, get_distribution, supra_weighted_random_pick };
