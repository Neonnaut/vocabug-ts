//import vocabug from '../dist/vocabug.es.js';

import vocabug from '../src/index'
import { examples } from '../app/vocabug/examples'


import { describe, it, expect } from 'vitest';

describe('vocabug', () => {
  it('returns generated words', () => {

    for (const [name, example] of Object.entries(examples)) {

      const run = vocabug.vocabug_f({
        file: example,
        num_of_words: 6
      });
      expect(typeof run.payload).toBe('string');
      expect(run.payload.length).toBeGreaterThan(0);
      expect(run.errors.length).toBeLessThan(1);
      expect(run.warnings.length).toBeLessThan(1);
      expect(run.infos.length).toBeGreaterThan(0);
      //expect(run.diagnostics.length).toBeGreaterThan(0);
      console.log(`Example: ${name}; words: ${run.payload}`);
    }
  });
});