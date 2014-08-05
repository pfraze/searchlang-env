
var SlangFormPrototype = Object.create(HTMLElement.prototype);

SlangFormPrototype.createdCallback = function() {
	// Setup attributes
	if (!this.hasAttribute('method')) {
		this.setAttribute('method', 'POST');
	}
	this.isToplevel = (web.util.findParentNode.byTag(this.parentNode, 'SLANG-FORM') === null);

	// Construct DOM
	this.innerHTML = [
		'<div class="slang-form-title">' + (this.getAttribute('title') || '') + '</div>',
		'<div class="slang-form-body">' + this.innerHTML + '</div>',
		((this.isToplevel) ?
			'<div class="slang-form-ctrls"><button>' + this.getAttribute('method') + '</button><button>Close</button></div>'
			: ''
		)
	].join('');

	// Add event handlers
	if (this.isToplevel) {
		this.lastChild.firstChild.addEventListener('click', onSubmitSlangform.bind(this));
		this.lastChild.lastChild.addEventListener('click', onCloseSlangform.bind(this));
		this.addEventListener('keyup', onKeyup.bind(this));
	}
};

function onKeyup(e) {
	// Submit on ctrl-enter
	if (e.keyCode == 13 && e.ctrlKey) {
		e.preventDefault();
		onSubmitSlangform.call(this);
	}
}

function onSubmitSlangform() {
	alert(this.getAttribute('method'));
}

function onCloseSlangform() {
	this.parentNode.removeChild(this);
}

module.exports = {
	register: function() {
		document.registerElement('slang-form', {
			prototype: SlangFormPrototype
		});
	}
};