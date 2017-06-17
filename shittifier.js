module.exports = function Shittifier(){

	var detectIndent = require("./node_modules/detect-indent/index.js");
	var escapeRegex = require("./node_modules/escape-string-regexp");

	var inputString = "";
	var outputString = "";
	var indentationInput;
	var settings = {
		blockmode: {
			indentation: {
				tabs: true,
				chars: 0
			}
		}
	};
	var comments = [
		"toDo", function () {
			return "TODO"+_getRnd("?",1,4);
		},
		function () {
			return "if ( " + _getRndArg("true","false")+ _getRndArg("||", "&&") + _getRndArg("new Date()", "window.ontouchstart") +") return " + _getRndArg(" false", "");
		},
		"if ( undefined "+_getRndArg("=","==")+ _getRndArg("window.cordova", "window.modernuzr", "options","CONFIG", "app")+" ) return",
		function() {
			return "if ( " +_getRndArg("width","height","footerHeight","headerHeight")+_getRndArg("<", ">=", ">", "==", "===")+_getRandomArbitrary(51,599,true)+" )";
		},
		function() {
			return "if ( "+_getRndArg("$helper","navitem","$widthelement")+".length < 0 ) return " + _getRndArg(" false", "");
		},
		function () {
			return "alert( "+_getRndArg("element.offset()","window.history","document.querySelector('.bottom')") +")";
		}
	];

	var shittifierFunctions = {

		strings: {
			optionalWhitespace: function(str) {
				console.log("optionalWhitespace",str);
				return str.replace( /(,|\)|\(|}|{|\[|\]|===|>>=|<<=|\|\|)/g, function safe(m,$1) {
					console.log("optionalWhitespace match", $1, _()+$1+_());
					return _()+$1+_();
				}).replace( / +(>|<|=|==|>=|<=) +/g, function notSafe(m,$1) {
					return _()+$1+_();
				});
			}
		},
		words: {
			typos: function (str) {

				var re = new RegExp( "\(var\|function \*\\(\?\) \*"+ escapeRegex(str) );
				if ( ! re.test(inputString) ){
					return str;
				}
				if ( Math.random() < 0.1 && str.length > 1 ) {
					var out = str.split("");
					var pos = _getRandomArbitrary(0,str.length-2,true);

					out[pos] = str[pos+1];
					out[pos+1] = str[pos];

					return out.join("");
				}
				return str;
			},
			case: function (str) {

				// if ( _isKeyword(str) ) {
				// 	return str;
				// }
				var re = new RegExp( "\(var\|function\) "+escapeRegex(str) );
				if ( ! re.test(inputString) ){
					return str;
				}
				if ( Math.random() > 0.5 ) {
					return str.replace(/([a-z])([A-Z])/g, function(m,$1,$2) {
						return $1 + "_"+ $2.toLowerCase();
					});
				} else {
					return str.replace(/(\w)_(\w)/g, function (m,$1,$2) {
						return $1 + $2.toUpperCase();
					});
				}
			}
		},
		lines: {
			whiteSpaceIndentation: function(str) {

				var indent = str.match(/^\s*/) && str.match(/^\s*/)[0], shittyIndentation, blockmodeIndentation;

				var blockmodeChars = settings.blockmode.indentation.chars;
				var blockmodeTabs = settings.blockmode.indentation.tabs;

				var reIndentationSpaces = new RegExp( _getRnd(" ",indentationInput.chars,indentationInput.chars), "g" );

				if ( blockmodeTabs ){

					shittyIndentation = indent.replace(reIndentationSpaces, "\t");
				} else {

					blockmodeIndentation = _getRnd(" ",blockmodeChars,blockmodeChars);
					shittyIndentation = indent.replace(/\t/g, blockmodeIndentation );
					shittyIndentation = shittyIndentation.replace(reIndentationSpaces, blockmodeIndentation );
				}

				return str.replace( indent, shittyIndentation );
			},
			removeBlockComments: function (str) {

				if ( str.match(/^\s*(\*|\/\*|\/\/\s*\/*)/) ) {
					str = "";
				}
				return str;
			},
			dublicateAsComment: function (str) {

				if ( Math.random() < 0.1 ) {

					var comment = str.replace(/^(?!\/\/)/,"\/\/").replace(/\d+/g, function (m) {
						return parseFloat(m) * _getRandomArbitrary(1,3,true);
					});
					return str + "\n"  + comment + "\n";
				}
				return str;
			},
			trailingColons: function (str) {
				return str.replace( /;\s*$/g, _getRnd(";") );
			},
			addComments: function(str) {

				if ( Math.random() < 0.05 ) {
					return str + "\n" + "//" + _getRandomIndent() + _getRandomComment() + "\n";
				}
				return str;
			},
			addEmptyNewlines: function (str) {

				if ( str.match(/^\s*$/) && Math.random() < 1 ) {
					// remove empty lines
					return;

				} else if ( Math.random() < 0.1 ) {
					// add empty lines
					var newSpaces = _getRnd(" ",0,40);
					var newTabs = _getRnd("\t",1,8);
					var newBoth1 = _getRnd(" ",0,20) + _getRnd("\t",0,4);
					var newBoth2 = _getRnd("\t",0,4) + _getRnd(" ",0,20);
					var newLine = "\n"+ _getRndArg(newSpaces,newTabs,newBoth1,newBoth2);
					return str + _getRnd(newLine,3);
				}
				return str;
			}
		},
		blocks: {
			addComments: function (str) {

				if ( Math.random() < 0.5 ) {

					var comment = str
						.replace(/(^.)/,"\/\/$1")
						.replace(/(\n|\r)(.+)/g, "\n\/\/$2")

					return str  + comment ;
				}
				return str;
			},
		}
	};

	var functionsSet = getFunctions();

	var shittify = function ( str ) {

		var prop, fn, shittyStr, arrStrings, arrLines, arrBlocks, arrLinesBlock;

		inputString = outputString = str;
		indentationInput = _detectIndentation(inputString);

		for (prop in shittifierFunctions.strings) {
			if (shittifierFunctions.strings.hasOwnProperty(prop) && functionsSet.strings.indexOf(prop) != -1 ) {

				fn = shittifierFunctions.strings[prop];

				// split into strings/regexes and valid code
				arrStrings = outputString.split(/(".+")|('.+')|(\/.+\/)/);

				// shittify the non-strings
				arrStrings.map(function (s,i) {

					if ( _isValidCodeBit(s) ) {

						arrStrings[i] = fn.call(null, s);
					}
				});

				outputString = arrStrings.join("");
			}
		}

		for (prop in shittifierFunctions.words) {
			if (shittifierFunctions.words.hasOwnProperty(prop) && functionsSet.words.indexOf(prop) != -1 ) {

				fn = shittifierFunctions.words[prop];

				// split into strings/regexes and valid code
				arrStrings = outputString.split(/(".+")|('.+')|(\/.+\/)/);

				// shittify the non-strings
				arrStrings.map(function (s) {

					if ( _isValidCodeBit(s) ) {

						var arrWords = s.split(/\b/);

						arrWords.map(function(s) {

							// only real word character words
							if ( s.match(/^\w+$/) ) {
								shittyStr = fn.call(null, s);
								outputString = outputString.replace( new RegExp("\\b"+escapeRegex(s)+"\\b", "g"), shittyStr);
							}
						});
					}
				});
			}
		}

		for (prop in shittifierFunctions.lines) {
			if (shittifierFunctions.lines.hasOwnProperty(prop) && functionsSet.lines.indexOf(prop) != -1) {

				fn = shittifierFunctions.lines[prop];

				arrLines = outputString.split(/\n/);
				arrBlocks = _getBlocksOfLines( arrLines );

				arrBlocks.map(function (s,i) {

					settings.blockmode.indentation.tabs = !settings.blockmode.indentation.tabs;
					settings.blockmode.indentation.chars = _getRandomArbitrary(1, 4, true);

					// create lines arr for each block
					arrLinesBlock = s.split("\n");
					arrLinesBlock.map(function(s,i) {

						arrLinesBlock[i] = fn.call(null, s);
					});

					arrBlocks[i] = arrLinesBlock.filter(_removeUndef).join("\n");
				});
				outputString = arrBlocks.join("\n");
			}
		}

		for (prop in shittifierFunctions.blocks && functionsSet.blocks.indexOf(prop) != -1) {
			if (shittifierFunctions.blocks.hasOwnProperty(prop)) {

				fn = shittifierFunctions.blocks[prop];

				arrLines = outputString.split(/\n/);
				arrBlocks = _getBlocksOfLines( arrLines );
				arrBlocks.map(function (s,i) {

					settings.blockmode.indentation.tabs = !settings.blockmode.indentation.tabs;
					settings.blockmode.indentation.chars = _getRandomArbitrary(0, 4, true);

					arrBlocks[i] = fn.call(null, s);
				});
				outputString = arrBlocks.join("");
			}
		}

		return outputString;
	};

	function _isValidCodeBit (s){

		var isTypeString = typeof s == "string";
		var isString = isTypeString && !!s.match(/(^".*"$)|(^'.*'$)|(^\/.*\/$)/);
		return isTypeString && !isString;
	}

	function _getBlocksOfLines (arrLines) {

		// TODO get actual code blocks, not random

		var arrBlocks = [], linesToGo = 0, i = -1;

		arrLines.map(function (line) {

			if ( linesToGo < 1 ) {
				i++;
				linesToGo = _getRandomArbitrary(1, Math.min(arrLines.length/2,40) );
			}
			arrBlocks[i] = arrBlocks[i] || "";
			arrBlocks[i] += line + "\n";

			linesToGo--;
		});
		return arrBlocks;
	}

	function _detectIndentation (str) {

		var detected = detectIndent(str);

		var indentation = {
			chars: detected.amount,
			tabs: (detected.type == "tabs")
		};

		return indentation;
	}

	function _getRandomComment() {

		var rndComment = comments[ _getRandomArbitrary(0,comments.length-1,true) ];

		if ( typeof rndComment == "function" ){
			rndComment = rndComment();
		}

		return shittifierFunctions.strings.optionalWhitespace.call(null, rndComment);
	}

	function _getRandomIndent() {

		return _getRndArg( _getRnd("\t",0,5), _getRnd(" ",0,30) );
	}

	function _removeUndef(item) {

		return item;
	}

	function _getRnd(strIn, max, min) {

		var strOut = "";

		min = min !== undefined ? min : 0;
		max = max !== undefined ? max : 1;

		var amount = _getRandomArbitrary(min, max, true);

		for (var i = 0; i < amount; i++) {
			strOut += strIn;
		}

		return strOut;
	}

	function _getRndArg() {

		var i = _getRandomArbitrary(0, arguments.length-1,true);

		return arguments[i];
	}

	function _() {

		return _getRnd(" ");
	}

	function _isKeyword(str) {

		try {
			eval('var ' + str + ' = 1');
		} catch (e){
			return true;
		}
		return false;
	}

	function _getRandomArbitrary (min, max, round) {

		var rnd = Math.random() * (max - min) + min;
		return round ? Math.round(rnd) : rnd;
	}

	function setFunctions (functions) {
		console.log("shittifier.setFunctions", functions);
		functionsSet = functions;
	}

	function getFunctions () {

		var functions = {
			words: [],
			strings: [],
			lines: [],
			blocks: []
		}, fn;
		for (fn in shittifierFunctions.words) {
			if (shittifierFunctions.words.hasOwnProperty(fn)) {
				functions.words.push(fn);
			}
		}
		for (fn in shittifierFunctions.strings) {
			if (shittifierFunctions.strings.hasOwnProperty(fn)) {
				functions.strings.push(fn);
			}
		}
		for (fn in shittifierFunctions.lines) {
			if (shittifierFunctions.lines.hasOwnProperty(fn)) {
				functions.lines.push(fn);
			}
		}
		for (fn in shittifierFunctions.blocks) {
			if (shittifierFunctions.blocks.hasOwnProperty(fn)) {
				functions.blocks.push(fn);
			}
		}
		return functions;
	}



	var api = {
		shittify: shittify,
		getFunctions: getFunctions,
		setFunctions: setFunctions
	};

	return api;
};