// Searchlang parser
// =================
/*
Grammar
line           := expr | comment
expr           := indentation ( label-expr | url-expr | search-exp ) '\n'
indentation    := /\s* /
label-expr     := /[A-Z_][A-Z_0-9]* /
url-expr       := /[^\s]+.[^\s]+/
search-expr    := search-subexpr | ( ( label-expr | url-expr | search-subexpr ) ( '>' search-subexpr )+ )
search-subexpr := term* ( attribute: values )*
attribute      := term
values         := term | string | '(' search-expr+ ')'
term           := /[A-z0-9_-]+/
string         := '"' /[^"]+/ '"'
comment        := sl-comment | ml-comment
sl-comment     := '--' /[^\n]* / '\n'
ml-comment     := '---' /^(---)/ '---'
*/

// Parser
// ======
var Parser = { buffer: null, trash: null, buffer_position: 0, buffer_size: 0, logging: false };
module.exports = Parser;

// Main API
// - Generates an array of { terms:, label:, url:, subnav:, children: } expression objects
//  - `terms`: array, a search-subexpr, consists of...
//    - string: a search term
//    - [string, string]: an attribute/value
//    - [string, object]: an attribute/subsearch
//  - `label`: string, a label-expr
//  - `url`: string, a url-expr
//  - `subnav`: object of { terms:, subnav: }, a sub navigation
//  - `children`: array of child { terms:, label:, url:, subnav:, children: } expression objects
//  - type of the expression object depends on structure:
//    - `terms` present, search-expr
//    - `label` present, label-expr
//    - `url` present, url-expr
Parser.parse = function(buffer) {
	Parser.buffer = buffer;
	Parser.trash = '';
	Parser.buffer_position = 0;
	Parser.buffer_size = buffer.length;
	Parser.log = ((Parser.logging) ? (function() { console.log.apply(console,arguments); }) : (function() {}));

	var expr_tree = { children: [] };
	try { Parser.readExpressionTree(expr_tree, 0); }
	catch (e) {
		return { error: e };
	}

	return expr_tree;
};

Parser.moveBuffer = function(dist) {
	Parser.trash += Parser.buffer.substring(0, dist);
	Parser.buffer = Parser.buffer.substring(dist);
	Parser.buffer_position += dist;
	Parser.log('+', dist);
};

Parser.isFinished = function() {
	if (Parser.buffer_position >= Parser.buffer_size || !/\S/.test(Parser.buffer))
		return true;
	return false;
};

Parser.readExpressionTree = function(parent, expected_indent) {
	while (true) {
		var indent = Parser.measureIndent();

		// Empty line?
		if (indent === false) {
			if (Parser.isFinished())
				break;
			// Skip to next line
			Parser.moveBuffer(Parser.buffer.indexOf('\n') + 1);
			continue;
		}
		// End of this expression level?
		else if (indent < expected_indent) {
			break;
		}
		// Part of this expression level?
		else if (indent == expected_indent) {
			var expr = Parser.readExpression();
			if (expr)
				parent.children.push(expr);
		}
		// Part of a new child expression level?
		else {
			var new_parent = parent.children[parent.children.length - 1];
			if (!new_parent) {
				throw Parser.errorMsg('Bad indentation (the first line can not be indented)');
			}
			if (!new_parent.children) {
				new_parent.children = [];
			}
			Parser.readExpressionTree(new_parent, indent);
		}
	}
};

var indentRegex = /^([ ]*)\S/;
Parser.measureIndent = function() {
	var match = indentRegex.exec(Parser.buffer);
	return (match) ? match[1].length : false;
};

var exprRegex = /^[ ]*(.*)(\n|$)/;
var labelRegex = /^[A-Z_][A-Z_0-9]*/;
var urlRegex = /^[^\s]+\.[^\s]+/;
Parser.readExpression = function() {
	// expr := indentation ( label-expr | url-expr | search-exp ) '\n'
	// ===============================================================

	// Read to newline
	var match = exprRegex.exec(Parser.buffer);
	if (!match) return false;
	var expr = match[1];

	// Categorize
	var expr_obj;
	if (labelRegex.test(expr)) {
		expr_obj = { label: expr };
		Parser.moveBuffer(match[0].length);
	} else if (urlRegex.test(expr)) {
		expr_obj = { url: expr };
		Parser.moveBuffer(match[0].length);
	} else {
		expr_obj = { terms: Parser.readSearchSubexpr() };
		// dont need to move buffer, ^ will do so
	}

	// :TODO: subnavigations

	return expr_obj;
};

Parser.readSearchSubexpr = function() {
	// search-subexpr := term* ( attribute: values )*
	// attribute      := term
	// values         := term | string | '(' search-expr+ ')'
	// ===============================================================
	var terms = [];
	while (true) {
		var term = Parser.readTerm() || Parser.readString();
		if (!term) {
			// Skip newline
			Parser.moveBuffer(1);
			break;
		}

		// An attribute/value?
		if (term.charAt(term.length - 1) == ':') {
			var value = Parser.readTerm() || Parser.readString();
			if (!value)
				value = '';
			// :TODO: subsearches
			terms.push([term, value]);
		}
		// A term
		else {
			terms.push(term);
		}
	}
	return terms;
};

