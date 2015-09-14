(function() {
  var Mobird = typeof require == 'function' ? require('..') : window.Mobird;

  QUnit.module('Collections');

  test('each', function() {
    Mobird.each([1, 2, 3], function(num, i) {
      equal(num, i + 1, 'each iterators provide value and iteration count');
    });

    var answers = [];
    Mobird.each([1, 2, 3], function(num){ answers.push(num * this.multiplier);}, {multiplier : 5});
    deepEqual(answers, [5, 10, 15], 'context object property accessed');

    answers = [];
    Mobird.each([1, 2, 3], function(num){ answers.push(num); });
    deepEqual(answers, [1, 2, 3], 'aliased as "forEach"');

    answers = [];
    var obj = {one : 1, two : 2, three : 3};
    obj.constructor.prototype.four = 4;
    Mobird.each(obj, function(value, key){ answers.push(key); });
    deepEqual(answers, ['one', 'two', 'three'], 'iterating over objects works, and ignores the object prototype.');
    delete obj.constructor.prototype.four;

    // ensure the each function is JITed
    Mobird(1000).times(function() { Mobird.each([], function(){}); });
    var count = 0;
    obj = {1 : 'foo', 2 : 'bar', 3 : 'baz'};
    Mobird.each(obj, function(value, key){ count++; });
    equal(count, 3, 'the fun should be called only 3 times');

    var answer = null;
    Mobird.each([1, 2, 3], function(num, index, arr){ if (Mobird.contains(arr, num)) answer = true; });
    ok(answer, 'can reference the original collection from inside the iterator');

    answers = 0;
    Mobird.each(null, function(){ ++answers; });
    equal(answers, 0, 'handles a null properly');

    Mobird.each(false, function(){});

    var a = [1, 2, 3];
    strictEqual(Mobird.each(a, function(){}), a);
    strictEqual(Mobird.each(null, function(){}), null);
  });

  test('lookupIterator with contexts', function() {
    Mobird.each([true, false, 'yes', '', 0, 1, {}], function(context) {
      Mobird.each([1], function() {
        equal(this, context);
      }, context);
    });
  });

  test('Iterating objects with sketchy length properties', function() {
    var functions = [
        'each', 'map', 'filter', 'find',
        'some', 'every', 'max', 'min',
        'groupBy', 'countBy', 'partition', 'indexBy'
    ];
    var reducers = ['reduce', 'reduceRight'];

    var tricks = [
      {length: '5'},
      {
        length: {
          valueOf: Mobird.constant(5)
        }
      },
      {length: Math.pow(2, 53) + 1},
      {length: Math.pow(2, 53)},
      {length: null},
      {length: -2},
      {length: new Number(15)}
    ];

    expect(tricks.length * (functions.length + reducers.length + 4));

    Mobird.each(tricks, function(trick) {
      var length = trick.length;
      strictEqual(Mobird.size(trick), 1, 'size on obj with length: ' + length);
      deepEqual(Mobird.toArray(trick), [length], 'toArray on obj with length: ' + length);
      deepEqual(Mobird.shuffle(trick), [length], 'shuffle on obj with length: ' + length);
      deepEqual(Mobird.sample(trick), length, 'sample on obj with length: ' + length);


      Mobird.each(functions, function(method) {
        Mobird[method](trick, function(val, key) {
          strictEqual(key, 'length', method + ': ran with length = ' + val);
        });
      });

      Mobird.each(reducers, function(method) {
        strictEqual(Mobird[method](trick), trick.length, method);
      });
    });
  });

  test('Resistant to collection length and properties changing while iterating', function() {

    var collection = [
      'each', 'map', 'filter', 'find',
      'some', 'every', 'max', 'min', 'reject',
      'groupBy', 'countBy', 'partition', 'indexBy',
      'reduce', 'reduceRight'
    ];
    var array = [
      'findIndex', 'findLastIndex'
    ];
    var object = [
      'mapObject', 'findKey', 'pick', 'omit'
    ];

    Mobird.each(collection.concat(array), function(method) {
      var sparseArray = [1, 2, 3];
      sparseArray.length = 100;
      var answers = 0;
      Mobird[method](sparseArray, function(){
        ++answers;
        return method === 'every' ? true : null;
      }, {});
      equal(answers, 100, method + ' enumerates [0, length)');

      var growingCollection = [1, 2, 3], count = 0;
      Mobird[method](growingCollection, function() {
        if (count < 10) growingCollection.push(count++);
        return method === 'every' ? true : null;
      }, {});
      equal(count, 3, method + ' is resistant to length changes');
    });

    Mobird.each(collection.concat(object), function(method) {
      var changingObject = {0: 0, 1: 1}, count = 0;
      Mobird[method](changingObject, function(val) {
        if (count < 10) changingObject[++count] = val + 1;
        return method === 'every' ? true : null;
      }, {});

      equal(count, 2, method + ' is resistant to property changes');
    });
  });

  test('map', function() {
    var doubled = Mobird.map([1, 2, 3], function(num){ return num * 2; });
    deepEqual(doubled, [2, 4, 6], 'doubled numbers');

    var tripled = Mobird.map([1, 2, 3], function(num){ return num * this.multiplier; }, {multiplier : 3});
    deepEqual(tripled, [3, 6, 9], 'tripled numbers with context');

    doubled = Mobird([1, 2, 3]).map(function(num){ return num * 2; });
    deepEqual(doubled, [2, 4, 6], 'OO-style doubled numbers');

    var ids = Mobird.map({length: 2, 0: {id: '1'}, 1: {id: '2'}}, function(n){
      return n.id;
    });
    deepEqual(ids, ['1', '2'], 'Can use collection methods on Array-likes.');

    deepEqual(Mobird.map(null, Mobird.noop), [], 'handles a null properly');

    deepEqual(Mobird.map([1], function() {
      return this.length;
    }, [5]), [1], 'called with context');

    // Passing a property name like Mobird.pluck.
    var people = [{name : 'moe', age : 30}, {name : 'curly', age : 50}];
    deepEqual(Mobird.map(people, 'name'), ['moe', 'curly'], 'predicate string map to object properties');
  });

  test('reduce', function() {
    var sum = Mobird.reduce([1, 2, 3], function(sum, num){ return sum + num; }, 0);
    equal(sum, 6, 'can sum up an array');

    var context = {multiplier : 3};
    sum = Mobird.reduce([1, 2, 3], function(sum, num){ return sum + num * this.multiplier; }, 0, context);
    equal(sum, 18, 'can reduce with a context object');

    sum = Mobird([1, 2, 3]).reduce(function(sum, num){ return sum + num; }, 0);
    equal(sum, 6, 'OO-style reduce');

    sum = Mobird.reduce([1, 2, 3], function(sum, num){ return sum + num; });
    equal(sum, 6, 'default initial value');

    var prod = Mobird.reduce([1, 2, 3, 4], function(prod, num){ return prod * num; });
    equal(prod, 24, 'can reduce via multiplication');

    ok(Mobird.reduce(null, Mobird.noop, 138) === 138, 'handles a null (with initial value) properly');
    equal(Mobird.reduce([], Mobird.noop, undefined), undefined, 'undefined can be passed as a special case');
    equal(Mobird.reduce([Mobird], Mobird.noop), Mobird, 'collection of length one with no initial value returns the first item');
    equal(Mobird.reduce([], Mobird.noop), undefined, 'returns undefined when collection is empty and no initial value');
  });

  test('reduceRight', function() {
    var list = Mobird.reduceRight(['foo', 'bar', 'baz'], function(memo, str){ return memo + str; }, '');
    equal(list, 'bazbarfoo', 'can perform right folds');

    list = Mobird.reduceRight(['foo', 'bar', 'baz'], function(memo, str){ return memo + str; });
    equal(list, 'bazbarfoo', 'default initial value');

    var sum = Mobird.reduceRight({a: 1, b: 2, c: 3}, function(sum, num){ return sum + num; });
    equal(sum, 6, 'default initial value on object');

    ok(Mobird.reduceRight(null, Mobird.noop, 138) === 138, 'handles a null (with initial value) properly');
    equal(Mobird.reduceRight([Mobird], Mobird.noop), Mobird, 'collection of length one with no initial value returns the first item');

    equal(Mobird.reduceRight([], Mobird.noop, undefined), undefined, 'undefined can be passed as a special case');
    equal(Mobird.reduceRight([], Mobird.noop), undefined, 'returns undefined when collection is empty and no initial value');

    // Assert that the correct arguments are being passed.

    var args,
        memo = {},
        object = {a: 1, b: 2},
        lastKey = Mobird.keys(object).pop();

    var expected = lastKey === 'a'
      ? [memo, 1, 'a', object]
      : [memo, 2, 'b', object];

    Mobird.reduceRight(object, function() {
      if (!args) args = Mobird.toArray(arguments);
    }, memo);

    deepEqual(args, expected);

    // And again, with numeric keys.

    object = {'2': 'a', '1': 'b'};
    lastKey = Mobird.keys(object).pop();
    args = null;

    expected = lastKey === '2'
      ? [memo, 'a', '2', object]
      : [memo, 'b', '1', object];

    Mobird.reduceRight(object, function() {
      if (!args) args = Mobird.toArray(arguments);
    }, memo);

    deepEqual(args, expected);
  });

  test('find', function() {
    var array = [1, 2, 3, 4];
    strictEqual(Mobird.find(array, function(n) { return n > 2; }), 3, 'should return first found `value`');
    strictEqual(Mobird.find(array, function() { return false; }), void 0, 'should return `undefined` if `value` is not found');

    array.dontmatch = 55;
    strictEqual(Mobird.find(array, function(x) { return x === 55; }), void 0, 'iterates array-likes correctly');

    // Matching an object like Mobird.findWhere.
    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}, {a: 2, b: 4}];
    deepEqual(Mobird.find(list, {a: 1}), {a: 1, b: 2}, 'can be used as findWhere');
    deepEqual(Mobird.find(list, {b: 4}), {a: 1, b: 4});
    ok(!Mobird.find(list, {c: 1}), 'undefined when not found');
    ok(!Mobird.find([], {c: 1}), 'undefined when searching empty list');

    var result = Mobird.find([1, 2, 3], function(num){ return num * 2 === 4; });
    equal(result, 2, 'found the first "2" and broke the loop');

    var obj = {
      a: {x: 1, z: 3},
      b: {x: 2, z: 2},
      c: {x: 3, z: 4},
      d: {x: 4, z: 1}
    };

    deepEqual(Mobird.find(obj, {x: 2}), {x: 2, z: 2}, 'works on objects');
    deepEqual(Mobird.find(obj, {x: 2, z: 1}), void 0);
    deepEqual(Mobird.find(obj, function(x) {
      return x.x === 4;
    }), {x: 4, z: 1});

    Mobird.findIndex([{a: 1}], function(a, key, obj) {
      equal(key, 0);
      deepEqual(obj, [{a: 1}]);
      strictEqual(this, Mobird, 'called with context');
    }, Mobird);
  });

  test('filter', function() {
    var evenArray = [1, 2, 3, 4, 5, 6];
    var evenObject = {one: 1, two: 2, three: 3};
    var isEven = function(num){ return num % 2 === 0; };

    deepEqual(Mobird.filter(evenArray, isEven), [2, 4, 6]);
    deepEqual(Mobird.filter(evenObject, isEven), [2], 'can filter objects');
    deepEqual(Mobird.filter([{}, evenObject, []], 'two'), [evenObject], 'predicate string map to object properties');

    Mobird.filter([1], function() {
      equal(this, evenObject, 'given context');
    }, evenObject);

    // Can be used like Mobird.where.
    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}];
    deepEqual(Mobird.filter(list, {a: 1}), [{a: 1, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}]);
    deepEqual(Mobird.filter(list, {b: 2}), [{a: 1, b: 2}, {a: 2, b: 2}]);
    deepEqual(Mobird.filter(list, {}), list, 'Empty object accepts all items');
    deepEqual(Mobird(list).filter({}), list, 'OO-filter');
  });

  test('reject', function() {
    var odds = Mobird.reject([1, 2, 3, 4, 5, 6], function(num){ return num % 2 === 0; });
    deepEqual(odds, [1, 3, 5], 'rejected each even number');

    var context = 'obj';

    var evens = Mobird.reject([1, 2, 3, 4, 5, 6], function(num){
      equal(context, 'obj');
      return num % 2 !== 0;
    }, context);
    deepEqual(evens, [2, 4, 6], 'rejected each odd number');

    deepEqual(Mobird.reject([odds, {one: 1, two: 2, three: 3}], 'two'), [odds], 'predicate string map to object properties');

    // Can be used like Mobird.where.
    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}];
    deepEqual(Mobird.reject(list, {a: 1}), [{a: 2, b: 2}]);
    deepEqual(Mobird.reject(list, {b: 2}), [{a: 1, b: 3}, {a: 1, b: 4}]);
    deepEqual(Mobird.reject(list, {}), [], 'Returns empty list given empty object');
    deepEqual(Mobird.reject(list, []), [], 'Returns empty list given empty array');
  });

  test('every', function() {
    ok(Mobird.every([], Mobird.identity), 'the empty set');
    ok(Mobird.every([true, true, true], Mobird.identity), 'every true values');
    ok(!Mobird.every([true, false, true], Mobird.identity), 'one false value');
    ok(Mobird.every([0, 10, 28], function(num){ return num % 2 === 0; }), 'even numbers');
    ok(!Mobird.every([0, 11, 28], function(num){ return num % 2 === 0; }), 'an odd number');
    ok(Mobird.every([1], Mobird.identity) === true, 'cast to boolean - true');
    ok(Mobird.every([0], Mobird.identity) === false, 'cast to boolean - false');
    ok(!Mobird.every([undefined, undefined, undefined], Mobird.identity), 'works with arrays of undefined');

    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}];
    ok(!Mobird.every(list, {a: 1, b: 2}), 'Can be called with object');
    ok(Mobird.every(list, 'a'), 'String mapped to object property');

    list = [{a: 1, b: 2}, {a: 2, b: 2, c: true}];
    ok(Mobird.every(list, {b: 2}), 'Can be called with object');
    ok(!Mobird.every(list, 'c'), 'String mapped to object property');

    ok(Mobird.every({a: 1, b: 2, c: 3, d: 4}, Mobird.isNumber), 'takes objects');
    ok(!Mobird.every({a: 1, b: 2, c: 3, d: 4}, Mobird.isObject), 'takes objects');
    ok(Mobird.every(['a', 'b', 'c', 'd'], Mobird.hasOwnProperty, {a: 1, b: 2, c: 3, d: 4}), 'context works');
    ok(!Mobird.every(['a', 'b', 'c', 'd', 'f'], Mobird.hasOwnProperty, {a: 1, b: 2, c: 3, d: 4}), 'context works');
  });

  test('some', function() {
    ok(!Mobird.some([]), 'the empty set');
    ok(!Mobird.some([false, false, false]), 'all false values');
    ok(Mobird.some([false, false, true]), 'one true value');
    ok(Mobird.some([null, 0, 'yes', false]), 'a string');
    ok(!Mobird.some([null, 0, '', false]), 'falsy values');
    ok(!Mobird.some([1, 11, 29], function(num){ return num % 2 === 0; }), 'all odd numbers');
    ok(Mobird.some([1, 10, 29], function(num){ return num % 2 === 0; }), 'an even number');
    ok(Mobird.some([1], Mobird.identity) === true, 'cast to boolean - true');
    ok(Mobird.some([0], Mobird.identity) === false, 'cast to boolean - false');
    ok(Mobird.some([false, false, true]));

    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}];
    ok(!Mobird.some(list, {a: 5, b: 2}), 'Can be called with object');
    ok(Mobird.some(list, 'a'), 'String mapped to object property');

    list = [{a: 1, b: 2}, {a: 2, b: 2, c: true}];
    ok(Mobird.some(list, {b: 2}), 'Can be called with object');
    ok(!Mobird.some(list, 'd'), 'String mapped to object property');

    ok(Mobird.some({a: '1', b: '2', c: '3', d: '4', e: 6}, Mobird.isNumber), 'takes objects');
    ok(!Mobird.some({a: 1, b: 2, c: 3, d: 4}, Mobird.isObject), 'takes objects');
    ok(Mobird.some(['a', 'b', 'c', 'd'], Mobird.hasOwnProperty, {a: 1, b: 2, c: 3, d: 4}), 'context works');
    ok(!Mobird.some(['x', 'y', 'z'], Mobird.hasOwnProperty, {a: 1, b: 2, c: 3, d: 4}), 'context works');
  });

  test('contains', function() {
    Mobird.each([null, void 0, 0, 1, NaN, {}, []], function(val) {
      strictEqual(Mobird.contains(val, 'hasOwnProperty'), false);
    });
    strictEqual(Mobird.contains([1, 2, 3], 2), true, 'two is in the array');
    ok(!Mobird.contains([1, 3, 9], 2), 'two is not in the array');

    strictEqual(Mobird.contains([5, 4, 3, 2, 1], 5, true), true, 'doesn\'t delegate to binary search');

    ok(Mobird.contains({moe: 1, larry: 3, curly: 9}, 3) === true, 'Mobird.contains on objects checks their values');
    ok(Mobird([1, 2, 3]).contains(2), 'OO-style contains');
  });

  test('contains', function() {

    var numbers = [1, 2, 3, 1, 2, 3, 1, 2, 3];
    strictEqual(Mobird.contains(numbers, 1, 1), true, 'contains takes a fromIndex');
    strictEqual(Mobird.contains(numbers, 1, -1), false, 'contains takes a fromIndex');
    strictEqual(Mobird.contains(numbers, 1, -2), false, 'contains takes a fromIndex');
    strictEqual(Mobird.contains(numbers, 1, -3), true, 'contains takes a fromIndex');
    strictEqual(Mobird.contains(numbers, 1, 6), true, 'contains takes a fromIndex');
    strictEqual(Mobird.contains(numbers, 1, 7), false, 'contains takes a fromIndex');

    ok(Mobird.every([1, 2, 3], Mobird.partial(Mobird.contains, numbers)), 'fromIndex is guarded');
  });

  test('contains with NaN', function() {
    strictEqual(Mobird.contains([1, 2, NaN, NaN], NaN), true, 'Expected [1, 2, NaN] to contain NaN');
    strictEqual(Mobird.contains([1, 2, Infinity], NaN), false, 'Expected [1, 2, NaN] to contain NaN');
  });

  test('contains with +- 0', function() {
    Mobird.each([-0, +0], function(val) {
      strictEqual(Mobird.contains([1, 2, val, val], val), true);
      strictEqual(Mobird.contains([1, 2, val, val], -val), true);
      strictEqual(Mobird.contains([-1, 1, 2], -val), false);
    });
  });


  test('invoke', 5, function() {
    var list = [[5, 1, 7], [3, 2, 1]];
    var result = Mobird.invoke(list, 'sort');
    deepEqual(result[0], [1, 5, 7], 'first array sorted');
    deepEqual(result[1], [1, 2, 3], 'second array sorted');

    Mobird.invoke([{
      method: function() {
        deepEqual(Mobird.toArray(arguments), [1, 2, 3], 'called with arguments');
      }
    }], 'method', 1, 2, 3);

    deepEqual(Mobird.invoke([{a: null}, {}, {a: Mobird.constant(1)}], 'a'), [null, void 0, 1], 'handles null & undefined');

    throws(function() {
      Mobird.invoke([{a: 1}], 'a');
    }, TypeError, 'throws for non-functions');
  });

  test('invoke w/ function reference', function() {
    var list = [[5, 1, 7], [3, 2, 1]];
    var result = Mobird.invoke(list, Array.prototype.sort);
    deepEqual(result[0], [1, 5, 7], 'first array sorted');
    deepEqual(result[1], [1, 2, 3], 'second array sorted');

    deepEqual(Mobird.invoke([1, 2, 3], function(a) {
      return a + this;
    }, 5), [6, 7, 8], 'receives params from invoke');
  });

  // Relevant when using ClojureScript
  test('invoke when strings have a call method', function() {
    String.prototype.call = function() {
      return 42;
    };
    var list = [[5, 1, 7], [3, 2, 1]];
    var s = 'foo';
    equal(s.call(), 42, 'call function exists');
    var result = Mobird.invoke(list, 'sort');
    deepEqual(result[0], [1, 5, 7], 'first array sorted');
    deepEqual(result[1], [1, 2, 3], 'second array sorted');
    delete String.prototype.call;
    equal(s.call, undefined, 'call function removed');
  });

  test('pluck', function() {
    var people = [{name: 'moe', age: 30}, {name: 'curly', age: 50}];
    deepEqual(Mobird.pluck(people, 'name'), ['moe', 'curly'], 'pulls names out of objects');
    deepEqual(Mobird.pluck(people, 'address'), [undefined, undefined], 'missing properties are returned as undefined');
    //compat: most flexible handling of edge cases
    deepEqual(Mobird.pluck([{'[object Object]': 1}], {}), [1]);
  });

  test('where', function() {
    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}];
    var result = Mobird.where(list, {a: 1});
    equal(result.length, 3);
    equal(result[result.length - 1].b, 4);
    result = Mobird.where(list, {b: 2});
    equal(result.length, 2);
    equal(result[0].a, 1);
    result = Mobird.where(list, {});
    equal(result.length, list.length);

    function test() {}
    test.map = Mobird.map;
    deepEqual(Mobird.where([Mobird, {a: 1, b: 2}, Mobird], test), [Mobird, Mobird], 'checks properties given function');
  });

  test('findWhere', function() {
    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}, {a: 2, b: 4}];
    var result = Mobird.findWhere(list, {a: 1});
    deepEqual(result, {a: 1, b: 2});
    result = Mobird.findWhere(list, {b: 4});
    deepEqual(result, {a: 1, b: 4});

    result = Mobird.findWhere(list, {c: 1});
    ok(Mobird.isUndefined(result), 'undefined when not found');

    result = Mobird.findWhere([], {c: 1});
    ok(Mobird.isUndefined(result), 'undefined when searching empty list');

    function test() {}
    test.map = Mobird.map;
    equal(Mobird.findWhere([Mobird, {a: 1, b: 2}, Mobird], test), Mobird, 'checks properties given function');

    function TestClass() {
      this.y = 5;
      this.x = 'foo';
    }
    var expect = {c: 1, x: 'foo', y: 5};
    deepEqual(Mobird.findWhere([{y: 5, b: 6}, expect], new TestClass()), expect, 'uses class instance properties');
  });

  test('max', function() {
    equal(-Infinity, Mobird.max(null), 'can handle null/undefined');
    equal(-Infinity, Mobird.max(undefined), 'can handle null/undefined');
    equal(-Infinity, Mobird.max(null, Mobird.identity), 'can handle null/undefined');

    equal(3, Mobird.max([1, 2, 3]), 'can perform a regular Math.max');

    var neg = Mobird.max([1, 2, 3], function(num){ return -num; });
    equal(neg, 1, 'can perform a computation-based max');

    equal(-Infinity, Mobird.max({}), 'Maximum value of an empty object');
    equal(-Infinity, Mobird.max([]), 'Maximum value of an empty array');
    equal(Mobird.max({'a': 'a'}), -Infinity, 'Maximum value of a non-numeric collection');

    equal(299999, Mobird.max(Mobird.range(1, 300000)), 'Maximum value of a too-big array');

    equal(3, Mobird.max([1, 2, 3, 'test']), 'Finds correct max in array starting with num and containing a NaN');
    equal(3, Mobird.max(['test', 1, 2, 3]), 'Finds correct max in array starting with NaN');

    var a = {x: -Infinity};
    var b = {x: -Infinity};
    var iterator = function(o){ return o.x; };
    equal(Mobird.max([a, b], iterator), a, 'Respects iterator return value of -Infinity');

    deepEqual(Mobird.max([{'a': 1}, {'a': 0, 'b': 3}, {'a': 4}, {'a': 2}], 'a'), {'a': 4}, 'String keys use property iterator');

    deepEqual(Mobird.max([0, 2], function(a){ return a * this.x; }, {x: 1}), 2, 'Iterator context');
    deepEqual(Mobird.max([[1], [2, 3], [-1, 4], [5]], 0), [5], 'Lookup falsy iterator');
    deepEqual(Mobird.max([{0: 1}, {0: 2}, {0: -1}, {a: 1}], 0), {0: 2}, 'Lookup falsy iterator');
  });

  test('min', function() {
    equal(Infinity, Mobird.min(null), 'can handle null/undefined');
    equal(Infinity, Mobird.min(undefined), 'can handle null/undefined');
    equal(Infinity, Mobird.min(null, Mobird.identity), 'can handle null/undefined');

    equal(1, Mobird.min([1, 2, 3]), 'can perform a regular Math.min');

    var neg = Mobird.min([1, 2, 3], function(num){ return -num; });
    equal(neg, 3, 'can perform a computation-based min');

    equal(Infinity, Mobird.min({}), 'Minimum value of an empty object');
    equal(Infinity, Mobird.min([]), 'Minimum value of an empty array');
    equal(Mobird.min({'a': 'a'}), Infinity, 'Minimum value of a non-numeric collection');

    var now = new Date(9999999999);
    var then = new Date(0);
    equal(Mobird.min([now, then]), then);

    equal(1, Mobird.min(Mobird.range(1, 300000)), 'Minimum value of a too-big array');

    equal(1, Mobird.min([1, 2, 3, 'test']), 'Finds correct min in array starting with num and containing a NaN');
    equal(1, Mobird.min(['test', 1, 2, 3]), 'Finds correct min in array starting with NaN');

    var a = {x: Infinity};
    var b = {x: Infinity};
    var iterator = function(o){ return o.x; };
    equal(Mobird.min([a, b], iterator), a, 'Respects iterator return value of Infinity');

    deepEqual(Mobird.min([{'a': 1}, {'a': 0, 'b': 3}, {'a': 4}, {'a': 2}], 'a'), {'a': 0, 'b': 3}, 'String keys use property iterator');

    deepEqual(Mobird.min([0, 2], function(a){ return a * this.x; }, {x: -1}), 2, 'Iterator context');
    deepEqual(Mobird.min([[1], [2, 3], [-1, 4], [5]], 0), [-1, 4], 'Lookup falsy iterator');
    deepEqual(Mobird.min([{0: 1}, {0: 2}, {0: -1}, {a: 1}], 0), {0: -1}, 'Lookup falsy iterator');
  });

  test('sortBy', function() {
    var people = [{name : 'curly', age : 50}, {name : 'moe', age : 30}];
    people = Mobird.sortBy(people, function(person){ return person.age; });
    deepEqual(Mobird.pluck(people, 'name'), ['moe', 'curly'], 'stooges sorted by age');

    var list = [undefined, 4, 1, undefined, 3, 2];
    deepEqual(Mobird.sortBy(list, Mobird.identity), [1, 2, 3, 4, undefined, undefined], 'sortBy with undefined values');

    list = ['one', 'two', 'three', 'four', 'five'];
    var sorted = Mobird.sortBy(list, 'length');
    deepEqual(sorted, ['one', 'two', 'four', 'five', 'three'], 'sorted by length');

    function Pair(x, y) {
      this.x = x;
      this.y = y;
    }

    var collection = [
      new Pair(1, 1), new Pair(1, 2),
      new Pair(1, 3), new Pair(1, 4),
      new Pair(1, 5), new Pair(1, 6),
      new Pair(2, 1), new Pair(2, 2),
      new Pair(2, 3), new Pair(2, 4),
      new Pair(2, 5), new Pair(2, 6),
      new Pair(undefined, 1), new Pair(undefined, 2),
      new Pair(undefined, 3), new Pair(undefined, 4),
      new Pair(undefined, 5), new Pair(undefined, 6)
    ];

    var actual = Mobird.sortBy(collection, function(pair) {
      return pair.x;
    });

    deepEqual(actual, collection, 'sortBy should be stable');

    deepEqual(Mobird.sortBy(collection, 'x'), collection, 'sortBy accepts property string');

    list = ['q', 'w', 'e', 'r', 't', 'y'];
    deepEqual(Mobird.sortBy(list), ['e', 'q', 'r', 't', 'w', 'y'], 'uses Mobird.identity if iterator is not specified');
  });

  test('groupBy', function() {
    var parity = Mobird.groupBy([1, 2, 3, 4, 5, 6], function(num){ return num % 2; });
    ok('0' in parity && '1' in parity, 'created a group for each value');
    deepEqual(parity[0], [2, 4, 6], 'put each even number in the right group');

    var list = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    var grouped = Mobird.groupBy(list, 'length');
    deepEqual(grouped['3'], ['one', 'two', 'six', 'ten']);
    deepEqual(grouped['4'], ['four', 'five', 'nine']);
    deepEqual(grouped['5'], ['three', 'seven', 'eight']);

    var context = {};
    Mobird.groupBy([{}], function(){ ok(this === context); }, context);

    grouped = Mobird.groupBy([4.2, 6.1, 6.4], function(num) {
      return Math.floor(num) > 4 ? 'hasOwnProperty' : 'constructor';
    });
    equal(grouped.constructor.length, 1);
    equal(grouped.hasOwnProperty.length, 2);

    var array = [{}];
    Mobird.groupBy(array, function(value, index, obj){ ok(obj === array); });

    array = [1, 2, 1, 2, 3];
    grouped = Mobird.groupBy(array);
    equal(grouped['1'].length, 2);
    equal(grouped['3'].length, 1);

    var matrix = [
      [1, 2],
      [1, 3],
      [2, 3]
    ];
    deepEqual(Mobird.groupBy(matrix, 0), {1: [[1, 2], [1, 3]], 2: [[2, 3]]});
    deepEqual(Mobird.groupBy(matrix, 1), {2: [[1, 2]], 3: [[1, 3], [2, 3]]});
  });

  test('indexBy', function() {
    var parity = Mobird.indexBy([1, 2, 3, 4, 5], function(num){ return num % 2 === 0; });
    equal(parity['true'], 4);
    equal(parity['false'], 5);

    var list = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    var grouped = Mobird.indexBy(list, 'length');
    equal(grouped['3'], 'ten');
    equal(grouped['4'], 'nine');
    equal(grouped['5'], 'eight');

    var array = [1, 2, 1, 2, 3];
    grouped = Mobird.indexBy(array);
    equal(grouped['1'], 1);
    equal(grouped['2'], 2);
    equal(grouped['3'], 3);
  });

  test('countBy', function() {
    var parity = Mobird.countBy([1, 2, 3, 4, 5], function(num){ return num % 2 === 0; });
    equal(parity['true'], 2);
    equal(parity['false'], 3);

    var list = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    var grouped = Mobird.countBy(list, 'length');
    equal(grouped['3'], 4);
    equal(grouped['4'], 3);
    equal(grouped['5'], 3);

    var context = {};
    Mobird.countBy([{}], function(){ ok(this === context); }, context);

    grouped = Mobird.countBy([4.2, 6.1, 6.4], function(num) {
      return Math.floor(num) > 4 ? 'hasOwnProperty' : 'constructor';
    });
    equal(grouped.constructor, 1);
    equal(grouped.hasOwnProperty, 2);

    var array = [{}];
    Mobird.countBy(array, function(value, index, obj){ ok(obj === array); });

    array = [1, 2, 1, 2, 3];
    grouped = Mobird.countBy(array);
    equal(grouped['1'], 2);
    equal(grouped['3'], 1);
  });

  test('shuffle', function() {
    var numbers = Mobird.range(10);
    var shuffled = Mobird.shuffle(numbers);
    notStrictEqual(numbers, shuffled, 'original object is unmodified');
    ok(Mobird.every(Mobird.range(10), function() { //appears consistent?
      return Mobird.every(numbers, Mobird.partial(Mobird.contains, numbers));
    }), 'contains the same members before and after shuffle');

    shuffled = Mobird.shuffle({a: 1, b: 2, c: 3, d: 4});
    equal(shuffled.length, 4);
    deepEqual(shuffled.sort(), [1, 2, 3, 4], 'works on objects');
  });

  test('sample', function() {
    var numbers = Mobird.range(10);
    var allSampled = Mobird.sample(numbers, 10).sort();
    deepEqual(allSampled, numbers, 'contains the same members before and after sample');
    allSampled = Mobird.sample(numbers, 20).sort();
    deepEqual(allSampled, numbers, 'also works when sampling more objects than are present');
    ok(Mobird.contains(numbers, Mobird.sample(numbers)), 'sampling a single element returns something from the array');
    strictEqual(Mobird.sample([]), undefined, 'sampling empty array with no number returns undefined');
    notStrictEqual(Mobird.sample([], 5), [], 'sampling empty array with a number returns an empty array');
    notStrictEqual(Mobird.sample([1, 2, 3], 0), [], 'sampling an array with 0 picks returns an empty array');
    deepEqual(Mobird.sample([1, 2], -1), [], 'sampling a negative number of picks returns an empty array');
    ok(Mobird.contains([1, 2, 3], Mobird.sample({a: 1, b: 2, c: 3})), 'sample one value from an object');
  });

  test('toArray', function() {
    ok(!Mobird.isArray(arguments), 'arguments object is not an array');
    ok(Mobird.isArray(Mobird.toArray(arguments)), 'arguments object converted into array');
    var a = [1, 2, 3];
    ok(Mobird.toArray(a) !== a, 'array is cloned');
    deepEqual(Mobird.toArray(a), [1, 2, 3], 'cloned array contains same elements');

    var numbers = Mobird.toArray({one : 1, two : 2, three : 3});
    deepEqual(numbers, [1, 2, 3], 'object flattened into array');

    if (typeof document != 'undefined') {
      // test in IE < 9
      var actual;
      try {
        actual = Mobird.toArray(document.childNodes);
      } catch(ex) { }
      deepEqual(actual, Mobird.map(document.childNodes, Mobird.identity), 'works on NodeList');
    }
  });

  test('size', function() {
    equal(Mobird.size({one : 1, two : 2, three : 3}), 3, 'can compute the size of an object');
    equal(Mobird.size([1, 2, 3]), 3, 'can compute the size of an array');
    equal(Mobird.size({length: 3, 0: 0, 1: 0, 2: 0}), 3, 'can compute the size of Array-likes');

    var func = function() {
      return Mobird.size(arguments);
    };

    equal(func(1, 2, 3, 4), 4, 'can test the size of the arguments object');

    equal(Mobird.size('hello'), 5, 'can compute the size of a string literal');
    equal(Mobird.size(new String('hello')), 5, 'can compute the size of string object');

    equal(Mobird.size(null), 0, 'handles nulls');
    equal(Mobird.size(0), 0, 'handles numbers');
  });

  test('partition', function() {
    var list = [0, 1, 2, 3, 4, 5];
    deepEqual(Mobird.partition(list, function(x) { return x < 4; }), [[0, 1, 2, 3], [4, 5]], 'handles bool return values');
    deepEqual(Mobird.partition(list, function(x) { return x & 1; }), [[1, 3, 5], [0, 2, 4]], 'handles 0 and 1 return values');
    deepEqual(Mobird.partition(list, function(x) { return x - 3; }), [[0, 1, 2, 4, 5], [3]], 'handles other numeric return values');
    deepEqual(Mobird.partition(list, function(x) { return x > 1 ? null : true; }), [[0, 1], [2, 3, 4, 5]], 'handles null return values');
    deepEqual(Mobird.partition(list, function(x) { if (x < 2) return true; }), [[0, 1], [2, 3, 4, 5]], 'handles undefined return values');
    deepEqual(Mobird.partition({a: 1, b: 2, c: 3}, function(x) { return x > 1; }), [[2, 3], [1]], 'handles objects');

    deepEqual(Mobird.partition(list, function(x, index) { return index % 2; }), [[1, 3, 5], [0, 2, 4]], 'can reference the array index');
    deepEqual(Mobird.partition(list, function(x, index, arr) { return x === arr.length - 1; }), [[5], [0, 1, 2, 3, 4]], 'can reference the collection');

    // Default iterator
    deepEqual(Mobird.partition([1, false, true, '']), [[1, true], [false, '']], 'Default iterator');
    deepEqual(Mobird.partition([{x: 1}, {x: 0}, {x: 1}], 'x'), [[{x: 1}, {x: 1}], [{x: 0}]], 'Takes a string');

    // Context
    var predicate = function(x){ return x === this.x; };
    deepEqual(Mobird.partition([1, 2, 3], predicate, {x: 2}), [[2], [1, 3]], 'partition takes a context argument');

    deepEqual(Mobird.partition([{a: 1}, {b: 2}, {a: 1, b: 2}], {a: 1}), [[{a: 1}, {a: 1, b: 2}], [{b: 2}]], 'predicate can be object');

    var object = {a: 1};
    Mobird.partition(object, function(val, key, obj) {
      equal(val, 1);
      equal(key, 'a');
      equal(obj, object);
      equal(this, predicate);
    }, predicate);
  });

  if (typeof document != 'undefined') {
    test('Can use various collection methods on NodeLists', function() {
        var parent = document.createElement('div');
        parent.innerHTML = '<span id=id1></span>textnode<span id=id2></span>';

        var elementChildren = Mobird.filter(parent.childNodes, Mobird.isElement);
        equal(elementChildren.length, 2);

        deepEqual(Mobird.map(elementChildren, 'id'), ['id1', 'id2']);
        deepEqual(Mobird.map(parent.childNodes, 'nodeType'), [1, 3, 1]);

        ok(!Mobird.every(parent.childNodes, Mobird.isElement));
        ok(Mobird.some(parent.childNodes, Mobird.isElement));

        function compareNode(node) {
          return Mobird.isElement(node) ? node.id.charAt(2) : void 0;
        }
        equal(Mobird.max(parent.childNodes, compareNode), Mobird.last(parent.childNodes));
        equal(Mobird.min(parent.childNodes, compareNode), Mobird.first(parent.childNodes));
    });
  }

}());
