import Nesca_Grammar_Stream from "../src/modules/nesca_grammar_stream";


import { describe, it, expect } from 'vitest';
import  Logger  from '../src/modules/logger'; // Assuming Logger is defined in src/logger
import Escape_Mapper from '../src/modules/escape_mapper'; // Assuming Escape_Mapper is defined in src/escape_mapper

describe('vocabug', () => {
  it('returns generated words', () => {

    const logger = new Logger();
    const escape_mapper = new Escape_Mapper();
    const n = new Nesca_Grammar_Stream(logger, ['a', 'b', 'ch'], escape_mapper);

    const tokens = n.main_parser("#asdfg#", "BEFORE", 1);
    expect(tokens.length).toBeGreaterThan(0);

    const tokens2 = n.main_parser("asd+{4}*fg::&{a,b,c}\\", "TARGET", 1);
    expect(tokens2.length).toBeGreaterThan(0);;
  });
});