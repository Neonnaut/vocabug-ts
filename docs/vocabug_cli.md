# Vocabug CLI

## 📦 Installation

Install globally via npm or yarn:

```bash
npm install -g vocabug
# or
yarn global add vocabug
```

```
vocabug <path> [options]
```

`<path>` is the required path to the input text file

Options:

- `--help` or `?`
Show help
- `--version` or `v`
Show version number
- `--num_of_words` or `-n` and `<number>`
Number of words to generate. `<number>` must be in range 1 to 100,000 -- the default is 100
- `--output_mode` or `-m` and `<mode>`
Output mode. `<mode>` must be `word-list`, `debug`, or `paragraph` -- default is `word-list`
- `--remove_duplicates` or `-r`
Remove duplicate words. Default is true
- `--force_word_limit` or `-l`
Force word limit. Default is false
- `--sort_words` or `-s`
Sort generated words alphabetically. Default is true
- `--output_divider` or `-od` and `<string>` 
Divider or "delimeter" between words. Default of `<string>` in a space
- `--encoding` or `-e` and  `<encoding>`
File encoding to use. `<encoding>` must be `ascii`, `binary`, `latin1`, `ucs-2`, `ucs2`, `utf8`, `utf-8`, `utf16le`, `utf-16le` -- default is `utf8`