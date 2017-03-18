# Design of the plain-music-js Library
*For an introduction to plain music, you should read the [article](https://pellejuul.github.io/posts/2017/03/12/writing-music-in-plain-text.html)*

## Parts of a Plain Music File 

### Units

At the buttom *Plain Music* is made of *units*. There are three types of unit: *notes*, *groups*
and *chords*.

A note can contain the following parts:

```
↓↓ Command whitespace (one)
  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ Command (multiple)
                  ↓Instruction whitespace (one)
                   ↓↓↓↓↓↓↓↓↓↓↓↓↓ Instruction (multiple)
| [command: value] 'instruction' csl^_+-!*~ | 
                                ↑ Whitespace (one)
                                 ↑ pitch (one)
                                  ↑ Sharp (one)
                                   ↑ Low (one)
                                    ↑ Octave up (multiple)
                                     ↑ Octave down (multiple)
                                      ↑ Duration double (multiple)
                                       ↑ Duration halve (multiple)
                                        ↑ Accented (one)
                                         ↑ Staccato(one)
                                          ↑ Slurred (one)
                                           ↑ End whitespace (one)
```

The parts marked with `(one)` can only appear once, the parts marked with `(multiple)`
can appear multiple times.  The barline/pipe character `|` is considered whitespace.

Groups look very much like notes:

```
| [command: value] 'instruction' (c d e)sl^_+-!*~/3:2 | 
                                 ↑↑↑↑↑↑↑ units (one)
                                                 ↑↑↑↑ Tuplet (one) 
```

For the sake of brevity I have only included descriptions for the parts which are specific
to groups.

And lasty, chords look like:

```
| [command: value] 'instruction' <c d e>sl^_+-!*~ | 
                                 ↑↑↑↑↑↑↑ units (one)
```

Since the three types of unit look so much alike, they are represented by the same kind of
object:

```
var unit = { 
  commands: [{ name: 'string', value: 'string', whitespace: 'string' }],
  instructions: [{ name: 'string', whitespace: 'string' }],
  whitespace: 'string',
  sharp: bool,
  low: bool,
  octaveUp: int,
  octaveDown: int,
  durationDouble: int,
  durationHalve: int,
  accented: bool,
  staccato: bool,
  slurred: bool,
  endWhitespace: 'string',
  type: <type>
}
```

The `type` field will be either `note`, `group` or `chord`, identifying the unit type. Depending
on the unit type, the object will have additional fields, specific to that unit.

* If `type == 'note'` then there should be a field `pitch: 'string'` which contains
    the pitch string (`'c'`, `'d'`, `'e'`, etc.).
* If `type == 'group'` then there should be two fields: `units: [unit]` containing the inner
    units and `tuplet: { from: int, to: int }` containing tuplet info. If the group isn't tuplisized,
    then `tuplet` will be `undefined`.
* If `type == 'group'` then the should b a field `units: [unit]` containing the inner units.

If a group is tuplisized with e.g. `/3:2` then the `tuplet` field should be `{ from: 3, to: 2}`.

### Staves
The *stave* is the next structural part of a piece of Plain Music. It is also the last part, apart
from the file itself. There are two kinds of staves: *single-voice* and *multi-voice*.

A single-voice stave looks like:

```
↓ Command whitespace (one)
 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ Command (multiple)
                 ↓Instruction whitespace (one)
                  ↓↓↓↓↓↓↓↓↓↓↓↓↓ Instruction (multiple)
 [command: value] 'instruction' {c d e}
                                ↑↑↑↑↑↑↑ units (one)
                                       ↑ End whitespace (one)
```

A multi-voice stave looks like:

```
↓ Command whitespace (one)
 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ Command (multiple)
                 ↓Instruction whitespace (one)
                  ↓↓↓↓↓↓↓↓↓↓↓↓↓ Instruction (multiple)
 [command: value] 'instruction' {{c d e} {c d e)}
                                 ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑ voices (one)
                                                 ↑ End whitespace (one)
```

Both kinds of stave has the same object representation:

```
var stave = { 
  commands: [{ name: 'string', value: 'string', whitespace: 'string' }],
  instructions: [{ name: 'string', whitespace: 'string' }],
  whitespace: 'string',
  voices: [[unit]],
  endWhitespace: 'string'
}
```

### The Entire File
With our `stave` object defined, the representation of a Plain Music file
is then just:

```
var file = [stave]
```

## Parsing and Generating
The plain-music-js library should expose function for parsing and generating
Plain Music. 

The parser functions are:

* `parseUnit(string)` parses a note
* `parseStave(string)` parses a stave
* `parseFile(string)` parses an entire Plain Music file.

For generation of Plain Music we have the functions:

* `generateUnit(unit)` generates the string for a note
* `generateStave(stave)` generates the string for a stave
* `generateFile(file)` generates the string for an entire file.

Because the `stave` and `unit` objects collectively contain all whitespace found
in a file, the `parse*` and `generate*` functions are inverse of each other. So it is:

```
file == generateFile(parseFile(file))
```
