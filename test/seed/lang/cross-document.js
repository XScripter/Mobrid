(function() {
  if (typeof document == 'undefined') return;

  var Mobird = typeof require == 'function' ? require('..') : window.Mobird;

  QUnit.module('Cross Document');
  /* global iObject, iElement, iArguments, iFunction, iArray, iError, iString, iNumber, iBoolean, iDate, iRegExp, iNaN, iNull, iUndefined, ActiveXObject */

  // Setup remote variables for iFrame tests.
  var iframe = document.createElement('iframe');
  iframe.frameBorder = iframe.height = iframe.width = 0;
  document.body.appendChild(iframe);
  var iDoc = (iDoc = iframe.contentDocument || iframe.contentWindow).document || iDoc;
  iDoc.write(
    [
      '<script>',
      'parent.iElement = document.createElement("div");',
      'parent.iArguments = (function(){ return arguments; })(1, 2, 3);',
      'parent.iArray = [1, 2, 3];',
      'parent.iString = new String("hello");',
      'parent.iNumber = new Number(100);',
      'parent.iFunction = (function(){});',
      'parent.iDate = new Date();',
      'parent.iRegExp = /hi/;',
      'parent.iNaN = NaN;',
      'parent.iNull = null;',
      'parent.iBoolean = new Boolean(false);',
      'parent.iUndefined = undefined;',
      'parent.iObject = {};',
      'parent.iError = new Error();',
      '</script>'
    ].join('\n')
  );
  iDoc.close();

  test('isEqual', function() {

    ok(!Mobird.isEqual(iNumber, 101));
    ok(Mobird.isEqual(iNumber, 100));

    // Objects from another frame.
    ok(Mobird.isEqual({}, iObject), 'Objects with equivalent members created in different documents are equal');

    // Array from another frame.
    ok(Mobird.isEqual([1, 2, 3], iArray), 'Arrays with equivalent elements created in different documents are equal');
  });

  test('isEmpty', function() {
    ok(!Mobird([iNumber]).isEmpty(), '[1] is not empty');
    ok(!Mobird.isEmpty(iArray), '[] is empty');
    ok(Mobird.isEmpty(iObject), '{} is empty');
  });

  test('isElement', function() {
    ok(!Mobird.isElement('div'), 'strings are not dom elements');
    ok(Mobird.isElement(document.body), 'the body tag is a DOM element');
    ok(Mobird.isElement(iElement), 'even from another frame');
  });

  test('isArguments', function() {
    ok(Mobird.isArguments(iArguments), 'even from another frame');
  });

  test('isObject', function() {
    ok(Mobird.isObject(iElement), 'even from another frame');
    ok(Mobird.isObject(iFunction), 'even from another frame');
  });

  test('isArray', function() {
    ok(Mobird.isArray(iArray), 'even from another frame');
  });

  test('isString', function() {
    ok(Mobird.isString(iString), 'even from another frame');
  });

  test('isNumber', function() {
    ok(Mobird.isNumber(iNumber), 'even from another frame');
  });

  test('isBoolean', function() {
    ok(Mobird.isBoolean(iBoolean), 'even from another frame');
  });

  test('isFunction', function() {
    ok(Mobird.isFunction(iFunction), 'even from another frame');
  });

  test('isDate', function() {
    ok(Mobird.isDate(iDate), 'even from another frame');
  });

  test('isRegExp', function() {
    ok(Mobird.isRegExp(iRegExp), 'even from another frame');
  });

  test('isNaN', function() {
    ok(Mobird.isNaN(iNaN), 'even from another frame');
  });

  test('isNull', function() {
    ok(Mobird.isNull(iNull), 'even from another frame');
  });

  test('isUndefined', function() {
    ok(Mobird.isUndefined(iUndefined), 'even from another frame');
  });

  test('isError', function() {
    ok(Mobird.isError(iError), 'even from another frame');
  });

  if (typeof ActiveXObject != 'undefined') {
    test('IE host objects', function() {
      var xml = new ActiveXObject('Msxml2.DOMDocument.3.0');
      ok(!Mobird.isNumber(xml));
      ok(!Mobird.isBoolean(xml));
      ok(!Mobird.isNaN(xml));
      ok(!Mobird.isFunction(xml));
      ok(!Mobird.isNull(xml));
      ok(!Mobird.isUndefined(xml));
    });

    test('#1621 IE 11 compat mode DOM elements are not functions', function() {
      var fn = function() {};
      var xml = new ActiveXObject('Msxml2.DOMDocument.3.0');
      var div = document.createElement('div');

      // JIT the function
      var count = 200;
      while (count--) {
        Mobird.isFunction(fn);
      }

      equal(Mobird.isFunction(xml), false);
      equal(Mobird.isFunction(div), false);
      equal(Mobird.isFunction(fn), true);
    });
  }

}());