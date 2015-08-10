/*!
 * serve-favicon
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

//var etag = require('etag');
//var fresh = require('fresh');
//var fs = require('fs');
//var ms = require('ms');
var parseUrl = require('parseurl');
var path = require('path');
var resolve = path.resolve;
var request = require('request');

/**
 * Module exports.
 * @public
 */

module.exports = favicon;

/**
 * Module variables.
 * @private
 */

var maxMaxAge = 60 * 60 * 24 * 365 * 1000; // 1 year

/**
 * Serves the favicon located by the given `path`.
 *
 * @public
 * @param {String|Buffer} path
 * @param {Object} [options]
 * @return {Function} middleware
 */

function favicon(url) {
  var opts = {
    symbol: false,
    symbolColor: '#ffffff',
    symbolBackgroundColor: false
  };
  // If url isn't a string, it is a config object
  if(url && url.toString() !== url) opts = url;
  else                       opts.url = url;

  var analysing; 
  var buf;
  var icon; // favicon cache
  //var maxAge = calcMaxAge(opts.maxAge);
  var stat;

  //if (!path) throw new TypeError('path to favicon.ico is required');

  /*if (Buffer.isBuffer(path)) {
    buf = new Buffer(path.length);
    path.copy(buf);

    icon = createIcon(buf, maxAge);
  } else if (typeof path === 'string') {
    path = resolve(path);
    stat = fs.statSync(path);
    if (stat.isDirectory()) throw createIsDirError(path);
  } else {
    throw new TypeError('path to favicon.ico must be string or buffer');
  }*/
  
  var reqIsHTML = function(req){
    return req.headers.accept && !!req.headers.accept.match(/text\/html/);
  };
  // If no host header is to be found, intelligently guess what the host is from the connection
  var getHostFromConnection = function(connection){
    var address = connection.address();
    return address.address + ':' + address.port;
  };
  // Node.js does not implement canvas, thus we render the favicon in the client
  var canvasScript = function(opts){
    
    var symbol = opts.symbol || document.title[0] || location.hostname[0];
    var symbolBackgroundColor = opts.themeColor || getSymbolBackgroundColor();
    var favicon = drawFavicon();
    
    function drawFavicon(){
      
      var canvas = document.createElement('canvas');
      canvas.width = 16;canvas.height = 16;
      var ctx = canvas.getContext('2d');
      
      var scaleFactor = backingScale(ctx);
          if (scaleFactor > 1) {
          canvas.width = canvas.width * scaleFactor;
          canvas.height = canvas.height * scaleFactor;
          // update the context for the new canvas scale
          var ctx = canvas.getContext("2d");
      }
      
      ctx.fillStyle = symbolBackgroundColor;
      //ctx.fillRect(0, 0, canvas.width, canvas.height);
      roundedRect(ctx, 0, 0, canvas.width, canvas.height, 2 * scaleFactor);
      ctx.fill();
      ctx.fillStyle = opts.symbolColor;
      ctx.font = (canvas.height-(canvas.height/4)+(1.5*scaleFactor))+'px system, -apple-system, ".SFNSDisplay-Regular", "Helvetica Neue", "Lucida Grande", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(symbol, canvas.width/2, canvas.height - (canvas.height / 4) + scaleFactor);
      
      return canvas;
    };

    var link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = favicon.toDataURL("image/x-icon");
    
    // Only Gecko can do this
    //canvas.toBlob(blobCallback('passThisString'), 'image/vnd.microsoft.icon', '-moz-parse-options:format=bmp;bpp=32');
    
    document.getElementsByTagName('head')[0].appendChild(link);
    
    // A utility function to draw a rectangle with rounded corners.
    function roundedRect(ctx,x,y,width,height,radius){
      ctx.beginPath();
      ctx.moveTo(x,y+radius);
      ctx.lineTo(x,y+height-radius);
      ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
      ctx.lineTo(x+width-radius,y+height);
      ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
      ctx.lineTo(x+width,y+radius);
      ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
      ctx.lineTo(x+radius,y);
      ctx.quadraticCurveTo(x,y,x,y+radius);
    }
    
    function backingScale(context) {
      if ('devicePixelRatio' in window) {
          if (window.devicePixelRatio > 1) {
              return window.devicePixelRatio;
          }
      }
      return 1;
    }
    
    function getSymbolBackgroundColor(){
      // Android >=5.0 && OS X Safari >=9.0
      var themeColor = document.querySelector('meta[name="theme-color"]');
      if(themeColor && themeColor.content) return themeColor.content;
      // Windows >=8 app tile colors
      themeColor = document.querySelector('meta[name="msapplication-TileColor"]');
      if(themeColor && themeColor.content) return themeColor.content;
      // IE >=9 pinned site ui color
      themeColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
      if(themeColor && themeColor.content) return themeColor.content;
      // Oh crap
      var tmpColors = ["#007BB6", "teal", "olive", "hotpink", "crimson", "darkcyan", "deeppink", "SeaGreen", "Sienna"];
      return tmpColors[Math.floor(Math.random()*tmpColors.length)];
    }
  };

  return function favicon(req, res, next){
    
    if(analysing) return next();
    
    //req.connection.address() could be used
    // We haven't created the icon yet!
    if(!icon && req.method === 'GET' && reqIsHTML(req)) {
      var host = req.headers.host || getHostFromConnection(req.connection);
      
      analysing = true;
      
      //@TODO do not hardcode the protocol
      var x = request({
        method: 'GET',
        uri: 'http://' + host + req.url,
        gzip: true
      }, function (error, response, body) {
        //console.log(response.statusCode);
        if (!error && response.statusCode == 200) {
          var modifiedBody = body.replace(/<\/body>(?![\s\S]*<\/body>)/, function () {
              return "\n<script>\n(" + canvasScript.toString() + ")("+JSON.stringify(opts)+");\n</script>\n" + arguments[0];
          });
          analysing = false;
          //console.log(modifiedBody);
          res.end(modifiedBody);
        } else next(error);
      });
      req.pipe(x);
      
      return;
    }
    
    if (parseUrl(req).pathname !== '/favicon.ico' || parseUrl(req).pathname !== '/favicon.png') {
      next();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = req.method === 'OPTIONS' ? 200 : 405;
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    if (icon) return send(req, res, icon);

    res.end();

    //send(req, res, icon);
    /*
    fs.readFile(path, function(err, buf){
      if (err) return next(err);
      icon = createIcon(buf, maxAge);
      send(req, res, icon);
    });
    */
  };
};

/**
 * Calculate the max-age from a configured value.
 *
 * @private
 * @param {string|number} val
 * @return {number}
 */

function calcMaxAge(val) {
  var num = typeof val === 'string'
    ? ms(val)
    : val;

  return num != null
    ? Math.min(Math.max(0, num), maxMaxAge)
    : maxMaxAge
}

/**
 * Create icon data from Buffer and max-age.
 *
 * @private
 * @param {Buffer} buf
 * @param {number} maxAge
 * @return {object}
 */

function createIcon(buf, maxAge) {
  return {
    body: buf,
    headers: {
      'Cache-Control': 'public, max-age=' + Math.floor(maxAge / 1000),
      'ETag': etag(buf)
    }
  };
}

/**
 * Create EISDIR error.
 *
 * @private
 * @param {string} path
 * @return {Error}
 */

function createIsDirError(path) {
  var error = new Error('EISDIR, illegal operation on directory \'' + path + '\'');
  error.code = 'EISDIR';
  error.errno = 28;
  error.path = path;
  error.syscall = 'open';
  return error;
}

/**
 * Send icon data in response to a request.
 *
 * @private
 * @param {IncomingMessage} req
 * @param {OutgoingMessage} res
 * @param {object} icon
 */

function send(req, res, icon) {
  var headers = icon.headers;

  // Set headers
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    res.setHeader(key, headers[key]);
  }

  if (fresh(req.headers, res._headers)) {
    res.statusCode = 304;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Length', icon.body.length);
  res.setHeader('Content-Type', 'image/x-icon');
  res.end(icon.body);
}
