var Context = require('./context');

// Searchlang executor
// ===================
var Executor = { programAST: null, position: null };
module.exports = Executor;

// Run a parsed program
Executor.exec = function(programAST) {
	// Reset the global context
	Context.reset(); // should only have builtins at start

	// Setup queue
	Executor.programAST = programAST;
	Executor.position = 0;

	// Run each statement in series, returning a broken promise if any respond with failure
	return execNext();
};

// Queue management
function getCurrent() {
	return Executor.programAST.children[Executor.position];
}
function advance() {
	Executor.position++;
}
function execNext() {
	// Fetch the next root expression
	var expr = getCurrent();
	if (!expr) {
		// done
		return web.promise(true);
	}

	// Skip label expression-trees (they dont execute)
	if (expr.label) {
		advance();
		return execNext();
	}

	// Find out about the root expression of this expr-tree
	return web.promise(resolveExpr(expr)).then(function(link) {
		// Now run this expr-tree
		return execExprTree(expr);
	}).then(function() {
		// Move to next root expression
		advance();
		return execNext();
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

function execExprTree(expr) {
	// Make sure we have a link
	if (!expr.link) {
		if (expr.url) {
			expr.link = { href: expr.url };
		} else {
			throw "No matching endpoints found for this line.";
		}
	}

	// Check link type
	var isExecutable = web.queryLink(expr.link, { rel: 'searchlang.org/exe' });
	if (isExecutable) {
		// Resolve the full tree
		var url;
		return walkExprTree(expr, resolveExpr)
			.then(function(links) {
				console.log(links);
				// Send exec request
				url = buildExprUrl(expr);
				return web.postJson(url, links);
			})
			.then(function(res) {
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

// Utility to run a function on each node in a tree
// - any failed nodes fails the entire walk
function walkExprTree(root, func) {
	if (!root.children) return web.promise(false);
	var promises = root.children.map(function(expr) {
		return walkExprTree(expr, func).then(function(children) {
			return web.promise(func(expr)).then(function(res) {
				if (children) {
					res.children = children;
				}
				return res;
			});
		});
	});
	return web.promise.all(promises);
}