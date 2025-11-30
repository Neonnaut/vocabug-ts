
Overall structure:

A vocabug document consists of directives and their decorators.

Each directive is a block of s


@meta.description = "description"
@meta.author = "name"
@meta.title = "languageX"
@meta.domain = "neonnaut.neocities.com"


@categories.distribution = gusein-zade
categories {
  C = abcde
  @supra R = acute
}

units {
  syll = C[R~5]
}

@words.distribution = zipfian
@words.optionals_weight = 30%
words{
  [first][second][syll][R:5],
}

@alphabet.invisible = {.}
alphabet{ EXAMPLE }

@graphemes.from_alphabet
graphemes{
  a, <=[á, à], e, <=[é, è], i, <=[í, ì], o, <=[ó ò], u, <=[ú, ù],
  b, 
}

features {
  voiced = abcde
  unvoiced
}

feature-field {
       |          |  m n p b t d k g s h l j
MANNER | nasal    |  + + . . . . . . . . . .
       | plosive  |  . . + + + + + + . . . .
       | nasal    |  + + . . . . . . . . . .
       | fricative|  . . . . . . . . + + - -
       | approx   |  . . . . . . . . . . + +
         @VOICE   |  Y Y - + - + - + N N Y Y
PLACE  | labial   |  + . . . . . . . . . . .
       | alveolar |  . + . . + + . . + . + .
       | palatal  |  . . . . . . . . . . . +
       | velar    |  . . . . . . + + . . . .
       | glottal  |  . . . . . . . . . + . .
}

[voiced, stop] -> [nasal]

stage {
  @cluster-field {
    EXAMPLE
  }

  @routine {
    EXAMPLE
  }

  @transform.chance = 40%:
  @transform.name = "thingy":
}



;               Comment
\;              Escapes a character after it
{ and }	        Alternator-set
( and )	        Optionalator-set
C, D, K, ...    Any one-length cap-letter can refer to a category
<[ and ]	      Feature matrix
^ or ∅	        Insertion when in TARGET, deletion when in RESULT
, or " " 	      Separates choices
/		            A condition follows this character
?		            A chance condition follows this character
! or //         An exception follows this character
_               The underscore _ is a reference to the target
#	 	            Word boundary
$		            Syllable boundary
:	              Geminate-mark, duplicate of the previous grapheme matched
*		            Wildcard, matches exactly 1 of any grapheme
=1              Reference-capture
1 2 3 4         Reference
~		            Based-mark
+		            Quantifier, matches as 1 or more of the previous grapheme
%		            Anythings-mark, matches ungreedily 1 or more wildcards
0		            Rejects a word
>> => -> ⇒ →   Indicates change
?{ and }        Bounded quantifier
%{ and | and }  Guarded-anythings-mark
&{ and }        Named escape
&T              Target-mark
&M              Metathesis-mark
&E		          Empty-mark
&=              Begins Reference-capture of a sequence of graphemes


supraseme

#5d4472


