import gen_words from '../src/modules/core';
import { examples } from '../src/examples';

import { describe, it, expect } from 'vitest';

describe('vocabug', () => {
  it('returns generated words', () => {

    for (const [name, example] of Object.entries(examples)) {

      const def = gen_words({
        file: example,
        num_of_words: "7",
        mode: 'word-list',
        remove_duplicates: true,
        force_word_limit: false,
        sort_words: true,
        capitalise_words: false,
        word_divider: " "
      });
      expect(typeof def.text).toBe('string');
      expect(def.text.length).toBeGreaterThan(0);
      expect(def.errors.length).toBeLessThan(1);
      expect(def.warnings.length).toBeLessThan(1);
      expect(def.infos.length).toBeGreaterThan(0);
      console.log(def.text);

    }
  });
});