var hasEnumBug = !{
  toString: null
}.propertyIsEnumerable('toString');
var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
  'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'
];

function collectNonEnumProps(obj, keys) {
  var nonEnumIdx = nonEnumerableProps.length;
  var constructor = obj.constructor;
  var proto = (Mobird.isFunction(constructor) && constructor.prototype) || ObjProto;

  // Constructor is a special case.
  var prop = 'constructor';
  if (Mobird.has(obj, prop) && !Mobird.contains(keys, prop)) keys.push(prop);

  while (nonEnumIdx--) {
    prop = nonEnumerableProps[nonEnumIdx];
    if (prop in obj && obj[prop] !== proto[prop] && !Mobird.contains(keys, prop)) {
      keys.push(prop);
    }
  }
}

Mobird.keys = function(obj) {
  if (!Mobird.isObject(obj)) return [];
  if (nativeKeys) return nativeKeys(obj);
  var keys = [];
  for (var key in obj)
    if (Mobird.has(obj, key)) keys.push(key);
  // Ahem, IE < 9.
  if (hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
};

Mobird.allKeys = function(obj) {
  if (!Mobird.isObject(obj)) return [];
  var keys = [];
  for (var key in obj) keys.push(key);
  // Ahem, IE < 9.
  if (hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
};

Mobird.values = function(obj) {
  var keys = Mobird.keys(obj);
  var length = keys.length;
  var values = Array(length);
  for (var i = 0; i < length; i++) {
    values[i] = obj[keys[i]];
  }
  return values;
};

Mobird.mapObject = function(obj, iteratee, context) {
  iteratee = cb(iteratee, context);
  var keys = Mobird.keys(obj),
    length = keys.length,
    results = {},
    currentKey;
  for (var index = 0; index < length; index++) {
    currentKey = keys[index];
    results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
  }
  return results;
};

Mobird.pairs = function(obj) {
  var keys = Mobird.keys(obj);
  var length = keys.length;
  var pairs = Array(length);
  for (var i = 0; i < length; i++) {
    pairs[i] = [keys[i], obj[keys[i]]];
  }
  return pairs;
};

Mobird.invert = function(obj) {
  var result = {};
  var keys = Mobird.keys(obj);
  for (var i = 0, length = keys.length; i < length; i++) {
    result[obj[keys[i]]] = keys[i];
  }
  return result;
};

Mobird.functions = function(obj) {
  var names = [];
  for (var key in obj) {
    if (Mobird.isFunction(obj[key])) names.push(key);
  }
  return names.sort();
};

Mobird.extend = createAssigner(Mobird.allKeys);

// Assigns a given object with all the own properties in the passed-in object(s)
// (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
Mobird.extendOwn = Mobird.assign = createAssigner(Mobird.keys);

Mobird.findKey = function(obj, predicate, context) {
  predicate = cb(predicate, context);
  var keys = Mobird.keys(obj),
    key;
  for (var i = 0, length = keys.length; i < length; i++) {
    key = keys[i];
    if (predicate(obj[key], key, obj)) return key;
  }
};

Mobird.pick = function(object, oiteratee, context) {
  var result = {},
    obj = object,
    iteratee, keys;
  if (obj == null) return result;
  if (Mobird.isFunction(oiteratee)) {
    keys = Mobird.allKeys(obj);
    iteratee = optimizeCb(oiteratee, context);
  } else {
    keys = flatten(arguments, false, false, 1);
    iteratee = function(value, key, obj) {
      return key in obj;
    };
    obj = Object(obj);
  }
  for (var i = 0, length = keys.length; i < length; i++) {
    var key = keys[i];
    var value = obj[key];
    if (iteratee(value, key, obj)) result[key] = value;
  }
  return result;
};

Mobird.omit = function(obj, iteratee, context) {
  if (Mobird.isFunction(iteratee)) {
    iteratee = Mobird.negate(iteratee);
  } else {
    var keys = Mobird.map(flatten(arguments, false, false, 1), String);
    iteratee = function(value, key) {
      return !Mobird.contains(keys, key);
    };
  }
  return Mobird.pick(obj, iteratee, context);
};

Mobird.defaults = createAssigner(Mobird.allKeys, true);

Mobird.create = function(prototype, props) {
  var result = baseCreate(prototype);
  if (props) Mobird.extendOwn(result, props);
  return result;
};

Mobird.clone = function(obj) {
  if (!Mobird.isObject(obj)) return obj;
  return Mobird.isArray(obj) ? obj.slice() : Mobird.extend({}, obj);
};

Mobird.tap = function(obj, interceptor) {
  interceptor(obj);
  return obj;
};

Mobird.isMatch = function(object, attrs) {
  var keys = Mobird.keys(attrs),
    length = keys.length;
  if (object == null) return !length;
  var obj = Object(object);
  for (var i = 0; i < length; i++) {
    var key = keys[i];
    if (attrs[key] !== obj[key] || !(key in obj)) return false;
  }
  return true;
};


// Internal recursive comparison function for `isEqual`.
var eq = function(a, b, aStack, bStack) {
  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
  if (a === b) return a !== 0 || 1 / a === 1 / b;
  // A strict comparison is necessary because `null == undefined`.
  if (a == null || b == null) return a === b;
  // Unwrap any wrapped objects.
  if (a instanceof Mobird) a = a._wrapped;
  if (b instanceof Mobird) b = b._wrapped;
  // Compare `[[Class]]` names.
  var className = toString.call(a);
  if (className !== toString.call(b)) return false;
  switch (className) {
    // Strings, numbers, regular expressions, dates, and booleans are compared by value.
    case '[object RegExp]':
    // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
    case '[object String]':
      // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
      // equivalent to `new String("5")`.
      return '' + a === '' + b;
    case '[object Number]':
      // `NaN`s are equivalent, but non-reflexive.
      // Object(NaN) is equivalent to NaN
      if (+a !== +a) return +b !== +b;
      // An `egal` comparison is performed for other numeric values.
      return +a === 0 ? 1 / +a === 1 / b : +a === +b;
    case '[object Date]':
    case '[object Boolean]':
      // Coerce dates and booleans to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a === +b;
  }

  var areArrays = className === '[object Array]';
  if (!areArrays) {
    if (typeof a != 'object' || typeof b != 'object') return false;

    // Objects with different constructors are not equivalent, but `Object`s or `Array`s
    // from different frames are.
    var aCtor = a.constructor,
      bCtor = b.constructor;
    if (aCtor !== bCtor && !(Mobird.isFunction(aCtor) && aCtor instanceof aCtor &&
      Mobird.isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
  }
  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

  // Initializing stack of traversed objects.
  // It's done here since we only need them for objects and arrays comparison.
  aStack = aStack || [];
  bStack = bStack || [];
  var length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (aStack[length] === a) return bStack[length] === b;
  }

  // Add the first object to the stack of traversed objects.
  aStack.push(a);
  bStack.push(b);

  // Recursively compare objects and arrays.
  if (areArrays) {
    // Compare array lengths to determine if a deep comparison is necessary.
    length = a.length;
    if (length !== b.length) return false;
    // Deep compare the contents, ignoring non-numeric properties.
    while (length--) {
      if (!eq(a[length], b[length], aStack, bStack)) return false;
    }
  } else {
    // Deep compare objects.
    var keys = Mobird.keys(a),
      key;
    length = keys.length;
    // Ensure that both objects contain the same number of properties before comparing deep equality.
    if (Mobird.keys(b).length !== length) return false;
    while (length--) {
      // Deep compare each member
      key = keys[length];
      if (!(Mobird.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop();
  bStack.pop();
  return true;
};

Mobird.isEqual = function(a, b) {
  return eq(a, b);
};

Mobird.isEmpty = function(obj) {
  if (obj == null) return true;
  if (isArrayLike(obj) && (Mobird.isArray(obj) || Mobird.isString(obj) || Mobird.isArguments(obj))) return obj.length === 0;
  return Mobird.keys(obj).length === 0;
};

Mobird.isElement = function(obj) {
  return !!(obj && obj.nodeType === 1);
};

Mobird.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

Mobird.isObject = function(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
Mobird.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
  Mobird['is' + name] = function(obj) {
    return toString.call(obj) === '[object ' + name + ']';
  };
});

// Define a fallback version of the method in browsers (ahem, IE < 9), where
// there isn't any inspectable "Arguments" type.
(function() {
  if (!Mobird.isArguments(arguments)) {
    Mobird.isArguments = function(obj) {
      return Mobird.has(obj, 'callee');
    };
  }
})();

// Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
// IE 11 (#1621), and in Safari 8 (#1929).
if (typeof /./ != 'function' && typeof Int8Array != 'object') {
  Mobird.isFunction = function(obj) {
    return typeof obj == 'function' || false;
  };
}

Mobird.isFinite = function(obj) {
  return isFinite(obj) && !isNaN(parseFloat(obj));
};

Mobird.isNaN = function(obj) {
  return Mobird.isNumber(obj) && obj !== +obj;
};

Mobird.isBoolean = function(obj) {
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
};

Mobird.isNull = function(obj) {
  return obj === null;
};

Mobird.isUndefined = function(obj) {
  return obj === void 0;
};

Mobird.has = function(obj, key) {
  return obj != null && hasOwnProperty.call(obj, key);
};

// Helper function to correctly set up the prototype chain for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
Mobird.inherits = function(protoProps, staticProps) {
  var parent = this;
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent constructor.
  if (protoProps && Mobird.has(protoProps, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ return parent.apply(this, arguments); };
  }

  // Add static properties to the constructor function, if supplied.
  Mobird.extend(child, parent, staticProps);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent` constructor function.
  var Surrogate = function(){ this.constructor = child; };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate;

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) Mobird.extend(child.prototype, protoProps);

  // Set a convenience property in case the parent's prototype is needed
  // later.
  child.__super__ = parent.prototype;

  return child;
};