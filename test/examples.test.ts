import gen_words from '../src/modules/core';
import { examples } from '../src/examples';

import { describe, it, expect } from 'vitest';

describe('vocabug', () => {
  it('returns generated words', () => {

    for (const [name, example] of Object.entries(examples)) {

      const def = gen_words(example,"7",'word-list',true,false,true,false," ");
      expect(typeof def.text).toBe('string');
      expect(def.text.length).toBeGreaterThan(0);
      expect(def.errors.length).toBeLessThan(1);
      expect(def.warnings.length).toBeLessThan(1);
      expect(def.infos.length).toBeGreaterThan(0);
      console.log(def.text);

    }
  });
});