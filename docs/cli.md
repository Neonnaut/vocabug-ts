# CLI

## 📦 Installation

Install globally via npm or yarn:

```bash
npm install -g vocabug
# or
yarn global add vocabug
```

```
wordgen <path> [options]
```

<path> is the required path to the input text file

- `?`, --help                        Show help
- `v`, --version                     Show version number
- `-n`, --num_of_words <number>       Number of words to generate (default: 100)
- `-m`, --output_mode <mode>          Output mode: word-list, debug, paragraph (default: word-list)
- `-d`, --remove_duplicates           Remove duplicate words (default: true)
- `-l`, --force_word_limit            Force word limit even if input is short (default: false)
- `-s`, --sort_words                  Sort generated words alphabetically (default: true)
- `-w`, --word_divider <string>       Divider between words (default: " ")
- `-e`, --encoding <encoding>         File encoding to use (default: utf8)

  Supported encodings:
    ascii, binary, latin1, ucs-2, ucs2, utf-8, utf16le, utf8

  Notes:
    - Encoding is case-insensitive
    - "utf-16le" is accepted as a synonym for "utf16le"
    - Invalid encodings will throw an error listing valid choices