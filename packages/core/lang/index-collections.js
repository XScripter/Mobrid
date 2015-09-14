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