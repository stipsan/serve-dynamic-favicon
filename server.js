var http = require('http');
var favicon = require('./index.js');
var finalhandler = require('finalhandler');

var _favicon = favicon('https://github.com');

var server = http.createServer(function onRequest(req, res) {
  var done = finalhandler(req, res);

  _favicon(req, res, function onNext(err) {
    if (err) return done(err);

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<!DOCTYPE html>');
    res.write('<html>');
    res.write('<head>');
    res.write('<title>Hello World!</title>');
    res.write('<meta name="theme-color" content="#007BB6">');
    res.write('</head>');
    res.write('<body>');
    res.write('Hello World!');
    res.write('</body>');
    res.write('</html>');
    res.end();
  });
});

// In case this script is started using node or node-debug instead of `npm start`
if(!process.env.npm_package_config_port) process.env.npm_package_config_port = 3010;
 
server.listen(process.env.npm_package_config_port);
console.log('Server is listening on port:', process.env.npm_package_config_port);