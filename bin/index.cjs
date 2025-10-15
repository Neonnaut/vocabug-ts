#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const yargs = require("yargs/yargs");
const helpers_1 = require("yargs/helpers");
const vocabug = require('../dist/vocabug.cjs.js');
const encodings = [
    'ascii',
    'binary',
    'latin1',
    'ucs-2',
    'ucs2',
    'utf-8',
    'utf16le',
    'utf8'
];
const argv = yargs((0, helpers_1.hideBin)(process.argv))
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
    choices: ['word-list', 'debug', 'paragraph'],
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
    alias: 'e',
    choices: encodings,
    describe: 'What file encoding to use',
    default: 'utf8',
    requiresArg: true,
    coerce: (enc) => {
        // ignore case, and allow 'utf-16le' as a synonym for 'utf16le'
        const littleEnc = enc.toLowerCase();
        if (littleEnc === 'utf-16le') {
            return 'utf16le';
        }
        else if (!encodings.includes(littleEnc)) {
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
    .parseSync();
const filePath = argv._[0]; // first positional arg
if (!filePath) {
    console.error('Error: No file path provided.');
    process.exitCode = 1;
    process.exit();
}
const file_text = fs.readFileSync(filePath, argv.encoding);
try {
    console.log(vocabug.generate({
        file: file_text,
        num_of_words: argv.num_of_words,
        mode: argv.output_mode,
        remove_duplicates: argv.remove_duplicates,
        force_word_limit: argv.force_word_limit,
        sort_words: argv.sort_words,
        word_divider: argv.word_divider
    }));
}
catch {
    process.exitCode = 1;
    console.error(`Error: Could not find file '${argv._[0]}'.`);
}
