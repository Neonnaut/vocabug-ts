# API

Install with `npm install vocabug`, or `yarn add vocabug` and import it with either:

```ts
const vocabug = require('vocabug'); // CommonJS (Node.js)

import vocabug from 'vocabug'; // ES modules
```

There is one part inside this `vocabug` instance, the main function `generate()`. Below is a very minimal use of the program:
```ts
import vocabug from 'vocabug';
const text = "example"
const def = vocabug.generate({
    file: text
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
    num_of_words?: number | string = 100; // Number of words to generate. Must be in range 1 to 100,000
    output_mode?: 'word-list'|'debug'|'paragraph' = "word-list";
    remove_duplicates?: boolean = true; // Remove duplicate words
    force_word_limit?: boolean = false;
    sort_words?: boolean = true; // Sort generated words alphabetically.
    word_divider?: string = " "; // Divider or "delimeter" between words
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