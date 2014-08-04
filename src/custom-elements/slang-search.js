
var SlangSearchPrototype = Object.create(HTMLElement.prototype);

SlangSearchPrototype.createdCallback = function() {
	this.innerHTML = '<input type="text">';
};

module.exports = {
	register: function() {
		document.registerElement('slang-search', {
			prototype: SlangSearchPrototype
		});
	}
};