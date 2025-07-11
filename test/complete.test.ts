

import gen_words from '../src/modules/core'
import { get_example } from '../src/examples'

import { describe, it, expect } from 'vitest';

describe('vocabug', () => {
  it('returns generated words', () => {
    const defaul_def = gen_words(get_example('basic'),"7",'word-list',true,false,true,false," ");
    expect(typeof defaul_def.text).toBe('string');
    expect(defaul_def.text.length).toBeGreaterThan(0);
    expect(defaul_def.errors.length).toBeLessThan(1);
    expect(defaul_def.warnings.length).toBeLessThan(1);
    expect(defaul_def.infos.length).toBeGreaterThan(0);
    console.log(defaul_def.text);
  });
});