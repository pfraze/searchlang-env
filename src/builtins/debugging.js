
web.createServer(function(req, res) {
	res.link('/', { rel: 'self searchlang.org/exe service', title: 'Debug Service', keywords: 'test' });
	if (req.method == 'POST') {
		document.querySelector('#playground').innerHTML = 'Yep';
	}
	res.s204('No content').end();
}).listen({ local: 'debug' });