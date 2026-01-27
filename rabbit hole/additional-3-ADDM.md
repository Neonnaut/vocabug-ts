Are you a weirdo who types their dictionary out in latex? Or have you mistakeningly typed out your 
dictionary in a spreadsheet, only to find out the data type of dictionariesis too complex?
Your meaning does not exist in the websites database?
Your dictionary is now saved in a non-human-readable database file?

I want to write a dictionary in the same way I read a dictionary

```
thing:
   ENTRY
   KEY
   BRANCHER
   SINGLE
   MULTIPLE
   SINGLE OPTIONAL
   MULTIPLE OPTIONAL

thing parameter:
   format
   delimeter
   types

format-tags:
   [b]
   [i]
   [u]
   [superscript]
   [subscript]
   [small-caps]

format-content:
   <branch-incrementor-number>
   <branch-incrementor-letter>
   <newline>

--------------------------------

alphabet:
  a, b, c, c', d, ...

invisible:
  ., l

order-by:
  <word> descending



ENTRY:
   format = "_"
   delimiter = <newline>

   fields:
      KEY word:
         format = "[b]"_"[/b]"

      SINGLE ipa:
         format = "["_"]"

      BRANCHER pos:
         types = "n"|"noun", "v"|"verb", "adj"
         format = "[superscript]<branch-incrementor-num>[/superscript] [i]_[/i]."

      MULTIPLE meaning:
         delimiter: "; "

      MULTIPLE OPTIONAL note:
         format: "Note: [i]<note>[/i]",
         delimeter: ";"

dictionary:
 
right <ipa> rait <pos>
  n. <meaning> a direction <note> A note here / an additional note here separated by a frorward slash
  n. <meaning> To be healthy / To be appropriate <note> another optional note belonging to this branch
  
foo <pronounce> bar <class> n. <meaning> A placeholder word

```
 
 