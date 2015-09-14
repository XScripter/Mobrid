Mobird.identity = function(value) {
  return value;
};

Mobird.constant = function(value) {
  return function() {
    return value;
  };
};

Mobird.noop = function(){};

Mobird.property = property;

Mobird.propertyOf = function(obj) {
  return obj == null ? function(){} : function(key) {
    return obj[key];
  };
};

Mobird.matcher = Mobird.matches = function(attrs) {
  attrs = Mobird.extendOwn({}, attrs);
  return function(obj) {
    return Mobird.isMatch(obj, attrs);
  };
};

Mobird.times = function(n, iteratee, context) {
  var accum = Array(Math.max(0, n));
  iteratee = optimizeCb(iteratee, context, 1);
  for (var i = 0; i < n; i++) accum[i] = iteratee(i);
  return accum;
};

Mobird.random = function(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
};

Mobird.now = Date.now || function() {
    return new Date().getTime();
  };

// List of HTML entities for escaping.
var escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;'
};
var unescapeMap = Mobird.invert(escapeMap);

var createEscaper = function(map) {
  var escaper = function(match) {
    return map[match];
  };
  var source = '(?:' + Mobird.keys(map).join('|') + ')';
  var testRegexp = RegExp(source);
  var replaceRegexp = RegExp(source, 'g');
  return function(string) {
    string = string == null ? '' : '' + string;
    return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
  };
};
Mobird.escape = createEscaper(escapeMap);
Mobird.unescape = createEscaper(unescapeMap);

Mobird.result = function(object, property, fallback) {
  var value = object == null ? void 0 : object[property];
  if (value === void 0) {
    value = fallback;
  }
  return Mobird.isFunction(value) ? value.call(object) : value;
};

var idCounter = 0;
Mobird.uniqueId = function(prefix) {
  var id = ++idCounter + '';
  return prefix ? prefix + id : id;
};

Mobird.chain = function(obj) {
  var instance = Mobird(obj);
  instance._chain = true;
  return instance;
};