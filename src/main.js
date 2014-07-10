var Parser = require('./parser');
var Executor = require('./executor');
var Context = require('./context');
require('./builtins');

// Env Setup
// =========
Context.importBuiltin('#debug');

// GUI behaviors
// =============
var $$ = document.querySelector.bind(document);
var $ = function(selector) {
	return Array.prototype.slice.call(document.querySelectorAll(selector));
};
// textarea, behave.js
var editor = new Behave({
    textarea:  $$('.editor-textarea'),
    replaceTab: true,
    softTabs: true,
    tabSize: 2,
    autoOpen: false,
    overwrite: false,
    autoStrip: false,
    autoIndent: false,
    fence: false
});
// open/close toggle button
$('.btn-toggle-editor').forEach(function($btn) {
	$btn.addEventListener('click', function() {
		document.body.classList.toggle('mode-editoropen');
	});
});
// execute button
$('.btn-execute').forEach(function($btn) {
	$btn.addEventListener('click', function() {
		executeProgram($$('.editor-textarea').value);
	});
});
// ctrl+enter execute
$$('.editor-textarea').addEventListener('keyup', function(e) {
	if (e.keyCode == 13) {
		e.preventDefault();
		executeProgram($$('.editor-textarea').value);
	}
});

// Execution
// =========
// run full execution process
function executeProgram(programText) {
	// Parse program
	var programAST = Parser.parse(programText);
	if (programAST.error) {
		$$('#playground').innerHTML = '<pre class="parse-error">' + programAST.error + '</pre>';
		return;
	}

	// Begin execution
	$$('#playground').innerHTML = '';
	Executor.exec(programAST).always(function(out) {
		console.debug('Exec result:', out);
	});
}