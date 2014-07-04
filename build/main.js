(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Helpers
// =======
var $$ = document.querySelector.bind(document);
var $ = function(selector) {
	return Array.prototype.slice.call(document.querySelectorAll(selector));
};

// GUI behaviors
// =============
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

// Execution
// =========
// run full execution process
function executeProgram(programText) {
	$$('#playground').innerHTML = '<pre>'+programText+'</pre>';
}
},{}]},{},[1])