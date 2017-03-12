var PlainMusic = (function(SimpleParser) {
  var module = {};
  var SP = SimpleParser;

  module.parsePlainMusic = function(text) {
    var parser = new SimpleParser.Parser(text);

    var pitch = parser.regex("[abcdefg]");
    parser.refail("Expected pitch (c, d, e, f, g, a, b or r for rest)");
    var sharp = parser.regex("s*");
    var flat  = parser.regex("l*");;
    var octaveUp  = parser.regex("\\^*");
    var octaveDown = parser.regex("\\_*");
    var durationDouble = parser.regex("\\+*");
    var durationHalve = parser.regex("\\-*");
    var dots = parser.regex("\\.*");
    var accent = parser.optional(SP.string("!"));
    var staccato = parser.optional(SP.string("*"));
    var slur = parser.optional(SP.string("~"));
    parser.end();

    if (parser.success()) {
      var half = sharp.length - flat.length;
      var octave = octaveUp.length - octaveDown.length;
      var durationExponent = durationHalve.length - durationDouble.length;
      var duration = 1 / Math.pow(2, durationExponent);

      for (i = 0; i < dots.length; i++) {
        duration = duration * 3/2;
      }

      var accented = Boolean(accent);
      var staccato = Boolean(staccato);
      var slurred = Boolean(accent);

      return {
        pitch: pitch,
        half: half,
        octave: octave,
        duration: duration,
        accented: accented,
        staccato: staccato,
        slurred: slurred,
      };
    }

    throw parser.errorMessage();
  };

  return module;
})(SimpleParser);
