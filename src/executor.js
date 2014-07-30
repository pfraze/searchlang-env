var Context = require('./context');

// Searchlang executor
// ===================
var Executor = { };
module.exports = Executor;

// Run a parsed program
Executor.exec = function(expr) {
	// Reset the global context
	Context.reset(); // should only have builtins at start
	// :TODO: ^ no longer correct

	// Find out about the root expression of this expr-tree
	return web.promise(resolveExpr(expr)).then(function(link) {
		// Now run this expr-tree
		return execExpr(expr);
	});
}

function resolveExpr(expr) {
	// Resolve according to expression type
	var link;
	if (expr.link) {
		// Already resolved
		return expr.link;
	} else if (expr.url) {
		// Lookup, fetch if not found
		link = Context.find([{ href: expr.url }]);
		if (!link) {
			link = Context.fetch(expr.url);
		}
	// } else if (expr.label) { <-- no resolve step for label-blocks at the toplevel
	} else if (expr.terms) {
		// Search
		link = Context.find(expr.terms);
	}

	// Attach the resolved link to the expression-object
	return web.promise(link).then(function(link) {
		expr.link = JSON.parse(JSON.stringify(link));
		return expr.link;
	});
}

function execExpr(expr) {
	// Make sure we have a link
	if (!expr.link) {
		if (expr.url) {
			expr.link = { href: expr.url };
		} else {
			throw "No matching endpoints found for this line.";
		}
	}

	// Build url
	var url = buildExprUrl(expr);

	// Check link type
	var isExecutable = web.queryLink(expr.link, { rel: 'searchlang.org/exe' });
	if (isExecutable) {
		// Send exec request
		return web.postJson(url).then(function(res) {
			// Add response links to the context
			Context.import(url, res.links);
			return true;
		});
	} else {
		// Just import its links, if we havent already
		if (Context.hasImported(expr.link.href)) {
			return true;
		}
		return Context.import(expr.link.href);
	}
}

// Utility to produce a final URL for the expression
function buildExprUrl(expr) {
	// Build a template context from the search attr/values
	var ctx = {};
	if (expr.terms) {
		for (var i=0; i < expr.terms.length; i++) {
			if (Array.isArray(expr.terms[i])) {
				ctx[expr.terms[i][0]] = expr.terms[i][1];
			}
		}
	}

	return web.renderUri(expr.link.href, ctx);
}
