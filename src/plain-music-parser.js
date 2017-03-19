var Parleur = require('parleur-js');

// Parses a single plain music note, like 'c', 'c++' and 'csl^_+-.!*~'.
parsePlainMusic = function(text) {
  var parser = new Parleur.Parser(text);

  var result = stave(parser);
  parser.end();

  if (parser.success()) {
    return {
      error: undefined,
      result: result };
  }

  return { 
    error: parser.errorMessage(),
    result: undefined
  }
};

function whiteAndBarline(parser) {
  return parser.regex('[ \r\n\t\\|]*');
}

function white(parser) {
  return parser.regex('[ \r\n\t]*');
}

function stave(parser) {
  if (parser.failure()) return;

  var whitespace = white(parser);
  parser.string("{");
  var units = parser.many(unit);
  parser.string("}");
  var endWhitespace = white(parser);

  if (parser.success()) {
    return {
      whitespace: whitespace,
      units: units,
      endWhitespace: endWhitespace
    };
  }

  parser.fail("Expected stave");
  return undefined;
}

function unit(parser) {
  return note(parser);
}

function note(parser) {
  var whitespace = whiteAndBarline(parser);
  var pitch = parser.regex('[abcdefg]');
  var sharp = parser.regex("s*");
  var low = parser.regex("l*");;
  var octaveUp  = parser.regex("\\^*");
  var octaveDown = parser.regex("\\_*");
  var durationDouble = parser.regex("\\+*");
  var durationHalve = parser.regex("\\-*");
  var dots = parser.regex("\\.*");
  var accent = parser.optional(Parleur.string("!"));
  var staccato = parser.optional(Parleur.string("*"));
  var slur = parser.optional(Parleur.string("~"));
  var endWhitespace = whiteAndBarline(parser);

  if (parser.success()) {
    return {
      whitespace: whitespace,
      pitch: pitch,
      sharp: sharp.length,
      low: low.length,
      octaves: octaveUp.length - octaveDown.length,
      durationDouble: durationDouble.length,
      durationHalve: durationHalve.length,
      dots: dots.length,
      accented:Boolean(accent),
      staccato:Boolean(staccato),
      slurred: Boolean(slur),
      endWhitespace: endWhitespace
    };
  }

  parser.refail(parser.expected('note'));
  return undefined;
}

module.exports.parsePlainMusic = parsePlainMusic;