# The Conlanger's Suite

[![version][1]][2] [![license][3]][4] [![Tests]][badge-link]
[![issue count][5]][6] [![git activity][7]][8]

A suite of applications for conlangers. Each application has its own web-app, cli, or main fuction in the API. This allows applications to share modules between themselves to accomplish their tasks.

## Vocabug

![Vocabug logo](./app/vocabug/img/vocabug_logo.svg?raw=true "Vocabug")

Vocabug is a word generator designed to be a successor to the Williams' [Lexifer][10] and to [Awkwords][11]. It is built on TypeScript with Vite with a complete web-app interface and command-line interface.

Vocabug randomly generates vocabulary from a given definition of graphemes, frequencies and word patterns. You can use it to make words for a constructed language, to get an original nickname or password, or just for fun.

### Vocabug online

Vocabug lives online at [neonnaut.neocities.org/vocabug][12]

### Documentation

Documentation (also called "help", "instructions" or "manual") lives online at [neonnaut.neocities.org/vocabug_docs][13]

### API

[Read the API doc here](./docs/api.md)

### CLI

[Read the CLI (command-line-interface) doc here](./docs/cli.md)

## Development

To build use `npm run build`. For live testing use `npm run dev`.

## Nesca

![Nesca logo](./app/nesca/img/nesca.svg?raw=true "Nesca")

Nesca is a "sound change applier", it takes a set of transformation rules and applies them to words to simulate historical sound changes or under similar conditions. It also offers other word modification utilities including capitalisation and X-SAMPA to IPA. Nesca is an easy to use but powerful tool for conlangers and linguists.

## Nesca online

Nesca lives online at [neonnaut.neocities.org/nesca][14]

## Documentation

Documentation lives online at [neonnaut.neocities.org/nesca_docs][15]

## API

Install with `npm install nesca`, or `yarn add nesca` and import it with either:

```ts
const nesca = require('nesca'); // CommonJS (Node.js)

import nesca from 'nesca'; // ES modules
```

There are two parts inside this `nesca` instance, the main function `apply()` and `examples`, below is a very minimal use of the program:
```ts
import nesca from 'nesca';
const def = nesca.apply({
    file: nesca.examples.basic
});

console.log(def.text);
console.log(def.warnings.join(", "));
console.log(def.errors.join(", "));
console.log(def.infos.join(", "));
```

The input signature for `nesca.apply()` is:
```ts
type apply_options = {
  file: string;
  input_words: string;
  apply_mode?: Apply_Mode;
  word_divider?: string;
};
```

The properties of the return type of `nesca.apply()` are:
```ts
type apply_output = {
    text: string; // The changed corpus of words.
    errors: string[]; // A list of errors that occurred, that terminated the run.
    warnings: string[]; // A list of warnings that occurred.
    infos: string[]; // Useful information about the run.
    diagnostics: string[]; // Useful information about parsing the file on debug mode.
}
```

There is 1 example to choose from in `nesca.examples`: `default`.

## Development

To build use `npm run build`. For live testing use `npm run dev`.

[14]: https://neonnaut.neocities.org/nesca "deployment"
[15]: https://neonnaut.neocities.org/nesca_docs "docs"

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
