let entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;'
};

function escapeHtml (string) {
	return String(string).replace(/[&<>"'`=\/]/g, function (s) {
		return entityMap[s];
	});
}

let max_size = 555;
let all_cpps = [];

$('#max-size-input').on('keyup', function(evt) {
	max_size = $('#max-size-input').val();
	displayAll();
});

$('#file-input').on('change', async function(evt) {
	let files = evt.target.files;

	all_cpps = [];
	let promises = [];

	for(let file of files) {
		promises.push(
			new Promise((resolve) => {
				let reader = new FileReader();
				
				reader.onload = e => {
					let functions = scanFunctions(e.target.result);
					all_cpps.push({name: file.name, functs: functions});

					resolve();
				}
				reader.onerror = e => logError(e);
				
				reader.readAsText(file);
			})
		);
	}

	await Promise.all(promises);
	displayAll();
});

function displayAll() {
	$("#results").empty();

	all_cpps.sort((e1, e2) => e1.name.localeCompare(e2.name));

	for(let cpp of all_cpps) {
		displayProgram(cpp.name, cpp.functs);
	}
}

function displayProgram(name, functions) {
	let file_div = $("<details>").addClass("file");

	let file_name = $("<summary>");
	file_name.append(`<span class="func-name">${name}</span>`);
	file_div.append(file_name);

	let good = 0;
	for(let funct of functions) {
		let function_div = $("<details>");
		if(funct.bytes > max_size) {
			function_div.addClass("bad");
		}
		else {
			function_div.addClass("good");
			good += 1;
		}

		let function_name = $("<summary>");
		function_name.append(`<span class="func-name">${funct.name}</span>`);
		function_name.append(`<span class="func-bytes">${funct.bytes}B / ${max_size}B</span>`);
		function_div.append(function_name);

		let function_body = $("<pre>").html(funct.contents);
		function_div.append(function_body);

		file_div.append(function_div);
	}

	if(functions.length == 0) {
		file_div.append('<div class="empty">(no functions)</span>');
	}

	file_div.addClass(good == functions.length ? "good-outer" : "bad-outer");
	file_name.append(`<span class="func-bytes">${good} / ${functions.length}</span>`);


	$("#results").append(file_div);
}

function scanFunctions(text) {
	let functions = [];

	for(let i = 0; i < text.length; i ++) {
		let char = text.charAt(i);

		if(i > 0 && char == "/" && text.charAt(i-1) == "/") {
			while(i < text.length && text.charAt(i) != "\n") { i+=1; }
			i+=1;
		}
		if(i > 0 && char == "*" && text.charAt(i-1) == "/") {
			while(i < text.length && text.charAt(i) != "/" || text.charAt(i-1) != "*") { i+=1; }
			i+=1;
		}
		char = text.charAt(i);

		if(char == "{") {
			let j = i-1;

			while(/\s/.test(text.charAt(j)) && j > 0) j -= 1;

			let k = j;
			while(text.charAt(k) != "\n") {
				k --;
				if(text.charAt(k) == "/" && text.charAt(k-1) == "/") {
					j = k-2;
					break;
				}
			}

			while(/\s/.test(text.charAt(j)) && j > 0) j -= 1;

			if(text.charAt(j) == ")") {
				while(text.charAt(j) != "(" && j > 0) j -= 1;
				let line_begin = j;
	
				if(j > 0) {
					let end = j;
					let start = j-1;
	
					while(!/\s/.test(text.charAt(start - 1)) && start > 1) start -= 1;

					let resp = handleFunction(text, line_begin);

					i = resp.end;
					functions.push({
						name: text.substring(start, end),
						bytes: resp.chars,
						contents: resp.contents,
					});
				}
			}
		}
	}

	return functions;
}

function handleFunction(text, index) {
	let j = index;
	let indents = -1;

	while(!(text.charAt(j) == "}" && indents == 0) && j < text.length) {

		if(j < text.length - 1 && text.charAt(j) == "/" && text.charAt(j+1) == "/") {
			while(j < text.length && text.charAt(j) != "\n") { 
				j+=1;
			}
			continue;
		}
		if(j < text.length - 1 && text.charAt(j) == "/" && text.charAt(j+1) == "*") {
			while(j < text.length && text.charAt(j) != "/" || text.charAt(j-1) != "*") {
				j+=1; 
			}
			continue;
		}

		if(text.charAt(j) == "{") indents += 1;
		if(text.charAt(j) == "}") indents -= 1;
		j ++;
	}

	let function_text = text.substring(index, j+1);

	let function_body_html = "";
	let chars = 0;

	let in_span = false;
	let in_string = false;
	let in_char = false;
	for(let i = 0; i < function_text.length; i ++) {
		let char = function_text.charAt(i);

		if(char == "\"" && !in_string && !in_char) {
			in_string = true;
		}
		else if(char == "\"" && in_string && !in_char) {
			in_string = false;
		}
		
		if(char == "\'" && !in_string && !in_char) {
			in_char = true;
		}
		else if(char == "\'" && !in_string && in_char) {
			in_char = false;
		}

		if(i < function_text.length - 1 && char == "/" && function_text.charAt(i+1) == "/") {
			if(in_span) {
				in_span = false;
				function_body_html += "</span>";
			}

			while(i < function_text.length && function_text.charAt(i) != "\n") { 
				function_body_html += function_text.charAt(i);
				i+=1;
			}
			function_body_html += function_text.charAt(i);
			i+=1;
		}
		if(i < function_text.length - 1 && char == "/" && function_text.charAt(i+1) == "*") {
			if(in_span) {
				in_span = false;
				function_body_html += "</span>";
			}

			while(i < function_text.length && function_text.charAt(i) != "/" || function_text.charAt(i-1) != "*") {
				function_body_html += function_text.charAt(i);
				i+=1; 
			}
			function_body_html += function_text.charAt(i);
			i+=1;
		}
		char = function_text.charAt(i);

		if((/\s/.test(char) && !in_string && !in_char) && in_span || i >= function_text.length) {
			function_body_html += "</span>"
			in_span = false;
		}
		else if(!/\s/.test(char) && !in_span) {
			function_body_html += '<span class="code-highlight">'
			in_span = true;
		}

		if(in_span) chars += 1;

		function_body_html += char;
	}
	if(!in_span) {
		function_body_html += "</span>"
	}

	return {end: j, contents: function_body_html, chars: chars};
}

function logError(error) {
	console.log(error);
}



let deadline = new Date("Dec 10, 2023 23:59:59").getTime();

if(new Date().getTime() < deadline) {
	setCounter();
	setInterval(setCounter, 1000);
}

function setCounter() {
	let diff = Math.max(0, deadline - new Date().getTime());

	var days = Math.floor(diff / (1000 * 60 * 60 * 24));
	var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	var seconds = Math.floor((diff % (1000 * 60)) / 1000);

	$("#countdown").html(days + "d " + hours + "h "
	+ minutes + "m " + seconds + "s");
}