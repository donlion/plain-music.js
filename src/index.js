var plainMusicParser = require('./plain-music-parser.js');

module.exports.query = function(staves, staveNo, voiceNo, noteNo) {
  var stave = {};

  if (staveNo == undefined) {
    return undefined;
  }
  else {
    stave = staves[staveNo];
  }

  var voice = {};

  if (voiceNo == undefined) {
    return stave;
  }
  else {
    voice = stave.voices[voiceNo];
  }

  if (noteNo == undefined) {
    return voice;
  }

  return voice.units[noteNo];
}

module.exports.parseFile = plainMusicParser.parseFile;
