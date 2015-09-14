(function(){

  Mobird.each(['', 'WithNew'], function(withNew, _) {
    var createDeferred = function(fn) {
      return withNew ? new Mobird.Deferred(fn) : Mobird.Deferred(fn)
    }

    Evidence('MobirdDeferredTest' + withNew, {

      testSuccessOnResolve: function(t) {
        var called = 0
        createDeferred().resolve().done(function() {
          t.assertEqual(0, called++)
          t.assertEqual("resolved", this.state(), "Deferred is resolved (state)")
        }).fail(function() {
          t.fail("Error on resolve")
        }).always(function() {
          t.assertEqual(1, called++)
        })
        t.assertEqual(2, called, "Success and Always handlers called")
      },

      testErrorOnReject: function(t) {
        var called = 0
        createDeferred().reject().done(function() {
          t.fail("Success on reject")
        }).fail(function() {
          t.assertEqual(0, called++)
          t.assertEqual( "rejected", this.state(), "Deferred is rejected (state)" )
        }).always(function() {
          t.assertEqual(1, called++)
        })
        t.assertEqual(2, called, "Error and Always handlers called")
      },

      testDeferredFnContextIsArg1: function(t) {
        var called
        createDeferred(function(defer) {
          called = true
          t.assertEqual(defer, this, "Defer passed as this & first argument")
        })
        t.assertTrue(called, "Deferred function was called")
      },

      testDoneWithResolvedValue: function(t) {
        var called
        createDeferred(function(defer) {
          defer.resolve("done")
        }).done(function(value) {
          called = true
          t.assertEqual("done", value, "Done() received resolved value")
        })
        t.assertTrue(called, "Deferred function was called")
      },

      testNoDoneOnReject: function(t) {
        var called = false
        createDeferred(function(defer) {
          defer.reject("done")
        }).done(function(value) {
          called = true
          t.fail("done() should not be called on error")
        })
        t.assertFalse(called, "Deferred function was called")
      },

      testFilteringDone: function(t) {
        var value1, value2, value3,
          defer = createDeferred(),
          piped = defer.then(function(a, b) {
            return a * b
          })
        defer.done(function(a, b) { value1 = a, value2 = b }).resolve(2, 3)

        t.assertEqual(2, value1, "first resolve value ok")
        t.assertEqual(3, value2, "second resolve value ok")

        createDeferred().reject().then(function() { t.fail("then should not be called on reject") })
      },

      testSamePromise: function(t) {
        createDeferred(function(defer) {
          var promise = defer.promise()
          t.assertEqual(promise, defer.promise(), "promise is always the same")
        })
      },

      testExtendNonObject: function(t) {
        createDeferred(function(defer) {
          var func = function() {},
            funcPromise = defer.promise(func)
          t.assertEqual(func, funcPromise, "non objects get extended")
        })
      },

      testPromiseOnlyFns: function(t) {
        createDeferred(function(defer) {
          var promise = defer.promise()
          Mobird.each(promise, function(_, key) {
            var type = typeof promise[key]
            t.assertEqual("function", type, key + " is a function (" + type + ")")
          })
        })
      },

      testExtendObjectWithPromiseFns: function(t) {
        createDeferred(function(defer) {
          var promise = defer.promise(),
            func = function() {},
            funcPromise = defer.promise(func),
            fns = 0
          Mobird.each(promise, function(_, key) {
            ++fns
            t.assertEqual(promise[key], func[key], key + " is the same")
          })
        })
      },

      testFilteringReject: function(t) {
        var value1, value2, value3,
          defer = createDeferred(),
          piped = defer.then(null, function(a, b) {
            return a * b
          })

        defer.fail(function( a, b ) { value1 = a, value2 = b })
        defer.reject( 2, 3 )

        t.assertEqual(2, value1, "first reject value ok")
        t.assertEqual(3, value2, "second reject value ok")

        createDeferred().resolve().then(null, function() {
          t.fail("then should not be called on resolve")
        })

      },

      testFilteringProgress: function(t) {
        var value1, value2, value3,
          defer = createDeferred(),
          piped = defer.then(null, null, function(a, b) {
            return a * b
          })

        defer.progress(function(a, b) { value1 = a, value2 = b })

        defer.notify( 2, 3 )

        t.assertEqual(2, value1, "first progress value ok")
        t.assertEqual(3, value2, "second progress value ok")
      },

      testThenDeferredDone: function(t) {
        var value1, value2, value3,
          defer = createDeferred(),
          piped = defer.then(function(a, b) {
            return createDeferred(function(defer) {
              defer.reject(a * b)
            })
          })

        defer.done(function(a, b) { value1 = a, value2 = b })
        defer.resolve(2, 3)

        t.assertEqual(2, value1, "first resolve value ok")
        t.assertEqual(3, value2, "second resolve value ok")
      },

      testThenDeferredFail: function(t) {
        var value1, value2, value3,
          defer = createDeferred(),
          piped = defer.then(null, function(a, b) {
            return createDeferred(function(defer) {
              defer.resolve(a * b)
            })
          })

        defer.fail(function(a, b) { value1 = a, value2 = b })
        defer.reject(2, 3)

        t.assertEqual(2, value1, "first reject value ok")
        t.assertEqual(3, value2, "second reject value ok")
      },

      testThenDeferredProgress: function(t) {
        var value1, value2, value3,
          defer = createDeferred(),
          piped = defer.then(null, null, function(a, b) {
            return createDeferred(function(defer) {
              defer.resolve( a * b )
            })
          })

        defer.progress(function(a, b) { value1 = a, value2 = b })
        defer.notify(2, 3)

        t.assertEqual(2, value1, "first progress value ok")
        t.assertEqual(3, value2, "second progress value ok")
      },

      testThenWithContext: function(t) {
        var defer, piped, defer2, piped2, context = {}

        defer = createDeferred()
        piped = defer.then(function(value) {
          return value * 3
        })
        defer.resolve( 2 )

        defer2 = createDeferred()

        defer2.resolve(2)

      },

      testWhenValueCreatesPromise: function(t) {
        Mobird.each({
          "an empty string": "",
          "a non-empty string": "some string",
          "zero": 0,
          "a number other than zero": 1,
          "true": true,
          "false": false,
          "null": null,
          "undefined": undefined,
          "a plain object": {},
          "an array": [ 1, 2, 3 ]
        }, function(value, message) {
          t.assertTrue(
            Mobird.isFunction(Mobird.Deferred.when(value).done(function(resolveValue) {
              t.assertEqual(value, resolveValue, "Test the promise was resolved with " + message)
            }).promise), "Test " + message + " triggers the creation of a new Promise")
        })
      },

      testWhenNoValueCreatesPromise: function(t) {
        t.assertTrue(
          Mobird.isFunction(Mobird.Deferred.when().done(function(resolveValue) {
            t.assertEqual(undefined, resolveValue, "Test the promise was resolved with no parameter")
          }).promise), "Test calling when with no parameter triggers the creation of a new Promise")
      },

      testWhenPropagatesContext: function(t) {
        var context = {}, called = false
        Mobird.Deferred.when(createDeferred().resolveWith(context)).done(function() {
          called = true
        })
        t.assertTrue(called, "called done() after resolveWith")
      },

      testWhenDoneOnlyPromise: function(t) {
        var cache
        Mobird.each([1,2,3], function(i, _) {
          Mobird.Deferred.when(cache || createDeferred(function() {
              this.resolve(i)
            })).done(function(value) {
            t.assertEqual(1, value, "Function executed" + (i > 1 ? " only once" : ""))
            cache = value
          })
        })
      },

      testWhenJoined: function(t) {
        var deferreds = {
            value: 1,
            success: createDeferred().resolve(1),
            error: createDeferred().reject(0),
            futureSuccess: createDeferred().notify(true),
            futureError: createDeferred().notify(true),
            notify: createDeferred().notify(true)
          },
          willSucceed = {
            value: true,
            success: true,
            futureSuccess: true
          },
          willError = {
            error: true,
            futureError: true
          },
          willNotify = {
            futureSuccess: true,
            futureError: true,
            notify: true
          }

        Mobird.each(deferreds, function(defer1, id1) {
          Mobird.each(deferreds, function(defer2, id2) {
            var shouldResolve = willSucceed[id1] && willSucceed[id2],
              shouldError = willError[id1] || willError[id2],
              shouldNotify = willNotify[id1] || willNotify[id2],
              expected = shouldResolve ? [1, 1] : [0, undefined],
              expectedNotify = shouldNotify && [willNotify[id1], willNotify[id2]],
              code = id1 + '/' + id2,
              context1 = defer1 && Mobird.isFunction(defer1.promise) ? defer1.promise() : undefined,
              context2 = defer2 && Mobird.isFunction(defer2.promise) ? defer2.promise() : undefined
            Mobird.Deferred.when(defer1, defer2).done(function(a, b) {
              if (shouldResolve) {
                t.assertEqual(expected[0], a, code + " => resolve" )
                t.assertEqual(expected[1], b, code + " => resolve" )
              } else {
                t.fail(code + " => resolve")
              }
            }).fail(function(a, b) {
              if (shouldError) {
                t.assertIdentical(expected[1], b, code + " => reject")
              } else {
                t.fail(code + " => reject")
              }
            }).progress(function(a, b) {
              t.assertIdentical( expectedNotify[0], a, code + " => progress")
              t.assertIdentical( expectedNotify[1], b, code + " => progress")
              t.assertIdentical(expectedNotify[0] ? context1 : undefined, this[0], code + " => first context OK")
            })
          })
        })
        deferreds.futureSuccess.resolve(1)
        deferreds.futureError.reject(0)
      }

    })
  })
})()