# CHANGELOG

## [1.0.1] - 2025-DEC-17

### Added
- Created changelog
- Added 'greek-to-latin', 'latin-to-greek' and 'hangul-to-latin' 'routines'
- Docs for the above 'routines'
- Added 'syllable-boundary' directive and docs

### Modified
- The hangul "eu" graph's romanisation for the 'routine' is now now <ụ> instead of <ù>
- Renamed "roman-to-hangul" to "latin-to-hangul"
- Fixed an oversight with the 'anythings-mark' not splitting correctly on "|"
- Moved the "number of words" textbox into the config section
- Docs examples now have 'graphemes' inside "<" and ">" instead of "[" and "]"
- CLI works now

## [1.0.2] - 2025-DEC-23

### Added
- Download words button in web app

### Modified
- Features and categories parsing improvement
- conditions and exceptions parsing improvement
- updated docs to reflect this
- updated examples to reflect this

## [1.0.3] - 2026-JAN-27

### Added
- Disable any directive
- Rule line wrapping
- Letter-case field
- Added Nesca - sound change applier

### Modified

- Fixed https://github.com/Neonnaut/vocabug-ts/issues/1#issue-3821895482
- When debug mode was on, there would be a newline at the end of the word list. Now that is not the case.
- Chsnged this repository to "The Conlangers Suite"