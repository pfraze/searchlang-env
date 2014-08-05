
var SlangSearchPrototype = Object.create(HTMLElement.prototype);

SlangSearchPrototype.createdCallback = function() {
	var isMultiline = this.hasAttribute('multiline');
	// Iterate child forms
	var forms = this.querySelectorAll('slang-form');
	if (forms.length > 0) {
		// Add inputs before each form
		for (var i=0; i < forms.length; i++) {
			if (forms[i].parentNode == this) {
				this.insertBefore(createSearchInput(forms[i].getAttribute('query')), forms[i]);
			}
		}
		// Add a tailing search
		if (isMultiline) {
			this.appendChild(createSearchInput());
		}
	} else {
		// Add input
		this.appendChild(createSearchInput());
	}
};

function createSearchInput(value) {
	var input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.setAttribute('value', value || '');
	input.addEventListener('keyup', onSearchInputKeyup);
	return input;
}

function onSearchInputKeyup(e) {
	// Submit-on-enter
	if (e.keyCode == 13 && !e.ctrlKey) {
		e.preventDefault();
		alert(e.target.value); // :TODO:
	}
}

module.exports = {
	register: function() {
		document.registerElement('slang-search', {
			prototype: SlangSearchPrototype
		});
	}
};