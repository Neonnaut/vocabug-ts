#!/usr/bin/env node

import * as fs from 'fs';
import yargs from 'yargs';
import generate from '../dist/modules/core';
import { hideBin } from 'yargs/helpers';

import type { Arguments } from 'yargs';

type CLI_Args = Arguments<{
  num_of_words: number;
  output_mode: string;
  remove_duplicates: boolean;
  force_word_limit: boolean;
  sort_words: boolean;
  word_divider: string;
  encoding: BufferEncoding;
}> & {
  _: string[]; // positional args
};

type Output_Modes = 'word-list' | 'debug' | 'paragraph';


const encodings: readonly BufferEncoding[] = [
    'ascii',
    'binary',
    'latin1',
    'ucs-2',
    'ucs2',
    'utf-8',
    'utf16le',
    'utf8'
];

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <path> [options]')

  // aliases for default flags
  .alias({ help: '?', version: 'v' })
  // custom options

  .option('num_of_words', {
    alias: 'n',
    describe: 'Number of words to generate',
    type: 'number',
    default: 100,
  })
  .option('output_mode', {
    alias: 'm',
    describe: 'Output mode',
    choices: ['word-list', 'debug', 'paragraph'] as const,
    default: 'word-list'
  })
  .option('remove_duplicates', {
    alias: 'd',
    describe: 'Remove duplicate words',
    type: 'boolean',
    default: true
  })
  .option('force_word_limit', {
    alias: 'l',
    describe: 'Force word limit',
    type: 'boolean',
    default: false
  })
  .option('sort_words', {
    alias: 's',
    describe: 'Sort generated words',
    type: 'boolean',
    default: true
  })
  .option('word_divider', {
    alias: 'w',
    describe: 'Divider between words',
    type: 'string',
    default: ' '
  })
  .option('encoding', {
      alias:       'e',
      choices:     encodings,
      describe:    'What file encoding to use',
      default:     'utf8',
      requiresArg: true,
      coerce:      (enc: string) => {
          // ignore case, and allow 'utf-16le' as a synonym for 'utf16le'
          const littleEnc = enc.toLowerCase();
          if (littleEnc === 'utf-16le') {
              return 'utf16le';
          } else if (!(<string[]>encodings).includes(littleEnc)) {
              // throw an error indicating an invalid encoding
              let errorString = 'Invalid values:\n  Argument: encoding, '
                  + `Given: "${enc}", Choices: `;

              for (let i = 0; i < encodings.length; ++i) {
                  if (i !== 0) {
                      errorString += ', ';
                  }
                  errorString += `"${encodings[i]}"`;
              }
              throw new Error(errorString);
          }
          return littleEnc;
      }
  })

  .check((argv) => {
    // No checks yet
    return true;
  })
  .parseSync() as CLI_Args;

const filePath = argv._[0]; // first positional arg
const file_text = fs.readFileSync(filePath, argv.encoding);

try {
  console.log(
    generate({
      file: file_text,
      num_of_words: argv.num_of_words,
      mode: argv.output_mode  as Output_Modes,
      remove_duplicates: argv.remove_duplicates,
      force_word_limit: argv.force_word_limit,
      sort_words: argv.sort_words,
      word_divider: argv.word_divider
    } )
  );
} catch {
  process.exitCode = 1;
  console.error(`Error: Could not find file '${argv._[0]}'.`);
}