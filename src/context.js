// Searchlang global context manager
// =================================
var Context = { cache: null, imports: null, importsMap: null };
module.exports = Context;

// Imports management
function getImport(url) {
	return Context.imports[Context.importsMap[url]];
}

Context.reset = function() {
	// Clear all memory
	Context.cache = {};
	Context.imports = [];
	Context.importsMap = {};

	// Import builtins
	// :TODO:
};

Context.fetch = function(url) {
	// Check the cache
	if (url in Context.cache) {
		// Respond with self link
		return web.promise(Context.cache[url].get('self'));
	}
	// Run a head request
	return web.head(url)
		.then(function(res) {
			// Cache the response
			Context.cache[url] = res.links;

			// Respond with self link
			return Context.cache[url].get('self');
		});
};

Context.import = function(url) {
	if (Context.hasImported(url)) {
		return web.promise(getImport(url));
	}
	// Fetch the links
	return Context.fetch(url).then(function() {
		// Load from cache into active context
		var links = Context.cache[url];
		var i = (Context.imports.push(links) - 1);
		Context.importsMap[url] = i;
		return links;
	});
};

Context.hasImported = function(url) {
	return (url in Context.importsMap);
};

Context.find = function(terms) {
	// Search each import group in sequence
	var link;
	for (var i=0; i < Context.imports.length; i++) {
		link = findIn(Context.imports[i], terms);
		if (link)
			return link;
	}
	return false;
};

function findIn(links, terms) {
	for (var i=0; i < links.length; i++) {
		var link = links[i];

		// Stringify link for broad search
		if (!link.__stringified)
			link.__stringified = JSON.stringify(link).toLowerCase();

		if (doesLinkMatch(link, terms)) {
			return link;
		}
	}
	return false;
}

var uriTokenStart = '\\{([^\\}]*)[\\+\\#\\.\\/\\;\\?\\&]?';
var uriTokenEnd = '(\\,|\\})';
function doesLinkMatch(link, terms) {
	for (var j=0; j < terms.length; j++) {
		var term = terms[j];
		if (term.charAt) {
			// Broad search
			if (link.__stringified.indexOf(term.toLowerCase()) === -1) {
				return false;
			}
		} else {
			// Attribute/value search
			var attr  = term[0];
			var value = term[1];
			if (attr in link) {
				// Case-insensitive equality
				if (value.toLowerCase() !== link[attr].toLowerCase()) {
					return false;
				}
			} else {
				// Is the attribute in the href as a URI token?
				if (!RegExp(uriTokenStart+attr+uriTokenEnd,'i').test(link.href)) {
					return false;
				}
			}
		}
	}
	return true;
}