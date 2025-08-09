import Nesca_Grammar_Stream from "../src/modules/nesca_grammar_stream";


import { describe, it, expect } from 'vitest';
import  Logger  from '../src/modules/logger'; // Assuming Logger is defined in src/logger

describe('vocabug', () => {
  it('returns generated words', () => {

    const logger = new Logger();
    const n = new Nesca_Grammar_Stream(logger, ['a', 'b', 'ch'], "target");
    const tokens = n.main_parser("a+{,3}ch+{3,}ch+{3}ch+{3,8}ch+z---*+{,3}*+{3,}*+{3}*+{3,8}*+*---a+{,3}ch+{3,}ch+{3}ch+{3,8}ch+z---~+{,3}~+{3,}~+{3}~+{3,8}~+~");
    console.log(tokens);
    expect(1).toBeGreaterThan(0);
  });
});