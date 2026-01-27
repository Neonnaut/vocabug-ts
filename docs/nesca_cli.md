# Nesca CLI

## 📦 Installation

Install globally via npm or yarn:

```bash
npm install -g the_conlangers_suite
# or
yarn global add the_conlangers_suite
```

Then envoke Nesca CLI with:
```
nesca <path> [options]
```

`<path>` is the required path to the input text file

Options:

- `--help` or `?`
Show help
- `--version` or `v`
Show version number
- `--output_mode` or `-m` and `<mode>`
Output mode. `<mode>` must be `word-list`, `debug`, `old-to-new` or `paragraph` -- default is `word-list`
- `--sort_words` or `-s`
Sort generated words alphabetically. Default is true
- `input_words` or `-iw`
Input words to transform
- `input_divider` or `-id`
Input divider between words
- `--output_divider` or `-od` and `<string>` 
Divider or "delimeter" between words. Default of `<string>` in a space
- `--encoding` or `-e` and  `<encoding>`
File encoding to use. `<encoding>` must be `ascii`, `binary`, `latin1`, `ucs-2`, `ucs2`, `utf8`, `utf-8`, `utf16le`, `utf-16le` -- default is `utf8`