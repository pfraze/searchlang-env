var Parser = require('./parser');
var Executor = require('./executor');
var Context = require('./context');
require('./builtins');

// Env Setup
// =========
web.promise.bundle([
	Context.importBuiltin('local://document'),
	Context.importBuiltin('local://debug')
]).then(Context.reset.bind(Context));

// GUI behaviors
// =============
var $$ = document.querySelector.bind(document);
var $ = function(selector) {
	return Array.prototype.slice.call(document.querySelectorAll(selector));
};
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
// enter execute
$$('.editor-program').addEventListener('keyup', function(e) {
	if (e.target.parentNode == $$('.editor-program') && e.target.tagName == 'INPUT' && e.keyCode == 13) {
		e.preventDefault();
		executeLine(e.target.value);
	}
});

// GUI setup
// =========
$$('.editor-program').innerHTML = '<input type="search" />';

// Execution
// =========
// run full execution process
function executeLine(lineText) {
	// Parse program
	var programAST = Parser.parse(lineText);
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