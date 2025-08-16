# Vocabug

[![version][1]][2] [![license][3]][4] [![Tests]][badge-link]
[![issue count][5]][6] [![git activity][7]][8]

![Vocabug logo](./img/vocabug_logo.svg?raw=true "Vocabug")

This is a word generator designed to be a successor to the Williams' [Lexifer][10] and to [Awkwords][11]. It is built using TypeScript and builds using Vite as a browser app with a complete interface. Vocabug is the 'pro' version of the 'lite' Vocabug, Vocabug-lite.

Vocabug randomly generates vocabulary from a given definition of graphemes, frequencies and word patterns. You can use it to make words for a constructed language, to get an original nickname or password, or just for fun.

## Vocabug online

Vocabug lives online at [neonnaut.neocities.org/vocabug][12]

## Documentation

Documentation lives online at [neonnaut.neocities.org/vocabug_docs][13]

## API

Install with `npm install vocabug`, or `yarn add vocabug` and import it with either:

```ts
const vocabug = require('vocabug'); // CommonJS (Node.js)

import vocabug = require('vocabug'); // in TypeScript with --module commonjs, node12, or nodenext

import vocabug from 'vocabug'; // ES modules
```

There are two parts to the `vocabug` instance, the main function `generate()` and `examples`
```ts
import vocabug from 'vocabug';
const def = vocabug.generate({
    file: vocabug.examples.tonal
});

console.log(def.text);
console.log(def.warnings.join(", "));
console.log(def.errors.join(", "));
console.log(def.infos.join(", "));
```

The input signature for `vocabug.generate()` is:
```ts
type generate_options = {
    file: string; // Your definition file
    num_of_words?: number | string; // Number of words to generate
    mode?: 'word-list'|'debug'|'paragraph'; // generation mode
    remove_duplicates?: boolean;
    force_word_limit?: boolean; // Force to the time limit
    sort_words?: boolean;
    capitalise_words?: boolean;
    word_divider?: string;
};
```

The properties of the return type of `vocabug.generate()` are:
```ts
type generate_output = {
    text: string; // The generated corpus of words.
    errors: string[]; // A list of errors that occurred, that terminated generation.
    warnings: string[]; // A list of warnings that occurred.
    infos: string[]; // Useful information about the generation run.
    diagnostics: string[]; // Useful information about parsing the file on debug mode.
}
```

There are 5 examples to choose from in `vocabug.examples`: `default`, `tonal`, `romance`, `japanese` and `australian`.

## Development

To build use `npm run build`. For live testing use `npm run dev`.

[1]: https://img.shields.io/npm/v/vocabug
[2]: https://www.npmjs.com/package/vocabug "npm package"
[3]: https://img.shields.io/npm/l/vocabug
[4]: https://github.com/Neonnaut/vocabug-ts/blob/master/LICENSE "license text"
[5]: https://img.shields.io/github/issues-raw/Neonnaut/vocabug-ts
[6]: https://github.com/Neonnaut/vocabug-ts/issues "issues page"
[7]: https://img.shields.io/github/commit-activity/m/Neonnaut/vocabug-ts
[8]: https://github.com/Neonnaut/vocabug-ts/commits "commit log"

[badge-link]: https://github.com/Neonnaut/vocabug-ts/actions/workflows/ci.yml
[Tests]: https://github.com/Neonnaut/vocabug-ts/actions/workflows/ci.yml/badge.svg

[10]: https://github.com/bbrk24/lexifer-ts
[11]: https://github.com/nai888/awkwords
[12]: https://neonnaut.neocities.org/vocabug "deployment"
[13]: https://neonnaut.neocities.org/vocabug_docs "docs"