#!/usr/bin/env node
import fs from 'fs';
import yargs from 'yargs/yargs';

import { hideBin } from 'yargs/helpers';

// Type-only import (safe in CommonJS with TypeScript)
import type { Arguments } from 'yargs';

import { nesca } from '../../src/main';
import { VERSION } from '../../src/utils/version';


type CLI_Args = Arguments<{
  output_mode: string;
  sort_words: boolean;
  input_words: string;
  input_divider: string;
  output_divider: string;
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

  .option('output_mode', {
    alias: 'm',
    describe: 'Output mode',
    choices: ['word-list', 'debug', 'old-to-new'] as const,
    default: 'word-list'
  })
  .option('sort_words', {
    alias: 's',
    describe: 'Sort generated words',
    type: 'boolean',
    default: true
  })
  .option('input_words', {
    alias: 'iw',
    describe: 'Input words to transform',
    type: 'string',
    default: ''
  })
  .option('input_divider', {
    alias: 'id',
    describe: 'Divider between words',
    type: 'string',
    default: ' '
  })
  .option('output_divider', {
    alias: 'od',
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

if (!filePath) {
  console.error('Error: No file path provided.');
  process.exitCode = 1;
  process.exit();
}

const file_text = fs.readFileSync(filePath, argv.encoding);

try {
  console.log(`Transforming words with Nesca version ${VERSION}...`);

  const run = 
      nesca({
        file: file_text,
        input_words: argv.input_words,
        output_mode: argv.output_mode  as Output_Modes,
        input_divider: argv.input_divider,
        output_divider: argv.output_divider,
        sort_words: argv.sort_words
    } )

  for (const warning of run.warnings) {
    console.warn(warning);
  }
  for (const error of run.errors) {
    console.error(error);
  }
  for (const info of run.infos) {
    console.info(info);
  }
  if (run.payload.length === 0) {
    console.log(
      run.payload
    );
  }
} catch {
  process.exitCode = 1;
  console.error(`Error: Could not find file '${argv._[0]}'.`);
}