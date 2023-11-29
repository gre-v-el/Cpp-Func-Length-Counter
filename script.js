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

$('#file-input').on('change', function(evt) {
	let files = evt.target.files;

	$("#results").empty();

	for(let file of files) {
		let reader = new FileReader();
		
		reader.onload = e => {
			let functions = scanFunctions(e.target.result);
			displayProgram(file.name, functions);
		}
		reader.onerror = e => logError(e);
		
		reader.readAsText(file);
	}
});

function displayProgram(name, functions) {
	let file_div = $("<details>").addClass("file");

	let file_name = $("<summary>");
	file_name.append(`<span class="func-name">${name}</span>`);
	file_div.append(file_name);

	let good = 0;
	for(let funct of functions) {
		let function_div = $("<details>");
		if(funct.bytes > 555) {
			function_div.addClass("bad");
		}
		else {
			function_div.addClass("good");
			good += 1;
		}

		let function_name = $("<summary>");
		function_name.append(`<span class="func-name">${funct.name}</span>`);
		function_name.append(`<span class="func-bytes">${funct.bytes}B / 555B</span>`);
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

			if(text.charAt(j) == ")") {
				while(text.charAt(j) != "(" && j > 0) j -= 1;
				while(/\s/.test(text.charAt(j)) && j > 0) j -= 1;
	
				if(j > 0) {
					let end = j;
					let start = j-1;
	
					while(!/\s/.test(text.charAt(start - 1)) && start > 1) start -= 1;
					
					let resp = handleFunction(text, i);

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
	let j = index+1;
	let indents = 0;

	while(!(text.charAt(j) == "}" && indents == 0) && j < text.length) {
		if(text.charAt(j) == "{") indents += 1;
		if(text.charAt(j) == "}") indents -= 1;
		j ++;
	}

	let function_text = text.substring(index, j+1);

	let function_body_html = "";
	let chars = 0;

	let in_span = false;
	for(let i = 0; i < function_text.length; i ++) {
		let char = function_text.charAt(i);

		// if(i > 0 && char == "/" && text.charAt(i-1) == "/") {
		// 	while(i < text.length && text.charAt(i) != "\n") { i+=1; }
		// 	i+=1;
		// }
		// if(i > 0 && char == "*" && text.charAt(i-1) == "/") {
		// 	while(i < text.length && text.charAt(i) != "/" || text.charAt(i-1) != "*") { i+=1; }
		// 	i+=1;
		// }

		if(/\s/.test(char) && in_span || i >= function_text.length-1) {
			function_body_html += "</span>"
			in_span = false;
		} 
		else if(!/\s/.test(char) && !in_span && i > 0) {
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