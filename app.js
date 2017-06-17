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
