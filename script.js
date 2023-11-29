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
	let indents = 0;
	let whole_text_index = 0;

	for(let line of text.split('\n')) {
				
		for (let i = 0; i < line.length; i ++) {
			let char = line.charAt(i);

			if(char == "{") indents += 1;
			if(char == "}") indents -= 1;

			if(char == "{" && indents == 1) {
				let j = whole_text_index;

				while(text.charAt(j) != ")" && j > 0) j -= 1;
				while(text.charAt(j) != "(" && j > 0) j -= 1;
				while(/\s/.test(text.charAt(j)) && j > 0) j -= 1;

				if(j > 0) {
					let end = j;
					let start = j-1;
	
					while(!/\s/.test(text.charAt(start - 1)) && start > 1) start -= 1;
					
					handleFunction(text.substring(start, end), file_div, text, whole_text_index);
				} 

			}
			whole_text_index += 1;
		}
		whole_text_index += 1;
	}
}

function handleFunction(name, file_div, text, index) {
	let function_div = $("<details>");
	let function_name = $("<summary>");
	function_div.append(function_name);

	let function_body = $("<pre>");
	function_div.append(function_body);
}

function logError(error) {

}