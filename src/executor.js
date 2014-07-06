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
		return true;
	}

	// Find out about the root expression of this expr-tree
	var link = resolveExpr(expr);
	if (!link) {
		// Must be a label expression-tree, skip
		// (a failed resolution would be a broken promise)
		advance();
		return execNext();
	}

	// Wait...
	return web.promise(link).then(function(link) {
		// Attach the resolved link to the expression-object
		expr.link = link;

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
	return link;
}

function execExprTree(expr) {
	// Make sure we have a link
	if (!expr.link) {
		if (expr.url) {
			expr.link = { href: expr.url };
		} else {
			console.warn('(devnote) Interpretter program flow issue - this condition should have been handled in prior code');
			throw "No matching endpoints found for this line.";
		}
	}

	// Check link type
	var isExecutable = web.queryLink(expr.link, { rel: 'searchlang.org/exe' });
	if (isExecutable) {
		// Resolve the full tree
		return walkExprTree(expr, resolveExpr)
			.then(function() {
				// Send exec request
				return web.postJson(buildExprUrl(expr), expr);
			})
			.then(function(res) {
				// Add response links to the context
				Context.import(res.links);
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

// Utility to run a function on each node in a tree
// - any failed nodes fails the entire walk
function walkExprTree(root, func) {
	if (!root.children) return web.promise(true);
	var promises = root.children.map(function(expr) {
		return walkExprTree(expr).then(function() {
			return func(expr);
		});
	});
	return web.promise.all(promises);
}