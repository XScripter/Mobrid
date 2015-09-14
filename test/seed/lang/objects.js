(function() {
  var Mobird = typeof require == 'function' ? require('..') : window.Mobird;

  QUnit.module('Objects');

  var testElement = typeof document === 'object' ? document.createElement('div') : void 0;

  test('keys', function() {
    deepEqual(Mobird.keys({one : 1, two : 2}), ['one', 'two'], 'can extract the keys from an object');
    // the test above is not safe because it relies on for-in enumeration order
    var a = []; a[1] = 0;
    deepEqual(Mobird.keys(a), ['1'], 'is not fooled by sparse arrays; see issue #95');
    deepEqual(Mobird.keys(null), []);
    deepEqual(Mobird.keys(void 0), []);
    deepEqual(Mobird.keys(1), []);
    deepEqual(Mobird.keys('a'), []);
    deepEqual(Mobird.keys(true), []);

    // keys that may be missed if the implementation isn't careful
    var trouble = {
      'constructor': Object,
      'valueOf': Mobird.noop,
      'hasOwnProperty': null,
      'toString': 5,
      'toLocaleString': undefined,
      'propertyIsEnumerable': /a/,
      'isPrototypeOf': this,
      '__defineGetter__': Boolean,
      '__defineSetter__': {},
      '__lookupSetter__': false,
      '__lookupGetter__': []
    };
    var troubleKeys = ['constructor', 'valueOf', 'hasOwnProperty', 'toString', 'toLocaleString', 'propertyIsEnumerable',
                  'isPrototypeOf', '__defineGetter__', '__defineSetter__', '__lookupSetter__', '__lookupGetter__'].sort();
    deepEqual(Mobird.keys(trouble).sort(), troubleKeys, 'matches non-enumerable properties');
  });

  test('allKeys', function() {
    deepEqual(Mobird.allKeys({one : 1, two : 2}), ['one', 'two'], 'can extract the allKeys from an object');
    // the test above is not safe because it relies on for-in enumeration order
    var a = []; a[1] = 0;
    deepEqual(Mobird.allKeys(a), ['1'], 'is not fooled by sparse arrays; see issue #95');

    a.a = a;
    deepEqual(Mobird.allKeys(a), ['1', 'a'], 'is not fooled by sparse arrays with additional properties');

    Mobird.each([null, void 0, 1, 'a', true, NaN, {}, [], new Number(5), new Date(0)], function(val) {
      deepEqual(Mobird.allKeys(val), []);
    });

    // allKeys that may be missed if the implementation isn't careful
    var trouble = {
      constructor: Object,
      valueOf: Mobird.noop,
      hasOwnProperty: null,
      toString: 5,
      toLocaleString: undefined,
      propertyIsEnumerable: /a/,
      isPrototypeOf: this
    };
    var troubleKeys = ['constructor', 'valueOf', 'hasOwnProperty', 'toString', 'toLocaleString', 'propertyIsEnumerable',
                  'isPrototypeOf'].sort();
    deepEqual(Mobird.allKeys(trouble).sort(), troubleKeys, 'matches non-enumerable properties');

    function A() {}
    A.prototype.foo = 'foo';
    var b = new A();
    b.bar = 'bar';
    deepEqual(Mobird.allKeys(b).sort(), ['bar', 'foo'], 'should include inherited keys');

    function y() {}
    y.x = 'z';
    ok(Mobird.indexOf(Mobird.allKeys(y), 'x') > -1);
  });

  test('values', function() {
    deepEqual(Mobird.values({one: 1, two: 2}), [1, 2], 'can extract the values from an object');
    deepEqual(Mobird.values({one: 1, two: 2, length: 3}), [1, 2, 3], '... even when one of them is "length"');
  });

  test('pairs', function() {
    deepEqual(Mobird.pairs({one: 1, two: 2}), [['one', 1], ['two', 2]], 'can convert an object into pairs');
    deepEqual(Mobird.pairs({one: 1, two: 2, length: 3}), [['one', 1], ['two', 2], ['length', 3]], '... even when one of them is "length"');
  });

  test('invert', function() {
    var obj = {first: 'Moe', second: 'Larry', third: 'Curly'};
    deepEqual(Mobird.keys(Mobird.invert(obj)), ['Moe', 'Larry', 'Curly'], 'can invert an object');
    deepEqual(Mobird.invert(Mobird.invert(obj)), obj, 'two inverts gets you back where you started');

    obj = {length: 3};
    equal(Mobird.invert(obj)['3'], 'length', 'can invert an object with "length"');
  });

  test('functions', function() {
    var obj = {a : 'dash', b : Mobird.map, c : /yo/, d : Mobird.reduce};
    deepEqual(['b', 'd'], Mobird.functions(obj), 'can grab the function names of any passed-in object');

    var Animal = function(){};
    Animal.prototype.run = function(){};
    deepEqual(Mobird.functions(new Animal), ['run'], 'also looks up functions on the prototype');
  });

  test('extend', function() {
    var result;
    equal(Mobird.extend({}, {a: 'b'}).a, 'b', 'can extend an object with the attributes of another');
    equal(Mobird.extend({a: 'x'}, {a: 'b'}).a, 'b', 'properties in source override destination');
    equal(Mobird.extend({x: 'x'}, {a: 'b'}).x, 'x', "properties not in source don't get overriden");
    result = Mobird.extend({x: 'x'}, {a: 'a'}, {b: 'b'});
    deepEqual(result, {x: 'x', a: 'a', b: 'b'}, 'can extend from multiple source objects');
    result = Mobird.extend({x: 'x'}, {a: 'a', x: 2}, {a: 'b'});
    deepEqual(result, {x: 2, a: 'b'}, 'extending from multiple source objects last property trumps');
    result = Mobird.extend({}, {a: void 0, b: null});
    deepEqual(Mobird.keys(result), ['a', 'b'], 'extend copies undefined values');

    var F = function() {};
    F.prototype = {a: 'b'};
    var subObj = new F();
    subObj.c = 'd';
    deepEqual(Mobird.extend({}, subObj), {a: 'b', c: 'd'}, 'extend copies all properties from source');
    Mobird.extend(subObj, {});
    ok(!subObj.hasOwnProperty('a'), "extend does not convert destination object's 'in' properties to 'own' properties");

    try {
      result = {};
      Mobird.extend(result, null, undefined, {a: 1});
    } catch(ex) {}

    equal(result.a, 1, 'should not error on `null` or `undefined` sources');

    strictEqual(Mobird.extend(null, {a: 1}), null, 'extending null results in null');
    strictEqual(Mobird.extend(undefined, {a: 1}), undefined, 'extending undefined results in undefined');
  });

  test('extendOwn', function() {
    var result;
    equal(Mobird.extendOwn({}, {a: 'b'}).a, 'b', 'can assign an object with the attributes of another');
    equal(Mobird.extendOwn({a: 'x'}, {a: 'b'}).a, 'b', 'properties in source override destination');
    equal(Mobird.extendOwn({x: 'x'}, {a: 'b'}).x, 'x', "properties not in source don't get overriden");
    result = Mobird.extendOwn({x: 'x'}, {a: 'a'}, {b: 'b'});
    deepEqual(result, {x: 'x', a: 'a', b: 'b'}, 'can assign from multiple source objects');
    result = Mobird.assign({x: 'x'}, {a: 'a', x: 2}, {a: 'b'});
    deepEqual(result, {x: 2, a: 'b'}, 'assigning from multiple source objects last property trumps');
    deepEqual(Mobird.extendOwn({}, {a: void 0, b: null}), {a: void 0, b: null}, 'assign copies undefined values');

    var F = function() {};
    F.prototype = {a: 'b'};
    var subObj = new F();
    subObj.c = 'd';
    deepEqual(Mobird.extendOwn({}, subObj), {c: 'd'}, 'assign copies own properties from source');

    result = {};
    deepEqual(Mobird.assign(result, null, undefined, {a: 1}), {a: 1}, 'should not error on `null` or `undefined` sources');

    Mobird.each(['a', 5, null, false], function(val) {
      strictEqual(Mobird.assign(val, {a: 1}), val, 'assigning non-objects results in returning the non-object value');
    });

    strictEqual(Mobird.extendOwn(undefined, {a: 1}), undefined, 'assigning undefined results in undefined');

    result = Mobird.extendOwn({a: 1, 0: 2, 1: '5', length: 6}, {0: 1, 1: 2, length: 2});
    deepEqual(result, {a: 1, 0: 1, 1: 2, length: 2}, 'assign should treat array-like objects like normal objects');
  });

  test('pick', function() {
    var result;
    result = Mobird.pick({a: 1, b: 2, c: 3}, 'a', 'c');
    deepEqual(result, {a: 1, c: 3}, 'can restrict properties to those named');
    result = Mobird.pick({a: 1, b: 2, c: 3}, ['b', 'c']);
    deepEqual(result, {b: 2, c: 3}, 'can restrict properties to those named in an array');
    result = Mobird.pick({a: 1, b: 2, c: 3}, ['a'], 'b');
    deepEqual(result, {a: 1, b: 2}, 'can restrict properties to those named in mixed args');
    result = Mobird.pick(['a', 'b'], 1);
    deepEqual(result, {1: 'b'}, 'can pick numeric properties');

    Mobird.each([null, void 0], function(val) {
      deepEqual(Mobird.pick(val, 'hasOwnProperty'), {}, 'Called with null/undefined');
      deepEqual(Mobird.pick(val, Mobird.constant(true)), {});
    });
    deepEqual(Mobird.pick(5, 'toString', 'b'), {toString: Number.prototype.toString}, 'can iterate primitives');

    var data = {a: 1, b: 2, c: 3};
    var callback = function(value, key, object) {
      strictEqual(key, {1: 'a', 2: 'b', 3: 'c'}[value]);
      strictEqual(object, data);
      return value !== this.value;
    };
    result = Mobird.pick(data, callback, {value: 2});
    deepEqual(result, {a: 1, c: 3}, 'can accept a predicate and context');

    var Obj = function(){};
    Obj.prototype = {a: 1, b: 2, c: 3};
    var instance = new Obj();
    deepEqual(Mobird.pick(instance, 'a', 'c'), {a: 1, c: 3}, 'include prototype props');

    deepEqual(Mobird.pick(data, function(val, key) {
      return this[key] === 3 && this === instance;
    }, instance), {c: 3}, 'function is given context');

    ok(!Mobird.has(Mobird.pick({}, 'foo'), 'foo'), 'does not set own property if property not in object');
    Mobird.pick(data, function(value, key, obj) {
      equal(obj, data, 'passes same object as third parameter of iteratee');
    });
  });

  test('omit', function() {
    var result;
    result = Mobird.omit({a: 1, b: 2, c: 3}, 'b');
    deepEqual(result, {a: 1, c: 3}, 'can omit a single named property');
    result = Mobird.omit({a: 1, b: 2, c: 3}, 'a', 'c');
    deepEqual(result, {b: 2}, 'can omit several named properties');
    result = Mobird.omit({a: 1, b: 2, c: 3}, ['b', 'c']);
    deepEqual(result, {a: 1}, 'can omit properties named in an array');
    result = Mobird.omit(['a', 'b'], 0);
    deepEqual(result, {1: 'b'}, 'can omit numeric properties');

    deepEqual(Mobird.omit(null, 'a', 'b'), {}, 'non objects return empty object');
    deepEqual(Mobird.omit(undefined, 'toString'), {}, 'null/undefined return empty object');
    deepEqual(Mobird.omit(5, 'toString', 'b'), {}, 'returns empty object for primitives');

    var data = {a: 1, b: 2, c: 3};
    var callback = function(value, key, object) {
      strictEqual(key, {1: 'a', 2: 'b', 3: 'c'}[value]);
      strictEqual(object, data);
      return value !== this.value;
    };
    result = Mobird.omit(data, callback, {value: 2});
    deepEqual(result, {b: 2}, 'can accept a predicate');

    var Obj = function(){};
    Obj.prototype = {a: 1, b: 2, c: 3};
    var instance = new Obj();
    deepEqual(Mobird.omit(instance, 'b'), {a: 1, c: 3}, 'include prototype props');

    deepEqual(Mobird.omit(data, function(val, key) {
      return this[key] === 3 && this === instance;
    }, instance), {a: 1, b: 2}, 'function is given context');
  });

  test('defaults', function() {
    var options = {zero: 0, one: 1, empty: '', nan: NaN, nothing: null};

    Mobird.defaults(options, {zero: 1, one: 10, twenty: 20, nothing: 'str'});
    equal(options.zero, 0, 'value exists');
    equal(options.one, 1, 'value exists');
    equal(options.twenty, 20, 'default applied');
    equal(options.nothing, null, "null isn't overridden");

    Mobird.defaults(options, {empty: 'full'}, {nan: 'nan'}, {word: 'word'}, {word: 'dog'});
    equal(options.empty, '', 'value exists');
    ok(Mobird.isNaN(options.nan), "NaN isn't overridden");
    equal(options.word, 'word', 'new value is added, first one wins');

    try {
      options = {};
      Mobird.defaults(options, null, undefined, {a: 1});
    } catch(ex) {}

    equal(options.a, 1, 'should not error on `null` or `undefined` sources');

    strictEqual(Mobird.defaults(null, {a: 1}), null, 'result is null if destination is null');
    strictEqual(Mobird.defaults(undefined, {a: 1}), undefined, 'result is undefined if destination is undefined');
  });

  test('clone', function() {
    var moe = {name : 'moe', lucky : [13, 27, 34]};
    var clone = Mobird.clone(moe);
    equal(clone.name, 'moe', 'the clone as the attributes of the original');

    clone.name = 'curly';
    ok(clone.name === 'curly' && moe.name === 'moe', 'clones can change shallow attributes without affecting the original');

    clone.lucky.push(101);
    equal(Mobird.last(moe.lucky), 101, 'changes to deep attributes are shared with the original');

    equal(Mobird.clone(undefined), void 0, 'non objects should not be changed by clone');
    equal(Mobird.clone(1), 1, 'non objects should not be changed by clone');
    equal(Mobird.clone(null), null, 'non objects should not be changed by clone');
  });

  test('create', function() {
    var Parent = function() {};
    Parent.prototype = {foo: function() {}, bar: 2};

    Mobird.each(['foo', null, undefined, 1], function(val) {
      deepEqual(Mobird.create(val), {}, 'should return empty object when a non-object is provided');
    });

    ok(Mobird.create([]) instanceof Array, 'should return new instance of array when array is provided');

    var Child = function() {};
    Child.prototype = Mobird.create(Parent.prototype);
    ok(new Child instanceof Parent, 'object should inherit prototype');

    var func = function() {};
    Child.prototype = Mobird.create(Parent.prototype, {func: func});
    strictEqual(Child.prototype.func, func, 'properties should be added to object');

    Child.prototype = Mobird.create(Parent.prototype, {constructor: Child});
    strictEqual(Child.prototype.constructor, Child);

    Child.prototype.foo = 'foo';
    var created = Mobird.create(Child.prototype, new Child);
    ok(!created.hasOwnProperty('foo'), 'should only add own properties');
  });

  test('isEqual', function() {
    function First() {
      this.value = 1;
    }
    First.prototype.value = 1;
    function Second() {
      this.value = 1;
    }
    Second.prototype.value = 2;

    // Basic equality and identity comparisons.
    ok(Mobird.isEqual(null, null), '`null` is equal to `null`');
    ok(Mobird.isEqual(), '`undefined` is equal to `undefined`');

    ok(!Mobird.isEqual(0, -0), '`0` is not equal to `-0`');
    ok(!Mobird.isEqual(-0, 0), 'Commutative equality is implemented for `0` and `-0`');
    ok(!Mobird.isEqual(null, undefined), '`null` is not equal to `undefined`');
    ok(!Mobird.isEqual(undefined, null), 'Commutative equality is implemented for `null` and `undefined`');

    // String object and primitive comparisons.
    ok(Mobird.isEqual('Curly', 'Curly'), 'Identical string primitives are equal');
    ok(Mobird.isEqual(new String('Curly'), new String('Curly')), 'String objects with identical primitive values are equal');
    ok(Mobird.isEqual(new String('Curly'), 'Curly'), 'String primitives and their corresponding object wrappers are equal');
    ok(Mobird.isEqual('Curly', new String('Curly')), 'Commutative equality is implemented for string objects and primitives');

    ok(!Mobird.isEqual('Curly', 'Larry'), 'String primitives with different values are not equal');
    ok(!Mobird.isEqual(new String('Curly'), new String('Larry')), 'String objects with different primitive values are not equal');
    ok(!Mobird.isEqual(new String('Curly'), {toString: function(){ return 'Curly'; }}), 'String objects and objects with a custom `toString` method are not equal');

    // Number object and primitive comparisons.
    ok(Mobird.isEqual(75, 75), 'Identical number primitives are equal');
    ok(Mobird.isEqual(new Number(75), new Number(75)), 'Number objects with identical primitive values are equal');
    ok(Mobird.isEqual(75, new Number(75)), 'Number primitives and their corresponding object wrappers are equal');
    ok(Mobird.isEqual(new Number(75), 75), 'Commutative equality is implemented for number objects and primitives');
    ok(!Mobird.isEqual(new Number(0), -0), '`new Number(0)` and `-0` are not equal');
    ok(!Mobird.isEqual(0, new Number(-0)), 'Commutative equality is implemented for `new Number(0)` and `-0`');

    ok(!Mobird.isEqual(new Number(75), new Number(63)), 'Number objects with different primitive values are not equal');
    ok(!Mobird.isEqual(new Number(63), {valueOf: function(){ return 63; }}), 'Number objects and objects with a `valueOf` method are not equal');

    // Comparisons involving `NaN`.
    ok(Mobird.isEqual(NaN, NaN), '`NaN` is equal to `NaN`');
    ok(Mobird.isEqual(new Object(NaN), NaN), 'Object(`NaN`) is equal to `NaN`');
    ok(!Mobird.isEqual(61, NaN), 'A number primitive is not equal to `NaN`');
    ok(!Mobird.isEqual(new Number(79), NaN), 'A number object is not equal to `NaN`');
    ok(!Mobird.isEqual(Infinity, NaN), '`Infinity` is not equal to `NaN`');

    // Boolean object and primitive comparisons.
    ok(Mobird.isEqual(true, true), 'Identical boolean primitives are equal');
    ok(Mobird.isEqual(new Boolean, new Boolean), 'Boolean objects with identical primitive values are equal');
    ok(Mobird.isEqual(true, new Boolean(true)), 'Boolean primitives and their corresponding object wrappers are equal');
    ok(Mobird.isEqual(new Boolean(true), true), 'Commutative equality is implemented for booleans');
    ok(!Mobird.isEqual(new Boolean(true), new Boolean), 'Boolean objects with different primitive values are not equal');

    // Common type coercions.
    ok(!Mobird.isEqual(new Boolean(false), true), '`new Boolean(false)` is not equal to `true`');
    ok(!Mobird.isEqual('75', 75), 'String and number primitives with like values are not equal');
    ok(!Mobird.isEqual(new Number(63), new String(63)), 'String and number objects with like values are not equal');
    ok(!Mobird.isEqual(75, '75'), 'Commutative equality is implemented for like string and number values');
    ok(!Mobird.isEqual(0, ''), 'Number and string primitives with like values are not equal');
    ok(!Mobird.isEqual(1, true), 'Number and boolean primitives with like values are not equal');
    ok(!Mobird.isEqual(new Boolean(false), new Number(0)), 'Boolean and number objects with like values are not equal');
    ok(!Mobird.isEqual(false, new String('')), 'Boolean primitives and string objects with like values are not equal');
    ok(!Mobird.isEqual(12564504e5, new Date(2009, 9, 25)), 'Dates and their corresponding numeric primitive values are not equal');

    // Dates.
    ok(Mobird.isEqual(new Date(2009, 9, 25), new Date(2009, 9, 25)), 'Date objects referencing identical times are equal');
    ok(!Mobird.isEqual(new Date(2009, 9, 25), new Date(2009, 11, 13)), 'Date objects referencing different times are not equal');
    ok(!Mobird.isEqual(new Date(2009, 11, 13), {
      getTime: function(){
        return 12606876e5;
      }
    }), 'Date objects and objects with a `getTime` method are not equal');
    ok(!Mobird.isEqual(new Date('Curly'), new Date('Curly')), 'Invalid dates are not equal');

    // Functions.
    ok(!Mobird.isEqual(First, Second), 'Different functions with identical bodies and source code representations are not equal');

    // RegExps.
    ok(Mobird.isEqual(/(?:)/gim, /(?:)/gim), 'RegExps with equivalent patterns and flags are equal');
    ok(Mobird.isEqual(/(?:)/gi, /(?:)/ig), 'Flag order is not significant');
    ok(!Mobird.isEqual(/(?:)/g, /(?:)/gi), 'RegExps with equivalent patterns and different flags are not equal');
    ok(!Mobird.isEqual(/Moe/gim, /Curly/gim), 'RegExps with different patterns and equivalent flags are not equal');
    ok(!Mobird.isEqual(/(?:)/gi, /(?:)/g), 'Commutative equality is implemented for RegExps');
    ok(!Mobird.isEqual(/Curly/g, {source: 'Larry', global: true, ignoreCase: false, multiline: false}), 'RegExps and RegExp-like objects are not equal');

    // Empty arrays, array-like objects, and object literals.
    ok(Mobird.isEqual({}, {}), 'Empty object literals are equal');
    ok(Mobird.isEqual([], []), 'Empty array literals are equal');
    ok(Mobird.isEqual([{}], [{}]), 'Empty nested arrays and objects are equal');
    ok(!Mobird.isEqual({length: 0}, []), 'Array-like objects and arrays are not equal.');
    ok(!Mobird.isEqual([], {length: 0}), 'Commutative equality is implemented for array-like objects');

    ok(!Mobird.isEqual({}, []), 'Object literals and array literals are not equal');
    ok(!Mobird.isEqual([], {}), 'Commutative equality is implemented for objects and arrays');

    // Arrays with primitive and object values.
    ok(Mobird.isEqual([1, 'Larry', true], [1, 'Larry', true]), 'Arrays containing identical primitives are equal');
    ok(Mobird.isEqual([/Moe/g, new Date(2009, 9, 25)], [/Moe/g, new Date(2009, 9, 25)]), 'Arrays containing equivalent elements are equal');

    // Multi-dimensional arrays.
    var a = [new Number(47), false, 'Larry', /Moe/, new Date(2009, 11, 13), ['running', 'biking', new String('programming')], {a: 47}];
    var b = [new Number(47), false, 'Larry', /Moe/, new Date(2009, 11, 13), ['running', 'biking', new String('programming')], {a: 47}];
    ok(Mobird.isEqual(a, b), 'Arrays containing nested arrays and objects are recursively compared');

    // Overwrite the methods defined in ES 5.1 section 15.4.4.
    a.forEach = a.map = a.filter = a.every = a.indexOf = a.lastIndexOf = a.some = a.reduce = a.reduceRight = null;
    b.join = b.pop = b.reverse = b.shift = b.slice = b.splice = b.concat = b.sort = b.unshift = null;

    // Array elements and properties.
    ok(Mobird.isEqual(a, b), 'Arrays containing equivalent elements and different non-numeric properties are equal');
    a.push('White Rocks');
    ok(!Mobird.isEqual(a, b), 'Arrays of different lengths are not equal');
    a.push('East Boulder');
    b.push('Gunbarrel Ranch', 'Teller Farm');
    ok(!Mobird.isEqual(a, b), 'Arrays of identical lengths containing different elements are not equal');

    // Sparse arrays.
    ok(Mobird.isEqual(Array(3), Array(3)), 'Sparse arrays of identical lengths are equal');
    ok(!Mobird.isEqual(Array(3), Array(6)), 'Sparse arrays of different lengths are not equal when both are empty');

    var sparse = [];
    sparse[1] = 5;
    ok(Mobird.isEqual(sparse, [undefined, 5]), 'Handles sparse arrays as dense');

    // Simple objects.
    ok(Mobird.isEqual({a: 'Curly', b: 1, c: true}, {a: 'Curly', b: 1, c: true}), 'Objects containing identical primitives are equal');
    ok(Mobird.isEqual({a: /Curly/g, b: new Date(2009, 11, 13)}, {a: /Curly/g, b: new Date(2009, 11, 13)}), 'Objects containing equivalent members are equal');
    ok(!Mobird.isEqual({a: 63, b: 75}, {a: 61, b: 55}), 'Objects of identical sizes with different values are not equal');
    ok(!Mobird.isEqual({a: 63, b: 75}, {a: 61, c: 55}), 'Objects of identical sizes with different property names are not equal');
    ok(!Mobird.isEqual({a: 1, b: 2}, {a: 1}), 'Objects of different sizes are not equal');
    ok(!Mobird.isEqual({a: 1}, {a: 1, b: 2}), 'Commutative equality is implemented for objects');
    ok(!Mobird.isEqual({x: 1, y: undefined}, {x: 1, z: 2}), 'Objects with identical keys and different values are not equivalent');

    // `A` contains nested objects and arrays.
    a = {
      name: new String('Moe Howard'),
      age: new Number(77),
      stooge: true,
      hobbies: ['acting'],
      film: {
        name: 'Sing a Song of Six Pants',
        release: new Date(1947, 9, 30),
        stars: [new String('Larry Fine'), 'Shemp Howard'],
        minutes: new Number(16),
        seconds: 54
      }
    };

    // `B` contains equivalent nested objects and arrays.
    b = {
      name: new String('Moe Howard'),
      age: new Number(77),
      stooge: true,
      hobbies: ['acting'],
      film: {
        name: 'Sing a Song of Six Pants',
        release: new Date(1947, 9, 30),
        stars: [new String('Larry Fine'), 'Shemp Howard'],
        minutes: new Number(16),
        seconds: 54
      }
    };
    ok(Mobird.isEqual(a, b), 'Objects with nested equivalent members are recursively compared');

    // Instances.
    ok(Mobird.isEqual(new First, new First), 'Object instances are equal');
    ok(!Mobird.isEqual(new First, new Second), 'Objects with different constructors and identical own properties are not equal');
    ok(!Mobird.isEqual({value: 1}, new First), 'Object instances and objects sharing equivalent properties are not equal');
    ok(!Mobird.isEqual({value: 2}, new Second), 'The prototype chain of objects should not be examined');

    // Circular Arrays.
    (a = []).push(a);
    (b = []).push(b);
    ok(Mobird.isEqual(a, b), 'Arrays containing circular references are equal');
    a.push(new String('Larry'));
    b.push(new String('Larry'));
    ok(Mobird.isEqual(a, b), 'Arrays containing circular references and equivalent properties are equal');
    a.push('Shemp');
    b.push('Curly');
    ok(!Mobird.isEqual(a, b), 'Arrays containing circular references and different properties are not equal');

    // More circular arrays #767.
    a = ['everything is checked but', 'this', 'is not'];
    a[1] = a;
    b = ['everything is checked but', ['this', 'array'], 'is not'];
    ok(!Mobird.isEqual(a, b), 'Comparison of circular references with non-circular references are not equal');

    // Circular Objects.
    a = {abc: null};
    b = {abc: null};
    a.abc = a;
    b.abc = b;
    ok(Mobird.isEqual(a, b), 'Objects containing circular references are equal');
    a.def = 75;
    b.def = 75;
    ok(Mobird.isEqual(a, b), 'Objects containing circular references and equivalent properties are equal');
    a.def = new Number(75);
    b.def = new Number(63);
    ok(!Mobird.isEqual(a, b), 'Objects containing circular references and different properties are not equal');

    // More circular objects #767.
    a = {everything: 'is checked', but: 'this', is: 'not'};
    a.but = a;
    b = {everything: 'is checked', but: {that: 'object'}, is: 'not'};
    ok(!Mobird.isEqual(a, b), 'Comparison of circular references with non-circular object references are not equal');

    // Cyclic Structures.
    a = [{abc: null}];
    b = [{abc: null}];
    (a[0].abc = a).push(a);
    (b[0].abc = b).push(b);
    ok(Mobird.isEqual(a, b), 'Cyclic structures are equal');
    a[0].def = 'Larry';
    b[0].def = 'Larry';
    ok(Mobird.isEqual(a, b), 'Cyclic structures containing equivalent properties are equal');
    a[0].def = new String('Larry');
    b[0].def = new String('Curly');
    ok(!Mobird.isEqual(a, b), 'Cyclic structures containing different properties are not equal');

    // Complex Circular References.
    a = {foo: {b: {foo: {c: {foo: null}}}}};
    b = {foo: {b: {foo: {c: {foo: null}}}}};
    a.foo.b.foo.c.foo = a;
    b.foo.b.foo.c.foo = b;
    ok(Mobird.isEqual(a, b), 'Cyclic structures with nested and identically-named properties are equal');

    // Chaining.
    ok(!Mobird.isEqual(Mobird({x: 1, y: undefined}).chain(), Mobird({x: 1, z: 2}).chain()), 'Chained objects containing different values are not equal');

    a = Mobird({x: 1, y: 2}).chain();
    b = Mobird({x: 1, y: 2}).chain();
    equal(Mobird.isEqual(a.isEqual(b), Mobird(true)), true, '`isEqual` can be chained');

    // Objects without a `constructor` property
    if (Object.create) {
        a = Object.create(null, {x: {value: 1, enumerable: true}});
        b = {x: 1};
        ok(Mobird.isEqual(a, b), 'Handles objects without a constructor (e.g. from Object.create');
    }

    function Foo() { this.a = 1; }
    Foo.prototype.constructor = null;

    var other = {a: 1};
    strictEqual(Mobird.isEqual(new Foo, other), false, 'Objects from different constructors are not equal');
  });

  test('isEmpty', function() {
    ok(!Mobird([1]).isEmpty(), '[1] is not empty');
    ok(Mobird.isEmpty([]), '[] is empty');
    ok(!Mobird.isEmpty({one : 1}), '{one : 1} is not empty');
    ok(Mobird.isEmpty({}), '{} is empty');
    ok(Mobird.isEmpty(new RegExp('')), 'objects with prototype properties are empty');
    ok(Mobird.isEmpty(null), 'null is empty');
    ok(Mobird.isEmpty(), 'undefined is empty');
    ok(Mobird.isEmpty(''), 'the empty string is empty');
    ok(!Mobird.isEmpty('moe'), 'but other strings are not');

    var obj = {one : 1};
    delete obj.one;
    ok(Mobird.isEmpty(obj), 'deleting all the keys from an object empties it');

    var args = function(){ return arguments; };
    ok(Mobird.isEmpty(args()), 'empty arguments object is empty');
    ok(!Mobird.isEmpty(args('')), 'non-empty arguments object is not empty');

    // covers collecting non-enumerable properties in IE < 9
    var nonEnumProp = {'toString': 5};
    ok(!Mobird.isEmpty(nonEnumProp), 'non-enumerable property is not empty');
  });

  if (typeof document === 'object') {
    test('isElement', function() {
      ok(!Mobird.isElement('div'), 'strings are not dom elements');
      ok(Mobird.isElement(testElement), 'an element is a DOM element');
    });
  }

  test('isArguments', function() {
    var args = (function(){ return arguments; }(1, 2, 3));
    ok(!Mobird.isArguments('string'), 'a string is not an arguments object');
    ok(!Mobird.isArguments(Mobird.isArguments), 'a function is not an arguments object');
    ok(Mobird.isArguments(args), 'but the arguments object is an arguments object');
    ok(!Mobird.isArguments(Mobird.toArray(args)), 'but not when it\'s converted into an array');
    ok(!Mobird.isArguments([1, 2, 3]), 'and not vanilla arrays.');
  });

  test('isObject', function() {
    ok(Mobird.isObject(arguments), 'the arguments object is object');
    ok(Mobird.isObject([1, 2, 3]), 'and arrays');
    if (testElement) {
      ok(Mobird.isObject(testElement), 'and DOM element');
    }
    ok(Mobird.isObject(function () {}), 'and functions');
    ok(!Mobird.isObject(null), 'but not null');
    ok(!Mobird.isObject(undefined), 'and not undefined');
    ok(!Mobird.isObject('string'), 'and not string');
    ok(!Mobird.isObject(12), 'and not number');
    ok(!Mobird.isObject(true), 'and not boolean');
    ok(Mobird.isObject(new String('string')), 'but new String()');
  });

  test('isArray', function() {
    ok(!Mobird.isArray(undefined), 'undefined vars are not arrays');
    ok(!Mobird.isArray(arguments), 'the arguments object is not an array');
    ok(Mobird.isArray([1, 2, 3]), 'but arrays are');
  });

  test('isString', function() {
    var obj = new String('I am a string object');
    if (testElement) {
      ok(!Mobird.isString(testElement), 'an element is not a string');
    }
    ok(Mobird.isString([1, 2, 3].join(', ')), 'but strings are');
    strictEqual(Mobird.isString('I am a string literal'), true, 'string literals are');
    ok(Mobird.isString(obj), 'so are String objects');
    strictEqual(Mobird.isString(1), false);
  });

  test('isNumber', function() {
    ok(!Mobird.isNumber('string'), 'a string is not a number');
    ok(!Mobird.isNumber(arguments), 'the arguments object is not a number');
    ok(!Mobird.isNumber(undefined), 'undefined is not a number');
    ok(Mobird.isNumber(3 * 4 - 7 / 10), 'but numbers are');
    ok(Mobird.isNumber(NaN), 'NaN *is* a number');
    ok(Mobird.isNumber(Infinity), 'Infinity is a number');
    ok(!Mobird.isNumber('1'), 'numeric strings are not numbers');
  });

  test('isBoolean', function() {
    ok(!Mobird.isBoolean(2), 'a number is not a boolean');
    ok(!Mobird.isBoolean('string'), 'a string is not a boolean');
    ok(!Mobird.isBoolean('false'), 'the string "false" is not a boolean');
    ok(!Mobird.isBoolean('true'), 'the string "true" is not a boolean');
    ok(!Mobird.isBoolean(arguments), 'the arguments object is not a boolean');
    ok(!Mobird.isBoolean(undefined), 'undefined is not a boolean');
    ok(!Mobird.isBoolean(NaN), 'NaN is not a boolean');
    ok(!Mobird.isBoolean(null), 'null is not a boolean');
    ok(Mobird.isBoolean(true), 'but true is');
    ok(Mobird.isBoolean(false), 'and so is false');
  });

  test('isFunction', function() {
    ok(!Mobird.isFunction(undefined), 'undefined vars are not functions');
    ok(!Mobird.isFunction([1, 2, 3]), 'arrays are not functions');
    ok(!Mobird.isFunction('moe'), 'strings are not functions');
    ok(Mobird.isFunction(Mobird.isFunction), 'but functions are');
    ok(Mobird.isFunction(function(){}), 'even anonymous ones');

    if (testElement) {
      ok(!Mobird.isFunction(testElement), 'elements are not functions');
    }
  });

  if (typeof Int8Array !== 'undefined') {
    test('#1929 Typed Array constructors are functions', function() {
      Mobird.chain(['Float32Array', 'Float64Array', 'Int8Array', 'Int16Array', 'Int32Array', 'Uint8Array', 'Uint8ClampedArray', 'Uint16Array', 'Uint32Array'])
      .map(Mobird.propertyOf(typeof GLOBAL != 'undefined' ? GLOBAL : window))
      .compact()
      .each(function(TypedArray) {
          // PhantomJS reports `typeof UInt8Array == 'object'` and doesn't report toString TypeArray
          // as a function
          strictEqual(Mobird.isFunction(TypedArray), Object.prototype.toString.call(TypedArray) === '[object Function]');
      });
    });
  }

  test('isDate', function() {
    ok(!Mobird.isDate(100), 'numbers are not dates');
    ok(!Mobird.isDate({}), 'objects are not dates');
    ok(Mobird.isDate(new Date()), 'but dates are');
  });

  test('isRegExp', function() {
    ok(!Mobird.isRegExp(Mobird.identity), 'functions are not RegExps');
    ok(Mobird.isRegExp(/identity/), 'but RegExps are');
  });

  test('isFinite', function() {
    ok(!Mobird.isFinite(undefined), 'undefined is not finite');
    ok(!Mobird.isFinite(null), 'null is not finite');
    ok(!Mobird.isFinite(NaN), 'NaN is not finite');
    ok(!Mobird.isFinite(Infinity), 'Infinity is not finite');
    ok(!Mobird.isFinite(-Infinity), '-Infinity is not finite');
    ok(Mobird.isFinite('12'), 'Numeric strings are numbers');
    ok(!Mobird.isFinite('1a'), 'Non numeric strings are not numbers');
    ok(!Mobird.isFinite(''), 'Empty strings are not numbers');
    var obj = new Number(5);
    ok(Mobird.isFinite(obj), 'Number instances can be finite');
    ok(Mobird.isFinite(0), '0 is finite');
    ok(Mobird.isFinite(123), 'Ints are finite');
    ok(Mobird.isFinite(-12.44), 'Floats are finite');
  });

  test('isNaN', function() {
    ok(!Mobird.isNaN(undefined), 'undefined is not NaN');
    ok(!Mobird.isNaN(null), 'null is not NaN');
    ok(!Mobird.isNaN(0), '0 is not NaN');
    ok(Mobird.isNaN(NaN), 'but NaN is');
    ok(Mobird.isNaN(new Number(NaN)), 'wrapped NaN is still NaN');
  });

  test('isNull', function() {
    ok(!Mobird.isNull(undefined), 'undefined is not null');
    ok(!Mobird.isNull(NaN), 'NaN is not null');
    ok(Mobird.isNull(null), 'but null is');
  });

  test('isUndefined', function() {
    ok(!Mobird.isUndefined(1), 'numbers are defined');
    ok(!Mobird.isUndefined(null), 'null is defined');
    ok(!Mobird.isUndefined(false), 'false is defined');
    ok(!Mobird.isUndefined(NaN), 'NaN is defined');
    ok(Mobird.isUndefined(), 'nothing is undefined');
    ok(Mobird.isUndefined(undefined), 'undefined is undefined');
  });

  test('isError', function() {
    ok(!Mobird.isError(1), 'numbers are not Errors');
    ok(!Mobird.isError(null), 'null is not an Error');
    ok(!Mobird.isError(Error), 'functions are not Errors');
    ok(Mobird.isError(new Error()), 'Errors are Errors');
    ok(Mobird.isError(new EvalError()), 'EvalErrors are Errors');
    ok(Mobird.isError(new RangeError()), 'RangeErrors are Errors');
    ok(Mobird.isError(new ReferenceError()), 'ReferenceErrors are Errors');
    ok(Mobird.isError(new SyntaxError()), 'SyntaxErrors are Errors');
    ok(Mobird.isError(new TypeError()), 'TypeErrors are Errors');
    ok(Mobird.isError(new URIError()), 'URIErrors are Errors');
  });

  test('tap', function() {
    var intercepted = null;
    var interceptor = function(obj) { intercepted = obj; };
    var returned = Mobird.tap(1, interceptor);
    equal(intercepted, 1, 'passes tapped object to interceptor');
    equal(returned, 1, 'returns tapped object');

    returned = Mobird([1, 2, 3]).chain().
      map(function(n){ return n * 2; }).
      max().
      tap(interceptor).
      value();
    equal(returned, 6, 'can use tapped objects in a chain');
    equal(intercepted, returned, 'can use tapped objects in a chain');
  });

  test('has', function () {
    var obj = {foo: 'bar', func: function(){}};
    ok(Mobird.has(obj, 'foo'), 'has() checks that the object has a property.');
    ok(!Mobird.has(obj, 'baz'), "has() returns false if the object doesn't have the property.");
    ok(Mobird.has(obj, 'func'), 'has() works for functions too.');
    obj.hasOwnProperty = null;
    ok(Mobird.has(obj, 'foo'), 'has() works even when the hasOwnProperty method is deleted.');
    var child = {};
    child.prototype = obj;
    ok(!Mobird.has(child, 'foo'), 'has() does not check the prototype chain for a property.');
    strictEqual(Mobird.has(null, 'foo'), false, 'has() returns false for null');
    strictEqual(Mobird.has(undefined, 'foo'), false, 'has() returns false for undefined');
  });

  test('isMatch', function() {
    var moe = {name: 'Moe Howard', hair: true};
    var curly = {name: 'Curly Howard', hair: false};

    equal(Mobird.isMatch(moe, {hair: true}), true, 'Returns a boolean');
    equal(Mobird.isMatch(curly, {hair: true}), false, 'Returns a boolean');

    equal(Mobird.isMatch(5, {__x__: undefined}), false, 'can match undefined props on primitives');
    equal(Mobird.isMatch({__x__: undefined}, {__x__: undefined}), true, 'can match undefined props');

    equal(Mobird.isMatch(null, {}), true, 'Empty spec called with null object returns true');
    equal(Mobird.isMatch(null, {a: 1}), false, 'Non-empty spec called with null object returns false');

    Mobird.each([null, undefined], function(item) { strictEqual(Mobird.isMatch(item, null), true, 'null matches null'); });
    Mobird.each([null, undefined], function(item) { strictEqual(Mobird.isMatch(item, null), true, 'null matches {}'); });
    strictEqual(Mobird.isMatch({b: 1}, {a: undefined}), false, 'handles undefined values (1683)');

    Mobird.each([true, 5, NaN, null, undefined], function(item) {
      strictEqual(Mobird.isMatch({a: 1}, item), true, 'treats primitives as empty');
    });

    function Prototest() {}
    Prototest.prototype.x = 1;
    var specObj = new Prototest;
    equal(Mobird.isMatch({x: 2}, specObj), true, 'spec is restricted to own properties');

    specObj.y = 5;
    equal(Mobird.isMatch({x: 1, y: 5}, specObj), true);
    equal(Mobird.isMatch({x: 1, y: 4}, specObj), false);

    ok(Mobird.isMatch(specObj, {x: 1, y: 5}), 'inherited and own properties are checked on the test object');

    Prototest.x = 5;
    ok(Mobird.isMatch({x: 5, y: 1}, Prototest), 'spec can be a function');

    //null edge cases
    var oCon = {'constructor': Object};
    deepEqual(Mobird.map([null, undefined, 5, {}], Mobird.partial(Mobird.isMatch, Mobird, oCon)), [false, false, false, true], 'doesnt falsey match constructor on undefined/null');
  });

  test('matcher', function() {
    var moe = {name: 'Moe Howard', hair: true};
    var curly = {name: 'Curly Howard', hair: false};
    var stooges = [moe, curly];

    equal(Mobird.matcher({hair: true})(moe), true, 'Returns a boolean');
    equal(Mobird.matcher({hair: true})(curly), false, 'Returns a boolean');

    equal(Mobird.matcher({__x__: undefined})(5), false, 'can match undefined props on primitives');
    equal(Mobird.matcher({__x__: undefined})({__x__: undefined}), true, 'can match undefined props');

    equal(Mobird.matcher({})(null), true, 'Empty spec called with null object returns true');
    equal(Mobird.matcher({a: 1})(null), false, 'Non-empty spec called with null object returns false');

    ok(Mobird.find(stooges, Mobird.matcher({hair: false})) === curly, 'returns a predicate that can be used by finding functions.');
    ok(Mobird.find(stooges, Mobird.matcher(moe)) === moe, 'can be used to locate an object exists in a collection.');
    deepEqual(Mobird.where([null, undefined], {a: 1}), [], 'Do not throw on null values.');

    deepEqual(Mobird.where([null, undefined], null), [null, undefined], 'null matches null');
    deepEqual(Mobird.where([null, undefined], {}), [null, undefined], 'null matches {}');
    deepEqual(Mobird.where([{b: 1}], {a: undefined}), [], 'handles undefined values (1683)');

    Mobird.each([true, 5, NaN, null, undefined], function(item) {
      deepEqual(Mobird.where([{a: 1}], item), [{a: 1}], 'treats primitives as empty');
    });

    function Prototest() {}
    Prototest.prototype.x = 1;
    var specObj = new Prototest;
    var protospec = Mobird.matcher(specObj);
    equal(protospec({x: 2}), true, 'spec is restricted to own properties');

    specObj.y = 5;
    protospec = Mobird.matcher(specObj);
    equal(protospec({x: 1, y: 5}), true);
    equal(protospec({x: 1, y: 4}), false);

    ok(Mobird.matcher({x: 1, y: 5})(specObj), 'inherited and own properties are checked on the test object');

    Prototest.x = 5;
    ok(Mobird.matcher(Prototest)({x: 5, y: 1}), 'spec can be a function');

    // #1729
    var o = {'b': 1};
    var m = Mobird.matcher(o);

    equal(m({'b': 1}), true);
    o.b = 2;
    o.a = 1;
    equal(m({'b': 1}), true, 'changing spec object doesnt change matches result');


    //null edge cases
    var oCon = Mobird.matcher({'constructor': Object});
    deepEqual(Mobird.map([null, undefined, 5, {}], oCon), [false, false, false, true], 'doesnt falsey match constructor on undefined/null');
  });

  test('matcher', function() {
    var moe = {name: 'Moe Howard', hair: true};
    var curly = {name: 'Curly Howard', hair: false};
    var stooges = [moe, curly];

    equal(Mobird.matcher({hair: true})(moe), true, 'Returns a boolean');
    equal(Mobird.matcher({hair: true})(curly), false, 'Returns a boolean');

    equal(Mobird.matcher({__x__: undefined})(5), false, 'can match undefined props on primitives');
    equal(Mobird.matcher({__x__: undefined})({__x__: undefined}), true, 'can match undefined props');

    equal(Mobird.matcher({})(null), true, 'Empty spec called with null object returns true');
    equal(Mobird.matcher({a: 1})(null), false, 'Non-empty spec called with null object returns false');

    ok(Mobird.find(stooges, Mobird.matcher({hair: false})) === curly, 'returns a predicate that can be used by finding functions.');
    ok(Mobird.find(stooges, Mobird.matcher(moe)) === moe, 'can be used to locate an object exists in a collection.');
    deepEqual(Mobird.where([null, undefined], {a: 1}), [], 'Do not throw on null values.');

    deepEqual(Mobird.where([null, undefined], null), [null, undefined], 'null matches null');
    deepEqual(Mobird.where([null, undefined], {}), [null, undefined], 'null matches {}');
    deepEqual(Mobird.where([{b: 1}], {a: undefined}), [], 'handles undefined values (1683)');

    Mobird.each([true, 5, NaN, null, undefined], function(item) {
      deepEqual(Mobird.where([{a: 1}], item), [{a: 1}], 'treats primitives as empty');
    });

    function Prototest() {}
    Prototest.prototype.x = 1;
    var specObj = new Prototest;
    var protospec = Mobird.matcher(specObj);
    equal(protospec({x: 2}), true, 'spec is restricted to own properties');

    specObj.y = 5;
    protospec = Mobird.matcher(specObj);
    equal(protospec({x: 1, y: 5}), true);
    equal(protospec({x: 1, y: 4}), false);

    ok(Mobird.matcher({x: 1, y: 5})(specObj), 'inherited and own properties are checked on the test object');

    Prototest.x = 5;
    ok(Mobird.matcher(Prototest)({x: 5, y: 1}), 'spec can be a function');

    // #1729
    var o = {'b': 1};
    var m = Mobird.matcher(o);

    equal(m({'b': 1}), true);
    o.b = 2;
    o.a = 1;
    equal(m({'b': 1}), true, 'changing spec object doesnt change matches result');


    //null edge cases
    var oCon = Mobird.matcher({'constructor': Object});
    deepEqual(Mobird.map([null, undefined, 5, {}], oCon), [false, false, false, true], 'doesnt falsey match constructor on undefined/null');
  });

  test('findKey', function() {
    var objects = {
      a: {'a': 0, 'b': 0},
      b: {'a': 1, 'b': 1},
      c: {'a': 2, 'b': 2}
    };

    equal(Mobird.findKey(objects, function(obj) {
      return obj.a === 0;
    }), 'a');

    equal(Mobird.findKey(objects, function(obj) {
      return obj.b * obj.a === 4;
    }), 'c');

    equal(Mobird.findKey(objects, 'a'), 'b', 'Uses lookupIterator');

    equal(Mobird.findKey(objects, function(obj) {
      return obj.b * obj.a === 5;
    }), undefined);

    strictEqual(Mobird.findKey([1, 2, 3, 4, 5, 6], function(obj) {
      return obj === 3;
    }), '2', 'Keys are strings');

    strictEqual(Mobird.findKey(objects, function(a) {
      return a.foo === null;
    }), undefined);

    Mobird.findKey({a: {a: 1}}, function(a, key, obj) {
      equal(key, 'a');
      deepEqual(obj, {a: {a: 1}});
      strictEqual(this, objects, 'called with context');
    }, objects);

    var array = [1, 2, 3, 4];
    array.match = 55;
    strictEqual(Mobird.findKey(array, function(x) { return x === 55; }), 'match', 'matches array-likes keys');
  });


  test('mapObject', function() {
   var obj = {'a': 1, 'b': 2};
   var objects = {
      a: {'a': 0, 'b': 0},
      b: {'a': 1, 'b': 1},
      c: {'a': 2, 'b': 2}
    };

    deepEqual(Mobird.mapObject(obj, function(val) {
      return val * 2;
    }), {'a': 2, 'b': 4}, 'simple objects');

    deepEqual(Mobird.mapObject(objects, function(val) {
      return Mobird.reduce(val, function(memo,v){
       return memo + v;
      },0);
    }), {'a': 0, 'b': 2, 'c': 4}, 'nested objects');

    deepEqual(Mobird.mapObject(obj, function(val,key,obj) {
      return obj[key] * 2;
    }), {'a': 2, 'b': 4}, 'correct keys');

    deepEqual(Mobird.mapObject([1,2], function(val) {
      return val * 2;
    }), {'0': 2, '1': 4}, 'check behavior for arrays');

    deepEqual(Mobird.mapObject(obj, function(val) {
      return val * this.multiplier;
    }, {multiplier : 3}), {'a': 3, 'b': 6}, 'keep context');

    deepEqual(Mobird.mapObject({a: 1}, function() {
      return this.length;
    }, [1,2]), {'a': 2}, 'called with context');

    var ids = Mobird.mapObject({length: 2, 0: {id: '1'}, 1: {id: '2'}}, function(n){
      return n.id;
    });
    deepEqual(ids, {'length': undefined, '0': '1', '1': '2'}, 'Check with array-like objects');

    // Passing a property name like Mobird.pluck.
    var people = {'a': {name : 'moe', age : 30}, 'b': {name : 'curly', age : 50}};
    deepEqual(Mobird.mapObject(people, 'name'), {'a': 'moe', 'b': 'curly'}, 'predicate string map to object properties');

    Mobird.each([null, void 0, 1, 'abc', [], {}, undefined], function(val){
      deepEqual(Mobird.mapObject(val, Mobird.identity), {}, 'mapValue identity');
    });

    var Proto = function(){this.a = 1;};
    Proto.prototype.b = 1;
    var protoObj = new Proto();
    deepEqual(Mobird.mapObject(protoObj, Mobird.identity), {a: 1}, 'ignore inherited values from prototypes');

  });
}());
