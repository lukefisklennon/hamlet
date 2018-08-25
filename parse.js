var fs = require("fs");
var JSDOM = require("jsdom").JSDOM;
var smartquotes = require("smartquotes");

function go(input) {
	input.innerHTML = smartquotes(input.innerHTML.replace(/--/g, "&ndash;").replace(/\[/g, "(<i>").replace(/\]/g, "</i>)"));
	var output = "";
	var elements = input.children;
	var lastLog = Date.now();
	var act = 0;
	var scene = 0;
	var line = 0;
	for (var i = 1; i < elements.length; i++) {
		var element = elements[i];
		var html = element.innerHTML;
		var tagName = element.tagName.toLowerCase();
		var tags = {
			h3: () => {
				var id;
				var tag = `h2`;
				if (html.indexOf("ACT") != -1) {
					tag = `h1`;
					act++;
					scene = 0;
					id = `${act}`;
				} else {
					scene++;
					line = 0;
					id = `${act}.${scene}`;
				}
				output += `<${tag} id="${id}">${html}<${tag}>`;
			},
			a: () => {
				output += `<h3>${element.children[0].innerHTML}</h3>`;
			},
			blockquote: () => {
				output += `<div class="dialogue">`
				for (var i = 0; i < element.children.length; i++) {
					var child = element.children[i];
					if (child.tagName == "A") {
						line++;
						output += `<div class="line" id="${act}.${scene}.${line}">${child.innerHTML.trim()}</div>`;
					} else if (child.tagName == "P") {
						if (child.children.length > 0) {
							output += `<div class="direction">${child.children[0].innerHTML}</div>`;
						}
					}
				}
				output += `</div>`;
			}
		}
		if (tagName in tags) tags[tagName]();
		if (Date.now() - lastLog > 150) {
			progress("Parsing... " + (Math.ceil((i / (elements.length - 1)) * 100) + "%"));
			lastLog = Date.now();
		}
	}
	progress("Parsing... done\n");
	output += `<link href="https://fonts.googleapis.com/css?family=Lora:400,400i,700" rel="stylesheet"><style>body{font-family:'Lora',serif;font-size:18px;}.dialogue{margin-left:20px;}.direction{margin-top:10px;margin-bottom:10px;font-style:italic;}</style>`;
	fs.writeFileSync(process.argv[3], output);
}

console.log("Loading " + process.argv[2] + "...");
JSDOM.fromFile(process.argv[2]).then(dom => {
	go(dom.window.document.body, new JSDOM().window.document.body);
});

function progress(string) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(string);
}
