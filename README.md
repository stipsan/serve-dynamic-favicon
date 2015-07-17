# serve-dynamic-favicon

# PLEASE NOTE THIS IS IN ALPHA

Node.js middleware for serving a favicon that is generated on the fly.
Using the first letter of the the `<title>` tag overlayed a background color fetched from the `<meta name="theme-color" content="#007BB6">` you'll reduce the cognitive load when switching between browser tabs.
You may specify any url you want for where the metadata will be fetched from, or you can pass the letter and theme-color and save the initial request.
This is very useful for when you're running expressjs or BrowserSync servers.

## Install

```bash
npm install serve-dynamic-favicon --production --no-optional
```

## API

### favicon(url:string || options:object)

Create new middleware to serve a favicon generated from metadata fetched from the given `url` to a fetchable html document.
Pass an object with options to switch the middleware from auto mode to manual mode. Manual mode require you to at least specify `themeColor`. `symbol` is optional, omitting it will render a solid color without any foreground text as logo.

#### Options

##### themeColor

The backdrop color to the generated icon. Any css color value, with or without alpha, is supported.

##### symbol

The text letter, usually the first character found in the `<title>` tag when `url` is defined.

##### symbolColor

Optionally set the color of `symbol`. Defaults to `#ffffff`.

## Examples

Typically this middleware will come very early in your stack (maybe even first)
to avoid processing any other middleware if we already know the request is for
`/favicon.ico`.

### express

```javascript
var express = require('express');
var favicon = require('serve-dynamic-favicon');

var app = express();
app.use(favicon('https://github.com'));

// Add your routes here, etc.

app.listen(3000);
```

### connect

```javascript
var connect = require('connect');
var favicon = require('serve-dynamic-favicon');

var app = connect();
app.use(favicon('https://github.com'));

// Add your middleware here, etc.

app.listen(3000);
```

### vanilla http server

This middleware can be used anywhere, even outside express/connect. It takes
`req`, `res`, and `callback`.

```javascript
var http = require('http');
var favicon = require('serve-dynamic-favicon');
var finalhandler = require('finalhandler');

var _favicon = favicon();

var server = http.createServer(function onRequest(req, res) {
  var done = finalhandler(req, res);

  _favicon(req, res, function onNext(err) {
    if (err) return done(err);

    // continue to process the request here, etc.

    res.statusCode = 404;
    res.end('oops');
  });
});

server.listen(3000);
```

## License

[MIT](LICENSE)