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

// GUI setup
// =========
require('./custom-elements').registerAll();
$$('.editor-program').innerHTML = '<slang-search>test</slang-search><hr>' +
	'<slang-search><slang-form title="Form 1" query="foo">my foo prase<slang-search multiline><slang-form title="Form 1" query="foo">my foo prase</slang-form></slang-search></slang-form><slang-form title="Form 2" query="bar">my bar form</slang-form><hr>'+
	'<slang-form title="Multline" query=multi><slang-search multiline><slang-form>foo</slang-form><slang-form>bar</slang-form></slang-search></slang-form>';

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