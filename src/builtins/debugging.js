
web.createServer(function(req, res) {
	res.link('/', { rel: 'self searchlang.org/exe service', title: 'Debug Service', keywords: 'test' });
	res.link('local://debug2{?foo}', { rel: 'service', title: 'Debug Service' });
	req.buffer(function(program) {
		document.getElementById('playground').innerHTML += '<pre>'+JSON.stringify(req.body, 0, 4)+'</pre>';
		res.s204('No content').end();
	});
}).listen({ local: 'debug' });

web.createServer(function(req, res) {
	res.link('/{?foo}', { rel: 'self service', title: 'Debug Service 2' });
	res.s204('No content').end();
}).listen({ local: 'debug2' });