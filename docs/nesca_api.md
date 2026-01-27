# Nesca API

Install with `npm install the_conlangers_suite`, or `yarn add the_conlangers_suite` and import it with either:

```ts
const the_conlangers_suite = require('the_conlangers_suite'); // CommonJS (Node.js)

import the_conlangers_suite from 'the_conlangers_suite'; // ES modules
```

Below is a minimal use of the program:
```ts
import the_conlangers_suite from 'the_conlangers_suite';
const text = "example"
const def = the_conlangers_suite.nesca({
    file: text
});

console.log(def.text);
console.log(def.warnings.join(", "));
console.log(def.errors.join(", "));
console.log(def.infos.join(", "));
```

The input signature for `the_conlangers_suite.nesca()` is:
```ts
type Nesca_Options = {
   file: string;
   input_words: string;
   output_mode?: Output_Mode;
   sort_words?: boolean;
   input_divider?: string;
   output_divider?: string;
};
```

The properties of the return of `the_conlangers_suite.nesca()` are:
```ts
type nesca_output = {
    text: string; // The generated corpus of words.
    errors: string[]; // A list of errors that occurred, that terminated generation.
    warnings: string[]; // A list of warnings that occurred.
    infos: string[]; // Useful information about the generation run.
    diagnostics: string[]; // Useful information about parsing the file on debug mode.
}
```