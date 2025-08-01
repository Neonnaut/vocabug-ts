So... here we are, Nesca uses its own domain specific language (DSL) for matching patterns, while Lexifer uses regular expressions. Ye olde Lexifer uses Regexp, not to it's own discredit, but Nesca is a bit more powerful in some ways. Using Regexp for transforms / 'filters' is ... bad as you can not use common characters like `.` . So lets compare Nesca and RegExp to make sure NeSCA isn't missing anything. Also to feel like I'm not reinventing the wheel.

| REGEXP     | NeSCA    | Meaning                            |
|------------|----------|------------------------------------|
| \<, ^      | #_       | Start of word                      |
| \\>, $      | _#       | End of word                        |
|            | \\[SPACE] | Whitespace                         |
| ?=         | /_T      | Lookahead assertion                |
| ?!         | !_T      | Negative lookahead                 |
| ?<=        | /T_      | Lookbehind assertion               |
| ?!= or ?<! | !T_      | Negative lookbehind                |
| ?>         |          | Once-only Subexp­ression           |
| ?()        |          | Condition [if then]                |
| ?()\|      |          | Condition [if then else]           |
| ?#         | ;        | Comment                            |
| \1         | <1       | Backreference                      |
|            | :        | Geminate                           |
| *          | (T+)     | 0 or more                          |
| +          | +        | 1 or more                          |
| .          | *        | Any character except new line (\n) |
| .+?        | &        | Any series of characters ungreedy  |
| ?          | (T)      | 0 or 1                             |
| {3}        | ={3}     | Exactly 3                          |
| {3,}       | ={3+}    | 3 or more                          |
| {3,5}      | ={3,5}   | 3, 4 or 5                          |
| \          | \        | Escape following character         |
| (a\|b)     | [a, b]   | a or b                             |
| [^abc]     |          | Not (a or b or c)                  |
| [a-q]      |          | Lower case letter from a to q      |
| [A-Q]      |          | Upper case letter from A to Q      |
| [0-7]      |          | Digit from 0 to 7                  |

so, as we can see, NeSCA can't do things like target a group of characters that aren't part of a group of characters. We can't target "natural" classes like number list, ascii lowercase letters. NeSCA doesn't have if / else / then logic yet.

