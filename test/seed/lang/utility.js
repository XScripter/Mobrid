(function() {
  var Mobird = typeof require == 'function' ? require('..') : window.Mobird;

  QUnit.module('Utility');

  test('#750 - Return Mobird instance.', 2, function() {
    var instance = Mobird([]);
    ok(Mobird(instance) === instance);
    ok(new Mobird(instance) === instance);
  });

  test('identity', function() {
    var stooge = {name : 'moe'};
    equal(Mobird.identity(stooge), stooge, 'stooge is the same as his identity');
  });

  test('constant', function() {
    var stooge = {name : 'moe'};
    equal(Mobird.constant(stooge)(), stooge, 'should create a function that returns stooge');
  });

  test('noop', function() {
    strictEqual(Mobird.noop('curly', 'larry', 'moe'), undefined, 'should always return undefined');
  });

  test('property', function() {
    var stooge = {name : 'moe'};
    equal(Mobird.property('name')(stooge), 'moe', 'should return the property with the given name');
    equal(Mobird.property('name')(null), undefined, 'should return undefined for null values');
    equal(Mobird.property('name')(undefined), undefined, 'should return undefined for undefined values');
  });
  
  test('propertyOf', function() {
    var stoogeRanks = Mobird.propertyOf({curly: 2, moe: 1, larry: 3});
    equal(stoogeRanks('curly'), 2, 'should return the property with the given name');
    equal(stoogeRanks(null), undefined, 'should return undefined for null values');
    equal(stoogeRanks(undefined), undefined, 'should return undefined for undefined values');
    
    function MoreStooges() { this.shemp = 87; }
    MoreStooges.prototype = {curly: 2, moe: 1, larry: 3};
    var moreStoogeRanks = Mobird.propertyOf(new MoreStooges());
    equal(moreStoogeRanks('curly'), 2, 'should return properties from further up the prototype chain');
    
    var nullPropertyOf = Mobird.propertyOf(null);
    equal(nullPropertyOf('curly'), undefined, 'should return undefined when obj is null');
    
    var undefPropertyOf = Mobird.propertyOf(undefined);
    equal(undefPropertyOf('curly'), undefined, 'should return undefined when obj is undefined');
  });

  test('random', function() {
    var array = Mobird.range(1000);
    var min = Math.pow(2, 31);
    var max = Math.pow(2, 62);

    ok(Mobird.every(array, function() {
      return Mobird.random(min, max) >= min;
    }), 'should produce a random number greater than or equal to the minimum number');

    ok(Mobird.some(array, function() {
      return Mobird.random(Number.MAX_VALUE) > 0;
    }), 'should produce a random number when passed `Number.MAX_VALUE`');
  });

  test('now', function() {
    var diff = Mobird.now() - new Date().getTime();
    ok(diff <= 0 && diff > -5, 'Produces the correct time in milliseconds');//within 5ms
  });

  test('uniqueId', function() {
    var ids = [], i = 0;
    while (i++ < 100) ids.push(Mobird.uniqueId());
    equal(Mobird.uniq(ids).length, ids.length, 'can generate a globally-unique stream of ids');
  });

  test('times', function() {
    var vals = [];
    Mobird.times(3, function (i) { vals.push(i); });
    deepEqual(vals, [0, 1, 2], 'is 0 indexed');
    //
    vals = [];
    Mobird(3).times(function(i) { vals.push(i); });
    deepEqual(vals, [0, 1, 2], 'works as a wrapper');
    // collects return values
    deepEqual([0, 1, 2], Mobird.times(3, function(i) { return i; }), 'collects return values');

    deepEqual(Mobird.times(0, Mobird.identity), []);
    deepEqual(Mobird.times(-1, Mobird.identity), []);
    deepEqual(Mobird.times(parseFloat('-Infinity'), Mobird.identity), []);
  });

  test('mixin', function() {
    Mobird.mixin({
      myReverse: function(string) {
        return string.split('').reverse().join('');
      }
    });
    equal(Mobird.myReverse('panacea'), 'aecanap', 'mixed in a function to Mobird');
    equal(Mobird('champ').myReverse(), 'pmahc', 'mixed in a function to the OOP wrapper');
  });

  test('Mobird.escape', function() {
    equal(Mobird.escape(null), '');
  });

  test('Mobird.unescape', function() {
    var string = 'Curly & Moe';
    equal(Mobird.unescape(null), '');
    equal(Mobird.unescape(Mobird.escape(string)), string);
    equal(Mobird.unescape(string), string, 'don\'t unescape unnecessarily');
  });

  // Don't care what they escape them to just that they're escaped and can be unescaped
  test('Mobird.escape & unescape', function() {
    // test & (&amp;) seperately obviously
    var escapeCharacters = ['<', '>', '"', '\'', '`'];

    Mobird.each(escapeCharacters, function(escapeChar) {
      var str = 'a ' + escapeChar + ' string escaped';
      var escaped = Mobird.escape(str);
      notEqual(str, escaped, escapeChar + ' is escaped');
      equal(str, Mobird.unescape(escaped), escapeChar + ' can be unescaped');

      str = 'a ' + escapeChar + escapeChar + escapeChar + 'some more string' + escapeChar;
      escaped = Mobird.escape(str);

      equal(escaped.indexOf(escapeChar), -1, 'can escape multiple occurances of ' + escapeChar);
      equal(Mobird.unescape(escaped), str, 'multiple occurrences of ' + escapeChar + ' can be unescaped');
    });

    // handles multiple escape characters at once
    var joiner = ' other stuff ';
    var allEscaped = escapeCharacters.join(joiner);
    allEscaped += allEscaped;
    ok(Mobird.every(escapeCharacters, function(escapeChar) {
      return allEscaped.indexOf(escapeChar) !== -1;
    }), 'handles multiple characters');
    ok(allEscaped.indexOf(joiner) >= 0, 'can escape multiple escape characters at the same time');

    // test & -> &amp;
    var str = 'some string & another string & yet another';
    var escaped = Mobird.escape(str);

    ok(escaped.indexOf('&') !== -1, 'handles & aka &amp;');
    equal(Mobird.unescape(str), str, 'can unescape &amp;');
  });

  test('result calls functions and returns primitives', function() {
    var obj = {w: '', x: 'x', y: function(){ return this.x; }};
    strictEqual(Mobird.result(obj, 'w'), '');
    strictEqual(Mobird.result(obj, 'x'), 'x');
    strictEqual(Mobird.result(obj, 'y'), 'x');
    strictEqual(Mobird.result(obj, 'z'), undefined);
    strictEqual(Mobird.result(null, 'x'), undefined);
  });

  test('result returns a default value if object is null or undefined', function() {
    strictEqual(Mobird.result(null, 'b', 'default'), 'default');
    strictEqual(Mobird.result(undefined, 'c', 'default'), 'default');
    strictEqual(Mobird.result(''.match('missing'), 1, 'default'), 'default');
  });

  test('result returns a default value if property of object is missing', function() {
    strictEqual(Mobird.result({d: null}, 'd', 'default'), null);
    strictEqual(Mobird.result({e: false}, 'e', 'default'), false);
  });

  test('result only returns the default value if the object does not have the property or is undefined', function() {
    strictEqual(Mobird.result({}, 'b', 'default'), 'default');
    strictEqual(Mobird.result({d: undefined}, 'd', 'default'), 'default');
  });

  test('result does not return the default if the property of an object is found in the prototype', function() {
    var Foo = function(){};
    Foo.prototype.bar = 1;
    strictEqual(Mobird.result(new Foo, 'bar', 2), 1);
  });

  test('result does use the fallback when the result of invoking the property is undefined', function() {
    var obj = {a: function() {}};
    strictEqual(Mobird.result(obj, 'a', 'failed'), undefined);
  });

  test('result fallback can use a function', function() {
    var obj = {a: [1, 2, 3]};
    strictEqual(Mobird.result(obj, 'b', Mobird.constant(5)), 5);
    strictEqual(Mobird.result(obj, 'b', function() {
      return this.a;
    }), obj.a, 'called with context');
  });

}());
