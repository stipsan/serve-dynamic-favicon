var http = require('http');
var favicon = require('serve-dynamic-favicon');
var finalhandler = require('finalhandler');

var _favicon = favicon('https://github.com');

var server = http.createServer(function onRequest(req, res) {
  var done = finalhandler(req, res);

  _favicon(req, res, function onNext(err) {
    if (err) return done(err);

    // continue to process the request here, etc.

    res.statusCode = 404;
    res.end();
  });
  
  resp.writeHead(200, {'Content-Type': 'text/html'});
  resp.write('<!DOCTYPE html>');
  resp.write('<html>');
  resp.write('<head>');
  resp.write('<title>Hello World!</title>');
  resp.write('<meta name="theme-color" content="#007BB6">');
  resp.write('</head>');
  resp.write('<body>');
  resp.write('Hello World!');
  resp.write('</body>');
  resp.write('</html>');
  resp.end();
});
 
server.listen(process.env.npm_package_config_port);
console.log('Server is listening on port:', process.env.npm_package_config_port);