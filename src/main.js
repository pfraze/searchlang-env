var $$ = document.querySelector.bind(document);
var $ = function(selector) {
	return Array.prototype.slice.call(document.querySelectorAll(selector));
};

// Editor behaviors
// ================
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