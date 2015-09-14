Mobird.defineModule('modules/http', function(require, exports, module) {

  var URL = require('modules/url');

  var makeErrorByStatus = function(statusCode, content) {
    var MAX_LENGTH = 500;

    var truncate = function(str, length) {
      return str.length > length ? str.slice(0, length) + '...' : str;
    };

    var message = 'failed [' + statusCode + ']';
    if (content) {
      message += ' ' + truncate(content.replace(/\n/g, ' '), MAX_LENGTH);
    }

    return new Error(message);
  };

  var populateData = function(response) {
    var contentType = (response.headers['content-type'] || ';').split(';')[0];

    if (Mobird.contains(['application/json', 'text/javascript'], contentType)) {
      try {
        response.data = JSON.parse(response.content);
      } catch (err) {
        response.data = null;
      }
    } else {
      response.data = null;
    }
  };

  var HTTP = {};

  /**
   * @param {String} method The [HTTP method](http://en.wikipedia.org/wiki/HTTP_method) to use, such as "`GET`", "`POST`", or "`HEAD`".
   * @param {String} url The URL to retrieve.
   * @param {Object} [options]
   * @param {String} options.content String to use as the HTTP request body.
   * @param {Object} options.data JSON-able object to stringify and use as the HTTP request body. Overwrites `content`.
   * @param {String} options.query Query string to go in the URL. Overwrites any query string in `url`.
   * @param {Object} options.params Dictionary of request parameters to be encoded and placed in the URL (for GETs) or request body (for POSTs).  If `content` or `data` is specified, `params` will always be placed in the URL.
   * @param {String} options.auth HTTP basic authentication string of the form `"username:password"`
   * @param {Object} options.headers Dictionary of strings, headers to add to the HTTP request.
   * @param {Number} options.timeout Maximum time in milliseconds to wait for the request before failing.  There is no timeout by default.
   * @param {Function} [asyncCallback] Optional callback.  If passed, the method runs asynchronously, instead of synchronously, and calls asyncCallback.  On the client, this callback is required.
   */
  HTTP.call = function(method, url, options, callback) {

    if (!callback && Mobird.isFunction(options)) {
      callback = options;
      options = null;
    }

    options = options || {};

    if (!Mobird.isFunction(callback)) {
      throw new Error('Can not make a blocking HTTP call from the client; callback required.');
    }

    method = (method || '').toUpperCase();

    var headers = {};

    var content = options.content;
    if (options.data) {
      content = JSON.stringify(options.data);
      headers['Content-Type'] = 'application/json';
    }

    var params_for_url, params_for_body;
    if (content || method === 'GET' || method === 'HEAD') {
      params_for_url = options.params;
    } else {
      params_for_body = options.params;
    }

    url = URL.constructUrl(url, options.query, params_for_url);

    var username, password;
    if (options.auth) {
      var colonLoc = options.auth.indexOf(':');
      if (colonLoc < 0) {
        throw new Error('auth option should be of the form "username:password"');
      }
      username = options.auth.substring(0, colonLoc);
      password = options.auth.substring(colonLoc + 1);
    }

    if (params_for_body) {
      content = URL.encodeParams(params_for_body);
    }

    Mobird.extend(headers, options.headers || {});

    callback = (function(callback) {
      return function(error, response) {
        if (error && response) {
          error.response = response;
        }
        callback(error, response);
      };
    })(callback);

    callback = Mobird.once(callback);

    try {
      var xhr;
      if (typeof XMLHttpRequest !== 'undefined') {
        xhr = new XMLHttpRequest();
      } else if (typeof ActiveXObject !== 'undefined') {
        xhr = new ActiveXObject('Microsoft.XMLHttp');
      } else {
        throw new Error('Can not create XMLHttpRequest');
      }

      xhr.open(method, url, true, username, password);

      for (var k in headers) {
        xhr.setRequestHeader(k, headers[k]);
      }

      var timed_out = false;
      var timer;
      if (options.timeout) {
        timer = setTimeout(function() {
          timed_out = true;
          xhr.abort();
        }, options.timeout);
      }

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (timer) {
            clearTimeout(timer);
          }

          if (timed_out) {
            callback(new Error('timeout'));
          } else if (!xhr.status) {
            callback(new Error('network'));
          } else {
            var response = {};
            response.statusCode = xhr.status;
            response.content = xhr.responseText;

            response.headers = {};
            var header_str = xhr.getAllResponseHeaders();

            if ('' === header_str && xhr.getResponseHeader('content-type')) {
              header_str = 'content-type: ' + xhr.getResponseHeader('content-type');
            }

            var headers_raw = header_str.split(/\r?\n/);
            Mobird.each(headers_raw, function(h) {
              var m = /^(.*?):(?:\s+)(.*)$/.exec(h);
              if (m && m.length === 3) {
                response.headers[m[1].toLowerCase()] = m[2];
              }
            });

            populateData(response);

            var error = null;
            if (response.statusCode >= 400) {
              error = makeErrorByStatus(response.statusCode, response.content);
            }

            callback(error, response);
          }
        }
      };

      xhr.send(content);

    } catch (err) {
      callback(err);
    }

  };

  HTTP.get = function (/* url, callOptions, asyncCallback */) {
    return HTTP.call.apply(this, ['GET'].concat(Mobird.toArray(arguments)));
  };

  HTTP.post = function (/* url, callOptions, asyncCallback */) {
    return HTTP.call.apply(this, ['POST'].concat(Mobird.toArray(arguments)));
  };

  HTTP.put = function (/* url, callOptions, asyncCallback */) {
    return HTTP.call.apply(this, ['PUT'].concat(Mobird.toArray(arguments)));
  };

  HTTP.del = function (/* url, callOptions, asyncCallback */) {
    return HTTP.call.apply(this, ['DELETE'].concat(Mobird.toArray(arguments)));
  };

  module.exports = HTTP;

});