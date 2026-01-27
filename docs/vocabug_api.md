# Vocabug API

Install with `npm install the_conlangers_suite`, or `yarn add the_conlangers_suite` and import it with either:

```ts
const the_conlangers_suite = require('the_conlangers_suite'); // CommonJS (Node.js)

import the_conlangers_suite from 'the_conlangers_suite'; // ES modules
```

Below is a minimal use of the program:
```ts
import the_conlangers_suite from 'the_conlangers_suite';
const text = "example"
const def = the_conlangers_suite.vocabug({
    file: text
});

console.log(def.text);
console.log(def.warnings.join(", "));
console.log(def.errors.join(", "));
console.log(def.infos.join(", "));
```

The input signature for `the_conlangers_suite.vocabug()` is:
```ts
type vocabug_options = {
    file: string; // Your definition file
    num_of_words?: number | string = 100; // Number of words to generate. Must be in range 1 to 100,000
    output_mode?: 'word-list'|'debug'|'paragraph' = "word-list";
    remove_duplicates?: boolean = true; // Remove duplicate words
    force_word_limit?: boolean = false;
    sort_words?: boolean = true; // Sort generated words alphabetically.
    output_divider?: string = " "; // Divider or "delimeter" between words
};
```

The properties of the return of `the_conlangers_suite.vocabug()` are:
```ts
type vocabug_output = {
    text: string; // The generated corpus of words.
    errors: string[]; // A list of errors that occurred, that terminated generation.
    warnings: string[]; // A list of warnings that occurred.
    infos: string[]; // Useful information about the generation run.
    diagnostics: string[]; // Useful information about parsing the file on debug mode.
}
```