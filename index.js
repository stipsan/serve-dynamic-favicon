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
    symbolColor: '#ffffff'
  };
  // If url isn't a string, it is a config object
  if(url.toString() !== url) opts = url;
  else                       opts.url = url;

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
    return !!req.headers.accept.match(/text\/html/);
  };
  // If no host header is to be found, intelligently guess what the host is from the connection
  var getHostFromConnection = function(connection){
    var address = connection.address();
    return address.address + ':' + address.port;
  };

  return function favicon(req, res, next){
    
    //req.connection.address() could be used
    // We haven't created the icon yet!
    var host;
    if(!icon && req.method === 'GET' && reqIsHTML(req)) host = req.headers.host || req.connection.address();
    
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
