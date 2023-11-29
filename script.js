$(document).ready(function() {
	
	$('#file-input').on('change', function(evt) {
		let files = evt.target.files;

		$("#results").empty();

		for(let file of files) {
			let reader = new FileReader();
			
			reader.onload = e => analyseProgram(file.name, e.target.result);
			reader.onerror = e => logError(e);
			
			reader.readAsText(file);
		}
	});
});

function analyseProgram(name, text) {
	let file_div = $("<details>").addClass("file");

	let file_name = $("<summary>").html(name);
	file_div.append(file_name);

	scanFunctions(text, file_div);

	$("#results").append(file_div);
}

function scanFunctions(text, file_div) {

	for(let i = 0; i < text.length; i ++) {
		let char = text.charAt(i);

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
					
					i = handleFunction(text.substring(start, end), file_div, text, i);
				}
			}
		}
	}
}

function handleFunction(name, file_div, text, index) {
	let j = index+1;
	let indents = 0;
	while(!(text.charAt(j) == "}" && indents == 0) && j < text.length) {
		if(text.charAt(j) == "{") indents += 1;
		if(text.charAt(j) == "}") indents -= 1;
		j ++;
	}

	let function_text = text.substring(index, j+1);

	let function_div = $("<details>");

	let function_name = $("<summary>").html(name);
	function_div.append(function_name);

	let function_body = $("<pre>").html(function_text);
	function_div.append(function_body);

	file_div.append(function_div);

	return j;
}

function logError(error) {
	console.log(error);
}