var termRegex = /^[ ]*([A-z0-9_-]+:?)/;
Parser.readTerm = function() {
	// term := /[A-z0-9_-]+/
	// =====================
	var match = termRegex.exec(Parser.buffer);
	if (!match) return false;
	Parser.moveBuffer(match[0].length);
	return match[1];
};

var stringRegex = /^[ ]*\"([^\"]*)\"/;
Parser.readString = function() {
	// string := '"' /[^"]+/ '"'
	// =========================
	var match = stringRegex.exec(Parser.buffer);
	if (!match) { return false; }
	Parser.moveBuffer(match[0].length);
	return replaceEscapeCodes(match[1]);
};

Parser.readAgent = function() {
	// agent = token '>' .
	// ===================
	// read non spaces...
	var match = /^\s*(\S*)/.exec(this.buffer);
	if (match && />/.test(match[1])) { // check for the identifying angle bracket
		var match_parts = match[1].split('>');
		var agent = match_parts[0];
		this.moveBuffer(agent.length+1);
		this.log('Read agent:', agent);
		return agent;
	}
	return false;
};

Parser.readRequest = function() {
	// request = [ [ method ] uri ] { header-flag } [ body ] .
	// =======================================================
	var targetUri = false, method = false, headers = {}, body, start_pos;
	start_pos = this.buffer_position;
	// Read till no more request features
	while (true) {
		var headerSwitch = this.readHeaderSwitch();
		if (headerSwitch) {
			headers[headerSwitch.key.toLowerCase()] = headerSwitch.value;
			continue;
		}
		body = this.readBody();
		if (body) {
			// body ends the command segment
			break;
		}
		var nstoken = this.readNSToken();
		if (nstoken) {
			// no uri, assume that's what it is
			if (!targetUri) { targetUri = nstoken; }
			else if (!method) {
				// no method, the first item was actually the method and this is the uri
				method = targetUri;
				targetUri = nstoken;
			} else {
				throw this.errorMsg("Unexpected token '" + nstoken + "'");
			}
			continue;
		}
		break;
	}
	// Return a request if we got a URI or body; otherwise, no match
	if (!targetUri && !body) { return false; }
	var request = { headers: headers };
	request.method = method;
	request.url = targetUri;
	if (body) { request.body = body; }
	this.log(request);
	return request;
};

Parser.readContentType = function() {
	// content-type = "[" [ token | string ] "]" .
	// ===========================================
	var match;

	// match opening bracket
	match = /^\s*\[\s*/.exec(this.buffer);
	if (!match) { return false; }
	this.moveBuffer(match[0].length);

	// read content-type
	match = /^[\w\/\*.0-9\+]+/.exec(this.buffer);
	var contentType = (!!match) ? match[0] : null;
	if (contentType)  { this.moveBuffer(contentType.length); }

	// match closing bracket
	match = /^\s*\]\s*/.exec(this.buffer);
	if (!match) { throw this.errorMsg("Closing bracket ']' expected after content-type"); }
	this.moveBuffer(match[0].length);

	this.log('Read mimetype:', contentType);
	return contentType;
};

Parser.readHeaderSwitch = function() {
	// header-flag = "-" header-key "=" header-value .
	// ===============================================
	var match, headerKey, headerValue;

	// match switch
	match = /^(\s*-)[^-]/.exec(this.buffer);
	if (!match) { return false; }
	this.moveBuffer(match[1].length);

	// match key
	headerKey = this.readToken();
	if (!headerKey) { throw this.errorMsg("Header name expected after '-' switch."); }

	// match '='
	match = /^\s*\=/.exec(this.buffer);
	if (match) {
		// match value
		this.moveBuffer(match[0].length);
		if (/^\s/.test(this.buffer)) { throw this.errorMsg("Value expected for -" + headerKey); }
		headerValue = this.readString() || this.readNSToken();
		if (!headerValue) { throw this.errorMsg("Value expected for -" + headerKey); }
	} else {
		// default value to `true`
		headerValue = true;
	}

	var header = { key:headerKey, value:headerValue };
	this.log('Read header:', header);
	return header;
};

Parser.readBody = function() {
	// body = '--' [ string | { ns-token } ] [ '[' | EOF ] .
	// =====================================================
	var match, body;

	// match switch
	match = /^\s*--/.exec(this.buffer);
	if (!match) { return false; }
	this.moveBuffer(match[0].length);

	// match string
	body = this.readString();
	if (!body) {
		// not a string, read till '[' or EOF
		match = /([^\[]*)/.exec(this.buffer);
		if (!match) { body = ''; }
		body = match[1].trim();
		this.moveBuffer(match[0].length);
	}

	this.log('Read body:', body);
	return body;
};

Parser.errorMsg = function(msg) {
	return msg+'\n'+this.trash.slice(-15)+'<span class=text-danger>&bull;</span>'+this.buffer.slice(0,15);
};

var bslash_regex = /(\\)(.)/g;
var escape_codes = { b: '\b', t: '\t', n: '\n', v: '\v', f: '\f', r: '\r', ' ': ' ', '"': '"', "'": "'", '\\': '\\' };
function replaceEscapeCodes(str) {
	return str.replace(bslash_regex, function(match, a, b) {
		var code = escape_codes[b];
		if (!code) throw "Invalid character sequence: '\\"+b+"'";
		return code;
	});
}