So... here we are, Nesca uses its own domain specific language (DSL) for matching patterns, while RegExp uses regular expressions. Ye olde Lexifer uses Regexp, not to it's own discredit, but Nesca is a bit more powerful in some ways. Using Regexp for transforms / 'filters' is ... bad as you can no longer use common characters like `.` . So lets compare Nesca and RegExp to make sure NeSCA isn't missing anything.

| REGEXP     | NeSCA    |                                                         | Need |
|------------|----------|---------------------------------------------------------|------|
| ^          | #_       | Start of string, or start of line in multi-line pattern |      |
| $          | _#       | End of string, or end of line in multi-line pattern     |      |
| \b         | #        | Word boundary                                           |      |
| \B         | !_#      | Not word boundary                                       |      |
| \<         | #_       | Start of word                                           |      |
| \\>         | _#       | End of word                                             |      |
|            | \\[SPACE] | Whitespace                                              | No   |
|            |          | digit matching                                          |      |
|            |          | POSIX                                                   | No   |
| ?=         | /_T      | Lookahead assertion                                     |      |
| ?!         | !_T      | Negative lookahead                                      |      |
| ?<=        | /T_      | Lookbehind assertion                                    |      |
| ?!= or ?<! | !T_      | Negative lookbehind                                     |      |
| ?>         |          | Once-only Subexp­ression                                |      |
| ?()        |          | Condition [if then]                                     |      |
| ?()\|      |          | Condition [if then else]                                |      |
| ?#         | ;        | Comment                                                 |      |
| *          |          | 0 or more                                               |      |
| +          |          | 1 or more                                               |      |
| ?          | (T)      | 0 or 1                                                  |      |
| {3}        |          | Exactly 3                                               |      |
| {3,}       |          | 3 or more                                               |      |
| {3,5}      |          | 3, 4 or 5                                               |      |
| \          | \        | Escape following character                              |      |
| \Q         |          | Begin literal sequence                                  |      |
| \E         |          | End literal sequence                                    |      |
| \n         |          | New line                                                |      |
| \r         |          | Carriage return                                         |      |
| \t         |          | Tab                                                     |      |
| \v         |          | Vertical tab                                            |      |
| \f         |          | Form feed                                               |      |
| \xxx       |          | Octal character xxx                                     |      |
| \xhh       |          | Hex character hh                                        |      |
| .          | *        | Any character except new line (\n)                      |      |
| (a\|b)     | [a, b]   | a or b                                                  |      |
| (...)      |          | Group                                                   |      |
| (?:...)    | ! ... /  | Passive (non-capturing) group                           |      |
| [abc]      |          | Range (a or b or c)                                     |      |
| [^abc]     |          | Not (a or b or c)                                       |      |
| [a-q]      |          | Lower case letter from a to q                           |      |
| [A-Q]      |          | Upper case letter from A to Q                           |      |
| [0-7]      |          | Digit from 0 to 7                                       |      |
| \x         |          | Group/subpattern number "x"                             |      |
| g          |          | Global match                                            |      |
| i *        |          | Case-insensitive                                        |      |
| m *        |          | Multiple lines                                          |      |
| s *        |          | Treat string as single line                             |      |
| x *        |          | Allow comments and whitespace in pattern                |      |
| e *        |          | Evaluate replacement                                    |      |
| U *        |          | Ungreedy pattern                                        |      |


so, 