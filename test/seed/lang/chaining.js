(function() {
  var Mobird = typeof require == 'function' ? require('..') : window.Mobird;

  QUnit.module('Chaining');

  test('map/flatten/reduce', function() {
    var lyrics = [
      'I\'m a lumberjack and I\'m okay',
      'I sleep all night and I work all day',
      'He\'s a lumberjack and he\'s okay',
      'He sleeps all night and he works all day'
    ];
    var counts = Mobird(lyrics).chain()
      .map(function(line) { return line.split(''); })
      .flatten()
      .reduce(function(hash, l) {
        hash[l] = hash[l] || 0;
        hash[l]++;
        return hash;
    }, {}).value();
    equal(counts.a, 16, 'counted all the letters in the song');
    equal(counts.e, 10, 'counted all the letters in the song');
  });

  test('filter/reject/sortBy', function() {
    var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    numbers = Mobird(numbers).chain().filter(function(n) {
      return n % 2 === 0;
    }).reject(function(n) {
      return n % 4 === 0;
    }).sortBy(function(n) {
      return -n;
    }).value();
    deepEqual(numbers, [10, 6, 2], 'filtered and reversed the numbers');
  });

  test('filter/reject/sortBy in functional style', function() {
    var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    numbers = Mobird.chain(numbers).filter(function(n) {
      return n % 2 === 0;
    }).reject(function(n) {
      return n % 4 === 0;
    }).sortBy(function(n) {
      return -n;
    }).value();
    deepEqual(numbers, [10, 6, 2], 'filtered and reversed the numbers');
  });

  test('reverse/concat/unshift/pop/map', function() {
    var numbers = [1, 2, 3, 4, 5];
    numbers = Mobird(numbers).chain()
      .reverse()
      .concat([5, 5, 5])
      .unshift(17)
      .pop()
      .map(function(n){ return n * 2; })
      .value();
    deepEqual(numbers, [34, 10, 8, 6, 4, 2, 10, 10], 'can chain together array functions.');
  });

  test('splice', function() {
    var instance = Mobird([1, 2, 3, 4, 5]).chain();
    deepEqual(instance.splice(1, 3).value(), [1, 5]);
    deepEqual(instance.splice(1, 0).value(), [1, 5]);
    deepEqual(instance.splice(1, 1).value(), [1]);
    deepEqual(instance.splice(0, 1).value(), [], '#397 Can create empty array');
  });

  test('shift', function() {
    var instance = Mobird([1, 2, 3]).chain();
    deepEqual(instance.shift().value(), [2, 3]);
    deepEqual(instance.shift().value(), [3]);
    deepEqual(instance.shift().value(), [], '#397 Can create empty array');
  });

  test('pop', function() {
    var instance = Mobird([1, 2, 3]).chain();
    deepEqual(instance.pop().value(), [1, 2]);
    deepEqual(instance.pop().value(), [1]);
    deepEqual(instance.pop().value(), [], '#397 Can create empty array');
  });

  test('chaining works in small stages', function() {
    var o = Mobird([1, 2, 3, 4]).chain();
    deepEqual(o.filter(function(i) { return i < 3; }).value(), [1, 2]);
    deepEqual(o.filter(function(i) { return i > 2; }).value(), [3, 4]);
  });

  test('#1562: Engine proxies for chained functions', function() {
    var wrapped = Mobird(512);
    strictEqual(wrapped.toJSON(), 512);
    strictEqual(wrapped.valueOf(), 512);
    strictEqual(+wrapped, 512);
    strictEqual(wrapped.toString(), '512');
    strictEqual('' + wrapped, '512');
  });

}());
