
var SlangPhrasePrototype = Object.create(HTMLElement.prototype);

SlangPhrasePrototype.createdCallback = function() {
	this.textContent = "I'm a slang-phrase with foo=" + this.getAttribute('foo') + "!";
};

module.exports = {
	register: function() {
		document.registerElement('slang-phrase', {
			prototype: SlangPhrasePrototype
		});
	}
};