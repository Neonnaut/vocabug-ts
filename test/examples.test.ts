//import vocabug from '../dist/vocabug.es.js';

import vocabug from '../src/index'


import { describe, it, expect } from 'vitest';

describe('vocabug', () => {
  it('returns generated words', () => {

    for (const [name, example] of Object.entries(vocabug.examples)) {

      const run = vocabug.generate({
        file: example,
        num_of_words: 6
      });
      expect(typeof run.text).toBe('string');
      expect(run.text.length).toBeGreaterThan(0);
      expect(run.errors.length).toBeLessThan(1);
      expect(run.warnings.length).toBeLessThan(1);
      expect(run.infos.length).toBeGreaterThan(0);
      //expect(run.diagnostics.length).toBeGreaterThan(0);
      console.log(`Example: ${name}; words: ${run.text}`);
    }
  });
});