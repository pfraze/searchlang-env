
web.at('#debug', function(req, res) {
	res.link('#debug', { rel: 'self searchlang.org/exe service', title: 'Debug Service', keywords: 'test' });
	res.link('#debug2{?foo}', { rel: 'service', title: 'Debug Service' });
	res.status(204, 'No content').end();
});
web.at('#debug2', function(req, res) {
	res.link('#debug2{?foo}', { rel: 'self service', title: 'Debug Service 2' });
	res.status(204, 'No content').end();
});