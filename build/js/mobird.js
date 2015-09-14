/**
 * Mobird 0.2.0
 * Full Featured HTML5 Framework For Building Mobile Apps
 * 
 * http://www.xscripter.com/mobird/
 * 
 * Copyright 2015, Clarence Hu
 * The XScripter.com
 * http://www.xscripter.com/
 * 
 * Licensed under MIT
 * 
 * Released on: September 11, 2015
 */
(function(factory) {
  var root = (typeof self == 'object' && self.self == self && self) ||
      (typeof global == 'object' && global.global == global && global);
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], function($) {
      root.Mobird = factory(root, $);
    });
  } else {
    root.Mobird = factory(root, (root.jQuery || root.Zepto || root.ender || root.$));
  }
}(function(root, $) {

  var previousMobird = root.Mobird;
  
  var Mobird = function(obj) {
    if (obj instanceof Mobird) {
      return obj;
    }
    if (!(this instanceof Mobird)) {
      return new Mobird(obj);
    }
    this._wrapped = obj;
  };
  
  Mobird.VERSION = '0.2.0';
  
  Mobird.$ = $;
  
  Mobird.noConflict = function() {
    root.Mobird = previousMobird;
    return this;
  };

  var ArrayProto = Array.prototype,
    ObjProto = Object.prototype,
    FuncProto = Function.prototype;
  
  var push = ArrayProto.push,
    slice = ArrayProto.slice,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty;
  
  var nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeBind = FuncProto.bind,
    nativeCreate = Object.create;
  
  var Ctor = function() {};
  
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1:
        return function(value) {
          return func.call(context, value);
        };
      case 2:
        return function(value, other) {
          return func.call(context, value, other);
        };
      case 3:
        return function(value, index, collection) {
          return func.call(context, value, index, collection);
        };
      case 4:
        return function(accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };
  
  var cb = function(value, context, argCount) {
    if (value == null) return Mobird.identity;
    if (Mobird.isFunction(value)) return optimizeCb(value, context, argCount);
    if (Mobird.isObject(value)) return Mobird.matcher(value);
    return Mobird.property(value);
  };
  Mobird.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };
  
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
          keys = keysFunc(source),
          l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };
  
  var baseCreate = function(prototype) {
    if (!Mobird.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };
  
  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };
  
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  Mobird.each = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = Mobird.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };
  
  Mobird.map = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && Mobird.keys(obj),
      length = (keys || obj).length,
      results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };
  
  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }
  
    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && Mobird.keys(obj),
        length = (keys || obj).length,
        index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }
  
  Mobird.reduce = createReduce(1);
  
  Mobird.reduceRight = createReduce(-1);
  
  Mobird.find = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = Mobird.findIndex(obj, predicate, context);
    } else {
      key = Mobird.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };
  
  Mobird.filter = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    Mobird.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };
  
  Mobird.reject = function(obj, predicate, context) {
    return Mobird.filter(obj, Mobird.negate(cb(predicate)), context);
  };
  
  Mobird.every = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && Mobird.keys(obj),
      length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };
  
  Mobird.some = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && Mobird.keys(obj),
      length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };
  
  Mobird.contains = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = Mobird.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return Mobird.indexOf(obj, item, fromIndex) >= 0;
  };
  
  Mobird.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = Mobird.isFunction(method);
    return Mobird.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };
  
  Mobird.pluck = function(obj, key) {
    return Mobird.map(obj, Mobird.property(key));
  };
  
  Mobird.where = function(obj, attrs) {
    return Mobird.filter(obj, Mobird.matcher(attrs));
  };
  
  Mobird.findWhere = function(obj, attrs) {
    return Mobird.find(obj, Mobird.matcher(attrs));
  };
  
  Mobird.max = function(obj, iteratee, context) {
    var result = -Infinity,
      lastComputed = -Infinity,
      value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : Mobird.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      Mobird.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };
  
  Mobird.min = function(obj, iteratee, context) {
    var result = Infinity,
      lastComputed = Infinity,
      value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : Mobird.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      Mobird.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };
  
  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  Mobird.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : Mobird.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = Mobird.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };
  
  Mobird.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = Mobird.values(obj);
      return obj[Mobird.random(obj.length - 1)];
    }
    return Mobird.shuffle(obj).slice(0, Math.max(0, n));
  };
  
  Mobird.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return Mobird.pluck(Mobird.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };
  
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      Mobird.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };
  
  Mobird.groupBy = group(function(result, value, key) {
    if (Mobird.has(result, key)) result[key].push(value);
    else result[key] = [value];
  });
  
  Mobird.indexBy = group(function(result, value, key) {
    result[key] = value;
  });
  
  Mobird.countBy = group(function(result, value, key) {
    if (Mobird.has(result, key)) result[key]++;
    else result[key] = 1;
  });
  
  Mobird.toArray = function(obj) {
    if (!obj) return [];
    if (Mobird.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return Mobird.map(obj, Mobird.identity);
    return Mobird.values(obj);
  };
  
  Mobird.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : Mobird.keys(obj).length;
  };
  
  Mobird.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [],
      fail = [];
    Mobird.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  Mobird.first = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return Mobird.initial(array, array.length - n);
  };
  
  Mobird.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };
  
  Mobird.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return Mobird.rest(array, Math.max(0, array.length - n));
  };
  
  Mobird.rest = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };
  
  Mobird.compact = function(array) {
    return Mobird.filter(array, Mobird.identity);
  };
  
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [],
      idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (Mobird.isArray(value) || Mobird.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0,
          len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };
  
  Mobird.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };
  
  Mobird.without = function(array) {
    return Mobird.difference(array, slice.call(arguments, 1));
  };
  
  Mobird.uniq = function(array, isSorted, iteratee, context) {
    if (!Mobird.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
        computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!Mobird.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!Mobird.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };
  
  Mobird.union = function() {
    return Mobird.uniq(flatten(arguments, true, true));
  };
  
  Mobird.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (Mobird.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!Mobird.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };
  
  Mobird.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return Mobird.filter(array, function(value) {
      return !Mobird.contains(rest, value);
    });
  };
  
  Mobird.zip = function() {
    return Mobird.unzip(arguments);
  };
  
  Mobird.unzip = function(array) {
    var length = array && Mobird.max(array, getLength).length || 0;
    var result = Array(length);
  
    for (var index = 0; index < length; index++) {
      result[index] = Mobird.pluck(array, index);
    }
    return result;
  };
  
  Mobird.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };
  
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }
  
  Mobird.findIndex = createPredicateIndexFinder(1);
  Mobird.findLastIndex = createPredicateIndexFinder(-1);
  
  Mobird.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0,
      high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1;
      else high = mid;
    }
    return low;
  };
  
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0,
        length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), Mobird.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }
  
  Mobird.indexOf = createIndexFinder(1, Mobird.findIndex, Mobird.sortedIndex);
  Mobird.lastIndexOf = createIndexFinder(-1, Mobird.findLastIndex);
  
  Mobird.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;
  
    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);
  
    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }
  
    return range;
  };
  
  Mobird.inArray = function(elem, array, i) {
    return [].indexOf.call(array, elem, i);
  };

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

  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (Mobird.isObject(result)) return result;
    return self;
  };
  
  Mobird.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!Mobird.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };
  
  Mobird.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0,
        length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === Mobird ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };
  
  Mobird.bindAll = function(obj) {
    var i, length = arguments.length,
      key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = Mobird.bind(obj[key], obj);
    }
    return obj;
  };
  
  Mobird.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!Mobird.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };
  
  Mobird.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  };
  
  Mobird.defer = Mobird.partial(Mobird.delay, Mobird, 1);
  
  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  Mobird.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : Mobird.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = Mobird.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };
  
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  Mobird.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
  
    var later = function() {
      var last = Mobird.now() - timestamp;
  
      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };
  
    return function() {
      context = this;
      args = arguments;
      timestamp = Mobird.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }
  
      return result;
    };
  };
  
  Mobird.wrap = function(func, wrapper) {
    return Mobird.partial(wrapper, func);
  };
  
  Mobird.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };
  
  Mobird.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };
  
  Mobird.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };
  
  Mobird.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };
  
  Mobird.once = Mobird.partial(Mobird.before, 2);

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
  
  Mobird.getParameterByName = function(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
      results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  var result = function(instance, obj) {
    return instance._chain ? Mobird(obj).chain() : obj;
  };
  
  Mobird.mixin = function(obj) {
    Mobird.each(Mobird.functions(obj), function(name) {
      var func = Mobird[name] = obj[name];
      Mobird.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(Mobird, args));
      };
    });
  };
  
  Mobird.mixin(Mobird);
  
  Mobird.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    Mobird.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });
  
  Mobird.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    Mobird.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });
  
  Mobird.prototype.value = function() {
    return this._wrapped;
  };
  
  Mobird.prototype.valueOf = Mobird.prototype.toJSON = Mobird.prototype.value;
  
  Mobird.prototype.toString = function() {
    return '' + this._wrapped;
  };

  var _requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 16);
      };
  })();
  
  var cancelAnimationFrame = window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame;
  
  Mobird.requestAnimationFrame = function(cb) {
    return _requestAnimationFrame(cb);
  };
  
  Mobird.cancelAnimationFrame = function(requestId) {
    cancelAnimationFrame(requestId);
  };
  
  Mobird.animationFrameThrottle = function(cb) {
    var args, isQueued, context;
    return function() {
      args = arguments;
      context = this;
      if (!isQueued) {
        isQueued = true;
        Mobird.requestAnimationFrame(function() {
          cb.apply(context, args);
          isQueued = false;
        });
      }
    };
  };
  
  Mobird.adjustTitle = function(title) {
    Mobird.requestAnimationFrame(function() {
      document.title = title;
    });
  };

  var __mobuleRequire;
  var __mobuleDefine;
  var __modules = {};
  var __moduleRequireStack = [];
  var __moduleInProgressModules = {};
  
  function __moduleBuild(module) {
    var factory = module.factory,
      SEPERATOR = '.',
      localRequire = function(id) {
        var resultantId = id;
        //Its a relative path, so lop off the last portion and add the id (minus './')
        if (id.charAt(0) === SEPERATOR) {
          resultantId = module.id.slice(0, module.id.lastIndexOf(SEPERATOR)) + SEPERATOR + id.slice(2);
        }
        return __mobuleRequire(resultantId);
      };
    module.exports = {};
    delete module.factory;
    factory(localRequire, module.exports, module);
    return module.exports;
  }
  
  Mobird.requireModule = __mobuleRequire = function(id) {
    if (!__modules[id]) {
      throw 'module ' + id + ' not found';
    } else if (id in __moduleInProgressModules) {
      var cycle = __moduleRequireStack.slice(__moduleInProgressModules[id]).join('->') + '->' + id;
      throw 'Cycle in module require graph: ' + cycle;
    }
    if (__modules[id].factory) {
      try {
        __moduleInProgressModules[id] = __moduleRequireStack.length;
        __moduleRequireStack.push(id);
        return __moduleBuild(__modules[id]);
      } finally {
        delete __moduleInProgressModules[id];
        __moduleRequireStack.pop();
      }
    }
    return __modules[id].exports;
  };
  
  Mobird.defineModule = __mobuleDefine = function(id, factory) {
    if (__modules[id]) {
      throw 'module ' + id + ' already defined';
    }
  
    __modules[id] = {
      id: id,
      factory: factory
    };
  };
  
  Mobird.Module = {
  
    require: __mobuleRequire,
  
    define: __mobuleDefine,
  
    remove: function(id) {
      delete __modules[id];
    },
  
    map: function() {
      return __modules;
    }
  
  };

  Mobird.Query = (function() {
  
    var undefined, key, $, classList, emptyArray = [],
      slice = emptyArray.slice,
      filter = emptyArray.filter,
      document = window.document,
      elementDisplay = {},
      classCache = {},
      cssNumber = {
        'column-count': 1,
        'columns': 1,
        'font-weight': 1,
        'line-height': 1,
        'opacity': 1,
        'z-index': 1,
        'zoom': 1
      },
      fragmentRE = /^\s*<(\w+|!)[^>]*>/,
      singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
      tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
      rootNodeRE = /^(?:body|html)$/i,
      capitalRE = /([A-Z])/g,
  
      methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
  
      adjacencyOperators = ['after', 'prepend', 'before', 'append'],
      table = document.createElement('table'),
      tableRow = document.createElement('tr'),
      containers = {
        'tr': document.createElement('tbody'),
        'tbody': table,
        'thead': table,
        'tfoot': table,
        'td': tableRow,
        'th': tableRow,
        '*': document.createElement('div')
      },
      readyRE = /complete|loaded|interactive/,
      simpleSelectorRE = /^[\w-]*$/,
      class2type = {},
      toString = class2type.toString,
      query = {},
      camelize, uniq,
      tempParent = document.createElement('div'),
      propMap = {
        'tabindex': 'tabIndex',
        'readonly': 'readOnly',
        'for': 'htmlFor',
        'class': 'className',
        'maxlength': 'maxLength',
        'cellspacing': 'cellSpacing',
        'cellpadding': 'cellPadding',
        'rowspan': 'rowSpan',
        'colspan': 'colSpan',
        'usemap': 'useMap',
        'frameborder': 'frameBorder',
        'contenteditable': 'contentEditable'
      },
      isArray = Array.isArray ||
        function(object) {
          return object instanceof Array
        };
  
    query.matches = function(element, selector) {
      if (!selector || !element || element.nodeType !== 1) return false
      var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
        element.oMatchesSelector || element.matchesSelector
      if (matchesSelector) return matchesSelector.call(element, selector)
      // fall back to performing a selector:
      var match, parent = element.parentNode,
        temp = !parent
      if (temp)(parent = tempParent).appendChild(element)
      match = ~query.qsa(parent, selector).indexOf(element)
      temp && tempParent.removeChild(element)
      return match
    }
  
    function type(obj) {
      return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
    }
  
    function isFunction(value) {
      return type(value) == "function"
    }
  
    function isWindow(obj) {
      return obj != null && obj == obj.window
    }
  
    function isDocument(obj) {
      return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }
  
    function isObject(obj) {
      return type(obj) == "object"
    }
  
    function isPlainObject(obj) {
      return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }
  
    function likeArray(obj) {
      return typeof obj.length == 'number'
    }
  
    function compact(array) {
      return filter.call(array, function(item) {
        return item != null
      })
    }
  
    function flatten(array) {
      return array.length > 0 ? $.fn.concat.apply([], array) : array
    }
    camelize = function(str) {
      return str.replace(/-+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : ''
      })
    }
  
    function dasherize(str) {
      return str.replace(/::/g, '/')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .replace(/_/g, '-')
        .toLowerCase()
    }
    uniq = function(array) {
      return filter.call(array, function(item, idx) {
        return array.indexOf(item) == idx
      })
    }
  
    function classRE(name) {
      return name in classCache ?
        classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }
  
    function maybeAddPx(name, value) {
      return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }
  
    function defaultDisplay(nodeName) {
      var element, display
      if (!elementDisplay[nodeName]) {
        element = document.createElement(nodeName)
        document.body.appendChild(element)
        display = getComputedStyle(element, '').getPropertyValue("display")
        element.parentNode.removeChild(element)
        display == "none" && (display = "block")
        elementDisplay[nodeName] = display
      }
      return elementDisplay[nodeName]
    }
  
    function children(element) {
      return 'children' in element ?
        slice.call(element.children) :
        $.map(element.childNodes, function(node) {
          if (node.nodeType == 1) return node
        })
    }
  
    query.fragment = function(html, name, properties) {
      var dom, nodes, container
  
      // A special case optimization for a single tag
      if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))
  
      if (!dom) {
        if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
        if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
        if (!(name in containers)) name = '*'
  
        container = containers[name]
        container.innerHTML = '' + html
        dom = $.each(slice.call(container.childNodes), function() {
          container.removeChild(this)
        })
      }
  
      if (isPlainObject(properties)) {
        nodes = $(dom)
        $.each(properties, function(key, value) {
          if (methodAttributes.indexOf(key) > -1) nodes[key](value)
          else nodes.attr(key, value)
        })
      }
  
      return dom
    }
  
    query.Q = function(dom, selector) {
      dom = dom || []
      dom.__proto__ = $.fn
      dom.selector = selector || ''
      return dom
    }
  
    query.isQ = function(object) {
      return object instanceof query.Q
    }
  
    query.init = function(selector, context) {
      var dom
      // If nothing given, return an empty Zepto collection
      if (!selector) return query.Q()
      // Optimize for string selectors
      else if (typeof selector == 'string') {
        selector = selector.trim()
        // If it's a html fragment, create nodes from it
        // Note: In both Chrome 21 and Firefox 15, DOM error 12
        // is thrown if the fragment doesn't begin with <
        if (selector[0] == '<' && fragmentRE.test(selector))
          dom = query.fragment(selector, RegExp.$1, context), selector = null
        // If there's a context, create a collection on that context first, and select
        // nodes from there
        else if (context !== undefined) return $(context).find(selector)
        // If it's a CSS selector, use it to select nodes.
        else dom = query.qsa(document, selector)
      }
      // If a function is given, call it when the DOM is ready
      else if (isFunction(selector)) return $(document).ready(selector)
      // If a Zepto collection is given, just return it
      else if (query.isQ(selector)) return selector
      else {
        // normalize array if an array of nodes is given
        if (isArray(selector)) dom = compact(selector)
        // Wrap DOM nodes.
        else if (isObject(selector))
          dom = [selector], selector = null
        // If it's a html fragment, create nodes from it
        else if (fragmentRE.test(selector))
          dom = query.fragment(selector.trim(), RegExp.$1, context), selector = null
        // If there's a context, create a collection on that context first, and select
        // nodes from there
        else if (context !== undefined) return $(context).find(selector)
        // And last but no least, if it's a CSS selector, use it to select nodes.
        else dom = query.qsa(document, selector)
      }
      // create a new Zepto collection from the nodes found
      return query.Q(dom, selector)
    }
  
    $ = function(selector, context) {
      return query.init(selector, context)
    }
  
    function extend(target, source, deep) {
      for (key in source)
        if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
          if (isPlainObject(source[key]) && !isPlainObject(target[key]))
            target[key] = {}
          if (isArray(source[key]) && !isArray(target[key]))
            target[key] = []
          extend(target[key], source[key], deep)
        } else if (source[key] !== undefined) target[key] = source[key]
    }
  
    $.extend = function(target) {
      var deep, args = slice.call(arguments, 1)
      if (typeof target == 'boolean') {
        deep = target
        target = args.shift()
      }
      args.forEach(function(arg) {
        extend(target, arg, deep)
      })
      return target
    }
  
    query.qsa = function(element, selector) {
      var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
      return (isDocument(element) && isSimple && maybeID) ?
        ((found = element.getElementById(nameOnly)) ? [found] : []) :
        (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
          slice.call(
            isSimple && !maybeID ?
              maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
                element.getElementsByTagName(selector) : // Or a tag
              element.querySelectorAll(selector) // Or it's not simple, and we need to query all
          )
    }
  
    function filtered(nodes, selector) {
      return selector == null ? $(nodes) : $(nodes).filter(selector)
    }
  
    $.contains = document.documentElement.contains ?
      function(parent, node) {
        return parent !== node && parent.contains(node)
      } :
      function(parent, node) {
        while (node && (node = node.parentNode))
          if (node === parent) return true
        return false
      }
  
    function funcArg(context, arg, idx, payload) {
      return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }
  
    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }
  
    // access className property while respecting SVGAnimatedString
    function className(node, value) {
      var klass = node.className || '',
        svg = klass && klass.baseVal !== undefined
  
      if (value === undefined) return svg ? klass.baseVal : klass
      svg ? (klass.baseVal = value) : (node.className = value)
    }
  
    function deserializeValue(value) {
      try {
        return value ?
        value == "true" ||
        (value == "false" ? false :
          value == "null" ? null :
            +value + "" == value ? +value :
              /^[\[\{]/.test(value) ? $.parseJSON(value) :
                value) : value
      } catch (e) {
        return value
      }
    }
  
    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject
  
    $.isEmptyObject = function(obj) {
      var name
      for (name in obj) return false
      return true
    }
  
    $.inArray = function(elem, array, i) {
      return emptyArray.indexOf.call(array, elem, i)
    }
  
    $.camelCase = camelize
    $.trim = function(str) {
      return str == null ? "" : String.prototype.trim.call(str)
    }
  
    // plugin compatibility
    $.uuid = 0
    $.support = {}
    $.expr = {}
  
    $.map = function(elements, callback) {
      var value, values = [],
        i, key
      if (likeArray(elements))
        for (i = 0; i < elements.length; i++) {
          value = callback(elements[i], i)
          if (value != null) values.push(value)
        } else
        for (key in elements) {
          value = callback(elements[key], key)
          if (value != null) values.push(value)
        }
      return flatten(values)
    }
  
    $.each = function(elements, callback) {
      var i, key
      if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++)
          if (callback.call(elements[i], i, elements[i]) === false) return elements
      } else {
        for (key in elements)
          if (callback.call(elements[key], key, elements[key]) === false) return elements
      }
  
      return elements
    }
  
    $.grep = function(elements, callback) {
      return filter.call(elements, callback)
    }
  
    if (window.JSON) $.parseJSON = JSON.parse
  
    // Populate the class2type map
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
      class2type["[object " + name + "]"] = name.toLowerCase()
    })
  
    $.fn = {
      // Because a collection acts like an array
      // copy over these useful array functions.
      forEach: emptyArray.forEach,
      reduce: emptyArray.reduce,
      push: emptyArray.push,
      sort: emptyArray.sort,
      indexOf: emptyArray.indexOf,
      concat: emptyArray.concat,
  
      // `map` and `slice` in the jQuery API work differently
      // from their array counterparts
      map: function(fn) {
        return $($.map(this, function(el, i) {
          return fn.call(el, i, el)
        }))
      },
      slice: function() {
        return $(slice.apply(this, arguments))
      },
  
      ready: function(callback) {
        // need to check if document.body exists for IE as that browser reports
        // document ready when it hasn't yet created the body element
        if (readyRE.test(document.readyState) && document.body) callback($)
        else document.addEventListener('DOMContentLoaded', function() {
          callback($)
        }, false)
        return this
      },
      get: function(idx) {
        return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
      },
      toArray: function() {
        return this.get()
      },
      size: function() {
        return this.length
      },
      remove: function() {
        return this.each(function() {
          if (this.parentNode != null)
            this.parentNode.removeChild(this)
        })
      },
      each: function(callback) {
        emptyArray.every.call(this, function(el, idx) {
          return callback.call(el, idx, el) !== false
        })
        return this
      },
      filter: function(selector) {
        if (isFunction(selector)) return this.not(this.not(selector))
        return $(filter.call(this, function(element) {
          return query.matches(element, selector)
        }))
      },
      add: function(selector, context) {
        return $(uniq(this.concat($(selector, context))))
      },
      is: function(selector) {
        return this.length > 0 && query.matches(this[0], selector)
      },
      not: function(selector) {
        var nodes = []
        if (isFunction(selector) && selector.call !== undefined)
          this.each(function(idx) {
            if (!selector.call(this, idx)) nodes.push(this)
          })
        else {
          var excludes = typeof selector == 'string' ? this.filter(selector) :
            (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
          this.forEach(function(el) {
            if (excludes.indexOf(el) < 0) nodes.push(el)
          })
        }
        return $(nodes)
      },
      has: function(selector) {
        return this.filter(function() {
          return isObject(selector) ?
            $.contains(this, selector) :
            $(this).find(selector).size()
        })
      },
      eq: function(idx) {
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
      },
      first: function() {
        var el = this[0]
        return el && !isObject(el) ? el : $(el)
      },
      last: function() {
        var el = this[this.length - 1]
        return el && !isObject(el) ? el : $(el)
      },
      find: function(selector) {
        var result, $this = this
        if (!selector) result = $()
        else if (typeof selector == 'object')
          result = $(selector).filter(function() {
            var node = this
            return emptyArray.some.call($this, function(parent) {
              return $.contains(parent, node)
            })
          })
        else if (this.length == 1) result = $(query.qsa(this[0], selector))
        else result = this.map(function() {
            return query.qsa(this, selector)
          })
        return result
      },
      closest: function(selector, context) {
        var node = this[0],
          collection = false
        if (typeof selector == 'object') collection = $(selector)
        while (node && !(collection ? collection.indexOf(node) >= 0 : query.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode
        return $(node)
      },
      parents: function(selector) {
        var ancestors = [],
          nodes = this
        while (nodes.length > 0)
          nodes = $.map(nodes, function(node) {
            if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
              ancestors.push(node)
              return node
            }
          })
        return filtered(ancestors, selector)
      },
      parent: function(selector) {
        return filtered(uniq(this.pluck('parentNode')), selector)
      },
      children: function(selector) {
        return filtered(this.map(function() {
          return children(this)
        }), selector)
      },
      contents: function() {
        return this.map(function() {
          return slice.call(this.childNodes)
        })
      },
      siblings: function(selector) {
        return filtered(this.map(function(i, el) {
          return filter.call(children(el.parentNode), function(child) {
            return child !== el
          })
        }), selector)
      },
      empty: function() {
        return this.each(function() {
          this.innerHTML = ''
        })
      },
      // `pluck` is borrowed from Prototype.js
      pluck: function(property) {
        return $.map(this, function(el) {
          return el[property]
        })
      },
      show: function() {
        return this.each(function() {
          this.style.display == "none" && (this.style.display = '')
          if (getComputedStyle(this, '').getPropertyValue("display") == "none")
            this.style.display = defaultDisplay(this.nodeName)
        })
      },
      replaceWith: function(newContent) {
        return this.before(newContent).remove()
      },
      wrap: function(structure) {
        var func = isFunction(structure)
        if (this[0] && !func)
          var dom = $(structure).get(0),
            clone = dom.parentNode || this.length > 1
  
        return this.each(function(index) {
          $(this).wrapAll(
            func ? structure.call(this, index) :
              clone ? dom.cloneNode(true) : dom
          )
        })
      },
      wrapAll: function(structure) {
        if (this[0]) {
          $(this[0]).before(structure = $(structure))
          var children
          // drill down to the inmost element
          while ((children = structure.children()).length) structure = children.first()
          $(structure).append(this)
        }
        return this
      },
      wrapInner: function(structure) {
        var func = isFunction(structure)
        return this.each(function(index) {
          var self = $(this),
            contents = self.contents(),
            dom = func ? structure.call(this, index) : structure
          contents.length ? contents.wrapAll(dom) : self.append(dom)
        })
      },
      unwrap: function() {
        this.parent().each(function() {
          $(this).replaceWith($(this).children())
        })
        return this
      },
      clone: function() {
        return this.map(function() {
          return this.cloneNode(true)
        })
      },
      hide: function() {
        return this.css("display", "none")
      },
      toggle: function(setting) {
        return this.each(function() {
          var el = $(this);
          (setting === undefined ? el.css("display") == "none" : setting) ? el.show(): el.hide()
        })
      },
      prev: function(selector) {
        return $(this.pluck('previousElementSibling')).filter(selector || '*')
      },
      next: function(selector) {
        return $(this.pluck('nextElementSibling')).filter(selector || '*')
      },
      html: function(html) {
        return 0 in arguments ?
          this.each(function(idx) {
            var originHtml = this.innerHTML
            $(this).empty().append(funcArg(this, html, idx, originHtml))
          }) :
          (0 in this ? this[0].innerHTML : null)
      },
      text: function(text) {
        return 0 in arguments ?
          this.each(function(idx) {
            var newText = funcArg(this, text, idx, this.textContent)
            this.textContent = newText == null ? '' : '' + newText
          }) :
          (0 in this ? this[0].textContent : null)
      },
      attr: function(name, value) {
        var result
        return (typeof name == 'string' && !(1 in arguments)) ?
          (!this.length || this[0].nodeType !== 1 ? undefined :
              (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
          ) :
          this.each(function(idx) {
            if (this.nodeType !== 1) return
            if (isObject(name))
              for (key in name) setAttribute(this, key, name[key])
            else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
          })
      },
      removeAttr: function(name) {
        return this.each(function() {
          this.nodeType === 1 && name.split(' ').forEach(function(attribute) {
            setAttribute(this, attribute)
          }, this)
        })
      },
      prop: function(name, value) {
        name = propMap[name] || name
        return (1 in arguments) ?
          this.each(function(idx) {
            this[name] = funcArg(this, value, idx, this[name])
          }) :
          (this[0] && this[0][name])
      },
      data: function(name, value) {
        var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()
  
        var data = (1 in arguments) ?
          this.attr(attrName, value) :
          this.attr(attrName)
  
        return data !== null ? deserializeValue(data) : undefined
      },
      val: function(value) {
        return 0 in arguments ?
          this.each(function(idx) {
            this.value = funcArg(this, value, idx, this.value)
          }) :
          (this[0] && (this[0].multiple ?
            $(this[0]).find('option').filter(function() {
              return this.selected
            }).pluck('value') :
            this[0].value))
      },
      offset: function(coordinates) {
        if (coordinates) return this.each(function(index) {
          var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top: coords.top - parentOffset.top,
              left: coords.left - parentOffset.left
            }
  
          if ($this.css('position') == 'static') props['position'] = 'relative'
          $this.css(props)
        })
        if (!this.length) return null
        var obj = this[0].getBoundingClientRect()
        return {
          left: obj.left + window.pageXOffset,
          top: obj.top + window.pageYOffset,
          width: Math.round(obj.width),
          height: Math.round(obj.height)
        }
      },
      css: function(property, value) {
        if (arguments.length < 2) {
          var computedStyle, element = this[0]
          if (!element) return
          computedStyle = getComputedStyle(element, '')
          if (typeof property == 'string')
            return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
          else if (isArray(property)) {
            var props = {}
            $.each(property, function(_, prop) {
              props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
            })
            return props
          }
        }
  
        var css = ''
        if (type(property) == 'string') {
          if (!value && value !== 0)
            this.each(function() {
              this.style.removeProperty(dasherize(property))
            })
          else
            css = dasherize(property) + ":" + maybeAddPx(property, value)
        } else {
          for (key in property)
            if (!property[key] && property[key] !== 0)
              this.each(function() {
                this.style.removeProperty(dasherize(key))
              })
            else
              css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
        }
  
        return this.each(function() {
          this.style.cssText += ';' + css
        })
      },
      index: function(element) {
        return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
      },
      hasClass: function(name) {
        if (!name) return false
        return emptyArray.some.call(this, function(el) {
          return this.test(className(el))
        }, classRE(name))
      },
      addClass: function(name) {
        if (!name) return this
        return this.each(function(idx) {
          if (!('className' in this)) return
          classList = []
          var cls = className(this),
            newName = funcArg(this, name, idx, cls)
          newName.split(/\s+/g).forEach(function(klass) {
            if (!$(this).hasClass(klass)) classList.push(klass)
          }, this)
          classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
        })
      },
      removeClass: function(name) {
        return this.each(function(idx) {
          if (!('className' in this)) return
          if (name === undefined) return className(this, '')
          classList = className(this)
          funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
            classList = classList.replace(classRE(klass), " ")
          })
          className(this, classList.trim())
        })
      },
      toggleClass: function(name, when) {
        if (!name) return this
        return this.each(function(idx) {
          var $this = $(this),
            names = funcArg(this, name, idx, className(this))
          names.split(/\s+/g).forEach(function(klass) {
            (when === undefined ? !$this.hasClass(klass) : when) ?
              $this.addClass(klass): $this.removeClass(klass)
          })
        })
      },
      scrollTop: function(value) {
        if (!this.length) return
        var hasScrollTop = 'scrollTop' in this[0]
        if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
        return this.each(hasScrollTop ?
          function() {
            this.scrollTop = value
          } :
          function() {
            this.scrollTo(this.scrollX, value)
          })
      },
      scrollLeft: function(value) {
        if (!this.length) return
        var hasScrollLeft = 'scrollLeft' in this[0]
        if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
        return this.each(hasScrollLeft ?
          function() {
            this.scrollLeft = value
          } :
          function() {
            this.scrollTo(value, this.scrollY)
          })
      },
      position: function() {
        if (!this.length) return
  
        var elem = this[0],
        // Get *real* offsetParent
          offsetParent = this.offsetParent(),
        // Get correct offsets
          offset = this.offset(),
          parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
            top: 0,
            left: 0
          } : offsetParent.offset()
  
        offset.top -= parseFloat($(elem).css('margin-top')) || 0
        offset.left -= parseFloat($(elem).css('margin-left')) || 0
  
        // Add offsetParent borders
        parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
        parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0
  
        // Subtract the two offsets
        return {
          top: offset.top - parentOffset.top,
          left: offset.left - parentOffset.left
        }
      },
      offsetParent: function() {
        return this.map(function() {
          var parent = this.offsetParent || document.body
          while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
            parent = parent.offsetParent
          return parent
        })
      }
    }
  
    $.fn.detach = $.fn.remove;
  
    // Generate the `width` and `height` functions
    ['width', 'height'].forEach(function(dimension) {
      var dimensionProperty =
        dimension.replace(/./, function(m) {
          return m[0].toUpperCase()
        })
  
      $.fn[dimension] = function(value) {
        var offset, el = this[0]
        if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
          isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
          (offset = this.offset()) && offset[dimension]
        else return this.each(function(idx) {
          el = $(this)
          el.css(dimension, funcArg(this, value, idx, el[dimension]()))
        })
      }
    })
  
    function traverseNode(node, fun) {
      fun(node)
      for (var i = 0, len = node.childNodes.length; i < len; i++)
        traverseNode(node.childNodes[i], fun)
    }
  
    adjacencyOperators.forEach(function(operator, operatorIndex) {
      var inside = operatorIndex % 2 //=> prepend, append
  
      $.fn[operator] = function() {
        // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
        var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : query.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
        if (nodes.length < 1) return this
  
        return this.each(function(_, target) {
          parent = inside ? target : target.parentNode
  
          // convert all methods to a "before" operation
          target = operatorIndex == 0 ? target.nextSibling :
            operatorIndex == 1 ? target.firstChild :
              operatorIndex == 2 ? target :
                null
  
          var parentInDocument = $.contains(document.documentElement, parent)
  
          nodes.forEach(function(node) {
            if (copyByClone) node = node.cloneNode(true)
            else if (!parent) return $(node).remove()
  
            parent.insertBefore(node, target)
            if (parentInDocument) traverseNode(node, function(el) {
              if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                (!el.type || el.type === 'text/javascript') && !el.src)
                window['eval'].call(window, el.innerHTML)
            })
          })
        })
      }
  
      $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
        $(html)[operator](this)
        return this
      }
    })
  
    query.Q.prototype = $.fn;
  
    // Export internal API functions in the `$.query` namespace
    query.uniq = uniq;
    query.deserializeValue = deserializeValue;
    $.query = query;
  
    return $;
  
  })();
  
  (Mobird.$ === undefined) && (Mobird.$ = Mobird.Query);

  (function($) {
  
    if (Mobird.isUndefined($)) {
      return;
    }
  
    var data = {},
      dataAttr = $.fn.data,
      camelize = $.camelCase,
      exp = $.expando = 'Query' + (+new Date()),
      emptyArray = []
  
    function getData(node, name) {
      var id = node[exp],
        store = id && data[id]
      if (name === undefined) return store || setData(node)
      else {
        if (store) {
          if (name in store) return store[name]
          var camelName = camelize(name)
          if (camelName in store) return store[camelName]
        }
        return dataAttr.call($(node), name)
      }
    }
  
    // Store value under camelized key on node
    function setData(node, name, value) {
      var id = node[exp] || (node[exp] = ++$.uuid),
        store = data[id] || (data[id] = attributeData(node))
      if (name !== undefined) store[camelize(name)] = value
      return store
    }
  
    // Read all "data-*" attributes from a node
    function attributeData(node) {
      var store = {}
      $.each(node.attributes || emptyArray, function(i, attr) {
        if (attr.name.indexOf('data-') == 0)
          store[camelize(attr.name.replace('data-', ''))] =
            $.query.deserializeValue(attr.value)
      })
      return store
    }
  
    $.fn.data = function(name, value) {
      return value === undefined ?
        // set multiple values via object
        $.isPlainObject(name) ?
          this.each(function(i, node) {
            $.each(name, function(key, value) {
              setData(node, key, value)
            })
          }) :
          // get value from first element
          (0 in this ? getData(this[0], name) : undefined) :
        // set value on all elements
        this.each(function() {
          setData(this, name, value)
        })
    }
  
    $.fn.removeData = function(names) {
      if (typeof names == 'string') names = names.split(/\s+/)
      return this.each(function() {
        var id = this[exp],
          store = id && data[id]
        if (store) $.each(names || store, function(key) {
          delete store[names ? camelize(this) : key]
        })
      })
    };
  
    // Generate extended `remove` and `empty` functions
    ['remove', 'empty'].forEach(function(methodName) {
      var origFn = $.fn[methodName]
      $.fn[methodName] = function() {
        var elements = this.find('*')
        if (methodName === 'remove') elements = elements.add(this)
        elements.removeData()
        return origFn.call(this)
      }
    })
  
  })(Mobird.Query);

  (function($) {
  
    if (Mobird.isUndefined($)) {
      return;
    }
  
    var _qid = 1,
      undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj) {
        return typeof obj == 'string'
      },
      handlers = {},
      specialEvents = {},
      focusinSupported = 'onfocusin' in window,
      focus = {
        focus: 'focusin',
        blur: 'focusout'
      },
      hover = {
        mouseenter: 'mouseover',
        mouseleave: 'mouseout'
      }
  
    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'
  
    function zid(element) {
      return element._qid || (element._qid = _qid++)
    }
  
    function findHandlers(element, event, fn, selector) {
      event = parse(event)
      if (event.ns) var matcher = matcherFor(event.ns)
      return (handlers[zid(element)] || []).filter(function(handler) {
        return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || zid(handler.fn) === zid(fn)) && (!selector || handler.sel == selector)
      })
    }
  
    function parse(event) {
      var parts = ('' + event).split('.')
      return {
        e: parts[0],
        ns: parts.slice(1).sort().join(' ')
      }
    }
  
    function matcherFor(ns) {
      return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }
  
    function eventCapture(handler, captureSetting) {
      return handler.del &&
        (!focusinSupported && (handler.e in focus)) ||
        !!captureSetting
    }
  
    function realEvent(type) {
      return hover[type] || (focusinSupported && focus[type]) || type
    }
  
    function add(element, events, fn, data, selector, delegator, capture) {
      var id = zid(element),
        set = (handlers[id] || (handlers[id] = []))
      events.split(/\s/).forEach(function(event) {
        if (event == 'ready') return $(document).ready(fn)
        var handler = parse(event)
        handler.fn = fn
        handler.sel = selector
        // emulate mouseenter, mouseleave
        if (handler.e in hover) fn = function(e) {
          var related = e.relatedTarget
          if (!related || (related !== this && !$.contains(this, related)))
            return handler.fn.apply(this, arguments)
        }
        handler.del = delegator
        var callback = delegator || fn
        handler.proxy = function(e) {
          e = compatible(e)
          if (e.isImmediatePropagationStopped()) return
          e.data = data
          var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
          if (result === false) e.preventDefault(), e.stopPropagation()
          return result
        }
        handler.i = set.length
        set.push(handler)
        if ('addEventListener' in element)
          element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    }
  
    function remove(element, events, fn, selector, capture) {
      var id = zid(element);
      (events || '').split(/\s/).forEach(function(event) {
        findHandlers(element, event, fn, selector).forEach(function(handler) {
          delete handlers[id][handler.i]
          if ('removeEventListener' in element)
            element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
        })
      })
    }
  
    $.event = {
      add: add,
      remove: remove
    }
  
    $.proxy = function(fn, context) {
      var args = (2 in arguments) && slice.call(arguments, 2)
      if (isFunction(fn)) {
        var proxyFn = function() {
          return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments)
        }
        proxyFn._qid = zid(fn)
        return proxyFn
      } else if (isString(context)) {
        if (args) {
          args.unshift(fn[context], fn)
          return $.proxy.apply(null, args)
        } else {
          return $.proxy(fn[context], fn)
        }
      } else {
        throw new TypeError("expected function")
      }
    }
  
    $.fn.bind = function(event, data, callback) {
      return this.on(event, data, callback)
    }
    $.fn.unbind = function(event, callback) {
      return this.off(event, callback)
    }
    $.fn.one = function(event, selector, data, callback) {
      return this.on(event, selector, data, callback, 1)
    }
  
    var returnTrue = function() {
        return true
      },
      returnFalse = function() {
        return false
      },
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }
  
    function compatible(event, source) {
      if (source || !event.isDefaultPrevented) {
        source || (source = event)
  
        $.each(eventMethods, function(name, predicate) {
          var sourceMethod = source[name]
          event[name] = function() {
            this[predicate] = returnTrue
            return sourceMethod && sourceMethod.apply(source, arguments)
          }
          event[predicate] = returnFalse
        })
  
        if (source.defaultPrevented !== undefined ? source.defaultPrevented :
            'returnValue' in source ? source.returnValue === false :
            source.getPreventDefault && source.getPreventDefault())
          event.isDefaultPrevented = returnTrue
      }
      return event
    }
  
    function createProxy(event) {
      var key, proxy = {
        originalEvent: event
      }
      for (key in event)
        if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]
  
      return compatible(proxy, event)
    }
  
    $.fn.delegate = function(selector, event, callback) {
      return this.on(event, selector, callback)
    }
    $.fn.undelegate = function(selector, event, callback) {
      return this.off(event, selector, callback)
    }
  
    $.fn.live = function(event, callback) {
      $(document.body).delegate(this.selector, event, callback)
      return this
    }
    $.fn.die = function(event, callback) {
      $(document.body).undelegate(this.selector, event, callback)
      return this
    }
  
    $.fn.on = function(event, selector, data, callback, one) {
      var autoRemove, delegator, $this = this
      if (event && !isString(event)) {
        $.each(event, function(type, fn) {
          $this.on(type, selector, data, fn, one)
        })
        return $this
      }
  
      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = data, data = selector, selector = undefined
      if (isFunction(data) || data === false)
        callback = data, data = undefined
  
      if (callback === false) callback = returnFalse
  
      return $this.each(function(_, element) {
        if (one) autoRemove = function(e) {
          remove(element, e.type, callback)
          return callback.apply(this, arguments)
        }
  
        if (selector) delegator = function(e) {
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match && match !== element) {
            evt = $.extend(createProxy(e), {
              currentTarget: match,
              liveFired: element
            })
            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
          }
        }
  
        add(element, event, callback, data, selector, delegator || autoRemove)
      })
    }
    $.fn.off = function(event, selector, callback) {
      var $this = this
      if (event && !isString(event)) {
        $.each(event, function(type, fn) {
          $this.off(type, selector, fn)
        })
        return $this
      }
  
      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = selector, selector = undefined
  
      if (callback === false) callback = returnFalse
  
      return $this.each(function() {
        remove(this, event, callback, selector)
      })
    }
  
    $.fn.trigger = function(event, args) {
      event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
      event._args = args
      return this.each(function() {
        // handle focus(), blur() by calling them directly
        if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
        // items in the collection might not be DOM elements
        else if ('dispatchEvent' in this) this.dispatchEvent(event)
        else $(this).triggerHandler(event, args)
      })
    }
  
    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function(event, args) {
      var e, result
      this.each(function(i, element) {
        e = createProxy(isString(event) ? $.Event(event) : event)
        e._args = args
        e.target = element
        $.each(findHandlers(element, event.type || event), function(i, handler) {
          result = handler.proxy(e)
          if (e.isImmediatePropagationStopped()) return false
        })
      })
      return result
    };
  
    // shortcut methods for `.bind(event, fn)` for each event type
    ('focusin focusout focus blur load resize scroll unload click dblclick ' +
    'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
    'change select keydown keypress keyup error').split(' ').forEach(function(event) {
        $.fn[event] = function(callback) {
          return (0 in arguments) ?
            this.bind(event, callback) :
            this.trigger(event)
        }
      })
  
    $.Event = function(type, props) {
      if (!isString(type)) props = type, type = props.type
      var event = document.createEvent(specialEvents[type] || 'Events'),
        bubbles = true
      if (props)
        for (var name in props)(name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
      event.initEvent(type, bubbles, true)
      return compatible(event)
    }
  
  })(Mobird.Query);

  (function($) {
  
    if (Mobird.isUndefined($)) {
      return;
    }
  
    var query = $.query,
      oldQsa = query.qsa,
      oldMatches = query.matches
  
    function visible(elem) {
      elem = $(elem)
      return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
    }
  
    var filters = $.expr[':'] = {
      visible: function() {
        if (visible(this)) return this
      },
      hidden: function() {
        if (!visible(this)) return this
      },
      selected: function() {
        if (this.selected) return this
      },
      checked: function() {
        if (this.checked) return this
      },
      parent: function() {
        return this.parentNode
      },
      first: function(idx) {
        if (idx === 0) return this
      },
      last: function(idx, nodes) {
        if (idx === nodes.length - 1) return this
      },
      eq: function(idx, _, value) {
        if (idx === value) return this
      },
      contains: function(idx, _, text) {
        if ($(this).text().indexOf(text) > -1) return this
      },
      has: function(idx, _, sel) {
        if (query.qsa(this, sel).length) return this
      }
    }
  
    var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
      childRe = /^\s*>/,
      classTag = 'Zepto' + (+new Date())
  
    function process(sel, fn) {
      // quote the hash in `a[href^=#]` expression
      sel = sel.replace(/=#\]/g, '="#"]')
      var filter, arg, match = filterRe.exec(sel)
      if (match && match[2] in filters) {
        filter = filters[match[2]], arg = match[3]
        sel = match[1]
        if (arg) {
          var num = Number(arg)
          if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '')
          else arg = num
        }
      }
      return fn(sel, filter, arg)
    }
  
    query.qsa = function(node, selector) {
      return process(selector, function(sel, filter, arg) {
        try {
          var taggedParent
          if (!sel && filter) sel = '*'
          else if (childRe.test(sel))
          // support "> *" child queries by tagging the parent node with a
          // unique class and prepending that classname onto the selector
            taggedParent = $(node).addClass(classTag), sel = '.' + classTag + ' ' + sel
  
          var nodes = oldQsa(node, sel)
        } catch (e) {
          console.error('error performing selector: %o', selector)
          throw e
        } finally {
          if (taggedParent) taggedParent.removeClass(classTag)
        }
        return !filter ? nodes :
          query.uniq($.map(nodes, function(n, i) {
            return filter.call(n, i, nodes, arg)
          }))
      })
    }
  
    query.matches = function(node, selector) {
      return process(selector, function(sel, filter, arg) {
        return (!sel || oldMatches(node, sel)) &&
          (!filter || filter.call(node, null, arg) === node)
      })
    }
  
  })(Mobird.Query);

  (function($) {
  
    if (Mobird.isUndefined($)) {
      return;
    }
  
    var prefix = '',
      eventPrefix, endEventName, endAnimationName,
      vendors = {
        Webkit: 'webkit',
        Moz: '',
        O: 'o'
      },
      document = window.document,
      testEl = document.createElement('div'),
      supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
      transform,
      transitionProperty, transitionDuration, transitionTiming, transitionDelay,
      animationName, animationDuration, animationTiming, animationDelay,
      cssReset = {}
  
    function dasherize(str) {
      return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase()
    }
  
    function normalizeEvent(name) {
      return eventPrefix ? eventPrefix + name : name.toLowerCase()
    }
  
    $.each(vendors, function(vendor, event) {
      if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
        prefix = '-' + vendor.toLowerCase() + '-'
        eventPrefix = event
        return false
      }
    })
  
    transform = prefix + 'transform'
    cssReset[transitionProperty = prefix + 'transition-property'] =
      cssReset[transitionDuration = prefix + 'transition-duration'] =
        cssReset[transitionDelay = prefix + 'transition-delay'] =
          cssReset[transitionTiming = prefix + 'transition-timing-function'] =
            cssReset[animationName = prefix + 'animation-name'] =
              cssReset[animationDuration = prefix + 'animation-duration'] =
                cssReset[animationDelay = prefix + 'animation-delay'] =
                  cssReset[animationTiming = prefix + 'animation-timing-function'] = ''
  
    $.fx = {
      off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
      speeds: {
        _default: 400,
        fast: 200,
        slow: 600
      },
      cssPrefix: prefix,
      transitionEnd: normalizeEvent('TransitionEnd'),
      animationEnd: normalizeEvent('AnimationEnd')
    }
  
    $.fn.animate = function(properties, duration, ease, callback, delay) {
      if ($.isFunction(duration))
        callback = duration, ease = undefined, duration = undefined
      if ($.isFunction(ease))
        callback = ease, ease = undefined
      if ($.isPlainObject(duration))
        ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
      if (duration) duration = (typeof duration == 'number' ? duration :
          ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
      if (delay) delay = parseFloat(delay) / 1000
      return this.anim(properties, duration, ease, callback, delay)
    }
  
    $.fn.anim = function(properties, duration, ease, callback, delay) {
      var key, cssValues = {},
        cssProperties, transforms = '',
        that = this,
        wrappedCallback, endEvent = $.fx.transitionEnd,
        fired = false
  
      if (duration === undefined) duration = $.fx.speeds._default / 1000
      if (delay === undefined) delay = 0
      if ($.fx.off) duration = 0
  
      if (typeof properties == 'string') {
        // keyframe animation
        cssValues[animationName] = properties
        cssValues[animationDuration] = duration + 's'
        cssValues[animationDelay] = delay + 's'
        cssValues[animationTiming] = (ease || 'linear')
        endEvent = $.fx.animationEnd
      } else {
        cssProperties = []
        // CSS transitions
        for (key in properties)
          if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
          else cssValues[key] = properties[key], cssProperties.push(dasherize(key))
  
        if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
        if (duration > 0 && typeof properties === 'object') {
          cssValues[transitionProperty] = cssProperties.join(', ')
          cssValues[transitionDuration] = duration + 's'
          cssValues[transitionDelay] = delay + 's'
          cssValues[transitionTiming] = (ease || 'linear')
        }
      }
  
      wrappedCallback = function(event) {
        if (typeof event !== 'undefined') {
          if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
          $(event.target).unbind(endEvent, wrappedCallback)
        } else
          $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout
  
        fired = true
        $(this).css(cssReset)
        callback && callback.call(this)
      }
      if (duration > 0) {
        this.bind(endEvent, wrappedCallback)
        // transitionEnd is not always firing on older Android phones
        // so make sure it gets fired
        setTimeout(function() {
          if (fired) return
          wrappedCallback.call(that)
        }, ((duration + delay) * 1000) + 25)
      }
  
      // trigger page reflow so new elements can animate
      this.size() && this.get(0).clientLeft
  
      this.css(cssValues)
  
      if (duration <= 0) setTimeout(function() {
        that.each(function() {
          wrappedCallback.call(this)
        })
      }, 0)
  
      return this
    }
  
    testEl = null
  
  
    /////////////////////////////////
  
    var document = window.document,
      docElem = document.documentElement,
      origShow = $.fn.show,
      origHide = $.fn.hide,
      origToggle = $.fn.toggle
  
    function anim(el, speed, opacity, scale, callback) {
      if (typeof speed == 'function' && !callback) callback = speed, speed = undefined
      var props = {
        opacity: opacity
      }
      if (scale) {
        props.scale = scale
        el.css($.fx.cssPrefix + 'transform-origin', '0 0')
      }
      return el.animate(props, speed, null, callback)
    }
  
    function hide(el, speed, scale, callback) {
      return anim(el, speed, 0, scale, function() {
        origHide.call($(this))
        callback && callback.call(this)
      })
    }
  
    $.fn.show = function(speed, callback) {
      origShow.call(this)
      if (speed === undefined) speed = 0
      else this.css('opacity', 0)
      return anim(this, speed, 1, '1,1', callback)
    }
  
    $.fn.hide = function(speed, callback) {
      if (speed === undefined) return origHide.call(this)
      else return hide(this, speed, '0,0', callback)
    }
  
    $.fn.toggle = function(speed, callback) {
      if (speed === undefined || typeof speed == 'boolean')
        return origToggle.call(this, speed)
      else return this.each(function() {
        var el = $(this)
        el[el.css('display') == 'none' ? 'show' : 'hide'](speed, callback)
      })
    }
  
    $.fn.fadeTo = function(speed, opacity, callback) {
      return anim(this, speed, opacity, null, callback)
    }
  
    $.fn.fadeIn = function(speed, callback) {
      var target = this.css('opacity')
      if (target > 0) this.css('opacity', 0)
      else target = 1
      return origShow.call(this).fadeTo(speed, target, callback)
    }
  
    $.fn.fadeOut = function(speed, callback) {
      return hide(this, speed, null, callback)
    }
  
    $.fn.fadeToggle = function(speed, callback) {
      return this.each(function() {
        var el = $(this)
        el[
          (el.css('opacity') == 0 || el.css('display') == 'none') ? 'fadeIn' : 'fadeOut'
          ](speed, callback)
      })
    }
  
  })(Mobird.Query);

  var __base = Mobird.__base = {};
  
  __base.isNodeAttached = function(el) {
    return Mobird.$.contains(document.documentElement, el);
  };
  
  __base._triggerMethod = (function() {
    var splitter = /(^|:)(\w)/gi;
  
    function getEventName(match, prefix, eventName) {
      return eventName.toUpperCase();
    }
  
    return function(context, event, args) {
      var noEventArg = arguments.length < 3;
      if (noEventArg) {
        args = event;
        event = args[0];
      }
  
      var methodName = 'on' + event.replace(splitter, getEventName);
      var method = context[methodName];
      var result;
  
      if (Mobird.isFunction(method)) {
        result = method.apply(context, noEventArg ? Mobird.rest(args) : args);
      }
  
      if (Mobird.isFunction(context.trigger)) {
        if (noEventArg + args.length > 1) {
          context.trigger.apply(context, noEventArg ? args : [event].concat(Mobird.rest(args, 0)));
        } else {
          context.trigger(event);
        }
      }
  
      return result;
    };
  })();
  
  __base.triggerMethod = function(event) {
    return __base._triggerMethod(this, arguments);
  };
  
  __base.triggerMethodOn = function(context) {
    var fnc = Mobird.isFunction(context.triggerMethod) ? context.triggerMethod : __base.triggerMethod;
  
    return fnc.apply(context, Mobird.rest(arguments));
  };
  
  __base.mergeOptions = function(options, keys) {
    if (!options) {
      return;
    }
    Mobird.extend(this, Mobird.pick(options, keys));
  };
  
  __base.getOption = function(target, optionName) {
    if (!target || !optionName) {
      return;
    }
    if (target.options && (target.options[optionName] !== undefined)) {
      return target.options[optionName];
    } else {
      return target[optionName];
    }
  };
  
  __base.proxyGetOption = function(optionName) {
    return __base.getOption(this, optionName);
  };
  
  __base._getValue = function(value, context, params) {
    if (Mobird.isFunction(value)) {
      value = params ? value.apply(context, params) : value.call(context);
    }
    return value;
  };
  
  __base.getValue = function(object, prop) {
    if (!(object && object[prop])) {
      return null;
    }
    return Mobird.isFunction(object[prop]) ? object[prop]() : object[prop];
  };
  
  function __baseBindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);
  
    Mobird.each(methodNames, function(methodName) {
  
      var method = target[methodName];
      if (!method) {
        throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
      }
  
      target.listenTo(entity, evt, method);
    });
  }
  
  function __baseBindToFunction(target, entity, evt, method) {
    target.listenTo(entity, evt, method);
  }
  
  function __baseUnbindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);
  
    Mobird.each(methodNames, function(methodName) {
      var method = target[methodName];
      target.stopListening(entity, evt, method);
    });
  }
  
  function __baseUnbindToFunction(target, entity, evt, method) {
    target.stopListening(entity, evt, method);
  }
  
  function __baseIterateEvents(target, entity, bindings, functionCallback, stringCallback) {
    if (!entity || !bindings) {
      return;
    }
  
    if (!Mobird.isObject(bindings)) {
      throw new Error('Bindings must be an object or function.');
    }
  
    // allow the bindings to be a function
    bindings = __base._getValue(bindings, target);
  
    // iterate the bindings and bind them
    Mobird.each(bindings, function(methods, evt) {
  
      // allow for a function as the handler,
      // or a list of event names as a string
      if (Mobird.isFunction(methods)) {
        functionCallback(target, entity, evt, methods);
      } else {
        stringCallback(target, entity, evt, methods);
      }
  
    });
  }
  
  __base.bindEntityEvents = function(target, entity, bindings) {
    __baseIterateEvents(target, entity, bindings, __baseBindToFunction, __baseBindFromStrings);
  };
  
  __base.unbindEntityEvents = function(target, entity, bindings) {
    __baseIterateEvents(target, entity, bindings, __baseUnbindToFunction, __baseUnbindFromStrings);
  };
  
  __base.proxyBindEntityEvents = function(entity, bindings) {
    return __base.bindEntityEvents(this, entity, bindings);
  };
  
  __base.proxyUnbindEntityEvents = function(entity, bindings) {
    return __base.unbindEntityEvents(this, entity, bindings);
  };

  var Support = Mobird.Support = {
  
    addEventListener: !!window.addEventListener,
  
    transitions: (function (temp) {
      var props = ['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
      for (var i in props) {
        if (temp.style[props[i]] !== undefined) {
          return true;
        }
      }
      return false;
    })(document.createElement('swipe')),
  
    touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
  
    transform3d: function () {
  
      var head, body, style, div, result;
  
      head = document.getElementsByTagName('head')[0];
      body = document.body;
  
      style = document.createElement('style');
      style.textContent = '@media (transform-3d),(-o-transform-3d),(-moz-transform-3d),(-webkit-transform-3d){#mo-3dtest{height:3px}}';
  
      div = document.createElement('div');
      div.id = 'mo-3dtest';
  
      head.appendChild(style);
      body.appendChild(div);
  
      result = div.offsetHeight === 3;
  
      style.parentNode.removeChild(style);
      div.parentNode.removeChild(div);
  
      return result;
    },
  
    animationEvents: (typeof window.WebKitAnimationEvent !== 'undefined')
  
  };

  var __eventsApi = function(iteratee, events, name, callback, opts) {
    var i = 0,
      names,
      eventSplitter = /\s+/;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
      for (names = Mobird.keys(name); i < names.length; i++) {
        events = __eventsApi(iteratee, events, names[i], name[names[i]], opts);
      }
    } else if (name && eventSplitter.test(name)) {
      // Handle space separated event names by delegating them individually.
      for (names = name.split(eventSplitter); i < names.length; i++) {
        events = iteratee(events, names[i], callback, opts);
      }
    } else {
      events = iteratee(events, name, callback, opts);
    }
    return events;
  };
  
  var __eventInternalOn = function(obj, name, callback, context, listening) {
    obj._events = __eventsApi(__eventOnApi, obj._events || {}, name, callback, {
      context: context,
      ctx: obj,
      listening: listening
    });
  
    if (listening) {
      var listeners = obj._listeners || (obj._listeners = {});
      listeners[listening.id] = listening;
    }
  
    return obj;
  };
  
  var __eventOnApi = function(events, name, callback, options) {
    if (callback) {
      var handlers = events[name] || (events[name] = []);
      var context = options.context,
        ctx = options.ctx,
        listening = options.listening;
      if (listening) listening.count++;
  
      handlers.push({
        callback: callback,
        context: context,
        ctx: context || ctx,
        listening: listening
      });
    }
    return events;
  };
  
  var __eventOffApi = function(events, name, callback, options) {
    if (!events) return;
  
    var i = 0,
      listening;
    var context = options.context,
      listeners = options.listeners;
  
    if (!name && !callback && !context) {
      var ids = Mobird.keys(listeners);
      for (; i < ids.length; i++) {
        listening = listeners[ids[i]];
        delete listeners[listening.id];
        delete listening.listeningTo[listening.objId];
      }
      return;
    }
  
    var names = name ? [name] : Mobird.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      var handlers = events[name];
  
      if (!handlers) break;
  
      var remaining = [];
      for (var j = 0; j < handlers.length; j++) {
        var handler = handlers[j];
        if (
          callback && callback !== handler.callback &&
          callback !== handler.callback._callback ||
          context && context !== handler.context
        ) {
          remaining.push(handler);
        } else {
          listening = handler.listening;
          if (listening && --listening.count === 0) {
            delete listeners[listening.id];
            delete listening.listeningTo[listening.objId];
          }
        }
      }
  
      // Update tail event if the list has any events.  Otherwise, clean up.
      if (remaining.length) {
        events[name] = remaining;
      } else {
        delete events[name];
      }
    }
    if (Mobird.size(events)) return events;
  };
  
  var __eventOnceMap = function(map, name, callback, offer) {
    if (callback) {
      var once = map[name] = Mobird.once(function() {
        offer(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
    }
    return map;
  };
  
  var __eventTriggerApi = function(objEvents, name, cb, args) {
    if (objEvents) {
      var events = objEvents[name];
      var allEvents = objEvents.all;
      if (events && allEvents) allEvents = allEvents.slice();
      if (events) __eventTriggerEvents(events, args);
      if (allEvents) __eventTriggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
  };
  
  var __eventTriggerEvents = function(events, args) {
    var ev, i = -1,
      l = events.length,
      a1 = args[0],
      a2 = args[1],
      a3 = args[2];
    switch (args.length) {
      case 0:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx);
        return;
      case 1:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1);
        return;
      case 2:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2);
        return;
      case 3:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
        return;
      default:
        while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
        return;
    }
  };
  
  var Events = Mobird.Events = {
  
    on: function(name, callback, context) {
      return __eventInternalOn(this, name, callback, context);
    },
  
    listenTo: function(obj, name, callback) {
      if (!obj) return this;
      var id = obj._listenId || (obj._listenId = Mobird.uniqueId('l'));
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var listening = listeningTo[id];
  
      if (!listening) {
        var thisId = this._listenId || (this._listenId = Mobird.uniqueId('l'));
        listening = listeningTo[id] = {
          obj: obj,
          objId: id,
          id: thisId,
          listeningTo: listeningTo,
          count: 0
        };
      }
  
      // Bind callbacks on obj, and keep track of them on listening.
      __eventInternalOn(obj, name, callback, this, listening);
      return this;
    },
  
    off: function(name, callback, context) {
      if (!this._events) return this;
      this._events = __eventsApi(__eventOffApi, this._events, name, callback, {
        context: context,
        listeners: this._listeners
      });
      return this;
    },
  
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
  
      var ids = obj ? [obj._listenId] : Mobird.keys(listeningTo);
  
      for (var i = 0; i < ids.length; i++) {
        var listening = listeningTo[ids[i]];
  
        if (!listening) break;
  
        listening.obj.off(name, callback, this);
      }
      if (Mobird.isEmpty(listeningTo)) this._listeningTo = void 0;
  
      return this;
    },
  
    once: function(name, callback, context) {
      var events = __eventsApi(__eventOnceMap, {}, name, callback, Mobird.bind(this.off, this));
      return this.on(events, void 0, context);
    },
  
    listenToOnce: function(obj, name, callback) {
      var events = __eventsApi(__eventOnceMap, {}, name, callback, Mobird.bind(this.stopListening, this, obj));
      return this.listenTo(obj, events);
    },
  
    trigger: function(name) {
      if (!this._events) return this;
  
      var length = Math.max(0, arguments.length - 1);
      var args = Array(length);
      for (var i = 0; i < length; i++) args[i] = arguments[i + 1];
  
      __eventsApi(__eventTriggerApi, this._events, name, void 0, args);
      return this;
    }
  
  };

  var Class = Mobird.Class = function(options) {
    this.options = Mobird.extend({}, Mobird.result(this, 'options'), options);
  
    this.initialize.apply(this, arguments);
  };
  
  Class.extend = Mobird.inherits;
  
  Mobird.extend(Class.prototype, Events, {
  
    initialize: function() {},
  
    destroy: function() {
      this.triggerMethod('before:destroy');
      this.triggerMethod('destroy');
      this.stopListening();
  
      return this;
    },
  
    triggerMethod: __base.triggerMethod,
  
    mergeOptions: __base.mergeOptions,
  
    getOption: __base.proxyGetOption,
  
    bindEntityEvents: __base.proxyBindEntityEvents,
  
    unbindEntityEvents: __base.proxyUnbindEntityEvents
  });

  var Deferred = Mobird.Deferred = function(fn) {
  
    var status = 'pending',
      doneFuncs = [],
      failFuncs = [],
      progressFuncs = [],
      resultArgs = null,
      foreach = function(arr, handler) {
        if (Mobird.isArray(arr)) {
          for (var i = 0; i < arr.length; i++) {
            handler(arr[i]);
          }
        } else
          handler(arr);
      },
  
      promise = {
        done: function() {
          for (var i = 0; i < arguments.length; i++) {
            // skip any undefined or null arguments
            if (!arguments[i]) {
              continue;
            }
  
            if (Mobird.isArray(arguments[i])) {
              var arr = arguments[i];
              for (var j = 0; j < arr.length; j++) {
                // immediately call the function if the deferred has been resolved
                if (status === 'resolved') {
                  arr[j].apply(this, resultArgs);
                }
  
                doneFuncs.push(arr[j]);
              }
            } else {
              // immediately call the function if the deferred has been resolved
              if (status === 'resolved') {
                arguments[i].apply(this, resultArgs);
              }
  
              doneFuncs.push(arguments[i]);
            }
          }
  
          return this;
        },
  
        fail: function() {
          for (var i = 0; i < arguments.length; i++) {
            // skip any undefined or null arguments
            if (!arguments[i]) {
              continue;
            }
  
            if (Mobird.isArray(arguments[i])) {
              var arr = arguments[i];
              for (var j = 0; j < arr.length; j++) {
                // immediately call the function if the deferred has been resolved
                if (status === 'rejected') {
                  arr[j].apply(this, resultArgs);
                }
  
                failFuncs.push(arr[j]);
              }
            } else {
              // immediately call the function if the deferred has been resolved
              if (status === 'rejected') {
                arguments[i].apply(this, resultArgs);
              }
  
              failFuncs.push(arguments[i]);
            }
          }
  
          return this;
        },
  
        always: function() {
          return this.done.apply(this, arguments).fail.apply(this, arguments);
        },
  
        progress: function() {
          for (var i = 0; i < arguments.length; i++) {
            // skip any undefined or null arguments
            if (!arguments[i]) {
              continue;
            }
  
            if (Mobird.isArray(arguments[i])) {
              var arr = arguments[i];
              for (var j = 0; j < arr.length; j++) {
                // immediately call the function if the deferred has been resolved
                if (status === 'pending') {
                  progressFuncs.push(arr[j]);
                }
              }
            } else {
              // immediately call the function if the deferred has been resolved
              if (status === 'pending') {
                progressFuncs.push(arguments[i]);
              }
            }
          }
  
          return this;
        },
  
        then: function() {
          // fail callbacks
          if (arguments.length > 1 && arguments[1]) {
            this.fail(arguments[1]);
          }
  
          // done callbacks
          if (arguments.length > 0 && arguments[0]) {
            this.done(arguments[0]);
          }
  
          // notify callbacks
          if (arguments.length > 2 && arguments[2]) {
            this.progress(arguments[2]);
          }
        },
  
        promise: function(obj) {
          if (obj == null) {
            return promise;
          } else {
            for (var i in promise) {
              obj[i] = promise[i];
            }
            return obj;
          }
        },
  
        state: function() {
          return status;
        },
  
        isRejected: function() {
          return status === 'rejected';
        },
  
        isResolved: function() {
          return status === 'resolved';
        },
  
        pipe: function(done, fail, progress) {
          return Deferred(function(def) {
            foreach(done, function(func) {
              // filter function
              if (typeof func === 'function') {
                deferred.done(function() {
                  var returnval = func.apply(this, arguments);
                  // if a new deferred/promise is returned, its state is passed to the current deferred/promise
                  if (returnval && typeof returnval === 'function') {
                    returnval.promise().then(def.resolve, def.reject, def.notify);
                  } else { // if new return val is passed, it is passed to the piped done
                    def.resolve(returnval);
                  }
                });
              } else {
                deferred.done(def.resolve);
              }
            });
  
            foreach(fail, function(func) {
              if (typeof func === 'function') {
                deferred.fail(function() {
                  var returnval = func.apply(this, arguments);
  
                  if (returnval && typeof returnval === 'function') {
                    returnval.promise().then(def.resolve, def.reject, def.notify);
                  } else {
                    def.reject(returnval);
                  }
                });
              } else {
                deferred.fail(def.reject);
              }
            });
          }).promise();
        }
      },
  
      deferred = {
        resolveWith: function(context) {
          if (status === 'pending') {
            status = 'resolved';
            var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
            for (var i = 0; i < doneFuncs.length; i++) {
              doneFuncs[i].apply(context, args);
            }
          }
          return this;
        },
  
        rejectWith: function(context) {
          if (status === 'pending') {
            status = 'rejected';
            var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
            for (var i = 0; i < failFuncs.length; i++) {
              failFuncs[i].apply(context, args);
            }
          }
          return this;
        },
  
        notifyWith: function(context) {
          if (status === 'pending') {
            var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
            for (var i = 0; i < progressFuncs.length; i++) {
              progressFuncs[i].apply(context, args);
            }
          }
          return this;
        },
  
        resolve: function() {
          return this.resolveWith(this, arguments);
        },
  
        reject: function() {
          return this.rejectWith(this, arguments);
        },
  
        notify: function() {
          return this.notifyWith(this, arguments);
        }
      };
  
    var obj = promise.promise(deferred);
  
    if (fn) {
      fn.apply(obj, [obj]);
    }
  
    return obj;
  };
  
  Deferred.when = function() {
    if (arguments.length < 2) {
      var obj = arguments.length ? arguments[0] : undefined;
      if (obj && (typeof obj.isResolved === 'function' && typeof obj.isRejected === 'function')) {
        return obj.promise();
      } else {
        return Deferred().resolve(obj).promise();
      }
    } else {
      return (function(args) {
        var df = Deferred(),
          size = args.length,
          done = 0,
          rp = new Array(size); // resolve params: params of each resolve, we need to track down them to be able to pass them in the correct order if the master needs to be resolved
  
        for (var i = 0; i < args.length; i++) {
          (function(j) {
            var obj = null;
  
            if (args[j].done) {
              args[j].done(function() {
                rp[j] = (arguments.length < 2) ? arguments[0] : arguments;
                if (++done == size) {
                  df.resolve.apply(df, rp);
                }
              })
                .fail(function() {
                  df.reject(arguments);
                });
            } else {
              obj = args[j];
              args[j] = new Deferred();
  
              args[j].done(function() {
                rp[j] = (arguments.length < 2) ? arguments[0] : arguments;
                if (++done == size) {
                  df.resolve.apply(df, rp);
                }
              })
                .fail(function() {
                  df.reject(arguments);
                }).resolve(obj);
            }
          })(i);
        }
  
        return df.promise();
      })(arguments);
    }
  };

  var Callbacks = Mobird.Callbacks = function() {
    this._deferred = Deferred();
    this._callbacks = [];
  };
  
  Mobird.extend(Callbacks.prototype, {
  
    add: function(callback, contextOverride) {
      var promise = Mobird.result(this._deferred, 'promise');
  
      this._callbacks.push({
        cb: callback,
        ctx: contextOverride
      });
  
      promise.then(function(args) {
        if (contextOverride) {
          args.context = contextOverride;
        }
        callback.call(args.context, args.options);
      });
    },
  
    run: function(options, context) {
      this._deferred.resolve({
        options: options,
        context: context
      });
    },
  
    reset: function() {
      var callbacks = this._callbacks;
      this._deferred = Deferred();
      this._callbacks = [];
  
      Mobird.each(callbacks, function(cb) {
        this.add(cb.cb, cb.ctx);
      }, this);
    }
  });

  var CommandCache = function(options) {
    this.options = options;
    this._commands = {};
  };
  
  Mobird.extend(CommandCache.prototype, Events, {
  
    get: function(commandName) {
      var commands = this._commands[commandName];
  
      if (!commands) {
        commands = {
          command: commandName,
          instances: []
        };
  
        this._commands[commandName] = commands;
      }
  
      return commands;
    },
  
    add: function(commandName, args) {
      var command = this.get(commandName);
      command.instances.push(args);
    },
  
    clear: function(commandName) {
      var command = this.get(commandName);
      command.instances = [];
    }
  });
  
  var Commands = Mobird.Commands = function(options) {
    this.options = options;
    this._handlers = {};
  
    if (Mobird.isFunction(this.initialize)) {
      this.initialize(options);
    }
  
    this._initializeCommandCache();
    this.on('handler:add', this._executeCommands, this);
  };
  
  Commands.extend = Mobird.inherits;
  
  Mobird.extend(Commands.prototype, Events, {
  
    add: function(commands){
      Mobird.each(commands, function(handler, name){
        var context = null;
  
        if (Mobird.isObject(handler) && !Mobird.isFunction(handler)){
          context = handler.context;
          handler = handler.callback;
        }
  
        this.set(name, handler, context);
      }, this);
    },
  
    set: function(name, handler, context) {
      var config = {
        callback: handler,
        context: context
      };
  
      this._handlers[name] = config;
  
      this.trigger('handler:add', name, handler, context);
    },
  
    has: function(name) {
      return !!this._handlers[name];
    },
  
    get: function(name) {
      var config = this._handlers[name];
  
      if (!config) {
        return;
      }
  
      return function() {
        return config.callback.apply(config.context, arguments);
      };
    },
  
    remove: function(name) {
      delete this._handlers[name];
    },
  
    removeAll: function() {
      this._handlers = {};
    },
  
    execute: function(name) {
      name = arguments[0];
      var args = Mobird.rest(arguments);
  
      if (this.has(name)) {
        this.get(name).apply(this, args);
      } else {
        this.commandCache.add(name, args);
      }
  
    },
  
    _executeCommands: function(name, handler, context) {
      var command = this.commandCache.get(name);
  
      Mobird.each(command.instances, function(args) {
        handler.apply(context, args);
      });
  
      this.commandCache.clear(name);
    },
  
    _initializeCommandCache: function() {
      this.commandCache = new CommandCache();
    }
  
  });

  if (!Function.prototype.bind) {
    Function.prototype.bind = function(object) {
      var originalFunction = this,
        args = Array.prototype.slice.call(arguments);
      object = args.shift();
      return function() {
        return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
      };
    };
  }
  
  function __routerAddHashchangeListener(el, listener) {
    if (el.addEventListener) {
      el.addEventListener('hashchange', listener, false);
    } else if (el.attachEvent) {
      el.attachEvent('hashchange', listener);
    }
  }
  
  function __routerRemoveHashchangeListener(el, listener) {
    if (el.removeEventListener) {
      el.removeEventListener('hashchange', listener, false);
    } else if (el.detachEvent) {
      el.detachEvent('hashchange', listener);
    }
  }
  
  var ROUTER_PATH_REPLACER = "([^\/\\?]+)",
    ROUTER_PATH_NAME_MATCHER = /:([\w\d]+)/g,
    ROUTER_PATH_EVERY_MATCHER = /\/\*(?!\*)/,
    ROUTER_PATH_EVERY_REPLACER = "\/([^\/\\?]+)",
    ROUTER_PATH_EVERY_GLOBAL_MATCHER = /\*{2}/,
    ROUTER_PATH_EVERY_GLOBAL_REPLACER = "(.*?)\\??",
    ROUTER_LEADING_BACKSLASHES_MATCH = /\/*$/;
  
  var RouterRequest = function(href) {
  
    this.href = href;
  
    this.params;
  
    this.query;
  
    this.splat;
  
    this.hasNext = false;
  };
  
  RouterRequest.prototype.get = function(key, default_value) {
    return (this.params && this.params[key] !== undefined) ?
      this.params[key] : (this.query && this.query[key] !== undefined) ?
      this.query[key] : (default_value !== undefined) ?
      default_value : undefined;
  };
  
  var Router = Mobird.Router = function(options) {
    this._options = Mobird.extend({
      ignorecase: true
    }, options);
    this._routes = [];
    this._befores = [];
    this._errors = {
      '_': function(err, url, httpCode) {
        if (console && console.warn) console.warn('Router.js : ' + httpCode);
      },
      '_404': function(err, url) {
        if (console && console.warn) console.warn('404! Unmatched route for url ' + url);
      },
      '_500': function(err, url) {
        if (console && console.error) console.error('500! Internal error route for url ' + url);
        else {
          throw new Error('500');
        }
      }
    };
    this._paused = false;
    this._hasChangeHandler = this._onHashChange.bind(this);
    __routerAddHashchangeListener(window, this._hasChangeHandler);
  };
  
  Router.prototype._onHashChange = function(e) {
    if (!this._paused) {
      this._route(this._extractFragment(window.location.href));
    }
    return true;
  };
  
  Router.prototype._extractFragment = function(url) {
    var hash_index = url.indexOf('#');
    return hash_index >= 0 ? url.substring(hash_index) : '#/';
  };
  
  Router.prototype._throwsRouteError = function(httpCode, err, url) {
    if (this._errors['_' + httpCode] instanceof Function)
      this._errors['_' + httpCode](err, url, httpCode);
    else {
      this._errors._(err, url, httpCode);
    }
    return false;
  };
  
  Router.prototype._buildRequestObject = function(fragmentUrl, params, splat, hasNext) {
    if (!fragmentUrl)
      throw new Error('Unable to compile request object');
    var request = new RouterRequest(fragmentUrl);
    if (params)
      request.params = params;
    var completeFragment = fragmentUrl.split('?');
    if (completeFragment.length == 2) {
      var queryKeyValue = null;
      var queryString = completeFragment[1].split('&');
      request.query = {};
      for (var i = 0, qLen = queryString.length; i < qLen; i++) {
        queryKeyValue = queryString[i].split('=');
        request.query[decodeURI(queryKeyValue[0])] = decodeURI(queryKeyValue[1].replace(/\+/g, '%20'));
      }
      request.query;
    }
    if (splat && splat.length > 0) {
      request.splats = splat;
    }
    if (hasNext === true) {
      request.hasNext = true;
    }
    return request;
  };
  
  Router.prototype._followRoute = function(fragmentUrl, url, matchedIndexes) {
    var index = matchedIndexes.splice(0, 1),
      route = this._routes[index],
      match = url.match(route.path),
      request,
      params = {},
      splat = [];
    if (!route) {
      return this._throwsRouteError(500, new Error('Internal error'), fragmentUrl);
    }
    /*Combine path parameter name with params passed if any*/
    for (var i = 0, len = route.paramNames.length; i < len; i++) {
      params[route.paramNames[i]] = match[i + 1];
    }
    i = i + 1;
    /*If any other match put them in request splat*/
    if (match && i < match.length) {
      for (var j = i; j < match.length; j++) {
        splat.push(match[j]);
      }
    }
    /*Build next callback*/
    var hasNext = (matchedIndexes.length !== 0);
    var next = (
      function(uO, u, mI, hasNext) {
        return function(hasNext, err, error_code) {
          if (!hasNext && !err) {
            return this._throwsRouteError(500, 'Cannot call "next" without an error if request.hasNext is false', fragmentUrl);
          }
          if (err)
            return this._throwsRouteError(error_code || 500, err, fragmentUrl);
          this._followRoute(uO, u, mI);
        }.bind(this, hasNext);
      }.bind(this)(fragmentUrl, url, matchedIndexes, hasNext)
    );
    request = this._buildRequestObject(fragmentUrl, params, splat, hasNext);
    route.routeAction(request, next);
  };
  
  Router.prototype._routeBefores = function(befores, before, fragmentUrl, url, matchedIndexes) {
    var next;
    if (befores.length > 0) {
      var nextBefore = befores.splice(0, 1);
      nextBefore = nextBefore[0];
      next = function(err, error_code) {
        if (err)
          return this._throwsRouteError(error_code || 500, err, fragmentUrl);
        this._routeBefores(befores, nextBefore, fragmentUrl, url, matchedIndexes);
      }.bind(this);
    } else {
      next = function(err, error_code) {
        if (err)
          return this._throwsRouteError(error_code || 500, err, fragmentUrl);
        this._followRoute(fragmentUrl, url, matchedIndexes);
      }.bind(this);
    }
    before(this._buildRequestObject(fragmentUrl, null, null, true), next);
  };
  
  Router.prototype._route = function(fragmentUrl) {
    var route = '',
      befores = this._befores.slice(),
    /*Take a copy of befores cause is nedeed to splice them*/
      matchedIndexes = [],
      urlToTest;
    var url = fragmentUrl;
    if (url.length === 0)
      return true;
    url = url.replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
    urlToTest = (url.split('?'))[0]
      .replace(ROUTER_LEADING_BACKSLASHES_MATCH, ''); /*Removes leading backslashes from the end of the url*/
    /*Check for all matching indexes*/
    for (var p in this._routes) {
      if (this._routes.hasOwnProperty(p)) {
        route = this._routes[p];
        if (route.path.test(urlToTest)) {
          matchedIndexes.push(p);
        }
      }
    }
  
    if (matchedIndexes.length > 0) {
      /*If befores were added call them in order*/
      if (befores.length > 0) {
        var before = befores.splice(0, 1);
        before = before[0];
        /*Execute all before consecutively*/
        this._routeBefores(befores, before, fragmentUrl, url, matchedIndexes);
      } else {
        /*Follow all routes*/
        this._followRoute(fragmentUrl, url, matchedIndexes);
      }
      /*If no route matched, then call 404 error*/
    } else {
      return this._throwsRouteError(404, null, fragmentUrl);
    }
  };
  
  Router.prototype.pause = function() {
    this._paused = true;
    return this;
  };
  
  Router.prototype.play = function(triggerNow) {
    triggerNow = 'undefined' == typeof triggerNow ? false : triggerNow;
    this._paused = false;
    if (triggerNow) {
      this._route(this._extractFragment(window.location.href));
    }
    return this;
  };
  
  Router.prototype.setLocation = function(url) {
    window.history.pushState(null, '', url);
    return this;
  };
  
  Router.prototype.redirect = function(url) {
    this.setLocation(url);
    if (!this._paused)
      this._route(this._extractFragment(url));
    return this;
  };
  
  Router.prototype.addRoute = function(path, callback) {
    var match,
      modifiers = (this._options.ignorecase ? 'i' : ''),
      paramNames = [];
    if ('string' == typeof path) {
      /*Remove leading backslash from the end of the string*/
      path = path.replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
      /*Param Names are all the one defined as :param in the path*/
      while ((match = ROUTER_PATH_NAME_MATCHER.exec(path)) !== null) {
        paramNames.push(match[1]);
      }
      path = new RegExp(path
          .replace(ROUTER_PATH_NAME_MATCHER, ROUTER_PATH_REPLACER)
          .replace(ROUTER_PATH_EVERY_MATCHER, ROUTER_PATH_EVERY_REPLACER)
          .replace(ROUTER_PATH_EVERY_GLOBAL_MATCHER, ROUTER_PATH_EVERY_GLOBAL_REPLACER) + "(?:\\?.+)?$", modifiers);
    }
    this._routes.push({
      'path': path,
      'paramNames': paramNames,
      'routeAction': callback
    });
    return this;
  };
  
  Router.prototype.before = function(callback) {
    this._befores.push(callback);
    return this;
  };
  
  Router.prototype.errors = function(httpCode, callback) {
    if (isNaN(httpCode)) {
      throw new Error('Invalid code for routes error handling');
    }
    if (!(callback instanceof Function)) {
      throw new Error('Invalid callback for routes error handling');
    }
    httpCode = '_' + httpCode;
    this._errors[httpCode] = callback;
    return this;
  };
  
  Router.prototype.run = function(startUrl) {
    if (!startUrl) {
      startUrl = this._extractFragment(window.location.href);
    }
    startUrl = startUrl.indexOf('#') === 0 ? startUrl : '#' + startUrl;
    this.redirect(startUrl);
    return this;
  };
  
  Router.prototype.destroy = function() {
    __routerRemoveHashchangeListener(window, this._hasChangeHandler);
    return this;
  };

  var __viewDelegateEventSplitter = /^(\S+)\s*(.*)$/;
  var __viewOptions = ['data', 'options', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
  
  var BaseView = function(options) {
    this.cid = Mobird.uniqueId('view');
    Mobird.extend(this, Mobird.pick(options, __viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
  };
  
  Mobird.extend(BaseView.prototype, Events, {
  
    tagName: 'div',
  
    _touching: false,
  
    touchPrevents: true,
  
    touchThreshold: 10,
  
    isTouch: window.document && 'ontouchstart' in window.document && !('callPhantom' in window),
  
    $: function(selector) {
      return this.$el.find(selector);
    },
  
    initialize: function() {},
  
    render: function() {
      return this;
    },
  
    remove: function() {
      this._removeElement();
      this.stopListening();
      return this;
    },
  
    _removeElement: function() {
      this.$el.remove();
    },
  
    setElement: function(element) {
      this.undelegateEvents();
      this._setElement(element);
      this.delegateEvents();
      return this;
    },
  
    _setElement: function(el) {
      if ((Mobird.$.query && Mobird.$.query.isQ(el)) || (el instanceof Mobird.$)) {
        this.$el = el;
      } else {
        this.$el = Mobird.$(el);
      }
  
      this.el = this.$el[0];
    },
  
    delegate: function(eventName, selector, listener) {
      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },
  
    undelegateEvents: function() {
      if (this.$el) this.$el.off('.delegateEvents' + this.cid);
      return this;
    },
  
    undelegate: function(eventName, selector, listener) {
      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },
  
    _createElement: function(tagName) {
      return document.createElement(tagName);
    },
  
    _ensureElement: function() {
      if (!this.el) {
        var attrs = Mobird.extend({}, Mobird.result(this, 'attributes'));
        if (this.id) attrs.id = Mobird.result(this, 'id');
        if (this.className) attrs['class'] = Mobird.result(this, 'className');
        this.setElement(this._createElement(Mobird.result(this, 'tagName')));
        this._setAttributes(attrs);
      } else {
        this.setElement(Mobird.result(this, 'el'));
      }
    },
  
    _setAttributes: function(attributes) {
      this.$el.attr(attributes);
    },
  
    delegateEvents: function(events) {
      if (!(events || (events = __base.getValue(this, 'events')))) {
        return;
      }
      this.undelegateEvents();
      var suffix = '.delegateEvents' + this.cid;
      Mobird(events).each(function(method, key) {
        if (!Mobird.isFunction(method)) {
          method = this[events[key]];
        }
        if (!method) {
          throw new Error('Method "' + events[key] + '" does not exist');
        }
        var match = key.match(__viewDelegateEventSplitter);
        var eventName = match[1],
          selector = match[2];
        var boundHandler = Mobird.bind(this._touchHandler, this);
        method = Mobird.bind(method, this);
        if (this._useTouchHandlers(eventName, selector)) {
          this.$el.on('touchstart' + suffix, selector, boundHandler);
          this.$el.on('touchend' + suffix, selector, {
              method: method
            },
            boundHandler
          );
        } else {
          eventName += suffix;
          if (selector === '') {
            this.$el.bind(eventName, method);
          } else {
            this.$el.on(eventName, selector, method);
          }
        }
      }, this);
    },
  
    _useTouchHandlers: function(eventName, selector) {
      return this.isTouch && eventName === 'click';
    },
  
    _touchHandler: function(e) {
      var oe = e.originalEvent || e;
      if (!('changedTouches' in oe)) return;
      var touch = oe.changedTouches[0];
      var x = touch.clientX;
      var y = touch.clientY;
      switch (e.type) {
        case 'touchstart':
          this._touching = [x, y];
          break;
        case 'touchend':
          var oldX = this._touching[0];
          var oldY = this._touching[1];
          var threshold = this.touchThreshold;
          if (x < (oldX + threshold) && x > (oldX - threshold) &&
            y < (oldY + threshold) && y > (oldY - threshold)) {
            this._touching = false;
            if (this.touchPrevents) {
              var tagName = e.currentTarget.tagName;
              if (tagName === 'BUTTON' ||
                tagName === 'A') {
                e.preventDefault();
                e.stopPropagation();
              }
            }
            e.data.method(e);
          }
          break;
      }
    }
  
  });
  
  BaseView.extend = Mobird.inherits;

  var View = Mobird.View = BaseView.extend({
  
    _components: null,
  
    super: function(fn) {
  
      var caller = View.prototype.super.caller;
      var found;
      for (var child = this; child && Mobird.isFunction(child[fn]); child = child.constructor.__super__) {
        if (!found) {
          found = true;
        } else if (child[fn] != caller) {
          return child[fn].apply(this, [].slice.call(arguments, 1));
        }
      }
  
    },
  
    render: function() {
      if (this.template && Mobird.isFunction(this.template)) {
        var data = Mobird.isFunction(this.serializeData) ? this.serializeData() : this;
        var $template = Mobird.$(this.template(data));
        if (this.attachToTemplate && $template.length === 1) {
          // swap out the view on the top level element to avoid duplication
          this.$el.replaceWith($template);
  
          // delegate events
          this.setElement($template);
        } else {
          this.$el.html($template);
        }
      }
  
      this.restoreComponents();
  
      if (this.onRender && Mobird.isFunction(this.onRender)) {
        this.onRender.apply(this, arguments);
      }
      this.trigger('rendered',this);
      return this;
    },
  
    setComponent: function(component, options) {
  
      this.removeComponents();
      if (options && options.emptyDOM) {
        this.$el.empty();
      }
      this.addComponent({component: component, selector: this.$el});
      return component;
    },
  
    getComponent: function() {
      if (this._components && this._components.length > 0) {
        return this._components[0];
      }
    },
  
    restoreComponents: function() {
      // restore the sub components to the dom
      Mobird.each(this._components, this._showComponent, this);
    },
  
    addComponent: function(options) {
      if (!options || !options.component) {
        throw new Error('Missing required component option');
      }
  
      if (!this._components) {
        this._components = [options];
      } else {
        this._components.push(options);
      }
  
      this.listenTo(options.component,'closed',this._removeComponent);
  
      return this._showComponent(options);
    },
  
    getComponentCount: function() {
      return this._components ? this._components.length : 0;
    },
  
    removeComponents: function() {
      Mobird.each(this._components, function(component) {
        this.stopListening(component.component);
        component.component.close();
      }, this);
      this._components = [];
    },
  
    _removeComponent: function(component) {
      var componentOption = Mobird.findWhere(this._components, {component: component});
      var index = this._components.indexOf(componentOption);
      if (index > -1) {
        this._components.splice(index,1);
      }
    },
  
    _showComponent: function(options) {
      var selector;
      if (Mobird.isObject(options.selector)) {
        selector = options.selector;
      } else if (Mobird.isString(options.selector)) {
        selector = this.$(options.selector);
      } else {
        selector = this.$el;
      }
  
      options.component.render();
      if (options.location === 'prepend') {
        selector.prepend(options.component.el);
      } else if (options.location === 'before') {
        selector.before(options.component.el);
      } else if (options.location === 'after') {
        selector.after(options.component.el);
      } else {
        selector.append(options.component.el);
      }
  
      if (options.component.onShow && Mobird.isFunction(options.component.onShow)) {
        options.component.onShow.apply(options.component, arguments);
      }
      options.component.trigger('shown',this);
  
      return options.component;
    },
  
    close: function() {
      if (this.onClose && Mobird.isFunction(this.onClose)) {
        this.onClose.apply(this, arguments);
      }
      this.removeComponents();
      this.remove();
      this.trigger('closed',this);
      this.unbind();
    }
  
  });

  Mobird.Component = BaseView.extend({
  
    close: function() {
      if (this.onClose && Mobird.isFunction(this.onClose)) {
        this.onClose.apply(this, arguments);
      }
      this.remove();
      this.trigger('closed',this);
      this.unbind();
    }
  
  });

  var Screen = Mobird.Screen = Class.extend({
  
    constructor: function(options) {
  
      this.options = options || {};
      this.el = this.getOption('el');
  
      if ((Mobird.$.query && Mobird.$.query.isQ(this.el)) || (this.el instanceof Mobird.$)) {
        this.el = this.el[0];
      }
  
      if (!this.el) {
        throw new Error('An "el" must be specified for a screen.');
      }
  
      this.$el = this.getEl(this.el);
      Class.call(this, options);
    },
  
    adjustTitle: function(title) {
      title = title || this.$el.attr('mo-title');
  
      if (title) {
        Mobird.adjustTitle(title);
      }
  
    },
  
    _toggleScreen: function() {
      var self = this;
      var transition = self.$el.attr('mo-transition');
      if (transition !== 'none') {
        ScreenTransition.goTo(self.$el, transition || 'slideleft', location.hash);
      } else {
        self.$el.siblings().removeClass('current');
        self.$el.addClass('current');
      }
    },
  
    show: function(view, options) {
      if (!this._ensureElement()) {
        return;
      }
  
      this._ensureViewIsIntact(view);
  
      this.adjustTitle();
      this._toggleScreen();
  
      var showOptions = options || {};
      var isDifferentView = view !== this.currentView;
      var preventDestroy = !!showOptions.preventDestroy;
      var forceShow = !!showOptions.forceShow;
  
      var isChangingView = !!this.currentView;
  
      var _shouldDestroyView = isDifferentView && !preventDestroy;
  
      var _shouldShowView = isDifferentView || forceShow;
  
      if (isChangingView) {
        this.triggerMethod('before:swapOut', this.currentView, this, options);
      }
  
      if (this.currentView) {
        delete this.currentView._parent;
      }
  
      if (_shouldDestroyView) {
        this.empty();
  
      } else if (isChangingView && _shouldShowView) {
        this.currentView.off('destroy', this.empty, this);
      }
  
      if (_shouldShowView) {
  
        view.once('destroy', this.empty, this);
        view.render();
  
        view._parent = this;
  
        if (isChangingView) {
          this.triggerMethod('before:swap', view, this, options);
        }
  
        this.triggerMethod('before:show', view, this, options);
        __base.triggerMethodOn(view, 'before:show', view, this, options);
  
        if (isChangingView) {
          this.triggerMethod('swapOut', this.currentView, this, options);
        }
  
        var attachedScreen = __base.isNodeAttached(this.el);
  
        var displayedViews = [];
  
        var attachOptions = Mobird.extend({
          triggerBeforeAttach: this.triggerBeforeAttach,
          triggerAttach: this.triggerAttach
        }, showOptions);
  
        if (attachedScreen && attachOptions.triggerBeforeAttach) {
          displayedViews = this._displayedViews(view);
          this._triggerAttach(displayedViews, 'before:');
        }
  
        this.attachHtml(view);
        this.currentView = view;
  
        if (attachedScreen && attachOptions.triggerAttach) {
          displayedViews = this._displayedViews(view);
          this._triggerAttach(displayedViews);
        }
  
        if (isChangingView) {
          this.triggerMethod('swap', view, this, options);
        }
  
        this.triggerMethod('show', view, this, options);
        __base.triggerMethodOn(view, 'show', view, this, options);
  
        return this;
      }
  
      return this;
    },
  
    triggerBeforeAttach: true,
    triggerAttach: true,
  
    _triggerAttach: function(views, prefix) {
      var eventName = (prefix || '') + 'attach';
      Mobird.each(views, function(view) {
        __base.triggerMethodOn(view, eventName, view, this);
      }, this);
    },
  
    _displayedViews: function(view) {
      return Mobird.union([view], Mobird.result(view, '_getNestedViews') || []);
    },
  
    _ensureElement: function() {
      if (!Mobird.isObject(this.el)) {
        this.$el = this.getEl(this.el);
        this.el = this.$el[0];
      }
  
      if (!this.$el || this.$el.length === 0) {
        if (this.getOption('allowMissingEl')) {
          return false;
        } else {
          throw new Error('An "el" ' + this.$el.selector + ' must exist in DOM');
        }
      }
      return true;
    },
  
    _ensureViewIsIntact: function(view) {
      if (!view) {
        throw new Error('The view passed is undefined and therefore invalid. You must pass a view instance to show.');
      }
  
      if (view.isDestroyed) {
        throw new Error('View (cid: "' + view.cid + '") has already been destroyed and cannot be used.');
      }
    },
  
    getEl: function(el) {
      return Mobird.$(el, __base._getValue(this.options.parentEl, this));
    },
  
    attachHtml: function(view) {
      this.$el.contents().detach();
  
      this.el.appendChild(view.el);
    },
  
    empty: function(options) {
      var view = this.currentView;
  
      var preventDestroy = __base._getValue(options, 'preventDestroy', this);
      if (!view) {
        return;
      }
  
      view.off('destroy', this.empty, this);
      this.triggerMethod('before:empty', view);
      if (!preventDestroy) {
        this._destroyView();
      }
      this.triggerMethod('empty', view);
  
      // Remove screen pointer to the currentView
      delete this.currentView;
  
      if (preventDestroy) {
        this.$el.contents().detach();
      }
  
      return this;
    },
  
    _destroyView: function() {
      var view = this.currentView;
  
      if (view.destroy && !view.isDestroyed) {
        view.destroy();
      } else if (view.remove) {
        view.remove();
  
        view.isDestroyed = true;
      }
    },
  
    attachView: function(view) {
      this.currentView = view;
      return this;
    },
  
    hasView: function() {
      return !!this.currentView;
    },
  
    reset: function() {
      this.empty();
  
      if (this.$el) {
        this.el = this.$el.selector;
      }
  
      delete this.$el;
      return this;
    }
  
  }, {
    buildScreen: function(screenConfig, DefaultScreenClass) {
      if (Mobird.isString(screenConfig)) {
        return this._buildScreenFromSelector(screenConfig, DefaultScreenClass);
      }
  
      if (screenConfig.selector || screenConfig.el || screenConfig.screenClass) {
        return this._buildScreenFromObject(screenConfig, DefaultScreenClass);
      }
  
      if (Mobird.isFunction(screenConfig)) {
        return this._buildScreenFromScreenClass(screenConfig);
      }
  
      throw new Error('Improper screen configuration type.');
    },
  
    _buildScreenFromSelector: function(selector, DefaultScreenClass) {
      return new DefaultScreenClass({
        el: selector
      });
    },
  
    _buildScreenFromObject: function(screenConfig, DefaultScreenClass) {
      var ScreenClass = screenConfig.screenClass || DefaultScreenClass;
      var options = Mobird.omit(screenConfig, 'selector', 'screenClass');
  
      if (screenConfig.selector && !options.el) {
        options.el = screenConfig.selector;
      }
  
      return new ScreenClass(options);
    },
  
    _buildScreenFromScreenClass: function(ScreenClass) {
      return new ScreenClass();
    }
  });

  var ScreenTransition = Mobird.ScreenTransition = {
  
    options: {
      useAnimations: true,
      defaultAnimation: 'slideleft',
      tapBuffer: 100, // High click delay = ~350, quickest animation (slide) = 250
      trackScrollPositions: false,
      updateHash: true
    },
  
    $currentScreen: Mobird.$('.mo-screen.current'),
    $body: Mobird.$('.mo-body'),
  
    _history: [],
  
    _animations: [{
      name: 'cubeleft',
      is3d: true
    }, {
      name: 'cuberight',
      is3d: true
    }, {
      name: 'dissolve'
    }, {
      name: 'fade'
    }, {
      name: 'flipleft',
      is3d: true
    }, {
      name: 'flipright',
      is3d: true
    }, {
      name: 'pop',
      is3d: true
    }, {
      name: 'swapleft',
      is3d: true
    }, {
      name: 'swapright',
      is3d: true
    }, {
      name: 'slidedown'
    }, {
      name: 'slideright'
    }, {
      name: 'slideup'
    }, {
      name: 'slideleft'
    }],
  
    addAnimation: function(animation) {
      if (Mobird.isString(animation.name)) {
        this._animations.push(animation);
      }
    },
  
    _addScreenToHistory: function(screen, animation, hash) {
      this._history.unshift({
        screen: screen,
        animation: animation,
        hash: hash || location.hash,
        id: screen.attr('id')
      });
    },
  
    transit: function(fromScreen, toScreen, animation, goingBack, hash) {
  
      var self = this;
  
      goingBack = goingBack ? goingBack : false;
  
      // Error check for target screen
      if (Mobird.isUndefined(toScreen) || toScreen.length === 0) {
        console.warn('Target element is missing.');
        return false;
      }
  
      // Error check for fromScreen === toScreen
      if (toScreen.hasClass('current')) {
        console.warn('You are already on the screen you are trying to navigate to.');
        return false;
      }
  
      // Collapse the keyboard
      Mobird.$(':focus').trigger('blur');
  
      fromScreen.trigger('screenAnimationStart', {
        direction: 'out',
        back: goingBack
      });
      toScreen.trigger('screenAnimationStart', {
        direction: 'in',
        back: goingBack
      });
  
      if (Support.animationEvents && animation && this.options.useAnimations) {
        // Fail over to 2d animation if need be
        if (!Support.transform3d() && animation.is3d) {
          console.warn('Did not detect support for 3d animations, falling back to ' + this.options.defaultAnimation + '.');
          animation.name = this.options.defaultAnimation;
        }
  
        // Reverse animation if need be
        var finalAnimationName = animation.name,
          is3d = animation.is3d ? 'animating3d' : '';
  
        if (goingBack) {
          finalAnimationName = finalAnimationName.replace(/left|right|up|down|in|out/, this._reverseAnimation);
        }
  
        console.warn('finalAnimationName is ' + finalAnimationName + '.');
  
        setTimeout(function() {
          navigationEndHandler();
        }, 250);
  
        // Trigger animations
        this.$body.addClass('animating ' + is3d);
  
        var lastScroll = window.pageYOffset;
  
        // Position the incoming screen so toolbar is at top of
        // viewport regardless of scroll position on from screen
        if (this.options.trackScrollPositions === true) {
          toScreen.css('top', window.pageYOffset - (toScreen.data('lastScroll') || 0));
        }
  
        toScreen.addClass(finalAnimationName + ' in current');
        fromScreen.removeClass('current').addClass(finalAnimationName + ' out inmotion');
  
        if (this.options.trackScrollPositions === true) {
          fromScreen.data('lastScroll', lastScroll);
          Mobird.$('.mo-scroll', fromScreen).each(function() {
            Mobird.$(this).data('lastScroll', this.scrollTop);
          });
        }
      } else {
        toScreen.addClass('current in');
        fromScreen.removeClass('current');
        navigationEndHandler();
      }
  
      // Housekeeping
      this.$currentScreen = toScreen;
      if (goingBack) {
        this._history.shift();
      } else {
        this._addScreenToHistory(this.$currentScreen, animation, hash);
      }
  
      if (hash) {
        this.setHash(hash);
      }
  
      // Private navigationEnd callback
      function navigationEndHandler(event) {
        var bufferTime = self.options.tapBuffer;
  
        if (Support.animationEvents && animation && self.options.useAnimations) {
          fromScreen.unbind('webkitAnimationEnd', navigationEndHandler);
          fromScreen.removeClass(finalAnimationName + ' out inmotion');
          if (finalAnimationName) {
            toScreen.removeClass(finalAnimationName);
          }
          self.$body.removeClass('animating animating3d');
          if (self.options.trackScrollPositions === true) {
            toScreen.css('top', -toScreen.data('lastScroll'));
  
            // Have to make sure the scroll/style resets
            // are outside the flow of this function.
            setTimeout(function() {
              toScreen.css('top', 0);
              window.scroll(0, toScreen.data('lastScroll'));
              Mobird.$('.mo-scroll', toScreen).each(function() {
                this.scrollTop = -Mobird.$(this).data('lastScroll');
              });
            }, 0);
          }
        } else {
          fromScreen.removeClass(finalAnimationName + ' out inmotion');
          if (finalAnimationName) {
            toScreen.removeClass(finalAnimationName);
          }
          bufferTime += 260;
        }
  
        // 'in' class is intentionally delayed,
        // as it is our ghost click hack
        setTimeout(function() {
          toScreen.removeClass('in');
          window.scroll(0, 0);
        }, bufferTime);
  
        // Trigger custom events
        toScreen.trigger('screenAnimationEnd', {
          direction: 'in',
          animation: animation,
          back: goingBack
        });
        fromScreen.trigger('screenAnimationEnd', {
          direction: 'out',
          animation: animation,
          back: goingBack
        });
      }
  
      return true;
    },
  
    _reverseAnimation: function(animation) {
      var opposites = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left',
        'in': 'out',
        'out': 'in'
      };
      return opposites[animation] || animation;
    },
  
    goBack: function goBack() {
      if (this._history.length < 1) {
        console.warn('History is empty.');
      }
  
      if (this._history.length === 1) {
        console.warn('You are on the first panel.');
        window.history.go(-1);
      }
  
      var from = this._history[0],
        to = this._history[1];
  
      if (to && to.screen) {
        if (to.hash) {
          this.setHash(to.hash);
        }
        if (this.transit(from.screen, to.screen, from.animation, true)) {
          return true;
        }
      }
      console.warn('Could not go back.');
      return false;
    },
  
    goTo: function goTo(toScreen, animation, hash) {
      var fromScreen;
  
      if (this._history.length === 0) {
  
        if (Mobird.$('.mo-screen.current').length === 0) {
          this.$currentScreen = Mobird.$('.mo-screen:first-child').addClass('current');
        }
  
        fromScreen = this.$currentScreen;
  
      } else {
        fromScreen = this._history[0].screen;
      }
  
      if (typeof animation === 'string') {
        for (var i = 0, max = this._animations.length; i < max; i++) {
          if (this._animations[i].name === animation) {
            animation = this._animations[i];
            break;
          }
        }
      }
  
      if (this.transit(fromScreen, toScreen, animation, false, hash)) {
        return true;
      } else {
        console.warn('Could not animate screens.');
        return false;
      }
    },
  
    setHash: function(hash) {
      if (this.options.updateHash) {
        location.hash = '#' + hash.replace(/^#/, '');
      }
    }
  
  };

  var ScreenManager = Mobird.ScreenManager = Class.extend({
    constructor: function(options) {
      this._screens = {};
      this.length = 0;
  
      Class.call(this, options);
  
      this.addScreens(this.getOption('screens'));
    },
  
    addScreens: function(screenDefinitions, defaults) {
      screenDefinitions = __base._getValue(screenDefinitions, this, arguments);
  
      return Mobird.reduce(screenDefinitions, function(screens, definition, name) {
        if (Mobird.isString(definition)) {
          definition = {
            selector: definition
          };
        }
        if (definition.selector) {
          definition = Mobird.defaults({}, definition, defaults);
        }
  
        screens[name] = this.addScreen(name, definition);
        return screens;
      }, {}, this);
    },
  
    addScreen: function(name, definition) {
      var screen;
  
      if (definition instanceof Screen) {
        screen = definition;
      } else {
        screen = Screen.buildScreen(definition, Screen);
      }
  
      this.triggerMethod('before:add:screen', name, screen);
  
      screen._parent = this;
      this._store(name, screen);
  
      this.triggerMethod('add:screen', name, screen);
      return screen;
    },
  
    get: function(name) {
      return this._screens[name];
    },
  
    getScreens: function() {
      return Mobird.clone(this._screens);
    },
  
    removeScreen: function(name) {
      var screen = this._screens[name];
      this._remove(name, screen);
  
      return screen;
    },
  
    removeScreens: function() {
      var screens = this.getScreens();
      Mobird.each(this._screens, function(screen, name) {
        this._remove(name, screen);
      }, this);
  
      return screens;
    },
  
    emptyScreens: function() {
      var screens = this.getScreens();
      Mobird.invoke(screens, 'empty');
      return screens;
    },
  
    destroy: function() {
      this.removeScreens();
      return Class.prototype.destroy.apply(this, arguments);
    },
  
    _store: function(name, screen) {
      if (!this._screens[name]) {
        this.length++;
      }
  
      this._screens[name] = screen;
    },
  
    _remove: function(name, screen) {
      this.triggerMethod('before:remove:screen', name, screen);
      screen.empty();
      screen.stopListening();
  
      delete screen._parent;
      delete this._screens[name];
      this.length--;
      this.triggerMethod('remove:screen', name, screen);
    }
  });

  Mobird.Application = Class.extend({
  
    constructor: function(options) {
      this._initializeScreens(options);
      this._initCallbacks = new Callbacks();
      this.commands = new Commands();
  
      this.appRouter = new Router();
  
      if (options && options.routers) {
        this._initializeRouters(options.routers);
      }
  
      if (options && options.commands) {
        this._initializeCommands(options.commands);
      }
  
      // Mobird.extend(this, options);
  
      Class.call(this, options);
    },
  
    addInitializer: function(initializer) {
      this._initCallbacks.add(initializer);
    },
  
    start: function(options) {
      this.triggerMethod('before:start', options);
      this._initCallbacks.run(options, this);
      this.triggerMethod('start', options);
    },
  
    addScreens: function(screens) {
      return this._screenManager.addScreens(screens);
    },
  
    emptyScreens: function() {
      return this._screenManager.emptyScreens();
    },
  
    removeScreen: function(screen) {
      return this._screenManager.removeScreen(screen);
    },
  
    getScreen: function(screen) {
      return this._screenManager.get(screen);
    },
  
    getScreens: function() {
      return this._screenManager.getScreens();
    },
  
    getScreenManager: function() {
      return new ScreenManager();
    },
  
    _initializeRouters: function(routers) {
      for(var matcher in routers) {
        this.appRouter.addRoute(matcher, routers[matcher]);
      }
    },
  
    _initializeCommands: function(commands) {
      this.commands.add(commands);
    },
  
    _initializeScreens: function(options) {
      var screens = Mobird.isFunction(this.screens) ? this.screens(options) : this.screens || {};
  
      this._initScreenManager();
  
      // Enable users to define `screens` in instance options.
      var optionScreens = __base.getOption(options, 'screens');
  
      // Enable screen options to be a function
      if (Mobird.isFunction(optionScreens)) {
        optionScreens = optionScreens.call(this, options);
      }
  
      // Overwrite current screens with those passed in options
      Mobird.extend(screens, optionScreens);
  
      this.addScreens(screens);
  
      return this;
    },
  
    _initScreenManager: function() {
      this._screenManager = this.getScreenManager();
      this._screenManager._parent = this;
  
      this.listenTo(this._screenManager, 'before:add:screen', function() {
        __base._triggerMethod(this, 'before:add:screen', arguments);
      });
  
      this.listenTo(this._screenManager, 'add:screen', function(name, screen) {
        this[name] = screen;
        __base._triggerMethod(this, 'add:screen', arguments);
      });
  
      this.listenTo(this._screenManager, 'before:remove:screen', function() {
        __base._triggerMethod(this, 'before:remove:screen', arguments);
      });
  
      this.listenTo(this._screenManager, 'remove:screen', function(name) {
        delete this[name];
        __base._triggerMethod(this, 'remove:screen', arguments);
      });
    }
  });

  return Mobird;

}));