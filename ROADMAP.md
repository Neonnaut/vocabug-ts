Thoughts....

- I should finish all wordgen things, then move on to NASC, then go back here to improve transforms

- Null symbol as alternative to caret?

- Do I keep graphemes escaped going past into the transforms?
If so, this would mean [ > @, would not work on a word \[ada
This will also mean I should steralise directives like `alphabet` of backslashes 

- New plan on interset... they should probably still be in `<` and `>` but it should consist of a 
singular category, followed by a weight: `<E:5>`

- HTML entities, good, keep them in `{}`

- Invisible set is good

- segments have a... bug? where if I say `$S = cas an` it resolves as two wordshapes instead of abbreviation of a single wordshape ... ugh

- there is a bug with escaping spaces because I use trim on the input in resolver

- I have yet to properly escape `;`


TRANSFORMS

I can prob use `&` as seperator again... perhaps it could replace ditto mark!!

Anythings-mark should be ampersand.