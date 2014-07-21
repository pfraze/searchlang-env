web.createServer(function(req, res) {
	switch (req.path) {
		case '/':
			return main(req, res);
		case '/paragraph':
			return paragraph(req, res);
		default:
			res.s404().end();
	}
}).listen({ local: 'document' });

function main(req, res) {
	res.link('/', { rel: 'self searchlang.org/exe', title: 'Document', keywords: 'page' });
	res.link('/paragraph', { rel: 'searchlang.org/html-element', title: 'Paragraph' });
	if (req.method == 'HEAD') { return res.s204().end(); }
	if (req.method != 'POST') {
		return res.s405().allow('HEAD, POST').end();
	}
	if (req.ContentType != 'application/json') {
		return res.s415('Only supports json').end();
	}
	req.buffer(function(program) {
		if (!Array.isArray(req.body)) {
			return res.s422('Must provide an array').end();
		}
		var ress_ = web.promise.bundle(req.body.map(function(link) { return web.get(link.href); }));
		ress_.always(function(ress) {
			ress.forEach(function(res) {
				document.getElementById('playground').innerHTML += res.body;
			});
			res.s204().end();
		});
	});
}

function paragraph(req, res) {
	res.link('/', { rel: 'up searchlang.org/exe', title: 'Document', keywords: 'page' });
	res.link('/paragraph', { rel: 'self searchlang.org/html-element', title: 'Paragraph' });
	if (req.method == 'HEAD') { return res.s204().end(); }
	if (req.method != 'GET') {
		return res.s405().allow('HEAD, GET').end();
	}
	return res.s200().html('<p>This is a paragraph.</p>').end();
}