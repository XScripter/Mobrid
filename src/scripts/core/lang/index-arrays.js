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