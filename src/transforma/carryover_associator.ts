import { get_first } from "../utils/utilities";
import type { Association, Associateme_Mapper } from "../utils/types";

class Carryover_Associator {
  private caryover_list: { entry_id: number; variant_id: number }[];

  constructor() {
    this.caryover_list = [];
  }

  // Called when a word's grapheme in TARGET matches a rule's grapheme with based-mark
  set_item(entry_id: number, variant_id: number) {
    this.caryover_list.push({ entry_id, variant_id });
  }

  // Get grapheme from
  // result token base and
  // first item in carryover_list entry and variant
  // If not null, removes first item from carryover_list
  // return null or found grapheme
  get_result_associateme(
    association: Association,
    associateme_mapper: Associateme_Mapper,
  ): string | null {
    // Get entry_id and variant_id from first item in carryover_associator
    const item = this.find_first_item();
    if (!item) {
      return null;
    }
    const [entry_id, variant_id] = item;
    // get base_id from my_result_token
    const base_id = association.base_id;

    // Find grapheme in associateme_mapper with entry_id, base_id, variant_id
    const my_grapheme = this.find_grapheme(
      entry_id,
      base_id,
      variant_id,
      associateme_mapper,
    );
    if (!my_grapheme) {
      return null;
    }
    if (entry_id != association.entry_id) {
      return null;
    }
    this.remove_first_item();
    return my_grapheme;
  }

  private find_first_item(): [number, number] | undefined {
    const item = get_first(this.caryover_list);
    return item ? [item.entry_id, item.variant_id] : undefined;
  }

  private remove_first_item() {
    this.caryover_list.shift();
  }

  find_grapheme(
    entry_id: number,
    base_id: number,
    variant_id: number,
    associateme_mapper: Associateme_Mapper,
  ): string | null {
    // Find grapheme in associateme_mapper with entry_id, base_id, variant_id

    // Guard: entry_id must be valid
    if (entry_id < 0 || entry_id >= associateme_mapper.length) {
      return null;
    }

    const entry = associateme_mapper[entry_id];

    // Guard: variant_id must be valid
    if (variant_id < 0 || variant_id >= entry.variants.length) {
      return null;
    }

    const variantGroup = entry.variants[variant_id];

    // Guard: base_id must be valid
    if (base_id < 0 || base_id >= variantGroup.length) {
      return null;
    }

    // Return the grapheme at that position
    return variantGroup[base_id];
  }
}

export default Carryover_Associator;
