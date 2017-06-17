(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* TextareaDecorator.js
 * written by Colin Kuebler 2012
 * Part of LDT, dual licensed under GPLv3 and MIT
 * Builds and maintains a styled output layer under a textarea input layer
 */

module.exports = function TextareaDecorator( textarea, parser ){
	/* INIT */
	var api = this;

	// construct editor DOM
	var parent = document.createElement("div");
	var output = document.createElement("pre");
	parent.appendChild(output);
	var label = document.createElement("label");
	parent.appendChild(label);
	// replace the textarea with RTA DOM and reattach on label
	textarea.parentNode.replaceChild( parent, textarea );
	label.appendChild(textarea);
	// transfer the CSS styles to our editor
	parent.className = 'ldt ' + textarea.className;
	textarea.className = '';
	// turn off built-in spellchecking in firefox
	textarea.spellcheck = false;
	// turn off word wrap
	textarea.wrap = "off";

	// coloring algorithm
	var color = function( input, output, parser ){
		var oldTokens = output.childNodes;
		var newTokens = parser.tokenize(input);
		var firstDiff, lastDiffNew, lastDiffOld;
		// find the first difference
		for( firstDiff = 0; firstDiff < newTokens.length && firstDiff < oldTokens.length; firstDiff++ )
			if( newTokens[firstDiff] !== oldTokens[firstDiff].textContent ) break;
		// trim the length of output nodes to the size of the input
		while( newTokens.length < oldTokens.length )
			output.removeChild(oldTokens[firstDiff]);
		// find the last difference
		for( lastDiffNew = newTokens.length-1, lastDiffOld = oldTokens.length-1; firstDiff < lastDiffOld; lastDiffNew--, lastDiffOld-- )
			if( newTokens[lastDiffNew] !== oldTokens[lastDiffOld].textContent ) break;
		// update modified spans
		for( ; firstDiff <= lastDiffOld; firstDiff++ ){
			oldTokens[firstDiff].className = parser.identify(newTokens[firstDiff]);
			oldTokens[firstDiff].textContent = oldTokens[firstDiff].innerText = newTokens[firstDiff];
		}
		// add in modified spans
		for( var insertionPt = oldTokens[firstDiff] || null; firstDiff <= lastDiffNew; firstDiff++ ){
			var span = document.createElement("span");
			span.className = parser.identify(newTokens[firstDiff]);
			span.textContent = span.innerText = newTokens[firstDiff];
			output.insertBefore( span, insertionPt );
		}
	};

	api.input = textarea;
	api.output = output;
	api.update = function(){
		var input = textarea.value;
		if( input ){
			color( input, output, parser );
			// determine the best size for the textarea
			var lines = input.split('\n');
			// find the number of columns
			var maxlen = 0, curlen;
			for( var i = 0; i < lines.length; i++ ){
				// calculate the width of each tab
				var tabLength = 0, offset = -1;
				while( (offset = lines[i].indexOf( '\t', offset+1 )) > -1 ){
					tabLength += 7 - (tabLength + offset) % 8;
				}
				var curlen = lines[i].length + tabLength;
				// store the greatest line length thus far
				maxlen = maxlen > curlen ? maxlen : curlen;
			}
			textarea.cols = maxlen + 1;
			textarea.rows = lines.length + 1;
		} else {
			// clear the display
			output.innerHTML = '';
			// reset textarea rows/cols
			textarea.cols = textarea.rows = 1;
		}
	};

	// detect all changes to the textarea,
	// including keyboard input, cut/copy/paste, drag & drop, etc
	if( textarea.addEventListener ){
		// standards browsers: oninput event
		textarea.addEventListener( "input", api.update, false );
	} else {
		// MSIE: detect changes to the 'value' property
		textarea.attachEvent( "onpropertychange",
			function(e){
				if( e.propertyName.toLowerCase() === 'value' ){
					api.update();
				}
			}
		);
	}
	// initial highlighting
	api.update();

	return api;
};


},{}],2:[function(require,module,exports){
/* Parser.js
 * written by Colin Kuebler 2012
 * Part of LDT, dual licensed under GPLv3 and MIT
 * Generates a tokenizer from regular expressions for TextareaDecorator
 */

module.exports = function Parser( rules, i ){
	/* INIT */
	var api = this;

	// variables used internally
	var i = i ? 'i' : '';
	var parseRE = null;
	var ruleSrc = [];
	var ruleMap = {};

	api.add = function( rules ){
		for( var rule in rules ){
			var s = rules[rule].source;
			ruleSrc.push( s );
			ruleMap[rule] = new RegExp('^('+s+')$', i );
		}
		parseRE = new RegExp( ruleSrc.join('|'), 'g'+i );
	};
	api.tokenize = function(input){
		return input.match(parseRE);
	};
	api.identify = function(token){
		for( var rule in ruleMap ){
			if( ruleMap[rule].test(token) ){
				return rule;
			}
		}
	};

	api.add( rules );

	return api;
};


},{}],3:[function(require,module,exports){
document.addEventListener("DOMContentLoaded", function() {

	var Shittifier = require("./shittifier.js");
	var LDTParser = require("./LDT/lib/parser.js");
	var LDTTextareaDecorator = require("./LDT/lib/TextareaDecorator.js");

	var shittifier = new Shittifier();

	var settings = {
		em: 0,
		parser: {
			whitespace: /\s+/,
			comment: /\/\*([^\*]|\*[^\/])*(\*\/?)?|(\/\/|#)[^\r\n]*/,
			string: /"(\\.|[^"\r\n])*"?|'(\\.|[^'\r\n])*'?/,
			number: /0x[\dA-Fa-f]+|-?(\d+\.?\d*|\.\d+)/,
			keyword: /(and|as|case|catch|class|const|def|delete|die|do|else|elseif|esac|exit|extends|false|fi|finally|for|foreach|function|global|if|new|null|or|private|protected|public|published|resource|return|self|static|struct|switch|then|this|throw|true|try|var|void|while|xor)(?!\w|=)/,
			variable: /[\$\%\@](\->|\w)+(?!\w)|\${\w*}?/,
			define: /[$A-Z_a-z0-9]+/,
			op: /[\+\-\*\/=<>!]=?|[\(\)\{\}\[\]\.\|]/,
			other: /\S+/,
		}
	};

	var input, inputElement = this.querySelector("#in");
	var output, outputElement = this.querySelector("#out");
	var actionElement = this.querySelector("#action");

	var onActionClick = function (e) {

		var shittifierFunctions = shittifier.getFunctions();
		for (var groupname in shittifierFunctions) {
			if (shittifierFunctions.hasOwnProperty(groupname)) {

				var group = shittifierFunctions[groupname];
				group.map(function (fnName,i) {
					if ( !document.getElementById(groupname+"."+fnName).checked ){
						delete group[i];
					}
				});
			}
		}
		shittifier.setFunctions( shittifierFunctions );

		input = inputElement.value;
		output = shittifier.shittify(input);
		outputElement.value = output;

		onOutputChange.call();
	};

	var onInputChange = function (e) {

		decoratorIn.update();
		Array.map.call(null, document.querySelectorAll(".ldt .whitespace, .ldt .comment"), convertWhitespace);

		setTimeout(function () {
			inputElement.scrollTop = 0;
			inputElement.scrollLeft = 0;
		}, 10);
	};

	var onOutputChange = function (e) {

		decoratorOut.update();
		Array.map.call(null, document.querySelectorAll(".ldt .whitespace, .ldt .comment"), convertWhitespace);
	};

	var convertWhitespace = function (el) {

		if ( el.querySelector(".space, .tab") ) return;

		el.innerHTML = el.innerHTML.replace(/ /g, "<span class='space'> </span>");
		el.innerHTML = el.innerHTML.replace(/\t/g, function (m) {
			return "<span class='tab'>"+m+"</span>";
		});

		Array.map.call(null, el.querySelectorAll(".tab"), function(tab) {

			var chars = Math.round(tab.offsetWidth/settings.em);
			var html = "";
			for (var i = 0; i < chars; i++) {
				html += " ";
			}
			tab.innerHTML = html;
		});
	};

	var getEm = function (el) {

		var em = 0;
		var span = document.createElement("SPAN");
		span.innerHTML = "m";
		span.style.fontFamily = "monospace";
		el.appendChild(span);
		em = span.offsetWidth;
		el.removeChild(span);

		return em;
	};

	var buildOptionsDom = function () {
		
		var shittifierFunctions = shittifier.getFunctions();
		var optionsEl = document.getElementById("options");

		for (var groupname in shittifierFunctions) {
			if (shittifierFunctions.hasOwnProperty(groupname)) {

				var group = shittifierFunctions[groupname];
				var groupEl = document.createElement("div");
				var groupElLabel = document.createElement("div");
					groupElLabel.textContent = groupname;
					groupEl.appendChild(groupElLabel);
					groupEl.setAttribute("id",groupname);
					groupEl.setAttribute("class","option-group");

				group.map(function (fnName) {
					var fnContainer = document.createElement("div");
					var fnEl = document.createElement("input");
					var fnElLabel = document.createElement("label");

					fnEl.setAttribute("type","checkbox");
					fnEl.setAttribute("id", groupname+"."+fnName);
					fnEl.setAttribute("checked", "checked");
					if ( fnName == "removeBlockComment" ){
						fnEl.setAttribute("disabled","")
					}
					fnEl.checked = true;
					fnElLabel.setAttribute("for", groupname+"."+fnName);
					fnElLabel.textContent = fnName.replace(/([a-z])([A-Z])/g, function(m,$1,$2) {
						return $1 + " " + $2.toLowerCase();
					});

					fnContainer.appendChild(fnEl);
					fnContainer.appendChild(fnElLabel);
					groupEl.appendChild(fnContainer);
				});
				optionsEl.appendChild(groupEl);
			}
		}
	};

	// initialize
	
	var parser = new LDTParser(settings.parser);
	var decoratorIn = new LDTTextareaDecorator( inputElement, parser );
	var decoratorOut = new LDTTextareaDecorator( outputElement, parser );

	settings.em = getEm( document.querySelector(".ldt") );

	Array.map.call(null, document.querySelectorAll(".ldt .whitespace, .ldt .comment"), convertWhitespace);

	buildOptionsDom();

	actionElement.addEventListener("click", onActionClick);
	inputElement.addEventListener("input", onInputChange);
	outputElement.addEventListener("input", onOutputChange);

	inputElement.focus();
});

},{"./LDT/lib/TextareaDecorator.js":1,"./LDT/lib/parser.js":2,"./shittifier.js":9}],4:[function(require,module,exports){
/* eslint-disable guard-for-in */
'use strict';
var repeating = require('repeating');

// detect either spaces or tabs but not both to properly handle tabs
// for indentation and spaces for alignment
var INDENT_RE = /^(?:( )+|\t+)/;

function getMostUsed(indents) {
	var result = 0;
	var maxUsed = 0;
	var maxWeight = 0;

	for (var n in indents) {
		var indent = indents[n];
		var u = indent[0];
		var w = indent[1];

		if (u > maxUsed || u === maxUsed && w > maxWeight) {
			maxUsed = u;
			maxWeight = w;
			result = Number(n);
		}
	}

	return result;
}

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	// used to see if tabs or spaces are the most used
	var tabs = 0;
	var spaces = 0;

	// remember the size of previous line's indentation
	var prev = 0;

	// remember how many indents/unindents as occurred for a given size
	// and how much lines follow a given indentation
	//
	// indents = {
	//    3: [1, 0],
	//    4: [1, 5],
	//    5: [1, 0],
	//   12: [1, 0],
	// }
	var indents = {};

	// pointer to the array of last used indent
	var current;

	// whether the last action was an indent (opposed to an unindent)
	var isIndent;

	str.split(/\n/g).forEach(function (line) {
		if (!line) {
			// ignore empty lines
			return;
		}

		var indent;
		var matches = line.match(INDENT_RE);

		if (!matches) {
			indent = 0;
		} else {
			indent = matches[0].length;

			if (matches[1]) {
				spaces++;
			} else {
				tabs++;
			}
		}

		var diff = indent - prev;
		prev = indent;

		if (diff) {
			// an indent or unindent has been detected

			isIndent = diff > 0;

			current = indents[isIndent ? diff : -diff];

			if (current) {
				current[0]++;
			} else {
				current = indents[diff] = [1, 0];
			}
		} else if (current) {
			// if the last action was an indent, increment the weight
			current[1] += Number(isIndent);
		}
	});

	var amount = getMostUsed(indents);

	var type;
	var actual;
	if (!amount) {
		type = null;
		actual = '';
	} else if (spaces >= tabs) {
		type = 'space';
		actual = repeating(' ', amount);
	} else {
		type = 'tab';
		actual = repeating('\t', amount);
	}

	return {
		amount: amount,
		type: type,
		indent: actual
	};
};

},{"repeating":5}],5:[function(require,module,exports){
'use strict';
var isFinite = require('is-finite');

module.exports = function (str, n) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected `input` to be a string');
	}

	if (n < 0 || !isFinite(n)) {
		throw new TypeError('Expected `count` to be a positive finite number');
	}

	var ret = '';

	do {
		if (n & 1) {
			ret += str;
		}

		str += str;
	} while ((n >>= 1));

	return ret;
};

},{"is-finite":6}],6:[function(require,module,exports){
'use strict';
var numberIsNan = require('number-is-nan');

module.exports = Number.isFinite || function (val) {
	return !(typeof val !== 'number' || numberIsNan(val) || val === Infinity || val === -Infinity);
};

},{"number-is-nan":7}],7:[function(require,module,exports){
'use strict';
module.exports = Number.isNaN || function (x) {
	return x !== x;
};

},{}],8:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],9:[function(require,module,exports){
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
},{"./node_modules/detect-indent/index.js":4,"./node_modules/escape-string-regexp":8}]},{},[3]);
