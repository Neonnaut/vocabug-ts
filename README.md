# The Conlanger's Suite

[![version][1]][2] [![license][3]][4] [![Tests]][badge-link]
[![issue count][5]][6] [![git activity][7]][8]

A suite of applications for conlangers built with typescript and the wonderful Vite tool. Each application has its own web-app, cli, and main fuction in the API. This allows applications to share modules between themselves to accomplish their tasks.

## Vocabug

![Vocabug logo](./app/vocabug/img/vocabug_logo.svg?raw=true "Vocabug")

Vocabug is a word generator designed to be a successor to the Williams' [Lexifer](https://github.com/bbrk24/lexifer-ts) and to [Awkwords](https://github.com/nai888/awkwords).

Vocabug randomly generates vocabulary from a given definition of graphemes, frequencies and word patterns. You can use it to make words for a constructed language, to get an original nickname or password, or just for fun.

### Vocabug online

Vocabug lives online at [neonnaut.neocities.org/vocabug](https://neonnaut.neocities.org/vocabug)

### Vocabug Documentation

Documentation (also called "help", "instructions" or "manual") lives online at [neonnaut.neocities.org/vocabug_docs](https://neonnaut.neocities.org/vocabug_docs)

### Vocabug API

[Read the API doc here](./docs/vocabug-api.md)

### Vocabug CLI

[Read the CLI (command-line-interface) doc here](./docs/vocabug-cli.md)

## Nesca

![Nesca logo](./app/nesca/img/nesca.svg?raw=true "Nesca")

Nesca is a "sound change applier", it takes a set of transformation rules and applies them to words to simulate historical sound changes or under similar conditions. It also offers other word modification utilities including capitalisation and X-SAMPA to IPA. Nesca is an easy to use but powerful tool for conlangers and linguists.

### Nesca online

Nesca lives online at [neonnaut.neocities.org/nesca](https://neonnaut.neocities.org/nesca)

### Nesca Documentation

Documentation lives online at [neonnaut.neocities.org/nesca_docs](neonnaut.neocities.org/nesca_docs)

### Nesca API

[Read the API doc here](./docs/api.md)

### Nesca CLI

[Read the CLI (command-line-interface) doc here](./docs/cli.md)

## Development

To build use `npm run build`. For live testing use `npm run dev-vocabug` or `npm run dev-nesca`.

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



