var SimpleParser = (function() {
  var module = {};

  // Parses any character.
  module.char = function(parser) {
    if (parser.failure()) return undefined;

    var text = parser.current();

    if (text.length == 0) {
      parser.fail("Expected a character");
      return undefined;
    }

    var char = text[0];
    parser.position += 1;
    return char;
  }

  // Parses a rule delimited by begin and end strings (such as parentheses).
  module.delimited = function(begin, end, rule) {
    var builtRule = function(parser) {
      if (parser.failure()) return undefined;

      parser.string(begin);
      parser.optionalWhitespace();
      var result = rule(parser);
      parser.optionalWhitespace();
      parser.string(end);

      if (parser.success()) {
        return result;
      }

      parser.fail("Expected <something> enclosed in '" + begin + "' and '" + end + "' (use refail to provide a more meaningful error message)");
      return undefined;
    };

    return builtRule;
  };

  // Parses a single digit.
  module.digit = function(parser) {
    if (parser.failure()) return undefined;

    var char = parser.regex("[0-9]");

    if (parser.success()) {
      return char;
    }

    parser.refail("Expected a digit, but got '" + parser.excerpt() + "'");

    return undefined;
  }

  // Builds a function which takes a parser, and asserts that it has no more 
  // text to parse.
  module.end = function(parser) {
    if (parser.failure()) return undefined;

    if (parser.current() === "") {
      return;
    }
    
    parser.fail("Expected end of text but got " + parser.excerpt());
    return undefined;
  }

  // Parses a float, either positive or nigtave, posiibly with an exponent.
  module.float = function(parser) {
    if (parser.failure()) return undefined;

    var valueString = parser.regex("-?(0|[1-9][0-9]*)(\\.[0-9]+)?(e(0|[1-9][0-9]+))?");

    if (parser.success()) {
      return parseFloat(valueString);
    }

    parser.refail("Expected a float but got " + parser.excerpt());
    return undefined;
  }

  // Parses an integer, either positive or negative.
  module.int = function(parser) {
    if (parser.failure()) return undefined;

    var valueString = parser.regex("-?(0|[1-9][0-9]*)");

    if (parser.success()) {
      return parseInt(valueString);
    }

    parser.refail("Expected an integer but got " + parser.excerpt());
    return undefined;
  }

  // Parses a letter.
  module.letter = function(parser) {
    if (parser.failure()) return undefined;

    var char = parser.regex("[a-zA-Z]");

    if (parser.success()) {
      return char;
    }

    parser.refail("Expected alphanumeric character, but got '" + parser.excerpt() + "'");

    return undefined;
  }

  // Builds a function which takes a parser and parses multiple instances of one
  // rule, with an optional required count.
  module.many = function (parserFunc, atLeast) {
    var builtFunction = function(parser) {
      if (parser.failure()) return undefined;
      var results = [];

      while (true) {
        var result = parserFunc(parser);
        
        if (parser.failure()) {
          parser.error = undefined;
          break;
        }

        results.push(result);
      }

      if (atLeast != undefined && results.length < atLeast) {
        parser.fail("Expected at least " + atLeast + " of <something>" + "(use refail to provide a more meaningful error message).");
      }

      return results;
    };

    return builtFunction;
  };

  // Parses one or more newline characters.
  module.newline = function(parser) {
    if (parser.failure()) return;

    var result = parser.regex("(\n|\r\n)+");

    if (parser.success()) {
      return result;
    }

    parser.refail(parser.expected("space"));
  }

  // Builds a function which takes a parser, and parses one of several
  // possibilities returning the result of the first rule to succeed. If none of
  // the possibilities succeed the error message of the rule which consumed the
  // most text is used.
  module.oneOf = function(possibilities) {
    return function(parser) {
      if (parser.failure()) return undefined;

      var topError = undefined;

      for (var i = 0; i < possibilities.length; i++) {
        var rule = possibilities[i];      
        var result = rule(parser);

        if (parser.success()) {
          return result;
        }

        var topPosition = topError ? topError.position : -1;
        var isNewTopError = parser.error.position > topPosition;

        if (topError == undefined || isNewTopError) {
          topError = parser.error;
        }

        parser.error = undefined;
      }

      parser.error = topError;
      parser.fail("Error while in parser.oneOf (use refail to provide a more meaningful error message).");
      return undefined;
    }
  }

  // Makes the given rule optional, returns undefined if the rule fails.
  module.optional = function(rule) {
    var builtRule = function(parser) {
      if (parser.failure()) return;

      var result = rule(parser);

      if (parser.failure()) {
        parser.error = undefined;
        return undefined;
      }

      return result;
    };

    return builtRule;
  };

  // Parses zero or more space characters.
  module.optionalSpace = function(parser) {
    if (parser.failure()) return;

    var result = parser.regex(" *");
    return result;
  }

  // Parses zero or more whitespace characters (space, tab, newline).
  module.optionalWhitespace = function(parser) {
    if (parser.failure()) return;

    var result = parser.regex("( |\t|\n|\r)*");
    return result;
  }

  // Builds a function which takes a parser, and parses and returns a match for
  // the given regular expression pattern.
  module.regex = function(pattern) {
    return function(parser) {
      if (parser.failure()) return undefined;

      if (!pattern.startsWith("^")) {
        pattern = "^" + pattern;
      }

      var regex = new RegExp(pattern);
      var current = parser.current();
      var matches = regex.exec(current);

      if (matches == null) {
        parser.fail("Expected a match for the regular expression '" + pattern + "' but got " + parser.excerpt());
        return undefined;
      }

      var match = matches[0];
      parser.position += match.length;

      return match;
    }
  }

  // Many instances of one rule separated by a string.
  module.separated = function(separator, atLeast, rule) {
    var builtRule = function(parser) {
      if (parser.failure()) return undefined;

      var ruleWithSeparator = function(innerParser) {
        innerParser.optionalWhitespace();
        innerParser.string(separator);
        innerParser.optionalWhitespace();
        var result = rule(innerParser);
        return result;
      };

      var results = [];
      var head = rule(parser);

      if (head != undefined) {
        results.push(head);
        var tail = parser.many(ruleWithSeparator, 0); 
        results = results.concat(tail);
      }

      if (results.length < atLeast) {
        parser.fail("Expected at least " + atLeast + " of <something> (use refail to provide a more meaningful error message).")
      }

      // Possibly `head` failed, if it's OK to parse zero instances, we should
      // not fail.
      if (parser.failure() && atLeast <= 0) {
        parser.error = undefined;
      }

      return results;
    };

    return builtRule;
  };

  // Builds a function which takes a parser, and parses and returns the given
  // string.
  module.string = function(string) {
    return function(parser) {
      if (parser.failure()) return;

      if (parser.current().startsWith(string)) {
        parser.position += string.length;
        return string;
      }

      parser.fail("Expected '" + string + "' but got " + parser.excerpt());

      return undefined;
    }
  }

  // Parses a word (a sequence of letters).
  module.word = function(parser) {
    if (parser.failure()) return;

    var result = parser.regex("[a-zA-Z]+");

    if (parser.success()) {
      return result;
    }

    parser.refail("Expected a word");
    return undefined;
  }

  // Parses one or more whitespace characters (space, tab, newline).
  module.whitespace = function(parser) {
    if (parser.failure()) return;

    var result = parser.regex("( |\t|\n|\r)+");

    if (parser.success()) {
      return result;
    }

    parser.refail(parser.expected("whitespace"));
  }

  // Parses one or more space characters.
  module.space = function(parser) {
    if (parser.failure()) return;

    var result = parser.regex(" +");

    if (parser.success()) {
      return result;
    }

    parser.refail(parser.expected("space"));
  }

  // Constructor for Parser object, takes the text to parse.
  module.Parser = function(text) {
    this.text = text;
    this.position = 0;
    this.error = undefined;
    this.excerptLength = 12;
  };

  // Parses any character.
  module.Parser.prototype.char = function() {
    return module.char(this);
  }

  // Parses a rule delimited by begin and end strings (such as parentheses).
  module.Parser.prototype.delimited = function(begin, end, rule) {
    return module.delimited(begin, end, rule)(this);
  }

  // Parses a single digit.
  module.Parser.prototype.digit = function() {
    return module.digit(this);
  }

  // Returns the text to parse, starting from the current position.
  module.Parser.prototype.current = function() {
    return this.text.substr(this.position);
  };

  // Asserts that there is no more text to parse.
  module.Parser.prototype.end = function() {
    return module.end(this);
  }

  // Assmbles and returns a message from the current error.
  module.Parser.prototype.errorMessage = function() {
    var message = "";
    var error = this.error;

    while (true) {
      message += error.message;
      
      if (error.innerError == undefined) {
        message += " (column " + error.position + ")";
        break;
      }
      else {
        message += ":\n";
        error = error.innerError;
      }
    }

    return message;
  }

  // Gets an excerpt of the text at the current position for building
  // error messages.
  module.Parser.prototype.excerpt = function() {
    var current = this.current();

    if (current.length == 0) {
      return "end of text";
    }

    if (current.length < this.excerptLength) {
      return "'" + current + "'";
    }

    return "'" + current.substr(0, this.excerptLength) + " ...'";
  };

  module.Parser.prototype.expected = function(name) {
    return "Expected " + name + " but got " + this.excerpt();
  }

  // Signals that a parser error has occured, chaining the new error.
  module.Parser.prototype.fail = function(message) {
    if (this.error == undefined) {
      this.error = {
        message: message,
        position: this.position,
        innerError: undefined
      };
    }
    else {
      this.error = {
        message: message,
        position: this.position,
        innerError: this.error
      };
    }
  };

  // Returns true if a parser error has occured, false otherwise.
  module.Parser.prototype.failure = function() {
    return this.error != undefined;
  };

  // Parses a float, either positive or nigtave, posiibly with an exponent.
  module.Parser.prototype.float = function() {
    return module.float(this);
  }

  // Parses an integer, either positive or negative.
  module.Parser.prototype.int = function() {
    return module.int(this);
  }

  // Parses a single letter.
  module.Parser.prototype.letter = function() {
    return module.letter(this);
  }

  // Parses many instances of a rule, with an optional minimal amount.
  module.Parser.prototype.many = function(rule, atLeast) {
    return module.many(rule, atLeast)(this);
  }

  // Parses one of several possibilities returning the result of the 
  // first rule to succeed. If none of the possibilities succeed the
  // error message of the rule which consumed the most text is used.
  module.Parser.prototype.oneOf = function(possibilities) {
    return module.oneOf(possibilities)(this);
  }

  // Makes the given rule optional, returns undefined if the rule fails.
  module.Parser.prototype.optional = function(rule) {
    return module.optional(rule)(this);
  }

  // Parses zero or more space characters. 
  module.Parser.prototype.optionalSpace = function() {
    return module.optionalSpace(this);
  }

  // Parses zero or more white space characters (space, tab, newline).
  module.Parser.prototype.optionalWhitespace = function() {
    return module.optionalWhitespace(this);
  }

  // Replaces the message of the topmost error.
  module.Parser.prototype.refail = function(message) {
    if (this.error == undefined) {
      return;
    }
    else {
      this.error.message = message;
      this.error.innerError = undefined;
    }
  }

  // Parses and returns a match for the given regular expression pattern.
  module.Parser.prototype.regex = function(pattern) {
    return module.regex(pattern)(this);
  }

  // Many instances of one rule separated by a string.
  module.Parser.prototype.separated = function(separator, atLeast, rule) {
    return module.separated(separator, atLeast, rule)(this);
  }

  // Parses and returns the given string.
  module.Parser.prototype.string = function(string) {
    return module.string(string)(this);
  }

  // Returns true if no parser error has occured, false otherwise.
  module.Parser.prototype.success = function() {
    return this.error == undefined;
  }

  // Parses a word (a sequence of letters).
  module.Parser.prototype.word = function() {
    return module.word(this);
  }

  // Parses one or more whitespace characters (space, tab, newline).
  module.Parser.prototype.whitespace = function() {
    return module.whitespace(this);
  }

  // Parses one or more space characters.
  module.Parser.prototype.space = function() {
    return module.space(this);
  }

  // Parses one or more space characters.
  module.Parser.prototype.newline = function() {
    return module.newline(this);
  }

  return module;
}
)();
