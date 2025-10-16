![Logo of letter V with bug antennae](../app/img/vocabug_logo.svg)

# Vocabug docs

<b>Version: 0.4.0</b>

## [1]()  About Vocabug

This is the complete documentation for [Vocabug, version: 0.4.0](./vocabug.html). Vocabug randomly generates vocabulary from a given definition of graphemes and word patterns. It can be used to generate words for a constructed language, original nicknames or passwords, or just for fun.

This word generator is designed to be a successor to the Williams' [Lexifer](https://github.com/bbrk24/lexifer-ts) and to the legendary [Awkwords](https://github.com/nai888/awkwords). You can find Vocabug's repository [here](https://github.com/Neonnaut/vocabug-ts). If you want a "modern" user interface, albeit with limited features, check out [Vocabug-lite](https://neonnaut.neocities.org/vocabug-lite).

## [2]()  Interface

* The textbox at the top of the program is the `definition-build editor`. A definition-build defines the graphemes, frequencies, word-shapes and transforms that generate the final words. There will already be a default definition-build in the definition-build editor, or the previous definition-build that generated words

* Use the `Number of words` textbox to choose the number of words to generate. The default number is 100

* Use the `Generate` button to see Vocabug produce words

* The and button will jump to the configuration and file save / load options, respectfully


* The button clears the definition-build editor and the generated words

* The button shows this document

* The generated words appear in a textbox below the editor

* Use the `Copy words` button to copy the generated words to the clipboard

* Below the copy words button is an 'output terminal'. It provides useful information about the generation run

### [2.1]()  Options

* The `Word divider` textbox sets the delimiter, or in other words, what the content will be between each word in the output. It is a space " ` `" by default. Use `\n` to get one word for each line

* `Word-list mode` will produce a list of words

* `Debug mode` will show, line by line, each step in creating each word

* `Paragraph mode` will produce words that look vaguely like sentences by injecting punctuation into the word list and capitalising the first word of each sentence

* `Remove duplicates` will make sure all words generated are unique
* `Force words` will force the generator to try and generate the complete number of words requested within 30 seconds, despite the number of rejections / duplicates removed
* `Sort words` sorts the words in alphabetical order, or the order defined in the `alphabet:` directive

* `Editor wrap lines` will make the definition-build editor jump to the next line if the line escapes the width of the definition-build editor
* `Show keyboard` will reveal a 'keyboard', a character selector, below the options. Clicking on a character will insert that character into the editor

* Use the buttons in the `Themes` dropdown to change the colour theme of the editor

### [2.2]()  File save / load

* Use the `Save` button to download the definition-build as a file called 'vocabug.txt', or whatever you named your file in the `File name:` field. The file is always a ".txt" type
* Use the `Load` button to load a file from your system into the definition-build editor
* Use the buttons in the `Examples` dropdown to load an example into the definition-build editor

## [3]()  Using comments

If a line contains a semicolon `;` everything after it on that line is ignored and not interpreted as Vocabug syntax -- unless `;` is [escaped](#vocescapeword). You can use this to leave notes about what something does or why you made certain decisions.

## [4]()  About graphemes

Graphemes are indivisible meaningful characters that make a generated word in Vocabug. Phonemes can be thought of as graphemes. If we use English words `sky` and `shy` as examples to illustrate this, `sky` is made up by the graphemes `s` + `k` + `y`, while `shy` is made up by `sh` + `y`.

### [4.1]()  Null grapheme

If a word is built using the syntax character `^` or `&#x2205;`, it will disappear in the generated word. In other words `^` is a null grapheme. If you want to use `^` as a grapheme, you will need to [escape it](#vocescapeword). To use other syntax characters as graphemes, they must be escaped too.

### [4.2]()  Escaping characters

A single-length character following the syntax character `\` ignores any meaning it might have had in the generator, including backslashes themselves. This way, anything including capital letters that have already been defined as categories, brackets, even spaces can be graphemes.

#### [4.2.1]()  Word creation character escape

These are the characters you must escape if you want to use them in [categories](#voccategories), [segments](#vocsegments) and the [words](#vocwords) directive:

| Characters | Meaning |
| --- | --- |
| `;` | [Comment](#voccomments) |
| `\` | Escapes a character after it |
| `[@` and `]` | Named escape |
| `C`, `D`, `K`, ... | Any one-length capital letter can refer to a [category](#voccategories) |
| `+` or `-` or `>`... | A [feature](#nescafeatures) |
| `+-` | Begins a [feature-field](#nescafeaturefield) |
| `$` | Defines a [segment](#vocsegments) when followed by a capital letter |
| `,` or `&#xA0;` | Separates choices |
| `*` | Gives [weight](#vocassigningweights) to an item |
| `{` and `}` | [Pick-one-set](#vocpickone) |
| `(` and `)` | [Optional-set](#vocoptional) |
| `[` and `]` | [Supra-set item](#vocsupraset) |
| `^` or `&#x2205;` | A null grapheme |

#### [4.2.2]()  Transform character escape

These are the characters you must escape if you want to use them in the [transform](#nescatransform) block:

| Characters | Meaning |
| --- | --- |
| `;` | [Comment](#voccomments) |
| `\` | Escapes a character after it |
| `[@` and `]` | Named escape |
| `>`, `->`, `=>`, `&#x21D2;` or `&#x2192;` | Indicates [change](#nescathechange) |
| `,` or `&#xA0;` | Separates choices |
| `{` and `}` | [Alternator-set](#nescaalternatorset) |
| `(` and `)` | [Optionalator-set](#nescaoptionalatorset) |
| `<` and a space | Begins a [Cluster-field](#nescaclusterfield) |
| `C`, `D`, `K`, ... | Any one-length capital letter can refer to a [category](#nescausingcategories) |
| `[+` or `[-` and `]` | [Feature](#nescausingfeatures) matrix |
| `^` or `&#x2205;` | [Insertion](#nescainsertionanddeletion) when in `TARGET`,[deletion](#nescainsertionanddeletion) when in `RESULT` |
| `0` | [Rejects](#nescareject) a word |
| `/` | A [condition](#nescathecondition) follows this character |
| `?` | A [chance condition](#nescachancecondition) follows this character |
| `!` or `//` | An [exception](#nescatheexception) follows this character |
| `_` | The underscore `_` is a reference to the target |
| `#` | [Word boundary](#nescawordboundary) |
| `$` | [Syllable boundary](#nescasyllableboundary) |
| `+` | [Quantifier](#nescaquantifier), matches as 1 or more of the previous grapheme |
| `+[` and `]` | [Bounded quantifier](#nescaboundedquantifier) |
| `:` | [Geminate-mark](#nescageminatemark), matches twice to the previous grapheme |
| `*` | [Wildcard](#nescawildcard), matches exactly 1 of any grapheme |
| `&` or `&#x2026;` | [Anythings-mark](#nescaanythingsmark), matches ungreedily 1 or more wildcards |
| `&[` or `&#x2026;[` and `]` | [Guarded-anythings-mark](#nescaguarded) |
| `%` | [Syllable-mark](#nescasyllablemark)-- equivalent to `&[.]` |
| `|` | [Engines](#nescaengine) are placed after this character, and a space |
| `<T` | [Target-mark](#nescatargetmark) |
| `<M` | [Metathesis-mark](#nescametathesismark) |
| `<E` | [Empty-mark](#nescaemptymark) |
| `=` and positive digit | [Reference-capture](#nescareference) |
| `<=` | Begins [Reference-capture](#nescareference) of a sequence of graphemes |
| A positive digit | [Reference](#nescareference) |
| `~` | [Based-mark](#nescabasedmark) |

#### [4.2.3]()  Named escape

Named escapes, enclosed in `[@` and `]` allow space and combining diacritics to be used without needing to insert these characters.

The supported characters are:

      <details>

| Escape Name | Unicode Character |
| --- | --- |
| `[@Space]` |  |
| `[@Acute]` |  ◌́ |
| `[@DoubleAcute]` |  ◌̋ |
| `[@Grave]` |  ◌̀ |
| `[@DoubleGrave]` |  ◌̏ |
| `[@Circumflex]` |  ◌̂ |
| `[@Caron]` |  ◌̌ |
| `[@Breve]` |  ◌̆ |
| `[@BreveBelow]` |  ◌̮ |
| `[@InvertedBreve]` |  ◌̑ |
| `[@InvertedBreveBelow]` |  ◌̯ |
| `[@TildeAbove]` |  ◌̃ |
| `[@TildeBelow]` |  ◌̰ |
| `[@Macron]` |  ◌̄ |
| `[@MacronBelow]` |  ◌̠ |
| `[@MacronBelowStandalone]` |  ◌˗ |
| `[@Dot]` |  ◌̇ |
| `[@DotBelow]` |  ◌̣ |
| `[@Diaeresis]` |  ◌̈ |
| `[@DiaeresisBelow]` |  ◌̤ |
| `[@Ring]` |  ◌̊ |
| `[@RingBelow]` |  ◌̥ |
| `[@Horn]` |  ◌̛ |
| `[@Hook]` |  ◌̉ |
| `[@CommaAbove]` |  ◌̓ |
| `[@CommaBelow]` |  ◌̦ |
| `[@Cedilla]` |  ◌̧ |
| `[@Ogonek]` |  ◌̨ |
| `[@VerticalLineBelow]` |  ◌̩ |
| `[@VerticalLineAbove]` |  ◌̍ |
| `[@DoubleVerticalLineBelow]` |  ◌͈ |
| `[@PlusSignBelow]` |  ◌̟ |
| `[@PlusSignStandalone]` |  ◌˖ |
| `[@uptackBelow]` |  ◌̝ |
| `[@UpTackStandalone]` |  ◌˔ |
| `[@LeftTackBelow]` |  ◌̘ |
| `[@rightTackBelow]` |  ◌̙ |
| `[@DownTackBelow]` |  ◌̞ |
| `[@DownTackStandalone]` |  ◌˕ |
| `[@BridgeBelow]` |  ◌̪ |
| `[@BridgeAbove]` |  ◌͆ |
| `[@InvertedBridgeBelow]` |  ◌̺ |
| `[@SquareBelow]` |  ◌̻ |
| `[@SeagullBelow]` |  ◌̼ |
| `[@LeftBracketBelow]` |  ◌͉ |

</details>


If you are using this, you should be very interested in the [Compose engine](#nescaengine).

## [5]()  Categories

A category is a set of [graphemes](#vocaboutgraphemes) with a key. The key is a singular-length capital letter. For example:

      C =t , n , k , m , ch , l , ꞌ, s , r , d , h , w , b , y , p , g
F =n , l , ꞌ, t , k , r , p
V =a , i , e , u , o

This creates three groups of graphemes. `C` is the group of all consonants, `V` is the group of all vowels, and `F` is the group of some of the consonants that will be used syllable finally.

These graphemes are separated by commas, however an alternative is to use spaces: `C = t n k m ch l &#xA78C; s r d h w b y p g`.

By default, the graphemes' frequencies decrease as they go to the right, according to the Gusein-Zade distribution. [You can change this distribution](#vocdistributions). In the above example, when Vocabug needs to choose a `V`, it will choose `a` the most at 43%, `i` the second-most at 26%, `e` the third-most at 17%, `u` the fourth-most at 10%, and `o` the fifth most at 4%.

Need more than 26 categories? Vocabug supports the following additional characters as the key of a category or [segment](#vocsegments): `&#xC1; &#x106; &#xC9; &#x1F4; &#xCD; &#x1E30; &#x139; &#x1E3E; &#x143; &#xD3; &#x1E54; &#x154; &#x15A; &#xDA; &#x1E82; &#xDD; &#x179; &#xC0; &#xC8; &#xCC; &#x1F8; &#xD2; &#xD9; &#x1E80; &#x1EF2; &#x1CD; &#x10C; &#x10E; &#x11A; &#x1E6; &#x21E; &#x1CF; &#x1E8; &#x13D; &#x147; &#x1D1; &#x158; &#x160; &#x164; &#x1D3; &#x17D; &#xC4; &#xCB; &#x1E26; &#xCF; &#xD6; &#xDC; &#x1E84; &#x1E8C; &#x178; &#x393; &#x394; &#x398; &#x39B; &#x39E; &#x3A0; &#x3A3; &#x3A6; &#x3A8; &#x3A9;`

### [5.1]()  Categories inside categories and set-categories

You can use categories inside categories, as long as the referenced category has previously been defined. For example:

      category-distribution :flat L =aa , ii , ee , oo
V =a , i , e , o ,L

In the example above, `V` has a 20% chance of being a long vowel.

You can also enclose a set of graphemes in curly braces `{` and `}`. This is called a 'set-category'. This set will be treated as if it were a reference to a category in terms of frequency. For example, we could write the same example as this:

      category-distribution :flat<br>
V =a , i , e , o ,{aa , ii , ee , oo }

Assigning weights to categories in categories and set-categories is possible.

Categories inside categories and set-categories CANNOT be a part of any sequence. for example `C = Xz` or `C = x{c, d}` or `C = {a, b}{c, d}` will not give the results you might want. To get sequence-like behaviour like that, you will need to use [segments](#vocsegments).

## [6]()  Building words

### [6.1]()  Words

The `words:` directive defines a set of 'word-shapes' that Vocabug will choose from to create words. A word-shape can consist of individual graphemes, [categories](#voccategories), [segments](#vocsegments) or a mixture of both.

By default, words are selected using the Zipf distribution. The first word-shape will be chosen the most often, then the second word-shape the second most often and so on. [You can change this distribution](#vocdistributions). Below is a very simple example that will generate words with one to three CV syllables:

      C `=` t `,` n `,` k `,` m `,` l `,` s `,` r `,` d `,` h `,` w `,` b `,` j `,` p `,` g
V `=` a `,` i `,` o `,` e `,` u
words :CV `,`CVCV `,`CVCVCV ,V


Word-shapes may alternatively be declared in the `BEGIN words:` block. Allowing word-shapes to be declared over multiple lines, and allowing the use of comments between word-shapes:

      BEGIN words : CV `,`<br>
CVCV `,`CVCVCV `,`; This is a comment<br>
V<br>
END

You must use the `END` keyword on a new line to end the block.

### [6.2]()  Segments

Segments are a system that provides an abbreviation of parts of a [word-shape](#vocwords). Typically you would use it to define the shape of a syllable. Segments are defined similarly to categories, but with several important differences:

* Every segment's key starts with `$`. `S = s` is a [category](#voccategories); `$S = s` is a segment.
* Segments are not sets like categories are. `$M = a, b, c` will not work as you might expect (because as already stated, segments are abbreviation for word-shapes). You would need to use a [pick-one-set](#vocpickone), i.e: `$M = {a, b, c}`

For example you could write the last example like so:

      C `=` t `,` n `,` k `,` m `,` l `,` s `,` r `,` d `,` h `,` w `,` b `,` j `,` p `,` g
V `=` a `,` i `,` o `,` e `,` u<br>
$S =CV words :$S $S$S $S$S$S

You can put segments inside segments.

### [6.3]()  Pick-one-set

A pick-one-set is a group of graphemes and categories separated by spaces or commas, enclosed in curly braces `{` and `}`. Vocabug will pick an option from that pick-one just like it would from a segment. For example:

      V =a , u
words : t {V , x }

This will produce either `ta`, `tu` or `tx`.

Pick-one-sets can be nested inside each other.

Anything inside the pick-one can be assigned a weight, and a pick-one itself can be assigned a weight as well if it is nested inside another set:

      words : `{` a `*1`, b `*2`, `{` c , d `}` `*2` `}`


### [6.4]()  Optional-set

Using round brackets, `(` and `)`, optional-set works the same way as [pick-one-set](#vocpickone), the only difference is that what's inside them can either appear in the word or not. The probability of each of these variants is 10% by default.

      words : ta (n , t , l )

In the above example, there is a 10% chance of getting one of `tan`, `tat` or `tal`, but a 90% chance of `ta`.

#### [6.4.1]()  Optionals weight

By default, an optional-set has a 10% chance of being included in the word. You can change this probability with the `optionals-weight:` directive.

### [6.5]()  Supra-set

A 'supra-set', is applied over the entire word, and there can only be one supra set. Square brackets `[` and `]`, denotes each item in the supra-set and their location in the word. The items of a supra-set can only be a category, or the null grapheme `^`. Only one item in the supra-set will be picked for that generated word.

Supra-set is a feature designed to help generate words with stress systems, pitch accent systems, or other word-based suprasegmentals. Here is an example where it is used for a stress system:

      C =t<br>
V =a<br>
X = '<br>
words :([X ]C V )[X ]CV

This produces any of the following words: `'ta`, `ta'ta`, `'tata`, never any words with more than one `'`. Notice here that `ta` is not possible -- A supra-set item is only chosen after dealing with any sets that the supra-set items are nested in.

See the "Romance-like" example for a language that uses supra-set for its stress system.

#### [6.5.1]()  Supra-set weight

You can set the weights of supra-set items like so:

      R =r<br>
$X =o [R *8 ]<br>
$Y =e [R *2 ]<br>
words :$X$Y

The above example has an 80% chance of generating `ore` and a 20% chance of generating `oer`.

Supra-set item weights support a sentinel value -- a 'super-heavy' value `s`. This `s` will ensure the supra-set item attached to this weight is always chosen over others. For example: `[V*s]`

## [7]()  Default distributions

<b>The ordering of items matters</b> in [categories](#voccategories), [segments](#vocsegments) and [word-shapes](#vocwords). The first item will be chosen the most often, the second grapheme the second most often, and so on.

You can change these default distributions (another name for this might be "default drop-off", but I digress). For categories, the default is `gusein-zade` and you change it with the `category-distribution:` directive. For the separate setting for word-shapes, the default is `zipfian` and you change it with the `wordshape-distribution:` directive. The distribution will be applied to each item in a set, and then recursively to any set that set is nested in (treating the nested set as an item), then applied at the surface level.

* A `zipfian` distribution approximates natural language frequency for words, where the highest-ranked item receives the greatest weight, and subsequent ones decay steeply until flattening out.
* A `gusein-zade` distribution offers a gentler slope that is natural across phonemes in a language, following a logarithmic decay that still prioritizes top-ranked items but spreads weight more evenly
* `Shallow` distribution, the red-headed step-child of the distributions. It doesn't occur in natural linguistics, but offers us something between Flat and Gusein-Zade. It is Zipfian in nature, a 'long-tailed Zipfian distribution'
* A `flat` distribution treats all items equally. This is not to say the items will be evenly chosen -- items are still being randomly chosen on a generation, they just have the same weight



      ![Distribution graph](img/distribution.png)


## [8]()  Assigning weights

If you want to set your own frequency for graphemes in a [category](#voccategories) or category-set, items in a [pick-one-set](#vocpickone), or [optional-set](#vocoptional), or [word-shapes](#vocwords) in the `words:` directive, you can use an asterisk `*` to specify the weight for each item, like so:

      V =a *5 , e *4 , i *3 , o *2 , u *1 $S ={V *8 , x *2 }words :$S *2 y

`V` has approximately the following probabilities: a: 33%, e: 27%, i: 20%, o: 13%, u: 7%. The [pick-one-set](#vocpickone) in the `$S` segment has an 80% chance of producing a V category over the x grapheme. And the first word-shape in the `words:` directive has twice the chance of being chosen over the next word-shape.

As you might have noticed in the example above, in a sequence that has at least one weighted option, it overwrites any default distributions. Also important to note is that any other option that you had not given a weight (inside that set, or on the surface level), is given a weight of 1.

## [9]()  Alphabetisation

The alphabet directive gives Vocabug a custom alphabetisation order for words, when the sort words checkbox is selected.

      alphabet : a , b , c , e , f , h , i , k , l , m , n , o , p , p', r , s , t , t', y


This would order generated words like so: `cat`, `chat`, `cumin`, `frog`, `tray`, `t'a`, `yanny`

### [9.1]()  Invisibility

Sometimes you will want characters, such as syllable dividers, to be invisible to alphabetisation. You can do this by listing these characters in the invisible: directive.

      invisible :., ˈ<br>

This will make these generated words: `za'ta`, `'ba.ta`, `'za.ta` be reordered into: `'ba.ta`, `za'ta`, `'za.ta`

## [10]()  Defining graphemes

The `graphemes:` directive tells Vocabug which (multi)graphs, including character + combining diacritics, are to be treated as grapheme units when using [transformations](#nescatransform).

      graphemes : a , b , c , ch , e , f , h , i , k , l , m , n , o , p , p', r , s , t , t', y

In the above example, we defined `ch` as a grapheme. This would stop a rule such as `c -> g` changing the word `chat` into `ghat`, but it will make `cobra` change into `gobra`.

'But the order of letters stated in my `alphabet:` directive is the same as my graphemes in my `graphemes:` directive, do I have to list them twice?' You might ask. You can list both using the `alphabet-and-graphemes:` directive.

Graphemes may alternatively be declared in the `BEGIN graphemes:` block. Allowing graphemes to be declared over multiple lines, and allowing the use of comments between graphemes. You must use the `END` keyword on a new line to end the block.

## [11]()  Transform

Once words are generated, you might want to modify them to prevent certain sequences, outright reject certain words, or simulate historical sound changes. This is the purpose of the transform block, which uses SPE style rules, and implements the [NeSCA program](./nesca.html).

All transforms must be used inside this block. To terminate this block you use an `END` line. However, all unterminated blocks are automatically terminated at the end of the definition-build:

      BEGIN transform :<br>
; Your rules go here<br>
END

A rule can be summarised in four fields: `CHANGE / CONDITION ! EXCEPTION`. The characters `/` and `!` that precede each field (except for the `CHANGE`) are necessary for signalling each field. For example, including a `!` will signal that this rule contains an exception, and all text following it until the next field marker will be interpreted as such.

Every rule begins on a new line and must contain a `CHANGE`. The `CONDITION` or `EXCEPTION` fields are optional.

If you want to capture graphemes that are normally syntax characters in transforms, you will need to [escape them](#vocescapetransform).

When this document uses examples to explain transformations, the last comment shows an example word transforming. For example `; amda ==> ampa` means the rule will transform the word `amda` into `ampa`

## [12]()  The change

The format of the change can be expressed as `TARGET -> RESULT`.

* `TARGET` specifies which part of the word is being changed
* Then followed by a space and the `>` character. `>` can be swapped with either `->`, `=>`, `&#x21D2;` or `&#x2192;` if you prefer
* `RESULT` is what `TARGET` is changing into, or in other words, replacing

Let's look at a simple unconditional rule:

      ; Replace every [o] with [x]<br>
o -> x<br>
; bodido ==> bxdidx

In this rule, we see every instance of `o` become `x`.

### [12.1]()  Concurrent change

Concurrent change is achieved by listing multiple graphemes in `TARGET` separated by commas, and listing the same amount of resultant graphemes in `RESULT` separated by commas. Changes in a concurrent change execute at the same time:

      ; Switch [o] and [a] around<br>
o , a -> a , o<br>
; boda ==> bado

Notice that the above example is different to the example below:

o -> a<br>
a -> o<br>
; boda ==> bodo

where each change is on its own line. We can see `o` merge with `a`, then `a` becomes `o`.

### [12.2]()  Merging change

Instead of listing each `RESULT` in a concurrent change, we can instead list just one that all the `TARGET`s will merge into:

      ; Merge [o] and [a] into [x]<br>
o , a -> x<br>
; boda ==> bxdx

This is equivalent to:

      ; Merge [o] and [a] into [x]<br>
o , a -> x , x<br>
; boda ==> bxdx


### [12.3]()  Reject

To remove, or in other words, reject a word, you use a zero `0` in `RESULT`:

a , bi ->0

In the above example, any word that contains `a` or `bi` will be rejected.

## [13]()  Insertion and deletion

Insertion requires a [condition](#nescathecondition) to be present, and for a caret `^` to be present in `TARGET`, representing nothing.

      ; Insert [a] in between [b] and [t]^-> a /b _ t
; bt ==> bat

Deletion happens when `^` is present in `RESULT`:

      ; Delete every [b] b ->^; bubda ==> uda


## [14]()  The condition

Conditions follow [the change](#nescathechange) and are placed after a forward slash. When a transform has a condition, the target must meet the environment described in the condition to execute.

The format of a condition is `/ BEFORE_AFTER`

* A forward slash `/` begins a condition
* `BEFORE` is anything in the word before the target
* The underscore `_` is a reference to the target in a condition
* `AFTER` is anything in the word after the target

For example:

      ; Change [o] into [x] only when it is between [p]s<br>
o -> x /p _ p<br>
; opoptot ==> opxptot


### [14.1]()  Multiple conditions in one rule

Multiple conditions for a single rule can be made by separating each condition with additional forward slashes. The change will happen if it meets either, or both of the conditions:

      ; Change [o] into [x] only when it is between [p]s or [t]s<br>
o -> x /p _ p /t _ t<br>
; opoptot ==> opxptxt


### [14.2]()  Word boundary

Hash `#` matches to word boundaries. Either the beginning of the word if it is in `BEFORE`, or the end of the word if it is in `AFTER`

o -> x /p _ p #<br>
; opoppop ==> opoppxp


### [14.3]()  Syllable boundary

Dollar-sign `$` matches to either the character `.` or if no match, tries to match word boundaries. Either the beginning of the word if it is in `BEFORE`, or the end of the word if it is in `AFTER`

o -> x /p _ p $<br>
; o.pop.pop ==> o.pxp.pxp


### [14.4]()  The chance condition

The chance condition is placed following a `?` as a number from 0 to 100. This number represents the chance of the transformation occuring:

aa -> a ? 30

In the above example, the transformation will execute only 30% of the time.

## [15]()  The exception

Exceptions are placed following an exclamation mark `!` and go after the condition, if there is one. Exceptions function exactly like the opposite of the condition -- when a transform has an exception, the target must meet the environment described in the exception to prevent execution:

aa -> a !_#

In the above example, the transformation will not execute if `aa` is at the end of the word.

If there are multiple exceptions, the transform must meet all of the exceptions for it not to execute.

An alternative to using an exclamation mark is to use two forward slashes `//`.

## [16]()  Using categories

You can reference categories in transforms. The category will behave in the same way as an alternator set:

B =x , y , z<br>
BEGIN transform :<br>
B ->^<br>
`; xapay ==> apa`


If the category is part of a target, it MUST be inside an alternator set:

B =x , y , z<br>
BEGIN transform :<br>
{B } v ->^<br>
`; xvapay ==> apay`


## [17]()  Features

Let's say you had the grapheme, or rather, phoneme /i/ and wanted to capture it by its distinctive vowel features, `+high` and `+front`, and turn it into a phoneme marked with `+high` and `+back` features, perhaps /ɯ/. Features let you do this.

The key of all features must consist of lowercase letters a to z, uppercase letters a to z, `.`, `-` or `+`

### [17.1]()  Pro-feature

A feature prepended with a plus sign `+` is a 'pro-feature'. For example `+voice`. We can define a set of graphemes that are marked by this feature by using this pro-feature. For example:

      +voice =b , d , g , v , z


### [17.2]()  Anti-feature

A feature prepended with a minus sign `-` is an 'anti-feature'. For example `-voice`. We can define a set of graphemes that are marked by a lack of this feature by using this anti-feature. For example:

      -voice =p , t , k , f , s


### [17.3]()  Para-feature

A feature prepended with a greater-than-sign `>` is a 'para-feature'. A para-feature is simply a pro-feature where the graphemes marked as the anti-feature of this feature are the graphemes in the `graphemes:` directive that are not not marked by this para-feature:

      graphemes : a , b , h , i , k , n , o , t<br>
>voice =a , i , o

Is equivalent to the below example:

      +vowel =a , i , o<br>
-vowel =b , h , k , n , t


'Where does this leave graphemes that are not marked by either the pro-feature or the anti-feature of a feature?', you might ask. Such graphemes are _unmarked_ by that feature.

### [17.4]()  Referencing features inside features

Features can be referenced inside features. For example:

      +vowel =a , i , o<br>
+non-yod =+vowel ,^i


Use a caret in front of a grapheme to ensure that that grapheme is not part of the pro/anti/para-feature. In the example above, the pro-feature ' `+non-yod`' is composed of the graphemes `a` and `o` -- the grapheme `i` is not part of this pro-feature. Due to the recursive nature of nested features, this removed grapheme will be removed... aggressively. For example, If `+non-yod` were to be referenced in a different feature, that feature would always not have `i` as a grapheme.

### [17.5]()  Using Features

To capture graphemes that are marked by features in a transform, the features must be listed in a 'feature-matrix' surrounded by `[` and `]`. The graphemes in a word must be marked by each pro-/anti-feature in the feature-matrix to be captured. For example if a feature-matrix `[+high, +back]` captures the graphemes: `u, &#x26F;`, another feature-matrix `[+high, +back, -round]` would capture `&#x26F;` only.

The very simple example below is written to change all voiceless graphemes that have a voiced counterpart into their voiced counterparts:


      -voice =p , t , k , f , s
+voice =b , d , g , v , z
BEGIN transform :[-voice]->[+voice]; tamefa ==> dameva END


In this rule, in `RESULT`, `[+voice]` has a symmetrical one-to-one change of graphemes from the graphemes in `[-voice]` in `TARGET`, leading to a concurrent change. Let's quickly imagine a scenario where the only `[+voice]` grapheme was `b`. The result will be a merging of all `-voice` graphemes into `b`: `tamepfa ==> bamebba`.

If the feature-matrix is part of a target, i.e: it has tokens on either side of it, it MUST be inside an alternator set.

### [17.6]()  Feature-field

Feature-fields allow graphemes to be easily marked by multiple features in table format.

The feature-field begins with a `+-` and a space. The graphemes being marked by the features are listed on the first row. The features are listed in the first column.

For example:

      `+-` m n p b t d k g s h l j
voice      `+` `+` `-` `+` `-` `+` `-` `+` `-` `-` `+` `+` plosive    `-` `-` `+` `+` `+` `+` `+` `+` `-` `-` `-` `-` nasal      `+` `+` `-` `-` `-` `-` `-` `-` `-` `-` `-` `-` fricative  `-` `-` `-` `-` `-` `-` `-` `-` `+` `+` `-` `-` approx     `-` `-` `-` `-` `-` `-` `-` `-` `-` `-` `+` `+` labial     `+` `-` `+` `+` `-` `-` `-` `-` `-` `-` `-` `-` alveolar   `-` `+` `-` `-` `+` `+` `-` `-` `+` `-` `+` `-` palatal    `-` `-` `-` `-` `-` `-` `-` `-` `-` `-` `-` `+` velar      `-` `-` `-` `-` `-` `-` `+` `+` `-` `-` `-` `-` glottal    `-` `-` `-` `-` `-` `-` `-` `-` `-` `+` `-` `-` `+-` a e i o
high   `-` `-` `+` `-` mid    `-` `+` `-` `+` low    `+` `-` `-` `-` front  `-` `+` `+` `-` back   `+` `-` `-` `+` round  `-` `-` `-` `+`

* A `+` means to mark the grapheme by that feature's pro-feature
* A `-` means to mark the grapheme by that feature's anti-feature
* A `.` means to leave the grapheme unmarked by that feature

Here are some matrices of these features and which graphemes they would capture:

* `[+plosive]` captures the graphemes `b, d, g, p, t, k`
* `[+voiced, +plosive]` captures the graphemes `b, d, g`
* `[+voiced, +labial, +plosive]` captures the grapheme `b`

## [18]()  Alternator and Optionalator

These cannot be nested.

### [18.1]()  Alternator-set

Enclosed in curly braces, `{` and `}`, only one Item in an alternator set will be part of each sequence. For example:

p {w , j }-> pp

The above example is equivalent to:

pw , pj -> pp

These can also be used in exceptions and conditions.

### [18.2]()  Optionalator-set

Items in an optionalator, enclosed in `(` and `)` can be captured whether or not they appear as part of a grapheme or as part of a sequence of graphemes:

      ; Merge [x] and [xw] into [k]<br>
x (w )-> k<br>
; xwaxaħa ==> kakaħa

Optional-set can also attach to an alternator-set:

      ; Merge [x], [xw], [ħ] and [ħw] into [k]<br>
{x , ħ}(w )-> k<br>
; xwaxaħa ==> kakaka

Optionalator-set cannot be used on its own, it must be connected to other content.

## [19]()  Cluster-field

Cluster-field is a way to target sequences of graphemes and change them. They are laid out as tables, and start with `<` followed by a space. The first part of a sequence is in the first column, and the second part is in the first row. For example:

      <p  t  k  m  n
m +nt nk +mm
n mp ++nn +


* In this example, `np` becomes <i>mp</i> and `mt` becomes <i>nt</i>
* `+` means to not change the target cluster at all
* Cluster-fields can use `0` to reject the word if it contains that sequence
* Cluster-fields can use `^` or `&#x2205;` to delete the target sequence
* These are executed concurrently just like concurrent changes. Their order does not matter
* Cluster-fields can also use conditions and exceptions, just put them on their own line

## [20]()  Wildcards and quantifiers

Wildcards and the like in this section are special tokens that can represent arbitrary amounts of arbitrary graphemes, which is especially useful when you don't know precisely how many, or of what kind of grapheme there will be between two target graphemes in a word.

### [20.1]()  Quantifier

Quantifier, using `+`, will match once or as many times as possible to the grapheme to the left of it. Quantifier cannot be used in `RESULT`:

a +-> o<br>
`; raraaaaa ==> roro`


### [20.2]()  Bounded quantifier

The bounded quantifier matches as many times its digit(s), enclosed in `+[` and `]`, to the things to the left.

      ; Change [o] into [x] only when preceded by three [r]s<br>
o -> x /r +[3 ]_ `; ororrro ==> ororrrx`


The digits in the quantifier can also be a range:

      ; Change a sequence of 2 to 4 [o]s into [x]<br>
o +[2 , 4 ]-> x
`; tootooooo ==> txtxo`



At the beginning of the list, `,` represents all the possible numbers lower than the number to the right, not including zero.

      ; Change a sequence of 1 to 4 [o]s into [x]<br>
o +[, 4 ]-> x
`; tootooooo ==> txtx`


And finally at the end of the list, `,` represents all possible numbers larger than the number to the the left

        ; Change a sequence of 4 to as many as possible [o]s into [x]<br>
o +[4 ,]-> x
`; toootooooo ==> toootx`


### [20.3]()  Geminate-mark

Geminate-mark using colon `:`, will match twice to the grapheme, or grapheme from a set or category, to the left of it. In other words, you can capture an item only when it is geminated using the geminate-mark:

a :-> o<br>
`; aaata => oata`


Unlike quantifier, a geminate mark can be used in `RESULT`:


a -> a :<br>
`; tat => taat`


### [20.4]()  Kleene-star

Occasionally, you may want to match a grapheme whether it exists, there is one of it, or there is multiple of it consecutively, known as a "Kleene-star". There is <b>no</b> dedicated character for a Kleene star. Instead, you wrap the content followed by a quantifier, in an optionalator:

u (a +)-> o<br>
`; ruaruaaaaa ==> roro`


### [20.5]()  Wildcard

Wildcard, using asterisk `*`, will match once to any grapheme. Wildcard does not match word boundaries. Wildcard cannot be used in `RESULT`:

      `; Any grapheme becomes [x] when any grapheme follows it`<br>
*-> x /_*<br>
`; aomp ==> xxxp`

Wildcard can be placed by itself inside an [optionalator](#nescaoptionalatorset) `(*)`, thereby allowing it to match nothing as well.

### [20.6]()  Anythings-mark

The anythings-mark uses ampersand `&`. It will match as many (but not zero) times to any grapheme. For example:

b &-> x<br>
`; abitto => ax`

As we can see, the rule matched `b` and greedily matched everything else.

The example below uses an anythings-mark in the condition:

      ; Simulate spreading of nasality to vowels<br>
a , i , u -> ã, ĩ, ũ /{ã, ĩ, ũ}&_<br>
; pabãdruliga ==> pabãdrũlĩgã


### [20.7]()  Guarded-anythings-mark

Guarded-anythings-mark is designed to change the greedy, spreading behaviour of the anythings-mark when certain graphemes are ahead of it. You enclose a set that consists of singular graphemes, or a sequence of graphemes inside `<span class="regexp">&[</span>` and `]` that will condition spreading.

<b>Consuming negative lookahead</b>:

Sometimes it is necessary to for the anythings mark to consume graphemes we are monitoring for, and then stop consuming:


b &[t ]-> x<br>
`; babitto => xto`

As we can see, the rule matched `b` followed by anything else until it reached the first `t`, consumed that, then stopped matching. This anythings-mark in Regular Expression terminology would be called "lazy" / "non-greedy"

<b>Negative lookahead</b>:

Sometimes it is necessary for graphemes to block the spread without having them be consumed. To do this put a caret `^` in front of all these blocking graphemes or grapheme sequences. For example we might want the graphemes `k` or `g` to prevent the rightward spread of nasal vowels to non nasal vowels:


a , i , u -> ã, ĩ, ũ /{ã, ĩ, ũ}&[^k , g ]_<br>
; pabãdruliga ==> pabãdrũlĩga


e

      ; capture up to a plosive + [r] cluster ; and then it's plosive. Transform this into [x].&[^{p , t , k } r ]{p , t , k }-> x
; kotatros -> xros




### [20.8]()  Syllable-mark

Using the percent-sign `%`, a 'syllable-mark' will match to a sequence of graphemes, as long as there is not a `.` character in the sequence. This is equivalent to `&{.}`

## [21]()  Advanced rules

### [21.1]()  Engine

The engine statement provides useful functions that you can call at any point in the transform block. You call an engine following a `|` and a space on a new line.

* `decompose` will break-down all characters in a word into their "[Unicode Normalization, Canonical Decomposition](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize#nfc)" form. For example, `&#xF1;` as a singular unicode entity, \u00F1, will be broken-down into a sequence of two characters, \u006E + \u0303
* `compose` does the opposite of decompose. It converts all characters in a word to the "[Unicode Normalization, Canonical Decomposition followed by Canonical Composition](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize#nfd)" form. For example, `&#xF1;` as two characters \u006E\u0303, will be transformed into one character, \u00F1
* `capitalise` will convert the first character of a word to uppercase
* `decapitalise` will convert the first character of a word to lowercase
* `to-uppercase` will convert all characters of a word to uppercase
* `to-lowercase` will convert all characters of a word to lowercase
* `reverse` will reverse the order of graphemes in a word

* `xsampa_to_ipa` will convert characters of a word written in X-SAMPA into IPA


* `ipa_to_xsampa` will convert characters of a word written in IPA into X-SAMPA

<details>

| IPA | X-SAMPA |
| --- | --- |
| b_< |  ɓ |
| d_< |  ɗ |
| d` |  ɖ |
| g_< |  ɠ |
| h\ |  ɦ |
| j\ |  ʝ |
| l\ |  ɺ |
| l` |  ɭ |
| n` |  ɳ |
| p\ |  ɸ |
| r\ |  ɹ |
| r\` |  ɻ |
| r` |  ɽ |
| s\ |  ɕ |
| s` |  ʂ |
| t` |  ʈ |
| x\ |  ɧ |
| z\ |  ʑ |
| z` |  ʐ |
| A |  ɑ |
| B |  β |
| B\ |  ʙ |
| C |  ç |
| D |  ð |
| E |  ɛ |
| F |  ɱ |
| G |  ɣ |
| G\ |  ɢ |
| G\_< |  ʛ |
| H |  ɥ |
| H\ |  ʜ |
| I |  ɪ |
| J |  ɲ |
| J\ |  ɟ |
| J\_< |  ʄ |
| K |  ɬ |
| K\ |  ɮ |
| L |  ʎ |
| L\ |  ʟ |
| M |  ɯ |
| M\ |  ɰ |
| N |  ŋ |
| N\ |  ɴ |
| O |  ɔ |
| O\ |  ʘ |
| v\ |  ʋ |
| P |  ʋ |
| Q |  ɒ |
| R |  ʁ |
| R\ |  ʀ |
| S |  ʃ |
| T |  θ |
| U |  ʊ |
| V |  ʌ |
| W |  ʍ |
| X |  χ |
| X\ |  ħ |
| Y |  ʏ |
| Z |  ʒ |
|  " |  ˈ◌ |
| % |  ˌ◌ |
| : |  ◌ː |
| :\ |  ◌ˑ |
| @ |  ə |
| @\ |  ɘ |
| @` |  ɚ |
| { |  æ |
| } |  ʉ |
| 1 |  ɨ |
| 2 |  ø |
| 3 |  ɜ |
| 3\ |  ɞ |
| 4 |  ɾ |
| 5 |  ɫ |
| 6 |  ɐ |
| 7 |  ɤ |
| 8 |  ɵ |
| 9 |  œ |
|  & |  ɶ |
| ? |  ʔ |
| ?\ |  ʕ |
| <\ |  ʢ |
| >\ |  ʡ |
|  ^ |  ꜛ |
| ! |  ꜜ |
| !\ |  ǃ |
| | | | |
| |\ |  ǀ |
| || | ‖ |
| |\\|\ |  ǁ |
|  =\ |  ǂ |
| -\ |  ‿ |

</details>

* `roman-to-hangul` converts, or rather, transliterates characters written in an arbitrary romanisation to Hangul Jamo blocks.
<details>

<caption>Initial and final jamo</caption>

| A romanisation | Initial | Final |
| --- | --- | --- |
| k |  ㄱ |  ㄱ |
| gk |  ㄲ |  ㄲ |
| n |  ㄴ |  ㄴ |
| t |  ㄷ |  ㄷ |
| dt |  ㄸ |  |
| r |  ㄹ |  ㄹ |
| m |  ㅁ |  ㅁ |
| p |  ㅂ |  ㅂ |
| bp |  ㅃ |  |
| s |  ㅅ |  ㅅ |
| z |  ㅆ |  ㅆ |
| c |  ㅈ |  ㅈ |
| j |  ㅉ |  |
| ch |  ㅊ |  ㅊ |
| kh |  ㅋ |  ㅋ |
| th |  ㅌ |  ㅌ |
| ph |  ㅍ |  ㅍ |
| x |  ㅎ |  ㅎ |
| gn |  |  ㅇ |

<caption>Medial jamo</caption>

| A romanisation | Hangul |
| --- | --- |
| a |  ㅏ |
|  è |  ㅐ |
|  ò |  ㅓ |
| e |  ㅔ |
| o |  ㅗ |
| u |  ㅜ |
|  ù |  ㅡ |
| i |  ㅣ |
| wa |  ㅘ |
| wè |  ㅙ |
| wò |  ㅝ |
| we |  ㅞ |
| wi |  ㅚ |
| uí |  ㅟ |
|  ùí |  ㅢ |
| ya |  ㅑ |
| yè |  ㅒ |
| yò |  ㅕ |
| ye |  ㅖ |
| yo |  ㅛ |
| yu |  ㅠ |

</details>
When there is no initial to be found, the jamo will have an initial Ieung. Forming an initial of the next jamo is prefered over creating a final for the current jamo.

### [21.2]()  Target-mark

A target-mark is a reference to the captured `TARGET` graphemes. It cannot be used in `TARGET`. This uses a less-than sign and a capital t `<T`.

Here are some examples where target-mark is employed:

<b>Full reduplication</b>:

&-><T<T ; malak ==> malakmalak


"<b>Haplology</b>":

{C }{V }(B )->^/_<T ; haplology ==> haplogy

<b>Reject a word when a word-initial consonant is identical to the next consonant</b>:

C ->0 /#_&[C ]<T


### [21.3]()  Metathesis-mark

Simple metathesis involves a less-than-sign and a capital m `<M` in `RESULT`. This will swap the first and last grapheme from the captured `TARGET` graphemes:

      ; Swap a plosive and nasal stop {p , t , k }{m , n }-><M<br>
; apma ==> ampa


Since metathesis reference is swapping the first and last grapheme, we can effectively simulate long-distance metathesis using an anythings-mark:


      ; Simulate Old Spanish "Hyperthesis" r &l -><M<br>
; parabla ==> palabra


### [21.3]()  Empty-mark

An Empty-mark using `<E`, inserts an 'empty' grapheme into the captured `TARGET` graphemes. It is only allowed in `TARGET`

One use for it is a trick to make one-place long-distance metathesis work, for example:


      ; The [r] of a plosive + [r] cluster is moved ; between a word initial plosive and a vowel <E {a , e , i , o , u }&[^{p , t , k } r ]{p , t , k } r -><M /#{p , t , k }_; kotatros -> krotatos


Another use for it is in a romanisation or deromanisation system using a cluster-field:


      <p  t  k  j  y
<E p  t  c  y  ü


### [21.4]()  Reference

Sometimes graphemes must be moved, copied, or asserted to be a certain grapheme between sounds. This is the purpose of reference. Reference is fairly straightforward, but there is a lot of jargon and different behaviour between fields to explain.

#### [21.4.1]()  Reference of singular grapheme

A grapheme (or graphemes) are bound to a reference using a 'reference-capture', to the right of some grapheme. A reference-capture looks like `=` followed by a single-digit positive number. This number, is called the 'reference-key' of the reference. The grapheme (or graphemes) bound to the reference is callsed the 'reference-value'.

The key behaviours of reference-capture are:

* A Reference forgets its reference-value in-between transforms. References do not persist between rules
* You can have up to nine references per transform
* A reference-value can be overwritten with a new reference-capture to that reference
* For reference-capture in conditions, a grapheme is captured only if that condition is met

The captured grapheme can then be reproduced elsewhere in the transform with a 'reference-mark', even before the reference-capture. The reference-mark invokes the reference-key of a reference.

The key behaviours of reference-mark are:

* A reference-mark may not be used in the `TARGET` of a transform.
* In each condition or exception of a transform, a reference-mark cannot be used before content has been bound to its reference with a reference-capture. For example `a -> e / 1x=1_` is invalid, and so is `a -> e / 1_x=1`. Reference-name is not recursive in conditions and exceptions.
* If a reference-mark is used where a reference-capture has not captured anything yet, it fails silently and outputs the number of the backrefence.

Here are some examples:


      ; Delete [ʔ] between identical vowels ʔ ->^/[+vowel]=1 _1 ; baʔaʔe ==> baaʔe


In the rule above, we are binding the `[+vowel]` feature-matrix to the reference `1`, by appending `=1` to it. Whatever this grapheme from `[+vowel]` is when the condition is met, is captured as the value of `1`. Then the value of backrefence `1` is inserted into `AFTER` by invoking its reference-mark.


      ; Insert an 'echo vowel' at the end of [ʔ] final words ^->1 /{V }=1 ʔ_#; foobaʔ ==> foobaʔa


In the rule above, we are binding the `V` category to the reference `1`, by appending `=1` to it. Whatever this grapheme from `V` is when the condition is met is the value of `1`. Then the value of `1` is inserted into `RESULT` by invoking its reference-mark.

#### [21.4.2]()  Reference of grapheme sequence

Now that that has been (hopefully) introduced and explained adequately, with reference's 'reference-capture' and 'reference-mark', lets explain how to capture and reference a sequence of graphemes.

To start capturing a sequence, you use a 'start-reference-capture', `<=` before the graphmemes to be captured. Then at the end of the graphemes to be captured, a 'reference-capture' is used to bind those graphemes to a reference:


      ; Insert an 'echo vowel' at the end of [ʔ] final words ^->1 /{V }=1 ʔ_#; foobaʔ ==> foobaʔa




### [21.5]()  Associatemes

If your language encodes tone, stress, breathy voice, or other phonological features directly on vowels, you'll often need to target a particular grapheme across its variants.

One method is to target each variant manually:


{a , á, à}->{e , é, è}<br>
; daná ==> dené


This workaround uses alternators, but lacks semantic clarity and scalability, and is outright tedious.

To solve this, are 'assosiatemes' -- aligned graphemes assosiated with their base grapheme, and other assosiated graphemes -- other SCAs might use the terms "floating diacritics" or "autosegmentals". These allow you to target all forms of a grapheme with a single transform. To set up associatemes, they must be stated in the graphemes: directive like so:


      graphemes : {a , e , i , o , u }<{á, é, í, ó, ú}<{à, è, ì, ò, ù} a -> e<br>
; daná ==> dené


This transform targets all variants of `a` and maps them to the assosiated variant of `e`.

The behaviour of assosiatemes are:

* Each grouping must contain an equal number of graphemes, aligned by position. This creates a traceable overlay across tone, stress, and other features
* This does not mean that each variant must be different by means of diacritics, they are arbitrarily variant. For example `graphemes: {a,b,c}<{x,y,z}` is valid
* This does not mean that we can have only one grouping set. For example `graphemes: {a,i,o}<{&#xE1;,&#xED;,&#xF3;}, {a,b,c}<{x,y,z}` is valid

### [21.5.1]()  Based-mark

To target only the base grapheme, use a tilde `~` after the grapheme:


a ~-> e<br>
; daná ==> dená


This transform applies only to the unmarked a, leaving á untouched.

## [22]()  Questions and answers

Here are some common questions and answers about Vocabug:

<b>The Generate button is greyed out</b>

This means Vocabug is busy generating words for you, and will eventually become clickable again. If you think this is taking too long, perhaps you have `force word limit` accidentally on.

<b>I received the error "Invalid regular expression"</b>

This error occurs because you are using Vocabug in an old browser or old browser version that does not support lookbehind. [You can check if this applies to you here](https://caniuse.com/js-regexp-lookbehind).

<b>What is a natural frequency for consonants in a language?</b>

There is no one-size-fits-all answer to this question, and different analyses of word lists may produce different data on what the general expectation is. For example, in English, /ð/ is very uncommon among all the words in English, however it is a common phoneme among sentences because of the prevalence of the words `this`, `that`, `those` and `the`. And indeed, morphology, historical sound changes and word borrowing can skew any initial control you might have over frequencies.

However, a good rule of thumb is that phonemes that are easy to pronounce and distinguish will be the most common.

<b>How do I weight an individual optional-set?</b>

Using the `Optionals-weight:` directive, affects the weight of all optional-sets. As of version 1, there is no direct way to weight an individual optional-set. You can however, use `^` as an item in an alternator, like `a{b, c, ^*3}`

1.
[Return to top](#mynav)
