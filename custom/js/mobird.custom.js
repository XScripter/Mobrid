/**
 * Mobird 0.2.0 - Custom Build
 * Full Featured HTML5 Framework For Building Mobile Apps
 * 
 * Included modules: template,url,http,storage,storage.cookie,storage.data,storage.local,storage.memory,storage.session,platform,scroller,viewport,swipe,imagelazy,url,storage,storage,storage,storage,storage,platform
 * 
 * http://www.xscripter.com/mobird/
 * 
 * Copyright 2015, Clarence Hu
 * The XScripter.com
 * http://www.xscripter.us/
 * 
 * Licensed under MIT
 * 
 * Released on: September 11, 2015
 */
Mobird.defineModule('modules/template', function(require, exports, module) {

  var Template = {};
  var templateHelpers = {};

  var noMatch = /(.)^/;

  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  Template.settings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  Template.addHelpers = function(newHelpers) {
    Mobird.extend(templateHelpers, newHelpers);
  };

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  function template(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = Mobird.defaults({}, settings, Template.settings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
        (settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source
      ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':Mobird.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', 'Mobird', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, Mobird);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  }

  Template.compile = function(text, data, settings) {

    if (data) {
      Mobird.defaults(data, templateHelpers);
      return template.apply(this, arguments);
    }

    var originalTemplate = template.apply(this, arguments);

    var wrappedTemplate = function(data) {
      data = Mobird.defaults({}, data, templateHelpers);
      return originalTemplate.call(this, data);
    };

    return wrappedTemplate;
  };

  module.exports = Template;

});
Mobird.Template = Mobird.requireModule('modules/template');
Mobird.defineModule('modules/url', function(require, exports, module) {

  var URL = {};

  var encodeString = function(str) {
    return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, '%2A');
  };

  URL.encodeParams = function(params) {
    var buf = [];
    Mobird.each(params, function(value, key) {
      if (buf.length) {
        buf.push('&');
      }
      buf.push(encodeString(key), '=', encodeString(value));
    });
    return buf.join('').replace(/%20/g, '+');
  };

  var buildUrl = function(before_qmark, from_qmark, opt_query, opt_params) {
    var url_without_query = before_qmark;
    var query = from_qmark ? from_qmark.slice(1) : null;

    if (Mobird.isString(opt_query)) {
      query = String(opt_query);
    }

    if (opt_params) {
      query = query || '';
      var prms = URL.encodeParams(opt_params);
      if (query && prms) {
        query += '&';
      }
      query += prms;
    }

    var url = url_without_query;
    if (query !== null) {
      url += ('?' + query);
    }

    return url;
  };

  URL.constructUrl = function(url, query, params) {
    var query_match = /^(.*?)(\?.*)?$/.exec(url);
    return buildUrl(query_match[1], query_match[2], query, params);
  };

  URL.getParameter = function(url, name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
      results = regex.exec(url);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  module.exports = URL;

});
Mobird.URL = Mobird.requireModule('modules/url');
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
Mobird.HTTP = Mobird.requireModule('modules/http');
Mobird.defineModule('modules/storage', function(require, exports, module) {

  var Storage = function(options) {

    var store = this;
    this.options = options || {};
    this.name = this.options.name || 'store';
    this.element = this.options.element || 'body';
    this.$element = Mobird.$(this.element);

    if (Mobird.isArray(this.options.type)) {
      Mobird.each(this.options.type, function(type, i) {
        if (Storage.isAvailable(type)) {
          store.type = type;
          return false;
        }
      });
    } else {
      this.type = this.options.type || 'memory';
    }
    this.meta_key = this.options.meta_key || '__keys__';
    this.storage = new Storage[Storage.stores[this.type]](this.name, this.element, this.options);
  };

  Storage.stores = {
    'memory': 'Memory',
    'data': 'Data',
    'local': 'LocalStorage',
    'session': 'SessionStorage',
    'cookie': 'Cookie'
  };

  Mobird.extend(Storage.prototype, {

    isAvailable: function() {
      if (Mobird.isFunction(this.storage.isAvailable)) {
        return this.storage.isAvailable();
      } else {
        return true;
      }
    },

    exists: function(key) {
      return this.storage.exists(key);
    },

    set: function(key, value) {
      var string_value = (typeof value == 'string') ? value : JSON.stringify(value);
      key = key.toString();
      this.storage.set(key, string_value);
      if (key != this.meta_key) {
        this._addKey(key);
        this.$element.trigger('set-' + this.name, {
          key: key,
          value: value
        });
        this.$element.trigger('set-' + this.name + '-' + key, {
          key: key,
          value: value
        });
      }
      // always return the original value
      return value;
    },

    get: function(key) {
      var value = this.storage.get(key);
      if (typeof value == 'undefined' || value == null || value == '') {
        return value;
      }
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    },

    clear: function(key) {
      this._removeKey(key);
      return this.storage.clear(key);
    },

    clearAll: function() {
      var self = this;
      this.each(function(key, value) {
        self.clear(key);
      });
    },

    keys: function() {
      return this.get(this.meta_key) || [];
    },

    each: function(callback) {
      var i = 0,
        keys = this.keys(),
        returned;

      for (i; i < keys.length; i++) {
        returned = callback(keys[i], this.get(keys[i]));
        if (returned === false) {
          return false;
        }
      }
    },

    filter: function(callback) {
      var found = [];
      this.each(function(key, value) {
        if (callback(key, value)) {
          found.push([key, value]);
        }
        return true;
      });
      return found;
    },

    first: function(callback) {
      var found = false;
      this.each(function(key, value) {
        if (callback(key, value)) {
          found = [key, value];
          return false;
        }
      });
      return found;
    },

    fetch: function(key, callback) {
      if (!this.exists(key)) {
        return this.set(key, callback.apply(this));
      } else {
        return this.get(key);
      }
    },

    _addKey: function(key) {
      var keys = this.keys();
      if (Mobird.inArray(key, keys) == -1) {
        keys.push(key);
      }
      this.set(this.meta_key, keys);
    },
    _removeKey: function(key) {
      var keys = this.keys();
      var index = Mobird.inArray(key, keys);
      if (index != -1) {
        keys.splice(index, 1);
      }
      this.set(this.meta_key, keys);
    }
  });

  Storage.isAvailable = function(type) {
    try {
      return Storage[Storage.stores[type]].prototype.isAvailable();
    } catch (e) {
      return false;
    }
  };

  module.exports = Storage;

});
Mobird.Storage = Mobird.requireModule('modules/storage');
Mobird.defineModule('modules/storage/cookie', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.Cookie = function(name, element, options) {
    this.name = name;
    this.element = element;
    this.options = options || {};
    this.path = this.options.path || '/';
    // set the expires in seconds or default 14 days
    this.expires_in = this.options.expires_in || (14 * 24 * 60 * 60);
  };

  Mobird.extend(Storage.Cookie.prototype, {
    isAvailable: function() {
      return ('cookie' in document) && (window.location.protocol != 'file:');
    },
    exists: function(key) {
      return (this.get(key) != null);
    },
    set: function(key, value) {
      return this._setCookie(key, value);
    },
    get: function(key) {
      return this._getCookie(key);
    },
    clear: function(key) {
      this._setCookie(key, "", -1);
    },
    _key: function(key) {
      return ['store', this.element, this.name, key].join('.');
    },
    _getCookie: function(key) {
      var escaped = this._key(key).replace(/(\.|\*|\(|\)|\[|\])/g, '\\$1');
      var match = document.cookie.match("(^|;\\s)" + escaped + "=([^;]*)(;|$)");
      return (match ? match[2] : null);
    },
    _setCookie: function(key, value, expires) {
      if (!expires) {
        expires = (this.expires_in * 1000)
      }
      var date = new Date();
      date.setTime(date.getTime() + expires);
      var set_cookie = [
        this._key(key), "=", value,
        "; expires=", date.toGMTString(),
        "; path=", this.path
      ].join('');
      document.cookie = set_cookie;
    }
  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/cookie');
Mobird.defineModule('modules/storage/data', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.Data = function(name, element) {
    this.name = name;
    this.element = element;
    this.$element = Mobird.$(element);
  };

  Mobird.extend(Storage.Data.prototype, {
    isAvailable: function() {
      return true;
    },
    exists: function(key) {
      return !!this.$element.data(this._key(key));
    },
    set: function(key, value) {
      return this.$element.data(this._key(key), value);
    },
    get: function(key) {
      return this.$element.data(this._key(key));
    },
    clear: function(key) {
      this.$element.removeData(this._key(key));
    },
    _key: function(key) {
      return ['store', this.name, key].join('.');
    }
  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/data');
Mobird.defineModule('modules/storage/local', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.LocalStorage = function(name, element) {
    this.name = name;
    this.element = element;
  };

  Mobird.extend(Storage.LocalStorage.prototype, {

    isAvailable: function() {
      return ('localStorage' in window) && (window.location.protocol != 'file:');
    },
    exists: function(key) {
      return (this.get(key) != null);
    },
    set: function(key, value) {
      return window.localStorage.setItem(this._key(key), value);
    },
    get: function(key) {
      return window.localStorage.getItem(this._key(key));
    },
    clear: function(key) {
      window.localStorage.removeItem(this._key(key));
    },
    _key: function(key) {
      return ['store', this.element, this.name, key].join('.');
    }

  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/local');
Mobird.defineModule('modules/storage/memory', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.Memory = function(name, element) {
    this.name = name;
    this.element = element;
    this.namespace = [this.element, this.name].join('.');
    Storage.Memory.store = Storage.Memory.store || {};
    Storage.Memory.store[this.namespace] = Storage.Memory.store[this.namespace] || {};
    this.store = Storage.Memory.store[this.namespace];
  };

  Mobird.extend(Storage.Memory.prototype, {
    isAvailable: function() {
      return true;
    },
    exists: function(key) {
      return (typeof this.store[key] != 'undefined');
    },
    set: function(key, value) {
      return this.store[key] = value;
    },
    get: function(key) {
      return this.store[key];
    },
    clear: function(key) {
      delete this.store[key];
    }
  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/memory');
Mobird.defineModule('modules/storage/session', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.SessionStorage = function(name, element) {
    this.name = name;
    this.element = element;
  };

  Mobird.extend(Storage.SessionStorage.prototype, {
    isAvailable: function() {
      return ('sessionStorage' in window) &&
        (window.location.protocol != 'file:') &&
        (Mobird.isFunction(window.sessionStorage.setItem));
    },
    exists: function(key) {
      return (this.get(key) != null);
    },
    set: function(key, value) {
      return window.sessionStorage.setItem(this._key(key), value);
    },
    get: function(key) {
      var value = window.sessionStorage.getItem(this._key(key));
      if (value && typeof value.value != 'undefined') {
        value = value.value
      }
      return value;
    },
    clear: function(key) {
      window.sessionStorage.removeItem(this._key(key));
    },
    _key: function(key) {
      return ['store', this.element, this.name, key].join('.');
    }
  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/session');
Mobird.defineModule('modules/platform', function(require, exports, module) {

  var IOS = 'ios';
  var ANDROID = 'android';
  var WINDOWS_PHONE = 'windowsphone';
  var BLACKBERRY = 'blackberry';
  var OPERA = 'opera mini';

  var platformName = null,
    platformVersion = null,
    platformReadyCallbacks = [],
    platformwindowLoadListenderAttached;

  var Platform = {

    navigator: window.navigator,

    isReady: false,
    isFullScreen: false,
    platforms: null,
    grade: null,
    ua: navigator.userAgent,

    ready: function (cb) {
      // run through tasks to complete now that the device is ready
      if (Platform.isReady) {
        cb();
      } else {
        // the platform isn't ready yet, add it to this array
        // which will be called once the platform is ready
        platformReadyCallbacks.push(cb);
      }
    },

    detect: function () {
      Platform._checkPlatforms();

      Mobird.requestAnimationFrame(function () {
        // only add to the body class if we got platform info
        for (var i = 0; i < Platform.platforms.length; i++) {
          Mobird.$('body').addClass('mo-platform-' + Platform.platforms[i]);
        }
      });
    },

    setGrade: function (grade) {
      var oldGrade = Platform.grade;
      Platform.grade = grade;
      Mobird.requestAnimationFrame(function () {
        if (oldGrade) {
          Mobird.$('body').removeClass('mo-grade-' + oldGrade);
        }
        Mobird.$('body').addClass('mo-grade-' + grade);
      });
    },

    device: function () {
      return window.device || {};
    },

    _checkPlatforms: function () {
      Platform.platforms = [];
      var grade = 'a';

      if (Platform.isWebView()) {
        Platform.platforms.push('webview');
        if (!(!window.cordova && !window.PhoneGap && !window.phonegap)) {
          Platform.platforms.push('cordova');
        } else if (window.forge) {
          Platform.platforms.push('trigger');
        }
      } else {
        Platform.platforms.push('browser');
      }
      if (Platform.isIPad()) {
        Platform.platforms.push('ipad');
      }

      var platform = Platform.platform();
      if (platform) {
        Platform.platforms.push(platform);

        var version = Platform.version();
        if (version) {
          var v = version.toString();
          if (v.indexOf('.') > 0) {
            v = v.replace('.', '_');
          } else {
            v += '_0';
          }
          Platform.platforms.push(platform + v.split('_')[0]);
          Platform.platforms.push(platform + v);

          if (Platform.isAndroid() && version < 4.4) {
            grade = (version < 4 ? 'c' : 'b');
          } else if (Platform.isWindowsPhone()) {
            grade = 'b';
          }
        }
      }

      Platform.setGrade(grade);
    },

    isWebView: function () {
      return !(!window.cordova && !window.PhoneGap && !window.phonegap && !window.forge);
    },
    isIPad: function () {
      if (/iPad/i.test(Platform.navigator.platform)) {
        return true;
      }
      return /iPad/i.test(Platform.ua);
    },

    isIOS: function () {
      return Platform.is(IOS);
    },
    isAndroid: function () {
      return Platform.is(ANDROID);
    },
    isWindowsPhone: function () {
      return Platform.is(WINDOWS_PHONE);
    },

    isBlackBerry: function () {
      return Platform.is(BLACKBERRY);
    },

    isOpera: function() {
      return Platform.is(OPERA);
    },

    isMobile: function() {
      return (Platform.isAndroid() || Platform.isBlackBerry() || Platform.isIOS() || Platform.isOpera() || Platform.isWindowsPhone());
    },

    platform: function () {
      // singleton to get the platform name
      if (platformName === null) {
        Platform.setPlatform(Platform.device().platform);
      }
      return platformName;
    },

    setPlatform: function (n) {
      if (typeof n != 'undefined' && n !== null && n.length) {
        platformName = n.toLowerCase();
      } else if (Mobird.getParameterByName('mobirdplatform')) {
        platformName = Mobird.getParameterByName('mobirdplatform');
      } else if (Platform.ua.indexOf('Android') > 0) {
        platformName = ANDROID;
      } else if (/iPhone|iPad|iPod/.test(Platform.ua)) {
        platformName = IOS;
      } else if (Platform.ua.indexOf('Windows Phone') > -1) {
        platformName = WINDOWS_PHONE;
      } else {
        platformName = Platform.navigator.platform && navigator.platform.toLowerCase().split(' ')[0] || '';
      }
    },

    version: function () {
      // singleton to get the platform version
      if (platformVersion === null) {
        Platform.setVersion(Platform.device().version);
      }
      return platformVersion;
    },

    setVersion: function (v) {
      if (typeof v != 'undefined' && v !== null) {
        v = v.split('.');
        v = parseFloat(v[0] + '.' + (v.length > 1 ? v[1] : 0));
        if (!isNaN(v)) {
          platformVersion = v;
          return;
        }
      }

      platformVersion = 0;

      var pName = Platform.platform();
      var versionMatch = {
        'android': /Android (\d+).(\d+)?/,
        'ios': /OS (\d+)_(\d+)?/,
        'windowsphone': /Windows Phone (\d+).(\d+)?/
      };
      if (versionMatch[pName]) {
        v = Platform.ua.match(versionMatch[pName]);
        if (v && v.length > 2) {
          platformVersion = parseFloat(v[1] + '.' + v[2]);
        }
      }
    },

    is: function (type) {
      type = type.toLowerCase();
      // check if it has an array of platforms
      if (Platform.platforms) {
        for (var x = 0; x < Platform.platforms.length; x++) {
          if (Platform.platforms[x] === type) {
            return true;
          }
        }
      }
      // exact match
      var pName = Platform.platform();
      if (pName) {
        return pName === type.toLowerCase();
      }

      // A quick hack for to check userAgent
      return Platform.ua.toLowerCase().indexOf(type) >= 0;
    },

    exitApp: function () {
      Platform.ready(function () {
        navigator.app && navigator.app.exitApp && navigator.app.exitApp();
      });
    },

    showStatusBar: function (val) {
      // Only useful when run within cordova
      Platform._showStatusBar = val;
      Platform.ready(function () {
        // run this only when or if the platform (cordova) is ready
        Mobird.requestAnimationFrame(function () {
          if (Platform._showStatusBar) {
            // they do not want it to be full screen
            window.StatusBar && window.StatusBar.show();
            Mobird.$('body').removeClass('mo-status-bar-hide');
          } else {
            // it should be full screen
            window.StatusBar && window.StatusBar.hide();
            Mobird.$('body').addClass('mo-status-bar-hide');
          }
        });
      });
    },

    fullScreen: function (showFullScreen, showStatusBar) {
      // showFullScreen: default is true if no param provided
      Platform.isFullScreen = (showFullScreen !== false);

      // add/remove the fullscreen classname to the body
      Mobird.$(document).ready(function () {
        // run this only when or if the DOM is ready
        Mobird.requestAnimationFrame(function () {
          if (Platform.isFullScreen) {
            Mobird.$('body').addClass('mo-fullscreen');
          } else {
            Mobird.$('body').removeClass('mo-fullscreen');
          }
        });
        // showStatusBar: default is false if no param provided
        Platform.showStatusBar((showStatusBar === true));
      });
    }

  };

  function onWindowLoad() {
    if (Platform.isWebView()) {
      document.addEventListener('deviceready', onPlatformReady, false);
    } else {
      onPlatformReady();
    }
    if (platformwindowLoadListenderAttached) {
      window.removeEventListener('load', onWindowLoad, false);
    }
  }

  function onPlatformReady() {
    Platform.isReady = true;
    Platform.detect();
    for (var x = 0; x < platformReadyCallbacks.length; x++) {
      platformReadyCallbacks[x]();
    }
    platformReadyCallbacks = [];

    Mobird.requestAnimationFrame(function () {
      Mobird.$('body').addClass('mo-platform-ready');
    });
  }

  Platform.initialize = function () {
    if (document.readyState === 'complete') {
      onWindowLoad();
    } else {
      platformwindowLoadListenderAttached = true;
      window.addEventListener('load', onWindowLoad, false);
    }
  };

  module.exports = Platform;

});
Mobird.Platform = Mobird.requireModule('modules/platform');
Mobird.initializePlatform = function() {
  Mobird.Platform.initialize();
};
Mobird.defineModule('modules/scroller', function(require, exports, module) {

  var elementStyle = document.createElement('div').style;
  var vendor = (function() {
    var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
      transform,
      i = 0,
      l = vendors.length;

    for (; i < l; i++) {
      transform = vendors[i] + 'ransform';
      if (transform in elementStyle) {
        return vendors[i].substr(0, vendors[i].length - 1);
      }
    }

    return false;
  })();

  function prefixStyle(style) {
    if (vendor === false) {
      return false;
    }
    if (vendor === '') {
      return style;
    }
    return vendor + style.charAt(0).toUpperCase() + style.substr(1);
  }

  var transformPrefix = prefixStyle('transform');

  var utils = {

    addEvent: function(el, type, fn, capture) {
      el.addEventListener(type, fn, !!capture);
    },

    removeEvent: function(el, type, fn, capture) {
      el.removeEventListener(type, fn, !!capture);
    },

    prefixPointerEvent: function(pointerEvent) {
      return window.MSPointerEvent ?
      'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10) :
        pointerEvent;
    },

    momentum: function(current, start, time, lowerMargin, wrapperSize, deceleration) {
      var distance = current - start,
        speed = Math.abs(distance) / time,
        destination,
        duration;

      deceleration = deceleration === undefined ? 0.0006 : deceleration;

      destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1);
      duration = speed / deceleration;

      if (destination < lowerMargin) {
        destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin;
        distance = Math.abs(destination - current);
        duration = distance / speed;
      } else if (destination > 0) {
        destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
        distance = Math.abs(current) + destination;
        duration = distance / speed;
      }

      return {
        destination: Math.round(destination),
        duration: duration
      };
    },

    hasTransform: transformPrefix !== false,
    hasPerspective: prefixStyle('perspective') in elementStyle,
    hasTouch: 'ontouchstart' in window,
    hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
    hasTransition: prefixStyle('transition') in elementStyle,

    isBadAndroid: /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion)),

    style: {
      transform: transformPrefix,
      transitionTimingFunction: prefixStyle('transitionTimingFunction'),
      transitionDuration: prefixStyle('transitionDuration'),
      transitionDelay: prefixStyle('transitionDelay'),
      transformOrigin: prefixStyle('transformOrigin')
    },

    hasClass: function(e, c) {
      var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
      return re.test(e.className);
    },

    addClass: function(e, c) {
      if (utils.hasClass(e, c)) {
        return;
      }

      var newclass = e.className.split(' ');
      newclass.push(c);
      e.className = newclass.join(' ');
    },

    removeClass: function(e, c) {
      if (!utils.hasClass(e, c)) {
        return;
      }

      var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
      e.className = e.className.replace(re, ' ');
    },

    offset: function(el) {
      var left = -el.offsetLeft,
        top = -el.offsetTop;

      // jshint -W084
      while (el = el.offsetParent) {
        left -= el.offsetLeft;
        top -= el.offsetTop;
      }
      // jshint +W084

      return {
        left: left,
        top: top
      };
    },

    preventDefaultException: function(el, exceptions) {
      for (var i in exceptions) {
        if (exceptions[i].test(el[i])) {
          return true;
        }
      }

      return false;
    },

    eventType: {
      touchstart: 1,
      touchmove: 1,
      touchend: 1,

      mousedown: 2,
      mousemove: 2,
      mouseup: 2,

      pointerdown: 3,
      pointermove: 3,
      pointerup: 3,

      MSPointerDown: 3,
      MSPointerMove: 3,
      MSPointerUp: 3
    },

    ease: {
      quadratic: {
        style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fn: function(k) {
          return k * (2 - k);
        }
      },
      circular: {
        style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
        fn: function(k) {
          return Math.sqrt(1 - (--k * k));
        }
      },
      back: {
        style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        fn: function(k) {
          var b = 4;
          return (k = k - 1) * k * ((b + 1) * k + b) + 1;
        }
      },
      bounce: {
        style: '',
        fn: function(k) {
          if ((k /= 1) < (1 / 2.75)) {
            return 7.5625 * k * k;
          } else if (k < (2 / 2.75)) {
            return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
          } else if (k < (2.5 / 2.75)) {
            return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
          } else {
            return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
          }
        }
      },
      elastic: {
        style: '',
        fn: function(k) {
          var f = 0.22,
            e = 0.4;

          if (k === 0) {
            return 0;
          }
          if (k == 1) {
            return 1;
          }

          return (e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1);
        }
      }
    },

    tap: function(e, eventName) {
      var ev = document.createEvent('Event');
      ev.initEvent(eventName, true, true);
      ev.pageX = e.pageX;
      ev.pageY = e.pageY;
      e.target.dispatchEvent(ev);
    },

    click: function(e) {
      var target = e.target,
        ev;

      if (!(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName)) {
        ev = document.createEvent('MouseEvents');
        ev.initMouseEvent('click', true, true, e.view, 1,
          target.screenX, target.screenY, target.clientX, target.clientY,
          e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
          0, null);

        ev._constructed = true;
        target.dispatchEvent(ev);
      }
    }

  };

  function Scroller(el, options) {
    this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
    this.scroller = this.wrapper.children[0];
    this.scrollerStyle = this.scroller.style; // cache style for better performance

    this.options = {

      resizeScrollbars: true,

      mouseWheelSpeed: 20,

      snapThreshold: 0.334,

      // INSERT POINT: OPTIONS

      startX: 0,
      startY: 0,
      scrollY: true,
      directionLockThreshold: 5,
      momentum: true,

      bounce: true,
      bounceTime: 600,
      bounceEasing: '',

      preventDefault: true,
      preventDefaultException: {
        tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/
      },

      HWCompositing: true,
      useTransition: true,
      useTransform: true
    };

    for (var i in options) {
      this.options[i] = options[i];
    }

    // Normalize options
    this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

    this.options.useTransition = utils.hasTransition && this.options.useTransition;
    this.options.useTransform = utils.hasTransform && this.options.useTransform;

    this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
    this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

    // If you want eventPassthrough I have to lock one of the axes
    this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
    this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

    // With eventPassthrough we also need lockDirection mechanism
    this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
    this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

    this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

    this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

    if (this.options.tap === true) {
      this.options.tap = 'tap';
    }

    if (this.options.shrinkScrollbars == 'scale') {
      this.options.useTransition = false;
    }

    this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

    // INSERT POINT: NORMALIZATION

    // Some defaults
    this.x = 0;
    this.y = 0;
    this.directionX = 0;
    this.directionY = 0;
    this._events = {};

    // INSERT POINT: DEFAULTS

    this._init();
    this.refresh();

    this.scrollTo(this.options.startX, this.options.startY);
    this.enable();
  }

  Scroller.prototype = {

    _init: function() {
      this._initEvents();

      if (this.options.scrollbars || this.options.indicators) {
        this._initIndicators();
      }

      if (this.options.mouseWheel) {
        this._initWheel();
      }

      if (this.options.snap) {
        this._initSnap();
      }

      if (this.options.keyBindings) {
        this._initKeys();
      }

      // INSERT POINT: _init

    },

    destroy: function() {
      this._initEvents(true);

      this._execEvent('destroy');
    },

    _transitionEnd: function(e) {
      if (e.target != this.scroller || !this.isInTransition) {
        return;
      }

      this._transitionTime();
      if (!this.resetPosition(this.options.bounceTime)) {
        this.isInTransition = false;
        this._execEvent('scrollEnd');
      }
    },

    _start: function(e) {
      // React to left mouse button only
      if (utils.eventType[e.type] != 1) {
        if (e.button !== 0) {
          return;
        }
      }

      if (!this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated)) {
        return;
      }

      if (this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException)) {
        e.preventDefault();
      }

      var point = e.touches ? e.touches[0] : e,
        pos;

      this.initiated = utils.eventType[e.type];
      this.moved = false;
      this.distX = 0;
      this.distY = 0;
      this.directionX = 0;
      this.directionY = 0;
      this.directionLocked = 0;

      this._transitionTime();

      this.startTime = Mobird.now();

      if (this.options.useTransition && this.isInTransition) {
        this.isInTransition = false;
        pos = this.getComputedPosition();
        this._translate(Math.round(pos.x), Math.round(pos.y));
        this._execEvent('scrollEnd');
      } else if (!this.options.useTransition && this.isAnimating) {
        this.isAnimating = false;
        this._execEvent('scrollEnd');
      }

      this.startX = this.x;
      this.startY = this.y;
      this.absStartX = this.x;
      this.absStartY = this.y;
      this.pointX = point.pageX;
      this.pointY = point.pageY;

      this._execEvent('beforeScrollStart');
    },

    _move: function(e) {
      if (!this.enabled || utils.eventType[e.type] !== this.initiated) {
        return;
      }

      if (this.options.preventDefault) { // increases performance on Android? TODO: check!
        e.preventDefault();
      }

      var point = e.touches ? e.touches[0] : e,
        deltaX = point.pageX - this.pointX,
        deltaY = point.pageY - this.pointY,
        timestamp = Mobird.now(),
        newX, newY,
        absDistX, absDistY;

      this.pointX = point.pageX;
      this.pointY = point.pageY;

      this.distX += deltaX;
      this.distY += deltaY;
      absDistX = Math.abs(this.distX);
      absDistY = Math.abs(this.distY);

      // We need to move at least 10 pixels for the scrolling to initiate
      if (timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10)) {
        return;
      }

      // If you are scrolling in one direction lock the other
      if (!this.directionLocked && !this.options.freeScroll) {
        if (absDistX > absDistY + this.options.directionLockThreshold) {
          this.directionLocked = 'h'; // lock horizontally
        } else if (absDistY >= absDistX + this.options.directionLockThreshold) {
          this.directionLocked = 'v'; // lock vertically
        } else {
          this.directionLocked = 'n'; // no lock
        }
      }

      if (this.directionLocked == 'h') {
        if (this.options.eventPassthrough == 'vertical') {
          e.preventDefault();
        } else if (this.options.eventPassthrough == 'horizontal') {
          this.initiated = false;
          return;
        }

        deltaY = 0;
      } else if (this.directionLocked == 'v') {
        if (this.options.eventPassthrough == 'horizontal') {
          e.preventDefault();
        } else if (this.options.eventPassthrough == 'vertical') {
          this.initiated = false;
          return;
        }

        deltaX = 0;
      }

      deltaX = this.hasHorizontalScroll ? deltaX : 0;
      deltaY = this.hasVerticalScroll ? deltaY : 0;

      newX = this.x + deltaX;
      newY = this.y + deltaY;

      // Slow down if outside of the boundaries
      if (newX > 0 || newX < this.maxScrollX) {
        newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
      }
      if (newY > 0 || newY < this.maxScrollY) {
        newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
      }

      this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
      this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

      if (!this.moved) {
        this._execEvent('scrollStart');
      }

      this.moved = true;

      this._translate(newX, newY);

      /* REPLACE START: _move */

      if (timestamp - this.startTime > 300) {
        this.startTime = timestamp;
        this.startX = this.x;
        this.startY = this.y;
      }

      /* REPLACE END: _move */

    },

    _end: function(e) {
      if (!this.enabled || utils.eventType[e.type] !== this.initiated) {
        return;
      }

      if (this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException)) {
        e.preventDefault();
      }

      var point = e.changedTouches ? e.changedTouches[0] : e,
        momentumX,
        momentumY,
        duration = Mobird.now() - this.startTime,
        newX = Math.round(this.x),
        newY = Math.round(this.y),
        distanceX = Math.abs(newX - this.startX),
        distanceY = Math.abs(newY - this.startY),
        time = 0,
        easing = '';

      this.isInTransition = 0;
      this.initiated = 0;
      this.endTime = Mobird.now();

      // reset if we are outside of the boundaries
      if (this.resetPosition(this.options.bounceTime)) {
        return;
      }

      this.scrollTo(newX, newY); // ensures that the last position is rounded

      // we scrolled less than 10 pixels
      if (!this.moved) {
        if (this.options.tap) {
          utils.tap(e, this.options.tap);
        }

        if (this.options.click) {
          utils.click(e);
        }

        this._execEvent('scrollCancel');
        return;
      }

      if (this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100) {
        this._execEvent('flick');
        return;
      }

      // start momentum animation if needed
      if (this.options.momentum && duration < 300) {
        momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : {
          destination: newX,
          duration: 0
        };
        momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : {
          destination: newY,
          duration: 0
        };
        newX = momentumX.destination;
        newY = momentumY.destination;
        time = Math.max(momentumX.duration, momentumY.duration);
        this.isInTransition = 1;
      }


      if (this.options.snap) {
        var snap = this._nearestSnap(newX, newY);
        this.currentPage = snap;
        time = this.options.snapSpeed || Math.max(
            Math.max(
              Math.min(Math.abs(newX - snap.x), 1000),
              Math.min(Math.abs(newY - snap.y), 1000)
            ), 300);
        newX = snap.x;
        newY = snap.y;

        this.directionX = 0;
        this.directionY = 0;
        easing = this.options.bounceEasing;
      }

      // INSERT POINT: _end

      if (newX != this.x || newY != this.y) {
        // change easing function when scroller goes out of the boundaries
        if (newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY) {
          easing = utils.ease.quadratic;
        }

        this.scrollTo(newX, newY, time, easing);
        return;
      }

      this._execEvent('scrollEnd');
    },

    _resize: function() {
      var that = this;

      clearTimeout(this.resizeTimeout);

      this.resizeTimeout = setTimeout(function() {
        that.refresh();
      }, this.options.resizePolling);
    },

    resetPosition: function(time) {
      var x = this.x,
        y = this.y;

      time = time || 0;

      if (!this.hasHorizontalScroll || this.x > 0) {
        x = 0;
      } else if (this.x < this.maxScrollX) {
        x = this.maxScrollX;
      }

      if (!this.hasVerticalScroll || this.y > 0) {
        y = 0;
      } else if (this.y < this.maxScrollY) {
        y = this.maxScrollY;
      }

      if (x == this.x && y == this.y) {
        return false;
      }

      this.scrollTo(x, y, time, this.options.bounceEasing);

      return true;
    },

    disable: function() {
      this.enabled = false;
    },

    enable: function() {
      this.enabled = true;
    },

    refresh: function() {
      var rf = this.wrapper.offsetHeight; // Force reflow

      this.wrapperWidth = this.wrapper.clientWidth;
      this.wrapperHeight = this.wrapper.clientHeight;

      /* REPLACE START: refresh */

      this.scrollerWidth = this.scroller.offsetWidth;
      this.scrollerHeight = this.scroller.offsetHeight;

      this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
      this.maxScrollY = this.wrapperHeight - this.scrollerHeight;

      /* REPLACE END: refresh */

      this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0;
      this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0;

      if (!this.hasHorizontalScroll) {
        this.maxScrollX = 0;
        this.scrollerWidth = this.wrapperWidth;
      }

      if (!this.hasVerticalScroll) {
        this.maxScrollY = 0;
        this.scrollerHeight = this.wrapperHeight;
      }

      this.endTime = 0;
      this.directionX = 0;
      this.directionY = 0;

      this.wrapperOffset = utils.offset(this.wrapper);

      this._execEvent('refresh');

      this.resetPosition();

      // INSERT POINT: _refresh

    },

    on: function(type, fn) {
      if (!this._events[type]) {
        this._events[type] = [];
      }

      this._events[type].push(fn);
    },

    off: function(type, fn) {
      if (!this._events[type]) {
        return;
      }

      var index = this._events[type].indexOf(fn);

      if (index > -1) {
        this._events[type].splice(index, 1);
      }
    },

    _execEvent: function(type) {
      if (!this._events[type]) {
        return;
      }

      var i = 0,
        l = this._events[type].length;

      if (!l) {
        return;
      }

      for (; i < l; i++) {
        this._events[type][i].apply(this, [].slice.call(arguments, 1));
      }
    },

    scrollBy: function(x, y, time, easing) {
      x = this.x + x;
      y = this.y + y;
      time = time || 0;

      this.scrollTo(x, y, time, easing);
    },

    scrollTo: function(x, y, time, easing) {
      easing = easing || utils.ease.circular;

      this.isInTransition = this.options.useTransition && time > 0;

      if (!time || (this.options.useTransition && easing.style)) {
        this._transitionTimingFunction(easing.style);
        this._transitionTime(time);
        this._translate(x, y);
      } else {
        this._animate(x, y, time, easing.fn);
      }
    },

    scrollToElement: function(el, time, offsetX, offsetY, easing) {
      el = el.nodeType ? el : this.scroller.querySelector(el);

      if (!el) {
        return;
      }

      var pos = utils.offset(el);

      pos.left -= this.wrapperOffset.left;
      pos.top -= this.wrapperOffset.top;

      // if offsetX/Y are true we center the element to the screen
      if (offsetX === true) {
        offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
      }
      if (offsetY === true) {
        offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
      }

      pos.left -= offsetX || 0;
      pos.top -= offsetY || 0;

      pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
      pos.top = pos.top > 0 ? 0 : pos.top < this.maxScrollY ? this.maxScrollY : pos.top;

      time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x - pos.left), Math.abs(this.y - pos.top)) : time;

      this.scrollTo(pos.left, pos.top, time, easing);
    },

    _transitionTime: function(time) {
      time = time || 0;

      this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

      if (!time && utils.isBadAndroid) {
        this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
      }


      if (this.indicators) {
        for (var i = this.indicators.length; i--;) {
          this.indicators[i].transitionTime(time);
        }
      }


      // INSERT POINT: _transitionTime

    },

    _transitionTimingFunction: function(easing) {
      this.scrollerStyle[utils.style.transitionTimingFunction] = easing;


      if (this.indicators) {
        for (var i = this.indicators.length; i--;) {
          this.indicators[i].transitionTimingFunction(easing);
        }
      }


      // INSERT POINT: _transitionTimingFunction

    },

    _translate: function(x, y) {
      if (this.options.useTransform) {

        /* REPLACE START: _translate */

        this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

        /* REPLACE END: _translate */

      } else {
        x = Math.round(x);
        y = Math.round(y);
        this.scrollerStyle.left = x + 'px';
        this.scrollerStyle.top = y + 'px';
      }

      this.x = x;
      this.y = y;


      if (this.indicators) {
        for (var i = this.indicators.length; i--;) {
          this.indicators[i].updatePosition();
        }
      }


      // INSERT POINT: _translate

    },

    _initEvents: function(remove) {
      var eventType = remove ? utils.removeEvent : utils.addEvent,
        target = this.options.bindToWrapper ? this.wrapper : window;

      eventType(window, 'orientationchange', this);
      eventType(window, 'resize', this);

      if (this.options.click) {
        eventType(this.wrapper, 'click', this, true);
      }

      if (!this.options.disableMouse) {
        eventType(this.wrapper, 'mousedown', this);
        eventType(target, 'mousemove', this);
        eventType(target, 'mousecancel', this);
        eventType(target, 'mouseup', this);
      }

      if (utils.hasPointer && !this.options.disablePointer) {
        eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
        eventType(target, utils.prefixPointerEvent('pointermove'), this);
        eventType(target, utils.prefixPointerEvent('pointercancel'), this);
        eventType(target, utils.prefixPointerEvent('pointerup'), this);
      }

      if (utils.hasTouch && !this.options.disableTouch) {
        eventType(this.wrapper, 'touchstart', this);
        eventType(target, 'touchmove', this);
        eventType(target, 'touchcancel', this);
        eventType(target, 'touchend', this);
      }

      eventType(this.scroller, 'transitionend', this);
      eventType(this.scroller, 'webkitTransitionEnd', this);
      eventType(this.scroller, 'oTransitionEnd', this);
      eventType(this.scroller, 'MSTransitionEnd', this);
    },

    getComputedPosition: function() {
      var matrix = window.getComputedStyle(this.scroller, null),
        x, y;

      if (this.options.useTransform) {
        matrix = matrix[utils.style.transform].split(')')[0].split(', ');
        x = +(matrix[12] || matrix[4]);
        y = +(matrix[13] || matrix[5]);
      } else {
        x = +matrix.left.replace(/[^-\d.]/g, '');
        y = +matrix.top.replace(/[^-\d.]/g, '');
      }

      return {
        x: x,
        y: y
      };
    },

    _initIndicators: function() {
      var interactive = this.options.interactiveScrollbars,
        customStyle = typeof this.options.scrollbars != 'string',
        indicators = [],
        indicator;

      var that = this;

      this.indicators = [];

      if (this.options.scrollbars) {
        // Vertical scrollbar
        if (this.options.scrollY) {
          indicator = {
            el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
            interactive: interactive,
            defaultScrollbars: true,
            customStyle: customStyle,
            resize: this.options.resizeScrollbars,
            shrink: this.options.shrinkScrollbars,
            fade: this.options.fadeScrollbars,
            listenX: false
          };

          this.wrapper.appendChild(indicator.el);
          indicators.push(indicator);
        }

        // Horizontal scrollbar
        if (this.options.scrollX) {
          indicator = {
            el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
            interactive: interactive,
            defaultScrollbars: true,
            customStyle: customStyle,
            resize: this.options.resizeScrollbars,
            shrink: this.options.shrinkScrollbars,
            fade: this.options.fadeScrollbars,
            listenY: false
          };

          this.wrapper.appendChild(indicator.el);
          indicators.push(indicator);
        }
      }

      if (this.options.indicators) {
        // TODO: check concat compatibility
        indicators = indicators.concat(this.options.indicators);
      }

      for (var i = indicators.length; i--;) {
        this.indicators.push(new Indicator(this, indicators[i]));
      }

      // TODO: check if we can use array.map (wide compatibility and performance issues)
      function _indicatorsMap(fn) {
        for (var i = that.indicators.length; i--;) {
          fn.call(that.indicators[i]);
        }
      }

      if (this.options.fadeScrollbars) {
        this.on('scrollEnd', function() {
          _indicatorsMap(function() {
            this.fade();
          });
        });

        this.on('scrollCancel', function() {
          _indicatorsMap(function() {
            this.fade();
          });
        });

        this.on('scrollStart', function() {
          _indicatorsMap(function() {
            this.fade(1);
          });
        });

        this.on('beforeScrollStart', function() {
          _indicatorsMap(function() {
            this.fade(1, true);
          });
        });
      }


      this.on('refresh', function() {
        _indicatorsMap(function() {
          this.refresh();
        });
      });

      this.on('destroy', function() {
        _indicatorsMap(function() {
          this.destroy();
        });

        delete this.indicators;
      });
    },

    _initWheel: function() {
      utils.addEvent(this.wrapper, 'wheel', this);
      utils.addEvent(this.wrapper, 'mousewheel', this);
      utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

      this.on('destroy', function() {
        utils.removeEvent(this.wrapper, 'wheel', this);
        utils.removeEvent(this.wrapper, 'mousewheel', this);
        utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
      });
    },

    _wheel: function(e) {
      if (!this.enabled) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      var wheelDeltaX, wheelDeltaY,
        newX, newY,
        that = this;

      if (this.wheelTimeout === undefined) {
        that._execEvent('scrollStart');
      }

      // Execute the scrollEnd event after 400ms the wheel stopped scrolling
      clearTimeout(this.wheelTimeout);
      this.wheelTimeout = setTimeout(function() {
        that._execEvent('scrollEnd');
        that.wheelTimeout = undefined;
      }, 400);

      if ('deltaX' in e) {
        if (e.deltaMode === 1) {
          wheelDeltaX = -e.deltaX * this.options.mouseWheelSpeed;
          wheelDeltaY = -e.deltaY * this.options.mouseWheelSpeed;
        } else {
          wheelDeltaX = -e.deltaX;
          wheelDeltaY = -e.deltaY;
        }
      } else if ('wheelDeltaX' in e) {
        wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
        wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
      } else if ('wheelDelta' in e) {
        wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
      } else if ('detail' in e) {
        wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
      } else {
        return;
      }

      wheelDeltaX *= this.options.invertWheelDirection;
      wheelDeltaY *= this.options.invertWheelDirection;

      if (!this.hasVerticalScroll) {
        wheelDeltaX = wheelDeltaY;
        wheelDeltaY = 0;
      }

      if (this.options.snap) {
        newX = this.currentPage.pageX;
        newY = this.currentPage.pageY;

        if (wheelDeltaX > 0) {
          newX--;
        } else if (wheelDeltaX < 0) {
          newX++;
        }

        if (wheelDeltaY > 0) {
          newY--;
        } else if (wheelDeltaY < 0) {
          newY++;
        }

        this.goToPage(newX, newY);

        return;
      }

      newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
      newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

      if (newX > 0) {
        newX = 0;
      } else if (newX < this.maxScrollX) {
        newX = this.maxScrollX;
      }

      if (newY > 0) {
        newY = 0;
      } else if (newY < this.maxScrollY) {
        newY = this.maxScrollY;
      }

      this.scrollTo(newX, newY, 0);

      // INSERT POINT: _wheel
    },

    _initSnap: function() {
      this.currentPage = {};

      if (typeof this.options.snap == 'string') {
        this.options.snap = this.scroller.querySelectorAll(this.options.snap);
      }

      this.on('refresh', function() {
        var i = 0,
          l,
          m = 0,
          n,
          cx, cy,
          x = 0,
          y,
          stepX = this.options.snapStepX || this.wrapperWidth,
          stepY = this.options.snapStepY || this.wrapperHeight,
          el;

        this.pages = [];

        if (!this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight) {
          return;
        }

        if (this.options.snap === true) {
          cx = Math.round(stepX / 2);
          cy = Math.round(stepY / 2);

          while (x > -this.scrollerWidth) {
            this.pages[i] = [];
            l = 0;
            y = 0;

            while (y > -this.scrollerHeight) {
              this.pages[i][l] = {
                x: Math.max(x, this.maxScrollX),
                y: Math.max(y, this.maxScrollY),
                width: stepX,
                height: stepY,
                cx: x - cx,
                cy: y - cy
              };

              y -= stepY;
              l++;
            }

            x -= stepX;
            i++;
          }
        } else {
          el = this.options.snap;
          l = el.length;
          n = -1;

          for (; i < l; i++) {
            if (i === 0 || el[i].offsetLeft <= el[i - 1].offsetLeft) {
              m = 0;
              n++;
            }

            if (!this.pages[m]) {
              this.pages[m] = [];
            }

            x = Math.max(-el[i].offsetLeft, this.maxScrollX);
            y = Math.max(-el[i].offsetTop, this.maxScrollY);
            cx = x - Math.round(el[i].offsetWidth / 2);
            cy = y - Math.round(el[i].offsetHeight / 2);

            this.pages[m][n] = {
              x: x,
              y: y,
              width: el[i].offsetWidth,
              height: el[i].offsetHeight,
              cx: cx,
              cy: cy
            };

            if (x > this.maxScrollX) {
              m++;
            }
          }
        }

        this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

        // Update snap threshold if needed
        if (this.options.snapThreshold % 1 === 0) {
          this.snapThresholdX = this.options.snapThreshold;
          this.snapThresholdY = this.options.snapThreshold;
        } else {
          this.snapThresholdX = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold);
          this.snapThresholdY = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold);
        }
      });

      this.on('flick', function() {
        var time = this.options.snapSpeed || Math.max(
            Math.max(
              Math.min(Math.abs(this.x - this.startX), 1000),
              Math.min(Math.abs(this.y - this.startY), 1000)
            ), 300);

        this.goToPage(
          this.currentPage.pageX + this.directionX,
          this.currentPage.pageY + this.directionY,
          time
        );
      });
    },

    _nearestSnap: function(x, y) {
      if (!this.pages.length) {
        return {
          x: 0,
          y: 0,
          pageX: 0,
          pageY: 0
        };
      }

      var i = 0,
        l = this.pages.length,
        m = 0;

      // Check if we exceeded the snap threshold
      if (Math.abs(x - this.absStartX) < this.snapThresholdX &&
        Math.abs(y - this.absStartY) < this.snapThresholdY) {
        return this.currentPage;
      }

      if (x > 0) {
        x = 0;
      } else if (x < this.maxScrollX) {
        x = this.maxScrollX;
      }

      if (y > 0) {
        y = 0;
      } else if (y < this.maxScrollY) {
        y = this.maxScrollY;
      }

      for (; i < l; i++) {
        if (x >= this.pages[i][0].cx) {
          x = this.pages[i][0].x;
          break;
        }
      }

      l = this.pages[i].length;

      for (; m < l; m++) {
        if (y >= this.pages[0][m].cy) {
          y = this.pages[0][m].y;
          break;
        }
      }

      if (i == this.currentPage.pageX) {
        i += this.directionX;

        if (i < 0) {
          i = 0;
        } else if (i >= this.pages.length) {
          i = this.pages.length - 1;
        }

        x = this.pages[i][0].x;
      }

      if (m == this.currentPage.pageY) {
        m += this.directionY;

        if (m < 0) {
          m = 0;
        } else if (m >= this.pages[0].length) {
          m = this.pages[0].length - 1;
        }

        y = this.pages[0][m].y;
      }

      return {
        x: x,
        y: y,
        pageX: i,
        pageY: m
      };
    },

    goToPage: function(x, y, time, easing) {
      easing = easing || this.options.bounceEasing;

      if (x >= this.pages.length) {
        x = this.pages.length - 1;
      } else if (x < 0) {
        x = 0;
      }

      if (y >= this.pages[x].length) {
        y = this.pages[x].length - 1;
      } else if (y < 0) {
        y = 0;
      }

      var posX = this.pages[x][y].x,
        posY = this.pages[x][y].y;

      time = time === undefined ? this.options.snapSpeed || Math.max(
        Math.max(
          Math.min(Math.abs(posX - this.x), 1000),
          Math.min(Math.abs(posY - this.y), 1000)
        ), 300) : time;

      this.currentPage = {
        x: posX,
        y: posY,
        pageX: x,
        pageY: y
      };

      this.scrollTo(posX, posY, time, easing);
    },

    next: function(time, easing) {
      var x = this.currentPage.pageX,
        y = this.currentPage.pageY;

      x++;

      if (x >= this.pages.length && this.hasVerticalScroll) {
        x = 0;
        y++;
      }

      this.goToPage(x, y, time, easing);
    },

    prev: function(time, easing) {
      var x = this.currentPage.pageX,
        y = this.currentPage.pageY;

      x--;

      if (x < 0 && this.hasVerticalScroll) {
        x = 0;
        y--;
      }

      this.goToPage(x, y, time, easing);
    },

    _initKeys: function(e) {
      // default key bindings
      var keys = {
        pageUp: 33,
        pageDown: 34,
        end: 35,
        home: 36,
        left: 37,
        up: 38,
        right: 39,
        down: 40
      };
      var i;

      // if you give me characters I give you keycode
      if (typeof this.options.keyBindings == 'object') {
        for (i in this.options.keyBindings) {
          if (typeof this.options.keyBindings[i] == 'string') {
            this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
          }
        }
      } else {
        this.options.keyBindings = {};
      }

      for (i in keys) {
        this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
      }

      utils.addEvent(window, 'keydown', this);

      this.on('destroy', function() {
        utils.removeEvent(window, 'keydown', this);
      });
    },

    _key: function(e) {
      if (!this.enabled) {
        return;
      }

      var snap = this.options.snap, // we are using this alot, better to cache it
        newX = snap ? this.currentPage.pageX : this.x,
        newY = snap ? this.currentPage.pageY : this.y,
        now = Mobird.now(),
        prevTime = this.keyTime || 0,
        acceleration = 0.250,
        pos;

      if (this.options.useTransition && this.isInTransition) {
        pos = this.getComputedPosition();

        this._translate(Math.round(pos.x), Math.round(pos.y));
        this.isInTransition = false;
      }

      this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

      switch (e.keyCode) {
        case this.options.keyBindings.pageUp:
          if (this.hasHorizontalScroll && !this.hasVerticalScroll) {
            newX += snap ? 1 : this.wrapperWidth;
          } else {
            newY += snap ? 1 : this.wrapperHeight;
          }
          break;
        case this.options.keyBindings.pageDown:
          if (this.hasHorizontalScroll && !this.hasVerticalScroll) {
            newX -= snap ? 1 : this.wrapperWidth;
          } else {
            newY -= snap ? 1 : this.wrapperHeight;
          }
          break;
        case this.options.keyBindings.end:
          newX = snap ? this.pages.length - 1 : this.maxScrollX;
          newY = snap ? this.pages[0].length - 1 : this.maxScrollY;
          break;
        case this.options.keyBindings.home:
          newX = 0;
          newY = 0;
          break;
        case this.options.keyBindings.left:
          newX += snap ? -1 : 5 + this.keyAcceleration >> 0;
          break;
        case this.options.keyBindings.up:
          newY += snap ? 1 : 5 + this.keyAcceleration >> 0;
          break;
        case this.options.keyBindings.right:
          newX -= snap ? -1 : 5 + this.keyAcceleration >> 0;
          break;
        case this.options.keyBindings.down:
          newY -= snap ? 1 : 5 + this.keyAcceleration >> 0;
          break;
        default:
          return;
      }

      if (snap) {
        this.goToPage(newX, newY);
        return;
      }

      if (newX > 0) {
        newX = 0;
        this.keyAcceleration = 0;
      } else if (newX < this.maxScrollX) {
        newX = this.maxScrollX;
        this.keyAcceleration = 0;
      }

      if (newY > 0) {
        newY = 0;
        this.keyAcceleration = 0;
      } else if (newY < this.maxScrollY) {
        newY = this.maxScrollY;
        this.keyAcceleration = 0;
      }

      this.scrollTo(newX, newY, 0);

      this.keyTime = now;
    },

    _animate: function(destX, destY, duration, easingFn) {
      var that = this,
        startX = this.x,
        startY = this.y,
        startTime = Mobird.now(),
        destTime = startTime + duration;

      function step() {
        var now = Mobird.now(),
          newX, newY,
          easing;

        if (now >= destTime) {
          that.isAnimating = false;
          that._translate(destX, destY);

          if (!that.resetPosition(that.options.bounceTime)) {
            that._execEvent('scrollEnd');
          }

          return;
        }

        now = (now - startTime) / duration;
        easing = easingFn(now);
        newX = (destX - startX) * easing + startX;
        newY = (destY - startY) * easing + startY;
        that._translate(newX, newY);

        if (that.isAnimating) {
          Mobird.requestAnimationFrame(step);
        }
      }

      this.isAnimating = true;
      step();
    },
    handleEvent: function(e) {
      switch (e.type) {
        case 'touchstart':
        case 'pointerdown':
        case 'MSPointerDown':
        case 'mousedown':
          this._start(e);
          break;
        case 'touchmove':
        case 'pointermove':
        case 'MSPointerMove':
        case 'mousemove':
          this._move(e);
          break;
        case 'touchend':
        case 'pointerup':
        case 'MSPointerUp':
        case 'mouseup':
        case 'touchcancel':
        case 'pointercancel':
        case 'MSPointerCancel':
        case 'mousecancel':
          this._end(e);
          break;
        case 'orientationchange':
        case 'resize':
          this._resize();
          break;
        case 'transitionend':
        case 'webkitTransitionEnd':
        case 'oTransitionEnd':
        case 'MSTransitionEnd':
          this._transitionEnd(e);
          break;
        case 'wheel':
        case 'DOMMouseScroll':
        case 'mousewheel':
          this._wheel(e);
          break;
        case 'keydown':
          this._key(e);
          break;
        case 'click':
          if (!e._constructed) {
            e.preventDefault();
            e.stopPropagation();
          }
          break;
      }
    }
  };

  function createDefaultScrollbar(direction, interactive, type) {
    var scrollbar = document.createElement('div'),
      indicator = document.createElement('div');

    if (type === true) {
      scrollbar.style.cssText = 'position:absolute;z-index:9999';
      indicator.style.cssText = '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
    }

    indicator.className = 'mo-scroll-bar-indicator';

    if (direction == 'h') {
      if (type === true) {
        scrollbar.style.cssText += ';height:7px;left:2px;right:2px;bottom:0';
        indicator.style.height = '100%';
      }
      scrollbar.className = 'mo-scroll-bar-h';
    } else {
      if (type === true) {
        scrollbar.style.cssText += ';width:7px;bottom:2px;top:2px;right:1px';
        indicator.style.width = '100%';
      }
      scrollbar.className = 'mo-scroll-bar-v';
    }

    scrollbar.style.cssText += ';overflow:hidden';

    if (!interactive) {
      scrollbar.style.pointerEvents = 'none';
    }

    scrollbar.appendChild(indicator);

    return scrollbar;
  }

  function Indicator(scroller, options) {
    this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
    this.wrapperStyle = this.wrapper.style;
    this.indicator = this.wrapper.children[0];
    this.indicatorStyle = this.indicator.style;
    this.scroller = scroller;

    this.options = {
      listenX: true,
      listenY: true,
      interactive: false,
      resize: true,
      defaultScrollbars: false,
      shrink: false,
      fade: false,
      speedRatioX: 0,
      speedRatioY: 0
    };

    for (var i in options) {
      this.options[i] = options[i];
    }

    this.sizeRatioX = 1;
    this.sizeRatioY = 1;
    this.maxPosX = 0;
    this.maxPosY = 0;

    if (this.options.interactive) {
      if (!this.options.disableTouch) {
        utils.addEvent(this.indicator, 'touchstart', this);
        utils.addEvent(window, 'touchend', this);
      }
      if (!this.options.disablePointer) {
        utils.addEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
        utils.addEvent(window, utils.prefixPointerEvent('pointerup'), this);
      }
      if (!this.options.disableMouse) {
        utils.addEvent(this.indicator, 'mousedown', this);
        utils.addEvent(window, 'mouseup', this);
      }
    }

    if (this.options.fade) {
      this.wrapperStyle[utils.style.transform] = this.scroller.translateZ;
      this.wrapperStyle[utils.style.transitionDuration] = utils.isBadAndroid ? '0.001s' : '0ms';
      this.wrapperStyle.opacity = '0';
    }
  }

  Indicator.prototype = {
    handleEvent: function(e) {
      switch (e.type) {
        case 'touchstart':
        case 'pointerdown':
        case 'MSPointerDown':
        case 'mousedown':
          this._start(e);
          break;
        case 'touchmove':
        case 'pointermove':
        case 'MSPointerMove':
        case 'mousemove':
          this._move(e);
          break;
        case 'touchend':
        case 'pointerup':
        case 'MSPointerUp':
        case 'mouseup':
        case 'touchcancel':
        case 'pointercancel':
        case 'MSPointerCancel':
        case 'mousecancel':
          this._end(e);
          break;
      }
    },

    destroy: function() {
      if (this.options.interactive) {
        utils.removeEvent(this.indicator, 'touchstart', this);
        utils.removeEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
        utils.removeEvent(this.indicator, 'mousedown', this);

        utils.removeEvent(window, 'touchmove', this);
        utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
        utils.removeEvent(window, 'mousemove', this);

        utils.removeEvent(window, 'touchend', this);
        utils.removeEvent(window, utils.prefixPointerEvent('pointerup'), this);
        utils.removeEvent(window, 'mouseup', this);
      }

      if (this.options.defaultScrollbars) {
        this.wrapper.parentNode.removeChild(this.wrapper);
      }
    },

    _start: function(e) {
      var point = e.touches ? e.touches[0] : e;

      e.preventDefault();
      e.stopPropagation();

      this.transitionTime();

      this.initiated = true;
      this.moved = false;
      this.lastPointX = point.pageX;
      this.lastPointY = point.pageY;

      this.startTime = Mobird.now();

      if (!this.options.disableTouch) {
        utils.addEvent(window, 'touchmove', this);
      }
      if (!this.options.disablePointer) {
        utils.addEvent(window, utils.prefixPointerEvent('pointermove'), this);
      }
      if (!this.options.disableMouse) {
        utils.addEvent(window, 'mousemove', this);
      }

      this.scroller._execEvent('beforeScrollStart');
    },

    _move: function(e) {
      var point = e.touches ? e.touches[0] : e,
        deltaX, deltaY,
        newX, newY,
        timestamp = Mobird.now();

      if (!this.moved) {
        this.scroller._execEvent('scrollStart');
      }

      this.moved = true;

      deltaX = point.pageX - this.lastPointX;
      this.lastPointX = point.pageX;

      deltaY = point.pageY - this.lastPointY;
      this.lastPointY = point.pageY;

      newX = this.x + deltaX;
      newY = this.y + deltaY;

      this._pos(newX, newY);

      // INSERT POINT: indicator._move

      e.preventDefault();
      e.stopPropagation();
    },

    _end: function(e) {
      if (!this.initiated) {
        return;
      }

      this.initiated = false;

      e.preventDefault();
      e.stopPropagation();

      utils.removeEvent(window, 'touchmove', this);
      utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
      utils.removeEvent(window, 'mousemove', this);

      if (this.scroller.options.snap) {
        var snap = this.scroller._nearestSnap(this.scroller.x, this.scroller.y);

        var time = this.options.snapSpeed || Math.max(
            Math.max(
              Math.min(Math.abs(this.scroller.x - snap.x), 1000),
              Math.min(Math.abs(this.scroller.y - snap.y), 1000)
            ), 300);

        if (this.scroller.x != snap.x || this.scroller.y != snap.y) {
          this.scroller.directionX = 0;
          this.scroller.directionY = 0;
          this.scroller.currentPage = snap;
          this.scroller.scrollTo(snap.x, snap.y, time, this.scroller.options.bounceEasing);
        }
      }

      if (this.moved) {
        this.scroller._execEvent('scrollEnd');
      }
    },

    transitionTime: function(time) {
      time = time || 0;
      this.indicatorStyle[utils.style.transitionDuration] = time + 'ms';

      if (!time && utils.isBadAndroid) {
        this.indicatorStyle[utils.style.transitionDuration] = '0.001s';
      }
    },

    transitionTimingFunction: function(easing) {
      this.indicatorStyle[utils.style.transitionTimingFunction] = easing;
    },

    refresh: function() {
      this.transitionTime();

      if (this.options.listenX && !this.options.listenY) {
        this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
      } else if (this.options.listenY && !this.options.listenX) {
        this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
      } else {
        this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
      }

      if (this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll) {

        utils.addClass(this.wrapper, 'mo-scroll-bar');
        utils.addClass(this.wrapper, 'mo-scroll-bar-both');
        utils.removeClass(this.wrapper, 'iScrollLoneScrollbar');

        if (this.options.defaultScrollbars && this.options.customStyle) {
          if (this.options.listenX) {
            this.wrapper.style.right = '8px';
          } else {
            this.wrapper.style.bottom = '8px';
          }
        }
      } else {
        utils.addClass(this.wrapper, 'mo-scroll-bar');
        utils.removeClass(this.wrapper, 'mo-scroll-bar-both');
        utils.addClass(this.wrapper, 'mo-scroll-bar-lo');

        if (this.options.defaultScrollbars && this.options.customStyle) {
          if (this.options.listenX) {
            this.wrapper.style.right = '2px';
          } else {
            this.wrapper.style.bottom = '2px';
          }
        }
      }

      var r = this.wrapper.offsetHeight; // force refresh

      if (this.options.listenX) {
        this.wrapperWidth = this.wrapper.clientWidth;
        if (this.options.resize) {
          this.indicatorWidth = Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8);
          this.indicatorStyle.width = this.indicatorWidth + 'px';
        } else {
          this.indicatorWidth = this.indicator.clientWidth;
        }

        this.maxPosX = this.wrapperWidth - this.indicatorWidth;

        if (this.options.shrink == 'clip') {
          this.minBoundaryX = -this.indicatorWidth + 8;
          this.maxBoundaryX = this.wrapperWidth - 8;
        } else {
          this.minBoundaryX = 0;
          this.maxBoundaryX = this.maxPosX;
        }

        this.sizeRatioX = this.options.speedRatioX || (this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX));
      }

      if (this.options.listenY) {
        this.wrapperHeight = this.wrapper.clientHeight;
        if (this.options.resize) {
          this.indicatorHeight = Math.max(Math.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1)), 8);
          this.indicatorStyle.height = this.indicatorHeight + 'px';
        } else {
          this.indicatorHeight = this.indicator.clientHeight;
        }

        this.maxPosY = this.wrapperHeight - this.indicatorHeight;

        if (this.options.shrink == 'clip') {
          this.minBoundaryY = -this.indicatorHeight + 8;
          this.maxBoundaryY = this.wrapperHeight - 8;
        } else {
          this.minBoundaryY = 0;
          this.maxBoundaryY = this.maxPosY;
        }

        this.maxPosY = this.wrapperHeight - this.indicatorHeight;
        this.sizeRatioY = this.options.speedRatioY || (this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY));
      }

      this.updatePosition();
    },

    updatePosition: function() {
      var x = this.options.listenX && Math.round(this.sizeRatioX * this.scroller.x) || 0,
        y = this.options.listenY && Math.round(this.sizeRatioY * this.scroller.y) || 0;

      if (!this.options.ignoreBoundaries) {
        if (x < this.minBoundaryX) {
          if (this.options.shrink == 'scale') {
            this.width = Math.max(this.indicatorWidth + x, 8);
            this.indicatorStyle.width = this.width + 'px';
          }
          x = this.minBoundaryX;
        } else if (x > this.maxBoundaryX) {
          if (this.options.shrink == 'scale') {
            this.width = Math.max(this.indicatorWidth - (x - this.maxPosX), 8);
            this.indicatorStyle.width = this.width + 'px';
            x = this.maxPosX + this.indicatorWidth - this.width;
          } else {
            x = this.maxBoundaryX;
          }
        } else if (this.options.shrink == 'scale' && this.width != this.indicatorWidth) {
          this.width = this.indicatorWidth;
          this.indicatorStyle.width = this.width + 'px';
        }

        if (y < this.minBoundaryY) {
          if (this.options.shrink == 'scale') {
            this.height = Math.max(this.indicatorHeight + y * 3, 8);
            this.indicatorStyle.height = this.height + 'px';
          }
          y = this.minBoundaryY;
        } else if (y > this.maxBoundaryY) {
          if (this.options.shrink == 'scale') {
            this.height = Math.max(this.indicatorHeight - (y - this.maxPosY) * 3, 8);
            this.indicatorStyle.height = this.height + 'px';
            y = this.maxPosY + this.indicatorHeight - this.height;
          } else {
            y = this.maxBoundaryY;
          }
        } else if (this.options.shrink == 'scale' && this.height != this.indicatorHeight) {
          this.height = this.indicatorHeight;
          this.indicatorStyle.height = this.height + 'px';
        }
      }

      this.x = x;
      this.y = y;

      if (this.scroller.options.useTransform) {
        this.indicatorStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
      } else {
        this.indicatorStyle.left = x + 'px';
        this.indicatorStyle.top = y + 'px';
      }
    },

    _pos: function(x, y) {
      if (x < 0) {
        x = 0;
      } else if (x > this.maxPosX) {
        x = this.maxPosX;
      }

      if (y < 0) {
        y = 0;
      } else if (y > this.maxPosY) {
        y = this.maxPosY;
      }

      x = this.options.listenX ? Math.round(x / this.sizeRatioX) : this.scroller.x;
      y = this.options.listenY ? Math.round(y / this.sizeRatioY) : this.scroller.y;

      this.scroller.scrollTo(x, y);
    },

    fade: function(val, hold) {
      if (hold && !this.visible) {
        return;
      }

      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;

      var time = val ? 250 : 500,
        delay = val ? 0 : 300;

      val = val ? '1' : '0';

      this.wrapperStyle[utils.style.transitionDuration] = time + 'ms';

      this.fadeTimeout = setTimeout((function(val) {
        this.wrapperStyle.opacity = val;
        this.visible = +val;
      }).bind(this, val), delay);
    }
  };

  module.exports = Scroller;

});
Mobird.Scroller = Mobird.requireModule('modules/scroller');
Mobird.defineModule('modules/viewport', function(require, exports, module) {

  var Platform = Mobird.requireModule('modules/platform');

  var viewportTag;
  var viewportProperties = {};

  var Viewport = {
    orientation: function () {
      // 0 = Portrait
      // 90 = Landscape
      // not using window.orientation because each device has a different implementation
      return (window.innerWidth > window.innerHeight ? 90 : 0);
    },
    update: viewportLoadTag
  };

  function viewportLoadTag() {
    var x;

    for (x = 0; x < document.head.children.length; x++) {
      if (document.head.children[x].name == 'viewport') {
        viewportTag = document.head.children[x];
        break;
      }
    }

    if (viewportTag) {
      var props = viewportTag.content.toLowerCase().replace(/\s+/g, '').split(',');
      var keyValue;
      for (x = 0; x < props.length; x++) {
        if (props[x]) {
          keyValue = props[x].split('=');
          viewportProperties[keyValue[0]] = (keyValue.length > 1 ? keyValue[1] : '_');
        }
      }
      viewportUpdate();
    }
  }

  function viewportUpdate() {
    var initWidth = viewportProperties.width;
    var initHeight = viewportProperties.height;
    var version = Platform.version();
    var DEVICE_WIDTH = 'device-width';
    var DEVICE_HEIGHT = 'device-height';
    var orientation = Viewport.orientation();

    // Most times we're removing the height and adding the width
    // So this is the default to start with, then modify per platform/version/oreintation
    delete viewportProperties.height;
    viewportProperties.width = DEVICE_WIDTH;

    if (Platform.isIPad()) {
      // iPad

      if (version > 7) {
        // iPad >= 7.1
        // https://issues.apache.org/jira/browse/CB-4323
        delete viewportProperties.width;

      } else {
        // iPad <= 7.0

        if (Platform.isWebView()) {
          // iPad <= 7.0 WebView

          if (orientation == 90) {
            // iPad <= 7.0 WebView Landscape
            viewportProperties.height = '0';

          } else if (version == 7) {
            // iPad <= 7.0 WebView Portait
            viewportProperties.height = DEVICE_HEIGHT;
          }
        } else {
          // iPad <= 6.1 Browser
          if (version < 7) {
            viewportProperties.height = '0';
          }
        }
      }

    } else if (Platform.isIOS()) {
      // iPhone

      if (Platform.isWebView()) {
        // iPhone WebView

        if (version > 7) {
          // iPhone >= 7.1 WebView
          delete viewportProperties.width;

        } else if (version < 7) {
          // iPhone <= 6.1 WebView
          // if height was set it needs to get removed with this hack for <= 6.1
          if (initHeight) viewportProperties.height = '0';

        } else if (version == 7) {
          //iPhone == 7.0 WebView
          viewportProperties.height = DEVICE_HEIGHT;
        }

      } else {
        // iPhone Browser

        if (version < 7) {
          // iPhone <= 6.1 Browser
          // if height was set it needs to get removed with this hack for <= 6.1
          if (initHeight) viewportProperties.height = '0';
        }
      }

    }

    // only update the Viewport tag if there was a change
    if (initWidth !== viewportProperties.width || initHeight !== viewportProperties.height) {
      viewportTagUpdate();
    }
  }

  function viewportTagUpdate() {
    var key, props = [];
    for (key in viewportProperties) {
      if (viewportProperties[key]) {
        props.push(key + (viewportProperties[key] == '_' ? '' : '=' + viewportProperties[key]));
      }
    }

    viewportTag.content = props.join(', ');
  }

  Viewport.initialize = function () {

    viewportLoadTag();

    window.addEventListener('orientationchange', function () {
      setTimeout(viewportUpdate, 1000);
    }, false);

  };

  module.exports = Viewport;

});
Mobird.Viewport = Mobird.requireModule('modules/viewport');
Mobird.initializeViewport = function() {
  Mobird.Viewport.initialize();
};
Mobird.defineModule('modules/swipe', function(require, exports, module) {

  // https://github.com/thebird/Swipe/blob/master/swipe.js
  function Swipe(container, options) {

    var offloadFn = function (fn) {
      setTimeout(fn || Mobird.noop, 0);
    };

    // quit if no root element
    if (!container) {
      return;
    }
    var element = container.children[0];
    var slides, slidePos, width;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 300;

    function setup() {

      // cache slides
      slides = element.children;

      // create an array to store current positions of each slide
      slidePos = new Array(slides.length);

      // determine width of each slide
      width = container.getBoundingClientRect().width || container.offsetWidth;

      element.style.width = (slides.length * width) + 'px';

      // stack elements
      var pos = slides.length;
      while (pos--) {

        var slide = slides[pos];

        slide.style.width = width + 'px';
        slide.setAttribute('data-index', pos);

        if (Support.transitions) {
          slide.style.left = (pos * -width) + 'px';
          move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
        }

      }

      if (!Support.transitions) {
        element.style.left = (index * -width) + 'px';
      }

      container.style.visibility = 'visible';

    }

    function prev() {

      if (index) {
        slide(index - 1);
      } else if (options.continuous) {
        slide(slides.length - 1);
      }

    }

    function next() {

      if (index < slides.length - 1) {
        slide(index + 1);
      } else if (options.continuous) {
        slide(0);
      }

    }

    function slide(to, slideSpeed) {

      // do nothing if already on requested slide
      if (index == to) {
        return;
      }

      if (Support.transitions) {

        var diff = Math.abs(index - to) - 1;
        var direction = Math.abs(index - to) / (index - to); // 1:right -1:left

        while (diff--) {
          move((to > index ? to : index) - diff - 1, width * direction, 0);
        }

        move(index, width * direction, slideSpeed || speed);
        move(to, 0, slideSpeed || speed);

      } else {

        animate(index * -width, to * -width, slideSpeed || speed);

      }

      index = to;

      offloadFn(options.callback && options.callback(index, slides[index]));

    }

    function move(index, dist, speed) {

      translate(index, dist, speed);
      slidePos[index] = dist;

    }

    function translate(index, dist, speed) {

      var slide = slides[index];
      var style = slide && slide.style;

      if (!style) {
        return;
      }

      style.webkitTransitionDuration =
        style.MozTransitionDuration =
          style.msTransitionDuration =
            style.OTransitionDuration =
              style.transitionDuration = speed + 'ms';

      style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
      style.msTransform =
        style.MozTransform =
          style.OTransform = 'translateX(' + dist + 'px)';

    }

    function animate(from, to, speed) {

      // if not an animation, just reposition
      if (!speed) {

        element.style.left = to + 'px';
        return;

      }

      var start = +new Date;

      var timer = setInterval(function () {

        var timeElap = +new Date - start;

        if (timeElap > speed) {

          element.style.left = to + 'px';

          if (delay) begin();

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

          clearInterval(timer);
          return;

        }

        element.style.left = (((to - from) * (Math.floor((timeElap / speed) * 100) / 100)) + from) + 'px';

      }, 4);

    }

    // setup auto slideshow
    var delay = options.auto || 0;
    var interval;

    function begin() {

      interval = setTimeout(next, delay);

    }

    function stop() {

      delay = 0;
      clearTimeout(interval);

    }


    // setup initial vars
    var start = {};
    var delta = {};
    var isScrolling;

    // setup event capturing
    var events = {

      handleEvent: function (event) {

        switch (event.type) {
          case 'touchstart':
            this.start(event);
            break;
          case 'touchmove':
            this.move(event);
            break;
          case 'touchend':
            offloadFn(this.end(event));
            break;
          case 'webkitTransitionEnd':
          case 'msTransitionEnd':
          case 'oTransitionEnd':
          case 'otransitionend':
          case 'transitionend':
            offloadFn(this.transitionEnd(event));
            break;
          case 'resize':
            offloadFn(setup.call());
            break;
        }

        if (options.stopPropagation) {
          event.stopPropagation();
        }

      },
      start: function (event) {

        var touches = event.touches[0];

        // measure start values
        start = {

          // get initial touch coords
          x: touches.pageX,
          y: touches.pageY,

          // store time to determine touch duration
          time: +new Date

        };

        // used for testing first move event
        isScrolling = undefined;

        // reset delta and end measurements
        delta = {};

        // attach touchmove and touchend listeners
        element.addEventListener('touchmove', this, false);
        element.addEventListener('touchend', this, false);

      },
      move: function (event) {

        // ensure swiping with one touch and not pinching
        if (event.touches.length > 1 || event.scale && event.scale !== 1) {
          return;
        }

        if (options.disableScroll) {
          event.preventDefault();
        }

        var touches = event.touches[0];

        // measure change in x and y
        delta = {
          x: touches.pageX - start.x,
          y: touches.pageY - start.y
        };

        // determine if scrolling test has run - one time test
        if (typeof isScrolling == 'undefined') {
          isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
        }

        // if user is not trying to scroll vertically
        if (!isScrolling) {

          // prevent native scrolling
          event.preventDefault();

          // stop slideshow
          stop();

          // increase resistance if first or last slide
          delta.x =
            delta.x /
            ((!index && delta.x > 0 // if first slide and sliding left
              || index == slides.length - 1 // or if last slide and sliding right
              && delta.x < 0 // and if sliding at all
            ) ?
              (Math.abs(delta.x) / width + 1) // determine resistance level
              : 1); // no resistance if false

          // translate 1:1
          translate(index - 1, delta.x + slidePos[index - 1], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(index + 1, delta.x + slidePos[index + 1], 0);

        }

      },
      end: function (event) {

        // measure duration
        var duration = +new Date - start.time;

        // determine if slide attempt triggers next/prev slide
        var isValidSlide =
          Number(duration) < 250 // if slide duration is less than 250ms
          && Math.abs(delta.x) > 20 // and if slide amt is greater than 20px
          || Math.abs(delta.x) > width / 2; // or if slide amt is greater than half the width

        // determine if slide attempt is past start and end
        var isPastBounds = !index && delta.x > 0 // if first slide and slide amt is greater than 0
          || index == slides.length - 1 && delta.x < 0; // or if last slide and slide amt is less than 0

        // determine direction of swipe (true:right, false:left)
        var direction = delta.x < 0;

        // if not scrolling vertically
        if (!isScrolling) {

          if (isValidSlide && !isPastBounds) {

            if (direction) {

              move(index - 1, -width, 0);
              move(index, slidePos[index] - width, speed);
              move(index + 1, slidePos[index + 1] - width, speed);
              index += 1;

            } else {

              move(index + 1, width, 0);
              move(index, slidePos[index] + width, speed);
              move(index - 1, slidePos[index - 1] + width, speed);
              index += -1;

            }

            options.callback && options.callback(index, slides[index]);

          } else {

            move(index - 1, -width, speed);
            move(index, 0, speed);
            move(index + 1, width, speed);

          }

        }

        // kill touchmove and touchend event listeners until touchstart called again
        element.removeEventListener('touchmove', events, false);
        element.removeEventListener('touchend', events, false);

      },
      transitionEnd: function (event) {

        if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

          if (delay) begin();

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        }

      }

    };

    // trigger setup
    setup();

    // start auto slideshow if applicable
    if (delay) {
      begin();
    }


    // add event listeners
    if (Support.addEventListener) {

      // set touchstart event on element
      if (Support.touch) element.addEventListener('touchstart', events, false);

      if (Support.transitions) {
        element.addEventListener('webkitTransitionEnd', events, false);
        element.addEventListener('msTransitionEnd', events, false);
        element.addEventListener('oTransitionEnd', events, false);
        element.addEventListener('otransitionend', events, false);
        element.addEventListener('transitionend', events, false);
      }

      // set resize event on window
      window.addEventListener('resize', events, false);

    } else {

      window.onresize = function () {
        setup()
      }; // to play nice with old IE

    }

    // expose the Swipe API
    return {
      setup: function () {

        setup();

      },
      slide: function (to, speed) {

        slide(to, speed);

      },
      prev: function () {

        // cancel slideshow
        stop();

        prev();

      },
      next: function () {

        stop();

        next();

      },
      getPos: function () {

        // return current index position
        return index;

      },
      kill: function () {

        // cancel slideshow
        stop();

        // reset element
        element.style.width = 'auto';
        element.style.left = 0;

        // reset slides
        var pos = slides.length;
        while (pos--) {

          var slide = slides[pos];
          slide.style.width = '100%';
          slide.style.left = 0;

          if (Support.transitions) translate(pos, 0, 0);

        }

        // removed event listeners
        if (Support.addEventListener) {

          // remove current event listeners
          element.removeEventListener('touchstart', events, false);
          element.removeEventListener('webkitTransitionEnd', events, false);
          element.removeEventListener('msTransitionEnd', events, false);
          element.removeEventListener('oTransitionEnd', events, false);
          element.removeEventListener('otransitionend', events, false);
          element.removeEventListener('transitionend', events, false);
          window.removeEventListener('resize', events, false);

        } else {

          window.onresize = null;

        }

      }
    };

  }

  module.exports = Swipe;

});
Mobird.Swipe = Mobird.requireModule('modules/swipe');
Mobird.$.fn.swipe = function (params) {
  return this.each(function () {
    Mobird.$(this).data('swipe', new Mobird.Swipe($(this)[0], params));
  });
};
Mobird.defineModule('modules/imageLazy', function(require, exports, module) {

  var ImageLazy = {};

  var callback = function () {};

  var offset, poll, delay, useDebounce, unload;

  var inView = function (element, view) {
    var box = element.getBoundingClientRect();
    return (box.right >= view.l && box.bottom >= view.t && box.left <= view.r && box.top <= view.b);
  };

  var debounceOrThrottle = function () {
    if(!useDebounce && !!poll) {
      return;
    }
    clearTimeout(poll);
    poll = setTimeout(function(){
      ImageLazy.render();
      poll = null;
    }, delay);
  };

  ImageLazy.init = function (opts) {
    opts = opts || {};
    var offsetAll = opts.offset || 0;
    var offsetVertical = opts.offsetVertical || offsetAll;
    var offsetHorizontal = opts.offsetHorizontal || offsetAll;
    var optionToInt = function (opt, fallback) {
      return parseInt(opt || fallback, 10);
    };
    offset = {
      t: optionToInt(opts.offsetTop, offsetVertical),
      b: optionToInt(opts.offsetBottom, offsetVertical),
      l: optionToInt(opts.offsetLeft, offsetHorizontal),
      r: optionToInt(opts.offsetRight, offsetHorizontal)
    };
    delay = optionToInt(opts.throttle, 250);
    useDebounce = opts.debounce !== false;
    unload = !!opts.unload;
    callback = opts.callback || callback;
    ImageLazy.render();
    if (document.addEventListener) {
      window.addEventListener('scroll', debounceOrThrottle, false);
      window.addEventListener('load', debounceOrThrottle, false);
    } else {
      window.attachEvent('onscroll', debounceOrThrottle);
      window.attachEvent('onload', debounceOrThrottle);
    }
  };

  ImageLazy.render = function () {
    var nodes = document.querySelectorAll('img[data-lazy], [data-lazy-background]');
    var length = nodes.length;
    var src, elem;
    var view = {
      l: 0 - offset.l,
      t: 0 - offset.t,
      b: (window.innerHeight || document.documentElement.clientHeight) + offset.b,
      r: (window.innerWidth || document.documentElement.clientWidth) + offset.r
    };
    for (var i = 0; i < length; i++) {
      elem = nodes[i];
      if (inView(elem, view)) {

        if (unload) {
          elem.setAttribute('data-lazy-placeholder', elem.src);
        }

        if (elem.getAttribute('data-lazy-background') !== null) {
          elem.style.backgroundImage = 'url(' + elem.getAttribute('data-lazy-background') + ')';
        }
        else {
          elem.src = elem.getAttribute('data-lazy');
        }

        if (!unload) {
          elem.removeAttribute('data-lazy');
          elem.removeAttribute('data-lazy-background');
        }

        callback(elem, 'load');
      }
      else if (unload && !!(src = elem.getAttribute('data-lazy-placeholder'))) {

        if (elem.getAttribute('data-lazy-background') !== null) {
          elem.style.backgroundImage = 'url(' + src + ')';
        }
        else {
          elem.src = src;
        }

        elem.removeAttribute('data-lazy-placeholder');
        callback(elem, 'unload');
      }
    }
    if (!length) {
      ImageLazy.detach();
    }
  };

  ImageLazy.detach = function () {
    if (document.removeEventListener) {
      window.removeEventListener('scroll', debounceOrThrottle);
    } else {
      window.detachEvent('onscroll', debounceOrThrottle);
    }
    clearTimeout(poll);
  };

  ImageLazy.initialize = function(options) {
    options = Mobird.extend({
      offset: 100,
      throttle: 250,
      unload: false,
      callback: Mobird.noop
    }, options || {});

    ImageLazy.init(options);
  };

  module.exports = ImageLazy;

});
Mobird.ImageLazy = Mobird.requireModule('modules/imageLazy');
Mobird.initializeImageLazy = function(options) {
  Mobird.ImageLazy.initialize(options);
};