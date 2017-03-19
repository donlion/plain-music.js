var Parleur = require('parleur-js');

// Parses a single plain music note, like 'c', 'c++' and 'csl^_+-.!*~'.
parsePlainMusic = function(text) {
  var parser = new Parleur.Parser(text);

  var pitch = parser.regex("[abcdefg]");
  parser.refail("Expected pitch (c, d, e, f, g, a, b or r for rest)");
  var sharp = parser.regex("s*");
  var flat  = parser.regex("l*");;
  var octaveUp  = parser.regex("\\^*");
  var octaveDown = parser.regex("\\_*");
  var durationDouble = parser.regex("\\+*");
  var durationHalve = parser.regex("\\-*");
  var dots = parser.regex("\\.*");
  var accent = parser.optional(Parleur.string("!"));
  var staccato = parser.optional(Parleur.string("*"));
  var slur = parser.optional(Parleur.string("~"));
  parser.end();

  if (parser.success()) {
    return {
      pitch:     pitch,
      halfsteps: sharp.length - flat.length,
      octaves:   octaveUp.length - octaveDown.length,
      duration:  durationDouble.length - durationHalve.length,
      dots:      dots.length,
      accented:  Boolean(accent),
      staccato:  Boolean(staccato),
      slurred:   Boolean(slur)
    };
  }

  throw parser.errorMessage();
};

module.exports.parsePlainMusic = parsePlainMusic;
