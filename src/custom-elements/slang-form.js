
var SlangFormPrototype = Object.create(HTMLElement.prototype);

SlangFormPrototype.createdCallback = function() {
	// Construct DOM
	this.innerHTML = [
		'<div class="slang-form-title">',
			(this.getAttribute('title') || ''),
			'<a href="#" title="Remove">&times;</a>',
		'</div>',
		'<div class="slang-form-body">' + this.innerHTML + '</div>'
	].join('');

	// Add event listeners
	this.firstChild.lastChild.addEventListener('click', onClickRemove.bind(this));
};

function onClickRemove(e) {
	e.preventDefault();
	this.parentNode.removeChild(this);
}

module.exports = {
	register: function() {
		document.registerElement('slang-form', {
			prototype: SlangFormPrototype
		});
	}
};