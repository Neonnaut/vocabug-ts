
CFMD

```mermaid
  graph TD;
      A-->B;
      A-->C;
      B-->D;
      C-->D;
```

Table of contents

Images
Inline (titles are optional):

![alt text](/path/img.jpg "Title")
Reference-style:

![alt text][id]

  [id]: /url/to/img.jpg "Title"


Syntax Cheatsheet
Phrase Emphasis
*italic*   **bold**
_italic_   __bold__
Links
Inline:

An [example](http://url.com/ "Title")
Reference-style labels (titles are optional):

An [example][id]. Then, anywhere
else in the doc, define the link:

  [id]: http://example.com/  "Title"
Images
Inline (titles are optional):

![alt text](/path/img.jpg "Title")
Reference-style:

![alt text][id]

  [id]: /url/to/img.jpg "Title"
Headers
Setext-style:

Header 1
========

Header 2
--------
atx-style (closing #'s are optional):

# Header 1 #

## Header 2 ##

###### Header 6
Lists
Ordered, without paragraphs:

1.  Foo
2.  Bar
Unordered, with paragraphs:

*   A list item.

    With multiple paragraphs.

*   Bar
You can nest them:

*   Abacus
    * ass
*   Bastard
    1.  bitch
    2.  bupkis
        * BELITTLER
    3. burper
*   Cunning
Blockquotes
> Email-style angle brackets
> are used for blockquotes.

> > And, they can be nested.

> #### Headers in blockquotes
> 
> * You can quote a list.
> * Etc.
Code Spans
`<code>` spans are delimited
by backticks.

You can include literal backticks
like `` `this` ``.
Preformatted Code Blocks
Indent every line of a code block by at least 4 spaces or 1 tab.

This is a normal paragraph.

    This is a preformatted
    code block.
Horizontal Rules
Three or more dashes or asterisks:

---

* * *

- - - -
Manual Line Breaks
End a line with two or more spaces:

Roses are red,   
Violets are blue.


-----





Github Flavored Markdown (GFMD) is based on [Markdown Syntax Guide](http://daringfireball.net/projects/markdown/syntax) with some overwriting as described at [Github Flavored Markdown](http://github.github.com/github-flavored-markdown/)


## Coding - Block

```ruby
# The Greeter class
class Greeter
  def initialize(name)
    @name = name.capitalize
  end

  def salute
    puts "Hello #{@name}!"
  end
end

# Create a new object
g = Greeter.new("world")

# Output "Hello World!"
g.salute
```
 
will produce  

```ruby
# The Greeter class
class Greeter
  def initialize(name)
    @name = name.capitalize
  end

  def salute
    puts "Hello #{@name}!"
  end
end

# Create a new object
g = Greeter.new("world")

# Output "Hello World!"
g.salute
```

Note: You can specify the different syntax highlighting based on the coding language eg. ruby, sh (for shell), php, etc  
Note: You must leave a blank line before the `\`\`\``


---

## Escape sequence
You can escape using \\ eg. \\\`


## Quoting

You can create a quote using `>`:

```
> This is a quote
```

will produce

> This is a quote

## Table


## Adding Image

```
![Branching Concepts](http://git-scm.com/figures/18333fig0319-tn.png "Branching Map")
```

superscript subscript

strikethrough

This isn't common, but some Markdown processors allow you to highlight text. The result looks like this. To highlight words, use two equal signs (==) before and after the words.

`I need to highlight these ==very important words==.`

heading ids

---
title: Footnotes
syntax-id: footnotes
syntax-summary: |
  Here's a sentence with a footnote. [^1]

  [^1]: This is the footnote.
---

Footnotes allow you to add notes and references without cluttering the body of the document. When you create a footnote, a superscript number with a link appears where you added the footnote reference. Readers can click the link to jump to the content of the footnote at the bottom of the page.

To create a footnote reference, add a caret and an identifier inside brackets (`[^1]`). Identifiers can be numbers or words, but they can't contain spaces or tabs. Identifiers only correlate the footnote reference with the footnote itself — in the output, footnotes are numbered sequentially.

Add the footnote using another caret and number inside brackets with a colon and text (`[^1]: My footnote.`). You don't have to put footnotes at the end of the document. You can put them anywhere except inside other elements like lists, block quotes, and tables.

```
Here's a simple footnote,[^1] and here's a longer one.[^bignote]

[^1]: This is the first footnote.

[^bignote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    `{ my code }`

    Add as many paragraphs as you like.
```

The rendered output looks like this:

Here's a simple footnote,[^1] and here's a longer one.[^bignote]

[^1]: This is the first footnote.

[^bignote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    `{ my code }`

    Add as many paragraphs as you like.

### definition list

## Auto linking

Many Markdown processors automatically turn URLs into links. That means if you type http://www.example.com, your Markdown processor will automatically turn it into a link even though you haven’t used brackets.

http://www.example.com

## Description List Term

: Definition 1
: Definition 2

## title and author metadata

## Syntax trees

## Glossing

## Typo checking

## ADDM Annotated Dictionary Database Manager