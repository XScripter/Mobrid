(function() {

  var Mobird = typeof require == 'function' ? require('..') : window.Mobird;

  module("Events");

  test("on and trigger", 2, function() {
    var obj = { counter: 0 };
    Mobird.extend(obj,Mobird.Events);
    obj.on('event', function() { obj.counter += 1; });
    obj.trigger('event');
    equal(obj.counter,1,'counter should be incremented.');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    equal(obj.counter, 5, 'counter should be incremented five times.');
  });

  test("binding and triggering multiple events", 4, function() {
    var obj = { counter: 0 };
    Mobird.extend(obj, Mobird.Events);

    obj.on('a b c', function() { obj.counter += 1; });

    obj.trigger('a');
    equal(obj.counter, 1);

    obj.trigger('a b');
    equal(obj.counter, 3);

    obj.trigger('c');
    equal(obj.counter, 4);

    obj.off('a c');
    obj.trigger('a b c');
    equal(obj.counter, 5);
  });

  test("binding and triggering with event maps", function() {
    var obj = { counter: 0 };
    Mobird.extend(obj, Mobird.Events);

    var increment = function() {
      this.counter += 1;
    };

    obj.on({
      a: increment,
      b: increment,
      c: increment
    }, obj);

    obj.trigger('a');
    equal(obj.counter, 1);

    obj.trigger('a b');
    equal(obj.counter, 3);

    obj.trigger('c');
    equal(obj.counter, 4);

    obj.off({
      a: increment,
      c: increment
    }, obj);
    obj.trigger('a b c');
    equal(obj.counter, 5);
  });

  test("binding and triggering multiple event names with event maps", function() {
    var obj = { counter: 0 };
    Mobird.extend(obj, Mobird.Events);

    var increment = function() {
      this.counter += 1;
    };

    obj.on({
      'a b c': increment
    });

    obj.trigger('a');
    equal(obj.counter, 1);

    obj.trigger('a b');
    equal(obj.counter, 3);

    obj.trigger('c');
    equal(obj.counter, 4);

    obj.off({
      'a c': increment
    });
    obj.trigger('a b c');
    equal(obj.counter, 5);
  });

  test("binding and trigger with event maps context", 2, function() {
    var obj = { counter: 0 };
    var context = {};
    Mobird.extend(obj, Mobird.Events);

    obj.on({
      a: function() {
        strictEqual(this, context, 'defaults `context` to `callback` param');
      }
    }, context).trigger('a');

    obj.off().on({
      a: function() {
        strictEqual(this, context, 'will not override explicit `context` param');
      }
    }, this, context).trigger('a');
  });

  test("listenTo and stopListening", 1, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    a.listenTo(b, 'all', function(){ ok(true); });
    b.trigger('anything');
    a.listenTo(b, 'all', function(){ ok(false); });
    a.stopListening();
    b.trigger('anything');
  });

  test("listenTo and stopListening with event maps", 4, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    var cb = function(){ ok(true); };
    a.listenTo(b, {event: cb});
    b.trigger('event');
    a.listenTo(b, {event2: cb});
    b.on('event2', cb);
    a.stopListening(b, {event2: cb});
    b.trigger('event event2');
    a.stopListening();
    b.trigger('event event2');
  });

  test("stopListening with omitted args", 2, function () {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    var cb = function () { ok(true); };
    a.listenTo(b, 'event', cb);
    b.on('event', cb);
    a.listenTo(b, 'event2', cb);
    a.stopListening(null, {event: cb});
    b.trigger('event event2');
    b.off();
    a.listenTo(b, 'event event2', cb);
    a.stopListening(null, 'event');
    a.stopListening();
    b.trigger('event2');
  });

  test("listenToOnce", 2, function() {
    // Same as the previous test, but we use once rather than having to explicitly unbind
    var obj = { counterA: 0, counterB: 0 };
    Mobird.extend(obj, Mobird.Events);
    var incrA = function(){ obj.counterA += 1; obj.trigger('event'); };
    var incrB = function(){ obj.counterB += 1; };
    obj.listenToOnce(obj, 'event', incrA);
    obj.listenToOnce(obj, 'event', incrB);
    obj.trigger('event');
    equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  test("listenToOnce and stopListening", 1, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    a.listenToOnce(b, 'all', function() { ok(true); });
    b.trigger('anything');
    b.trigger('anything');
    a.listenToOnce(b, 'all', function() { ok(false); });
    a.stopListening();
    b.trigger('anything');
  });

  test("listenTo, listenToOnce and stopListening", 1, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    a.listenToOnce(b, 'all', function() { ok(true); });
    b.trigger('anything');
    b.trigger('anything');
    a.listenTo(b, 'all', function() { ok(false); });
    a.stopListening();
    b.trigger('anything');
  });

  test("listenTo and stopListening with event maps", 1, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    a.listenTo(b, {change: function(){ ok(true); }});
    b.trigger('change');
    a.listenTo(b, {change: function(){ ok(false); }});
    a.stopListening();
    b.trigger('change');
  });

  test("listenTo yourself", 1, function(){
    var e = Mobird.extend({}, Mobird.Events);
    e.listenTo(e, "foo", function(){ ok(true); });
    e.trigger("foo");
  });

  test("listenTo yourself cleans yourself up with stopListening", 1, function(){
    var e = Mobird.extend({}, Mobird.Events);
    e.listenTo(e, "foo", function(){ ok(true); });
    e.trigger("foo");
    e.stopListening();
    e.trigger("foo");
  });

  test("stopListening cleans up references", 12, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    var fn = function() {};
    b.on('event', fn);
    a.listenTo(b, 'event', fn).stopListening();
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._events.event), 1);
    equal(Mobird.size(b._listeners), 0);
    a.listenTo(b, 'event', fn).stopListening(b);
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._events.event), 1);
    equal(Mobird.size(b._listeners), 0);
    a.listenTo(b, 'event', fn).stopListening(b, 'event');
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._events.event), 1);
    equal(Mobird.size(b._listeners), 0);
    a.listenTo(b, 'event', fn).stopListening(b, 'event', fn);
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._events.event), 1);
    equal(Mobird.size(b._listeners), 0);
  });

  test("stopListening cleans up references from listenToOnce", 12, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    var fn = function() {};
    b.on('event', fn);
    a.listenToOnce(b, 'event', fn).stopListening();
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._events.event), 1);
    equal(Mobird.size(b._listeners), 0);
    a.listenToOnce(b, 'event', fn).stopListening(b);
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._events.event), 1);
    equal(Mobird.size(b._listeners), 0);
    a.listenToOnce(b, 'event', fn).stopListening(b, 'event');
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._events.event), 1);
    equal(Mobird.size(b._listeners), 0);
    a.listenToOnce(b, 'event', fn).stopListening(b, 'event', fn);
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._events.event), 1);
    equal(Mobird.size(b._listeners), 0);
  });

  test("listenTo and off cleaning up references", 8, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    var fn = function() {};
    a.listenTo(b, 'event', fn);
    b.off();
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._listeners), 0);
    a.listenTo(b, 'event', fn);
    b.off('event');
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._listeners), 0);
    a.listenTo(b, 'event', fn);
    b.off(null, fn);
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._listeners), 0);
    a.listenTo(b, 'event', fn);
    b.off(null, null, a);
    equal(Mobird.size(a._listeningTo), 0);
    equal(Mobird.size(b._listeners), 0);
  });

  test("listenTo and stopListening cleaning up references", 2, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    a.listenTo(b, 'all', function(){ ok(true); });
    b.trigger('anything');
    a.listenTo(b, 'other', function(){ ok(false); });
    a.stopListening(b, 'other');
    a.stopListening(b, 'all');
    equal(Mobird.size(a._listeningTo), 0);
  });

  test("listenToOnce without context cleans up references after the event has fired", 2, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    a.listenToOnce(b, 'all', function(){ ok(true); });
    b.trigger('anything');
    equal(Mobird.size(a._listeningTo), 0);
  });

  test("listenToOnce with event maps cleans up references", 2, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    a.listenToOnce(b, {
      one: function() { ok(true); },
      two: function() { ok(false); }
    });
    b.trigger('one');
    equal(Mobird.size(a._listeningTo), 1);
  });

  test("listenToOnce with event maps binds the correct `this`", 1, function() {
    var a = Mobird.extend({}, Mobird.Events);
    var b = Mobird.extend({}, Mobird.Events);
    a.listenToOnce(b, {
      one: function() { ok(this === a); },
      two: function() { ok(false); }
    });
    b.trigger('one');
  });

  test("listenTo with empty callback doesn't throw an error", 1, function(){
    var e = Mobird.extend({}, Mobird.Events);
    e.listenTo(e, "foo", null);
    e.trigger("foo");
    ok(true);
  });

  test("trigger all for each event", 3, function() {
    var a, b, obj = { counter: 0 };
    Mobird.extend(obj, Mobird.Events);
    obj.on('all', function(event) {
      obj.counter++;
      if (event == 'a') a = true;
      if (event == 'b') b = true;
    })
      .trigger('a b');
    ok(a);
    ok(b);
    equal(obj.counter, 2);
  });

  test("on, then unbind all functions", 1, function() {
    var obj = { counter: 0 };
    Mobird.extend(obj,Mobird.Events);
    var callback = function() { obj.counter += 1; };
    obj.on('event', callback);
    obj.trigger('event');
    obj.off('event');
    obj.trigger('event');
    equal(obj.counter, 1, 'counter should have only been incremented once.');
  });

  test("bind two callbacks, unbind only one", 2, function() {
    var obj = { counterA: 0, counterB: 0 };
    Mobird.extend(obj,Mobird.Events);
    var callback = function() { obj.counterA += 1; };
    obj.on('event', callback);
    obj.on('event', function() { obj.counterB += 1; });
    obj.trigger('event');
    obj.off('event', callback);
    obj.trigger('event');
    equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    equal(obj.counterB, 2, 'counterB should have been incremented twice.');
  });

  test("unbind a callback in the midst of it firing", 1, function() {
    var obj = {counter: 0};
    Mobird.extend(obj, Mobird.Events);
    var callback = function() {
      obj.counter += 1;
      obj.off('event', callback);
    };
    obj.on('event', callback);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    equal(obj.counter, 1, 'the callback should have been unbound.');
  });

  test("two binds that unbind themeselves", 2, function() {
    var obj = { counterA: 0, counterB: 0 };
    Mobird.extend(obj,Mobird.Events);
    var incrA = function(){ obj.counterA += 1; obj.off('event', incrA); };
    var incrB = function(){ obj.counterB += 1; obj.off('event', incrB); };
    obj.on('event', incrA);
    obj.on('event', incrB);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  test("bind a callback with a supplied context", 1, function () {
    var TestClass = function () {
      return this;
    };
    TestClass.prototype.assertTrue = function () {
      ok(true, '`this` was bound to the callback');
    };

    var obj = Mobird.extend({},Mobird.Events);
    obj.on('event', function () { this.assertTrue(); }, (new TestClass));
    obj.trigger('event');
  });

  test("nested trigger with unbind", 1, function () {
    var obj = { counter: 0 };
    Mobird.extend(obj, Mobird.Events);
    var incr1 = function(){ obj.counter += 1; obj.off('event', incr1); obj.trigger('event'); };
    var incr2 = function(){ obj.counter += 1; };
    obj.on('event', incr1);
    obj.on('event', incr2);
    obj.trigger('event');
    equal(obj.counter, 3, 'counter should have been incremented three times');
  });

  test("callback list is not altered during trigger", 2, function () {
    var counter = 0, obj = Mobird.extend({}, Mobird.Events);
    var incr = function(){ counter++; };
    var incrOn = function(){ obj.on('event all', incr); };
    var incrOff = function(){ obj.off('event all', incr); };

    obj.on('event all', incrOn).trigger('event');
    equal(counter, 0, 'on does not alter callback list');

    obj.off().on('event', incrOff).on('event all', incr).trigger('event');
    equal(counter, 2, 'off does not alter callback list');
  });

  test("#1282 - 'all' callback list is retrieved after each event.", 1, function() {
    var counter = 0;
    var obj = Mobird.extend({}, Mobird.Events);
    var incr = function(){ counter++; };
    obj.on('x', function() {
      obj.on('y', incr).on('all', incr);
    })
      .trigger('x y');
    strictEqual(counter, 2);
  });

  test("if no callback is provided, `on` is a noop", 0, function() {
    Mobird.extend({}, Mobird.Events).on('test').trigger('test');
  });

  test("if callback is truthy but not a function, `on` should throw an error just like jQuery", 1, function() {
    var view = Mobird.extend({}, Mobird.Events).on('test', 'noop');
    throws(function() {
      view.trigger('test');
    });
  });

  test("remove all events for a specific context", 4, function() {
    var obj = Mobird.extend({}, Mobird.Events);
    obj.on('x y all', function() { ok(true); });
    obj.on('x y all', function() { ok(false); }, obj);
    obj.off(null, null, obj);
    obj.trigger('x y');
  });

  test("remove all events for a specific callback", 4, function() {
    var obj = Mobird.extend({}, Mobird.Events);
    var success = function() { ok(true); };
    var fail = function() { ok(false); };
    obj.on('x y all', success);
    obj.on('x y all', fail);
    obj.off(null, fail);
    obj.trigger('x y');
  });

  test("#1310 - off does not skip consecutive events", 0, function() {
    var obj = Mobird.extend({}, Mobird.Events);
    obj.on('event', function() { ok(false); }, obj);
    obj.on('event', function() { ok(false); }, obj);
    obj.off(null, null, obj);
    obj.trigger('event');
  });

  test("once", 2, function() {
    // Same as the previous test, but we use once rather than having to explicitly unbind
    var obj = { counterA: 0, counterB: 0 };
    Mobird.extend(obj, Mobird.Events);
    var incrA = function(){ obj.counterA += 1; obj.trigger('event'); };
    var incrB = function(){ obj.counterB += 1; };
    obj.once('event', incrA);
    obj.once('event', incrB);
    obj.trigger('event');
    equal(obj.counterA, 1, 'counterA should have only been incremented once.');
    equal(obj.counterB, 1, 'counterB should have only been incremented once.');
  });

  test("once variant one", 3, function() {
    var f = function(){ ok(true); };

    var a = Mobird.extend({}, Mobird.Events).once('event', f);
    var b = Mobird.extend({}, Mobird.Events).on('event', f);

    a.trigger('event');

    b.trigger('event');
    b.trigger('event');
  });

  test("once variant two", 3, function() {
    var f = function(){ ok(true); };
    var obj = Mobird.extend({}, Mobird.Events);

    obj
      .once('event', f)
      .on('event', f)
      .trigger('event')
      .trigger('event');
  });

  test("once with off", 0, function() {
    var f = function(){ ok(true); };
    var obj = Mobird.extend({}, Mobird.Events);

    obj.once('event', f);
    obj.off('event', f);
    obj.trigger('event');
  });

  test("once with event maps", function() {
    var obj = { counter: 0 };
    Mobird.extend(obj, Mobird.Events);

    var increment = function() {
      this.counter += 1;
    };

    obj.once({
      a: increment,
      b: increment,
      c: increment
    }, obj);

    obj.trigger('a');
    equal(obj.counter, 1);

    obj.trigger('a b');
    equal(obj.counter, 2);

    obj.trigger('c');
    equal(obj.counter, 3);

    obj.trigger('a b c');
    equal(obj.counter, 3);
  });

  test("once with off only by context", 0, function() {
    var context = {};
    var obj = Mobird.extend({}, Mobird.Events);
    obj.once('event', function(){ ok(false); }, context);
    obj.off(null, null, context);
    obj.trigger('event');
  });

  asyncTest("once with asynchronous events", 1, function() {
    var func = Mobird.debounce(function() { ok(true); start(); }, 50);
    var obj = Mobird.extend({}, Mobird.Events).once('async', func);

    obj.trigger('async');
    obj.trigger('async');
  });

  test("once with multiple events.", 2, function() {
    var obj = Mobird.extend({}, Mobird.Events);
    obj.once('x y', function() { ok(true); });
    obj.trigger('x y');
  });

  test("Off during iteration with once.", 2, function() {
    var obj = Mobird.extend({}, Mobird.Events);
    var f = function(){ this.off('event', f); };
    obj.on('event', f);
    obj.once('event', function(){});
    obj.on('event', function(){ ok(true); });

    obj.trigger('event');
    obj.trigger('event');
  });

  test("once without a callback is a noop", 0, function() {
    Mobird.extend({}, Mobird.Events).once('event').trigger('event');
  });

  test("listenToOnce without a callback is a noop", 0, function() {
    var obj = Mobird.extend({}, Mobird.Events);
    obj.listenToOnce(obj, 'event').trigger('event');
  });

  test("event functions are chainable", function() {
    var obj = Mobird.extend({}, Mobird.Events);
    var obj2 = Mobird.extend({}, Mobird.Events);
    var fn = function() {};
    equal(obj, obj.trigger('noeventssetyet'));
    equal(obj, obj.off('noeventssetyet'));
    equal(obj, obj.stopListening('noeventssetyet'));
    equal(obj, obj.on('a', fn));
    equal(obj, obj.once('c', fn));
    equal(obj, obj.trigger('a'));
    equal(obj, obj.listenTo(obj2, 'a', fn));
    equal(obj, obj.listenToOnce(obj2, 'b', fn));
    equal(obj, obj.off('a c'));
    equal(obj, obj.stopListening(obj2, 'a'));
    equal(obj, obj.stopListening());
  });

  test("#3448 - listenToOnce with space-separated events", 2, function() {
    var one = Mobird.extend({}, Mobird.Events);
    var two = Mobird.extend({}, Mobird.Events);
    var count = 1;
    one.listenToOnce(two, 'x y', function(n) { ok(n === count++); });
    two.trigger('x', 1);
    two.trigger('x', 1);
    two.trigger('y', 2);
    two.trigger('y', 2);
  });

})();
