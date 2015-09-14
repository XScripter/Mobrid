(function(){

  function click(el){
    var event = document.createEvent('MouseEvents')
    event.initMouseEvent('click', true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
    el.dispatchEvent(event)
  }

  function mousedown(el){
    var event = document.createEvent('MouseEvents')
    event.initMouseEvent('mousedown', true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
    el.dispatchEvent(event)
  }

  function outerHTML(node) {
    return node.outerHTML || (function(n) {
        var div = document.createElement('div')
        div.appendChild(n.cloneNode(true))
        var html = div.innerHTML
        div = null
        return html
      })(node)
  }

  var globalVarSetFromReady = ""
  Mobird.$(document).ready(function(){ globalVarSetFromReady = 'hi!' })

  var globalVarSetFromReady2 = ""
  Mobird.$(function(){ globalVarSetFromReady2 = 'hi!' })

  var globalVarSetFromReady3 = ""
  Mobird.$(document).on('ready', function(){ globalVarSetFromReady3 = 'hi!' })

  var globalVarSetFromReady4 = ""
  Mobird.$(document).on('foo ready bar', function(){ globalVarSetFromReady4 = 'hi!' })

  Evidence.Assertions.assertSame = function(expected, actual, message) {
    var expectedKeyCount = 0, actualKeyCount = 0, key, passed = true
    for (key in expected) expectedKeyCount++
    for (key in actual) actualKeyCount++

    if (expectedKeyCount == actualKeyCount)
      for (key in expected)
        passed &= expected[key] == actual[key]
    else
      passed = false

    this._assertExpression(passed, message || 'Failed assertion.',
      'Expected %o to be the same as %o.', actual, expected)
  }

  Evidence.Assertions.assertLength = function(expected, object, message) {
    var actual = object.length
    this._assertExpression(expected === actual, message || 'Failed assertion.',
      'Expected length %d, got %d.', expected, actual)
  }

  Evidence.Assertions.assertZeptoCollection = function(expectedLength, object, message) {
    if (!Mobird.$.query.isQ(object))
      this._assertExpression(false, message || 'Failed assertion.',
        'Expected %o to be a Zepto collection.', object)
    else
      this.assertLength(expectedLength, object, message)
  }

  Evidence.Assertions.assertEqualCollection = function(expectedCollection, actualCollection, message) {
    var expected = expectedCollection, actual = actualCollection,
      passed = expected.length == actual.length

    if (typeof expected.get == 'function') expected = expected.get()
    if (typeof actual.get == 'function') actual = actual.get()

    if (passed) for (var i=0; i<expected.length; i++) passed &= expected[i] == actual[i]

    this._assertExpression(passed, message || 'Failed assertion.',
      'Expected %o, got %o.', expected, actual)
  }

  Evidence('ZeptoTest', {

    testIsFunction: function(t) {
      t.assertTrue(Mobird.$.isFunction(function(){}))
      t.assertTrue(Mobird.$.isFunction(new Function()))

      var f1 = function(){}
      function f2(){}

      t.assertTrue(Mobird.$.isFunction(f1))
      t.assertTrue(Mobird.$.isFunction(f2))

      t.assertFalse(Mobird.$.isFunction())
      t.assertFalse(Mobird.$.isFunction(undefined))
      t.assertFalse(Mobird.$.isFunction({}))
      t.assertFalse(Mobird.$.isFunction(new Object()))
      t.assertFalse(Mobird.$.isFunction(null))
      t.assertFalse(Mobird.$.isFunction([]))
      t.assertFalse(Mobird.$.isFunction(1))
      t.assertFalse(Mobird.$.isFunction('a'))
      t.assertFalse(Mobird.$.isFunction(new Date()))
      t.assertFalse(Mobird.$.isFunction(window))
      t.assertFalse(Mobird.$.isFunction(Mobird.$('body')))
    },

    testIsPlainObject: function(t) {
      t.assertTrue(Mobird.$.isPlainObject(new Object()), 'Object is plain object')
      t.assertTrue(Mobird.$.isPlainObject({}), '{} is plain object')
      t.assertTrue(Mobird.$.isPlainObject({one : 1}), '{one : 1} is plain object')
      t.assertTrue(Mobird.$.isPlainObject({one : 1, two: [1,2]}), '{one : 1, two: [1,2]} is plain object')

      t.assertFalse(Mobird.$.isPlainObject(new Array()), 'Array object is not plain object')
      t.assertFalse(Mobird.$.isPlainObject([]), '[] is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(null), 'null is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(), 'undefined is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(new String()), 'empty String object is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(new String('moe')), 'String object is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(''), 'the empty string is not plain object')
      t.assertFalse(Mobird.$.isPlainObject('moe'), 'a string is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(new RegExp('test')), 'RegExp object is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(/test/), 'regex is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(new Boolean(true)), 'Boolean object is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(true), 'a boolean is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(new Number(2)), 'Number object is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(2), 'a number is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(new Function()), 'Function object is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(function() {}), 'a function is not plain object')
      t.assertFalse(Mobird.$.isPlainObject(new Date()), 'Date object is not plain object')

      t.assertFalse(Mobird.$.isPlainObject(window), 'window is not a plain object')
      t.assertFalse(Mobird.$.isPlainObject(Mobird.$("html")[0]), 'html node is not a plain object')

      var F = function(){}, obj
      F.prototype = {'a':1}
      obj = new F()
      t.assertFalse(Mobird.$.isPlainObject(obj), 'function with prototype is not a plain object')
    },

    testIsWindow: function(t){
      t.assertFalse(Mobird.$.isWindow())
      t.assertFalse(Mobird.$.isWindow({}))
      t.assertFalse(Mobird.$.isWindow(document.body))
      t.assertTrue(Mobird.$.isWindow(window))
      t.assertTrue(Mobird.$.isWindow(Mobird.$('iframe').get(0).contentWindow))
    },

    // test to see if we augment iOS 3.2 with String#trim()
    testTrim: function(t){
      t.assertEqual("blah", " blah ".trim())
      t.assertIdentical("", Mobird.$.trim(undefined))
      t.assertIdentical("", Mobird.$.trim(null))
      t.assertIdentical("", Mobird.$.trim(""))
      t.assertIdentical("0", Mobird.$.trim(0))
    },

    testCamelCase: function(t){
      t.assertEqual("hello", Mobird.$.camelCase("hello"))
      t.assertEqual("HELLO", Mobird.$.camelCase("HELLO"))
      t.assertEqual("helloNiceWorld", Mobird.$.camelCase("hello-nice-world"))
      t.assertEqual("helloWorld", Mobird.$.camelCase("helloWorld"))
    },

    testExtend: function(t){
      t.assertSame({}, Mobird.$.extend({}))
      t.assertSame(
        {a: "b", c: "d", e: "f"},
        Mobird.$.extend({a: "1", e: "f"}, {a: "b", c: "d"})
      )
      var obj = {}
      t.assertIdentical(obj, Mobird.$.extend(obj, {a: 1}))
      t.assertEqual(1, obj.a)

      obj = {}
      t.assertIdentical(obj, Mobird.$.extend(obj, {a: 1}, {b: 2}))
      t.assertEqual(2, obj.b)

      // undefined values are not copied over
      t.assertSame({a:1}, Mobird.$.extend({a:1}, {b:undefined}))

      // shallow by default
      obj = Mobird.$.extend({ a:{b:"c"} }, { a:{d:"e"} })
      t.assertSame({d:"e"}, obj.a)
    },

    testExtendDeep: function(t){
      var obj = { a:{b:"c", x:{y:"z"}} }
      Mobird.$.extend(true, obj, { a:{d:"e"} }, { a:{b:"B", f:"g", x:{q:"x"}} })

      t.assertEqual('a', Object.keys(obj).join(','))
      t.assertEqual('b,d,f,x', Object.keys(obj.a).sort().join(','))
      t.assertEqual('B', obj.a.b)
      t.assertEqual('e', obj.a.d)
      t.assertEqual('g', obj.a.f)
      t.assertEqual('z', obj.a.x.y)
      t.assertEqual('x', obj.a.x.q)

      // creates non-existing keys on target object
      obj = {}
      Mobird.$.extend(true, obj, { a:{b:"c"} })
      t.assertEqual('a', Object.keys(obj).join(','))
      t.assertEqual('c', obj.a.b)

      // skips iterating over DOM elements
      obj = {}
      var dom = Mobird.$('#some_element').get(0)
      Mobird.$.extend(true, obj, { element: dom })
      t.assertIdentical(dom, obj.element)

      // can override DOM element
      Mobird.$.extend(true, obj, { element:{a:'b'} })
      t.assertEqual('b', obj.element.a)

      // deep copy with array
      obj = {}
      var initial = { array: [1,2,3,4], object:{a:{b:["c","d"]}} }
      Mobird.$.extend(true, obj, initial)
      t.assertTrue(Mobird.$.isArray(obj.array))
      t.assertEqual(JSON.stringify(obj), JSON.stringify(initial))
      t.refuteIdentical(obj, initial)
      t.refuteIdentical(obj.array, initial.array)
      t.refuteIdentical(obj.object, initial.object)
      t.refuteIdentical(obj.object.a, initial.object.a)
      t.refuteIdentical(obj.object.a.b, initial.object.a.b)
    },

    testExtensionAPI: function(t) {
      t.assert('init' in Mobird.$.query)
      t.assert('fragment' in Mobird.$.query)
      t.assert('Q' in Mobird.$.query)
      t.assert('isQ' in Mobird.$.query)

      // redefine Q and log some debug information
      var oldZ = Mobird.$.query.Q, calls = []
      Mobird.$.query.Q = function Q(dom, selector) {
        var value = oldZ(dom, selector)
        calls.push(dom)
        return value
      }

      // now select some stuff
      var Z1 = Mobird.$(''), Z2 = Mobird.$('#find1 .findme')

      // check if Mobird.$.fn methods are still there
      t.assert('pluck' in Z1)
      t.assert('width' in Z2)

      // two calls should be logged
      t.assertLength(2, calls)

      // restore old Q
      Mobird.$.query.Q = oldZ
      var Z3 = Mobird.$('')
      t.assertLength(2, calls)

      t.assertFalse(Mobird.$.query.isQ())
      t.assertFalse(Mobird.$.query.isQ([]))
      t.assertTrue(Mobird.$.query.isQ(Mobird.$('body')))
    },

    testDollar: function(t){
      var expectedElement = document.getElementById('some_element')

      t.assertLength(1, Mobird.$('#some_element'))
      t.assertEqual(expectedElement, Mobird.$('#some_element').get(0))
      t.assertEqual(expectedElement, Mobird.$(expectedElement).get(0))

      t.assertLength(4, Mobird.$('p'))
      t.assertLength(1, Mobird.$('p > span.yay'))
    },

    testDollarUnique: function(t){
      t.refuteIdentical(Mobird.$('#some_element'), Mobird.$('#some_element'))
      t.refuteIdentical(Mobird.$('#nonexistent'), Mobird.$('#nonexistent'))
    },

    testDollarWithNil: function(t){
      t.assertZeptoCollection(0, Mobird.$(null))
      t.assertZeptoCollection(0, Mobird.$(undefined))
      t.assertZeptoCollection(0, Mobird.$(false))
      t.assertZeptoCollection(0, Mobird.$(''))
      t.assertZeptoCollection(0, Mobird.$('#'))

      var Z1 = Mobird.$(null), Z2 = Mobird.$(null)
      t.assert(Z1 !== Z2)
    },

    testDollarWithNonDOM: function(t){
      var query = Mobird.$(['a', 'b', 'c'])
      t.assertZeptoCollection(3, query)
      t.assertEqualCollection(['a', 'b', 'c'], query)

      t.assert(Mobird.$({}))
      t.assertTrue(Mobird.$({ a: true })[0].a)

      // Plain objects wrapped by a Zepto collection
      // should still refer to the original object
      // This is required for events on plain objects
      var plainObject = { a: 1 }
      Mobird.$(plainObject).get(0).a = 2
      t.assertEqual(2, plainObject.a)
      t.assertEqual(2, Mobird.$(plainObject).get(0).a)
    },

    testGetWithoutIndex: function(t){
      var query = Mobird.$('#find1 .findme')
      var array = query.get()
      t.assertFalse(query === array)
      t.assertTrue(Mobird.$.isArray(array))
      t.assertTrue(array.pop === ([]).pop)
    },

    testGetWithIndex: function(t){
      var query = Mobird.$('#find1 .findme')
      t.assertEqual(query[0], query.get(0))
      t.assertEqual(query[query.length - 1], query.get(-1))
      t.assertUndefined(query.get(query.length))
    },

    testSize: function(t){
      t.assertEqual(4, Mobird.$('#find1 .findme').size())
    },

    testDollarWithMultipleInstances: function(t){
      var instance1 = Mobird.$('#some_element'),
        instance2 = Mobird.$('p')

      t.assertLength(1, instance1)
      t.assertLength(4, instance2)
      t.refuteIdentical(instance1.get(0), instance2.get(0))
    },

    testDollarWithArrays: function(t){
      var element = document.getElementById('some_element')

      var z1 = Mobird.$([element])
      t.assertLength(1, z1)
      t.assertEqual(element, z1.get(0))

      var z2 = Mobird.$([element, null, undefined])
      t.assertLength(1, z2)
      t.assertEqual(element, z2.get(0))

      var z3 = Mobird.$([null, element, null])
      t.assertLength(1, z3)
      t.assertEqual(element, z3.get(0))
    },

    testDollarWithContext: function(t){
      // Zepto object
      var query = Mobird.$('p#find1, #find2')
      t.assertLength(11, Mobird.$('span', query))

      // DOM Element
      var domElement = document.getElementById('find1')
      t.assertLength(4, Mobird.$('span.findme', domElement))

      // Selector with DOM Element Context
      var domElement = document.getElementById('find1');
      t.assertLength(4, Mobird.$('span.findme', domElement));

      // DOM Element with DOM Element Context
      t.assertLength(1, Mobird.$(domElement, domElement));
    },

    testDollarWithDocument: function(t){
      var z = Mobird.$(document)
      t.assertLength(1, z)
      t.assertEqual('', z.selector)
    },

    testDollarWithAppcache: function(t){
      if ('applicationCache' in window) {
        var z = Mobird.$(window.applicationCache)
        t.assertLength(1, z)
        t.assertIdentical(window.applicationCache, z.get(0))
        t.assertEqual('', z.selector)
      }
    },

    testDollarWithDocumentFragment: function(t){
      var documentFragment = Mobird.$(document.createDocumentFragment())
      t.assertLength(1, documentFragment)
      t.assertEqual(Node.DOCUMENT_FRAGMENT_NODE, documentFragment.get(0).nodeType)
    },

    testDollarWithElementInIframe: function(t){
      var iframe = Mobird.$('#fixtures iframe').get(0),
        iframeWin = iframe.contentWindow,
        iframeDoc = iframe.contentDocument,
        iframeBody = iframeDoc.body,
        iframeEl = Mobird.$(iframeBody).find('b')

      t.assertIdentical(iframeWin, Mobird.$(iframeWin).get(0))
      t.assertIdentical(iframeDoc, Mobird.$(iframeDoc).get(0))
      t.assertIdentical(iframeBody, Mobird.$(iframeBody).get(0))
      t.assertEqual('B', iframeEl.pluck('tagName').join(','))
      t.assertEqual('Hello from iframe!', iframeEl.text())
    },

    testDollarWithFragment: function(t){
      var fragment = Mobird.$("<div>")
      t.assertLength(1, fragment)
      t.assertEqual("<div></div>", outerHTML(fragment.get(0)))
      t.assertEqual('', fragment.selector)
      t.assertNull(fragment.get(0).parentNode)

      fragment = Mobird.$("<div>hello world</div>")
      t.assertLength(1, fragment)
      t.assertEqual("<div>hello world</div>", outerHTML(fragment.get(0)))
      t.assertEqual('', fragment.selector)

      fragment = Mobird.$("<div>hello</div> <span>world</span>")
      t.assertLength(3, fragment)
      t.assertEqual("<div>hello</div>", outerHTML(fragment.get(0)))
      t.assertEqual(Node.TEXT_NODE, fragment.get(1).nodeType)
      t.assertEqual("<span>world</span>", outerHTML(fragment.get(2)))
      t.assertEqual('', fragment.selector)

      fragment = Mobird.$("<div>\nhello</div> \n<span>world</span>")
      t.assertLength(3, fragment)
      t.assertEqual("<div>\nhello</div>", outerHTML(fragment.get(0)))
      t.assertEqual(Node.TEXT_NODE, fragment.get(1).nodeType)
      t.assertEqual("<span>world</span>", outerHTML(fragment.get(2)))
      t.assertEqual('', fragment.selector)

      fragment = Mobird.$("<div /><div />")
      t.assertLength(2, fragment)

      fragment = Mobird.$("<div>hello</div> ")
      t.assertLength(1, fragment)
    },

    testDollarFragmentAndProperties: function(t){
      var el = Mobird.$('<p id=hi />', {
        id: 'hello', 'class': 'one two',
        text: 'world', css: {color: 'red'}
      })

      t.assertEqual('hello', el.attr('id'))
      t.assert(el.hasClass('one'))
      t.assert(el.hasClass('two'))
      t.assertEqual('world', el.text())
      t.assertEqual('red', el.css('color'))
    },

    testDollarNonemptyFragmentAndProperties: function(t){
      var query = Mobird.$('<a>Goodbye</a>', { text: "Hello", href: "http://zeptojs.com" })
      t.assertLength(1, query)
      t.assertEqual('Hello', query.text())
      t.assertEqual('http://zeptojs.com', query.attr("href"))
    },

    testDollarWithTextNode: function(t){
      var textNode = Mobird.$(document.createTextNode('hi there'))
      t.assertLength(1, textNode)
      t.assertEqual(Node.TEXT_NODE, textNode.get(0).nodeType)
    },

    testDollarWithCommentInFragment: function(t){
      var comment = Mobird.$('<!-- -->')
      t.assertLength(1, comment)
      t.assertEqual(Node.COMMENT_NODE, comment.get(0).nodeType)
    },

    testDollarWithDoctypeInFragment: function(t){
      t.assertZeptoCollection(0, Mobird.$('<!DOCTYPE html>'))
    },

    testNodeCreationViaDollar: function (t) {
      t.assertEqual('<div></div>', outerHTML(Mobird.$('<div></div>').get(0)))
      t.assertEqual('<div></div>', outerHTML(Mobird.$('<div/>').get(0)))
      t.assertEqual('<div><div></div></div>', outerHTML(Mobird.$('<div><div></div></div>').get(0)))
      t.assertEqual('<div><div></div></div>', outerHTML(Mobird.$('<div><div/></div>').get(0)))
      t.assertEqual('<div><div></div><div></div></div>', outerHTML(Mobird.$('<div><div></div><div></div></div>').get(0)))
    },

    testCreateTableCell: function(t) {
      t.assertEqual('TD', Mobird.$('<td></td>').pluck('nodeName').join(','))
    },

    testCreateTableHeaderCell: function(t) {
      t.assertEqual('TH', Mobird.$('<th></th>').pluck('nodeName').join(','))
    },

    testCreateTableRow: function(t) {
      t.assertEqual('TR', Mobird.$('<tr></tr>').pluck('nodeName').join(','))
    },

    testCreateTableHeader: function(t) {
      t.assertEqual('THEAD', Mobird.$('<thead></thead>').pluck('nodeName').join(','))
    },

    testCreateTableBody: function(t) {
      t.assertEqual('TBODY', Mobird.$('<tbody></tbody>').pluck('nodeName').join(','))
    },

    testCreateTableFooter: function(t) {
      t.assertEqual('TFOOT', Mobird.$('<tfoot></tfoot>').pluck('nodeName').join(','))
    },

    testCreateSelectOptgroup: function(t) {
      t.assertEqual('OPTGROUP', Mobird.$('<optgroup></optgroup>').pluck('nodeName').join(','))
    },

    testCreateSelectOption: function(t) {
      t.assertEqual('OPTION', Mobird.$('<option></option>').pluck('nodeName').join(','))
    },

    testReady: function(t){
      t.assertEqual('hi!', globalVarSetFromReady)
      t.assertEqual('hi!', globalVarSetFromReady2)
      t.assertEqual('hi!', globalVarSetFromReady3)
      t.assertEqual('hi!', globalVarSetFromReady4)
    },

    testNext: function(t){
      t.assertEqual('P', Mobird.$('#some_element').next().get(0).tagName)
      t.assertEqual('DIV', Mobird.$('p').next().get(0).tagName)

      t.assertEqual(0, Mobird.$('span.yay').next('.nay').size())
      t.assertEqual(1, Mobird.$('span.yay').next().size())
      t.assertEqual(1, Mobird.$('span.yay').next().next('.nay').size())
    },

    testPrev: function(t){
      t.assertEqual('H1', Mobird.$('p').prev().get(0).tagName)
      t.assertEqual('DIV', Mobird.$('ul').prev().get(0).tagName)

      t.assertEqual(0, Mobird.$('span.nay').prev('.yay').size())
      t.assertEqual(1, Mobird.$('span.nay').prev().size())
      t.assertEqual(1, Mobird.$('span.nay').prev().prev('.yay').size())
    },

    testEach: function(t){
      var index, tagnames = []
      Mobird.$('#eachtest > *').each(function(idx, el){
        index = idx
        t.assertIdentical(el, this)
        tagnames.push(el.tagName.toUpperCase())
      })
      t.assertEqual('SPAN, B, BR', tagnames.join(', '))
      t.assertEqual(2, index)
    },

    testEachBreak: function(t){
      var index, tagnames = []
      Mobird.$('#eachtest > *').each(function(idx, el){
        index = idx
        t.assertIdentical(el, this)
        tagnames.push(el.tagName.toUpperCase())
        if (idx == 1) return false
      })
      t.assertEqual('SPAN, B', tagnames.join(', '))
      t.assertEqual(1, index)
    },

    testMap: function(t){
      var results = Mobird.$('#eachtest > *').map(function(idx, el) {
        t.assertIdentical(el, this)
        return idx + ':' + this.nodeName.toUpperCase()
      })
      t.assertEqual(3, results.size())
      t.assertEqual('0:SPAN, 1:B, 2:BR', results.get().join(', '))
    },

    testDollarMap: function(t){
      var fruits = ['apples', 'oranges', 'pineapple', 'peach', ['grape', 'melon']]
      var results = Mobird.$.map(fruits, function(item, i) {
        if (item instanceof Array) return item
        else if (!/apple/.test(item)) return i + ':' + item
      })
      t.assertEqual('1:oranges,3:peach,grape,melon', results.join(','))
    },

    testDollarMapObject: function(t){
      var fruit = { name: 'banana', taste: 'sweet' }
      var results = Mobird.$.map(fruit, function(value, key) {
        return key + '=' + value
      })
      t.assertEqual('name=banana,taste=sweet', results.sort().join(','))
    },

    testDollarGrep: function(t){
      var fruits = ['apples', 'oranges', 'pineapple', 'peach']
      var result = Mobird.$.grep(fruits, function(name){ return /apple/.test(name) })
      t.assertEqualCollection(['apples', 'pineapple'], result)
    },

    testDollarEach: function(t){
      var array = ['a','b','c'], object = { a: 1, b: 2, c: 3 }, result

      result = []
      Mobird.$.each(array, function(idx, val){
        result.push(idx)
        result.push(val)
      })
      t.assertEqual('0a1b2c', result.join(''))

      result = []
      Mobird.$.each(object, function(key, val){
        result.push(key)
        result.push(val)
      })
      t.assertEqual('a1b2c3', result.join(''))

      result = []
      Mobird.$.each(array, function(idx, val){
        result.push(idx)
        result.push(val)
        return idx<1
      })
      t.assertEqual('0a1b', result.join(''))

      t.assertEqual('abc', Mobird.$.each(array, function(){}).join(''))
    },

    testDollarEachContext: function(t){
      Mobird.$.each(['a'], function(key, val) {
        t.assertEqual(this, val)
      })
      Mobird.$.each({a:'b'}, function(key, val) {
        t.assertEqual(this, val)
      })
    },

    testDollarInArray: function(t) {
      t.assertIdentical( 0,  Mobird.$.inArray(1, [1,2,3]) )
      t.assertIdentical( 1,  Mobird.$.inArray(2, [1,2,3]) )
      t.assertIdentical( -1, Mobird.$.inArray(4, [1,2,3]) )
      t.assertIdentical( 3,  Mobird.$.inArray(1, [1,2,3,1], 1) )
    },

    testDollarParseJSON: function(t) {
      t.assertSame({a:'b'}, Mobird.$.parseJSON('{"a":"b"}'))
    },

    testEq: function(t){
      var $els = Mobird.$('#eq_test div')
      t.assertZeptoCollection(1, $els.eq(0))
      t.assertZeptoCollection(1, $els.eq(-1))
      t.assertEqual($els.eq(-1)[0].className, 'eq2')
      t.assertUndefined($els.eq(-1).tagName)

      t.assertZeptoCollection(0, Mobird.$('nonexistent').eq(0))
    },

    testFirst: function(t){
      var query = Mobird.$('h1,p')
      t.assertLength(5, query)

      var zepto2 = query.first()
      t.refuteIdentical(query, zepto2)
      t.assertLength(5, query)

      t.assertLength(1, zepto2)
      t.assertEqual('H1', zepto2.get(0).tagName)

      t.assertLength(0, Mobird.$('nonexistent').first())
    },

    testFirstNonDOM: function(t){
      t.assertEqual('a', Mobird.$(['a', 'b', 'c']).first())
    },

    testLast: function(t){
      var query = Mobird.$('h1,p')
      t.assertLength(5, query)

      var zepto2 = query.last()
      t.refuteIdentical(query, zepto2)
      t.assertLength(5, query)

      t.assertLength(1, zepto2)
      t.assertEqual('P', zepto2.get(0).tagName)

      t.assertLength(0, Mobird.$('nonexistent').last())
    },

    testLastNonDOM: function(t){
      t.assertEqual('c', Mobird.$(['a', 'b', 'c']).last())
    },

    testPluck: function(t){
      t.assertEqual('H1DIVDIV', Mobird.$('h1,div.htmltest').pluck('tagName').join(''))
    },

    testShow: function(t){
      Mobird.$('#show_hide_div1').show()
      t.assertEqual('inline-block', getComputedStyle(Mobird.$('#show_hide_div1').get(0)).display)

      Mobird.$('#show_hide_div2').show()
      t.assertEqual('block', getComputedStyle(Mobird.$('#show_hide_div2').get(0)).display)

      Mobird.$('#show_hide_div3').show()
      t.assertEqual('block', getComputedStyle(Mobird.$('#show_hide_div3').get(0)).display)

      Mobird.$('#show_hide_span1').show()
      t.assertEqual('block', getComputedStyle(Mobird.$('#show_hide_span1').get(0)).display)

      Mobird.$('#show_hide_span2').show()
      t.assertEqual('block', getComputedStyle(Mobird.$('#show_hide_span2').get(0)).display)

      Mobird.$('#show_hide_span3').show()
      t.assertEqual('inline', getComputedStyle(Mobird.$('#show_hide_span3').get(0)).display)
    },

    testHide: function(t){
      Mobird.$('#show_hide_div1').hide()
      t.assertEqual('none', Mobird.$('#show_hide_div1').get(0).style.display)

      Mobird.$('#show_hide_div2').hide()
      t.assertEqual('none', Mobird.$('#show_hide_div2').get(0).style.display)

      Mobird.$('#show_hide_div3').hide()
      t.assertEqual('none', Mobird.$('#show_hide_div3').get(0).style.display)

      Mobird.$('#show_hide_span1').hide()
      t.assertEqual('none', Mobird.$('#show_hide_span1').get(0).style.display)

      Mobird.$('#show_hide_span2').hide()
      t.assertEqual('none', Mobird.$('#show_hide_span2').get(0).style.display)

      Mobird.$('#show_hide_span3').hide()
      t.assertEqual('none', Mobird.$('#show_hide_span3').get(0).style.display)
    },

    testToggle: function(t){
      var el = Mobird.$('#show_hide_div1').hide(),
        domStyle = el.get(0).style

      t.assertEqual('none', domStyle.display)

      var result = el.toggle()
      t.assertIdentical(el, result, 'expected toggle() to return self')
      t.assertIdentical('', domStyle.display)

      el.toggle()
      t.assertEqual('none', domStyle.display)

      el.toggle(true)
      t.assertIdentical('', domStyle.display)

      el.toggle(true)
      t.assertIdentical('', domStyle.display)

      el.toggle(false)
      t.assertEqual('none', domStyle.display)

      el.toggle(false)
      t.assertEqual('none', domStyle.display)
    },

    testToggleMultiple: function(t){
      var el1  = Mobird.$('#show_hide_div1').hide(),
        el2  = Mobird.$('#show_hide_div2').show(),
        both = Mobird.$('#show_hide_div1, #show_hide_div2')

      both.toggle()
      t.assertIdentical('', el1.get(0).style.display)
      t.assertEqual('none', el2.get(0).style.display)

      both.toggle()
      t.assertEqual('none', el1.get(0).style.display)
      t.assertEqual('block', el2.get(0).style.display)
    },

    testOffset: function(t){
      // TODO
      t.assertNull(Mobird.$('#doesnotexist').offset())
      var el = Mobird.$('#some_element')
      t.assertIdentical(el, el.offset({}))
    },

    testWidth: function(t){
      t.assertNull(Mobird.$('#doesnotexist').width())
      // can't check values here, but make sure it doesn't error out
      var viewportWidth = Mobird.$(window).width()
      t.assert(viewportWidth > 0 || viewportWidth === 0)
      t.assert(Mobird.$(document).width())

      t.assertIdentical(100, Mobird.$('#offset').width())
      Mobird.$('#offset').width('90px')
      t.assertIdentical(90, Mobird.$('#offset').width())
      Mobird.$('#offset').width(110)
      t.assertIdentical(110, Mobird.$('#offset').width())
      Mobird.$('#offset').width(function(i, oldWidth) { return oldWidth + 5 })
      t.assertIdentical(115, Mobird.$('#offset').width())
    },

    testHeight: function(t){
      t.assertNull(Mobird.$('#doesnotexist').height())
      // can't check values here, but make sure it doesn't error out
      var viewportHeight = Mobird.$(window).height()
      t.assert(viewportHeight > 0 || viewportHeight === 0)
      t.assert(Mobird.$(document).height())

      // with a tall element on the page,
      // the window (viewport) should be shorter than the total
      // document height
      Mobird.$('<div style="height:9999px" id="very_high"></div>').appendTo('body')
      t.assert(
        Mobird.$(window).height() < Mobird.$(document).height(),
        "'window' height was not smaller than 'document' height?")
      Mobird.$('#very_high').remove()

      t.assertIdentical(50, Mobird.$('#offset').height())
      Mobird.$('#offset').height('60px')
      t.assertIdentical(60, Mobird.$('#offset').height())
      Mobird.$('#offset').height(70)
      t.assertIdentical(70, Mobird.$('#offset').height())
      Mobird.$('#offset').height(function(i, oldHeight) { return oldHeight + 5 })
      t.assertIdentical(75, Mobird.$('#offset').height())
    },

    testClosest: function(t){
      var el = Mobird.$('#li2')
      t.assertEqualCollection(el, el.closest('li'))
      t.assertEqualCollection(Mobird.$('#nested'), el.closest('ul'))
      // with context
      t.assertEqualCollection(Mobird.$('#nested'), el.closest('ul', Mobird.$('#li1').get(0)))
      t.assertLength(0, el.closest('#parents', Mobird.$('#li1').get(0)))
      // no ancestor matched
      t.assertLength(0, el.closest('form'))
    },

    testClosestWithCollection: function(t){
      var targets = Mobird.$('#parents > li')
      var result = Mobird.$('#li2').closest(targets)
      t.assertLength(1, result)
      t.assertEqual('li1', result.get(0).id)

      t.assertLength(0, Mobird.$('#li1').closest('#li2'))
    },

    testClosestWithElement: function(t){
      var target = Mobird.$('#li1').get(0)
      var result = Mobird.$('#li2').closest(target)
      t.assertLength(1, result)
      t.assertIdentical(target, result.get(0))

      t.assertLength(0, Mobird.$('#li1').closest(Mobird.$('#li2').get(0)))
    },

    testClosestOnDetached: function(t){
      var el = Mobird.$('<div><p><a></a></p></div>'),
        para = el.children(),
        link = para.children()

      t.assertEqualCollection(para, link.closest('p'))
      t.assertEqualCollection(el, link.closest('div'))
      t.assertEqualCollection(el, el.closest('div'))
    },

    testContains: function(t){
      var el1 = Mobird.$('#li1'), el2 = Mobird.$('#li2')

      t.assertTrue(Mobird.$.contains(el1.get(0), el2.get(0)))
      t.assertFalse(Mobird.$.contains(el1.get(0), Mobird.$('#parents').get(0)))
    },

    testContainsOnDetached: function(t){
      var el = Mobird.$('<div><p><a></a></p></div>'),
        para = el.children(),
        link = para.children()

      t.assertTrue(Mobird.$.contains(para.get(0), link.get(0)))
      t.assertFalse(Mobird.$.contains(document.body, el.get(0)))
    },

    testParents: function(t){
      var body = document.body, html = body.parentNode, container = Mobird.$('#parents'),
        wrapper = Mobird.$('#fixtures').get(0)
      t.assertEqualCollection(Mobird.$([wrapper, body, html]), container.parents())

      var expected = Mobird.$('#li1 > ul').get()
      expected.push(Mobird.$('#li1').get(0))
      expected.push(container.get(0))
      expected = expected.concat([wrapper, body, html])
      t.assertEqualCollection(Mobird.$(expected), Mobird.$('#li1').find('li').parents())

      expected = [Mobird.$('#nested').get(0), Mobird.$('#parents').get(0)]
      t.assertEqualCollection(Mobird.$(expected), Mobird.$('#li2').parents('ul'))
    },

    testParentsIframe: function(t){
      var iframeBody = Mobird.$('iframe').get(0).contentDocument.body
      t.assertEqualCollection(
        [iframeBody, iframeBody.parentNode],
        Mobird.$(iframeBody).find('b').first().parents()
      )
    },

    testParent: function(t){
      var el = Mobird.$('#li1')
      t.assertEqualCollection(Mobird.$('#parents'), el.parent())
      t.assertEqualCollection(Mobird.$('#li1 > ul'), el.find('li').parent())
      t.assertLength(0, Mobird.$(document.createElement('div')).parent())
    },

    testParentOnDetached: function(t){
      t.assertLength(0, Mobird.$('<ul />').parent())
    },

    testChildren: function(t){
      var el=Mobird.$("#childrenTest"), lis=Mobird.$("li.child",el)

      //basic form
      t.assertEqualCollection(lis, el.children())
      //filtered by selector
      t.assertEqualCollection(lis.filter(".two"), el.children(".two"))
      //children == null
      t.assertLength(4,lis.children(null))
      //across multiple parents
      t.assertEqualCollection(el.find("li a"), lis.children("a"))
      //chainabilty
      t.assertEqual(el.find("li a.childOfTwo").text(), lis.children(".childOfTwo").text())
      //non-existent children
      t.assertLength(0,lis.children(".childOfTwo").children())
    },

    testContents: function(t){
      var $contents = Mobird.$("#contentsTest").contents()
      t.assertLength(3, $contents)
      t.assertLength(2, $contents.filter('span'))
      t.assertLength(0, Mobird.$("#contentsEmptyTest").contents())
    },

    testSiblings: function(t){
      var el=Mobird.$("#siblingsTest")

      //basic form
      t.assertEqualCollection(Mobird.$("li.one,li.three,li.four",el), Mobird.$("li.two",el).siblings())
      //filtered by selector
      t.assertEqualCollection(Mobird.$("li.three",el), Mobird.$("li.two",el).siblings(".three"))
      //across multiple parents
      t.assertEqualCollection(el.find("li b"), Mobird.$("li em",el).siblings("b"))
      t.assertLength(6,Mobird.$("li span",el).siblings())
      //non-existent siblings
      t.assertLength(0,Mobird.$("li span.e",el).siblings())
    },

    testNot: function(t){
      var el=Mobird.$("#notTest")

      //selector form
      t.assertEqualCollection(Mobird.$("li.one,li.three,li.four",el), Mobird.$("li",el).not(".two"))
      //element or NodeList form
      t.assertEqualCollection(Mobird.$("span.b,span.c,span.e",el), Mobird.$("span",el).not(document.getElementById("notTestExclude")))
      t.assertEqualCollection(Mobird.$("li",el), Mobird.$("li, span",el).not(document.getElementsByTagName("span")))
      //function form
      t.assertEqualCollection(Mobird.$("span.b,span.c",el),Mobird.$("span",el).not(function(i){
        var $this=Mobird.$(this)
        $this.html(i)
        return ($this.hasClass("d") || $this.hasClass("e")) ? true : false
      }))
      //test the index was passed in properly in previous test
      t.assertEqual("0",Mobird.$("span.b",el).text())
      t.assertEqual("1",Mobird.$("span.c",el).text())
    },

    testReplaceWith: function(t) {
      Mobird.$('div.first').replaceWith('<h2 id="replace_test">New heading</h2>')
      t.assertUndefined(Mobird.$('div.first').get(0))
      t.assert(document.getElementById("replace_test").nodeType)
      t.assertEqual(Mobird.$('.replacewith h2#replace_test').get(0), document.getElementById("replace_test"))

      Mobird.$('#replace_test').replaceWith(Mobird.$('.replace_test_div'))
      t.assertUndefined(Mobird.$('#replace_test').get(0))
      t.assert(document.getElementsByClassName("replace_test_div")[0].nodeType)
      t.assertEqual(Mobird.$('.replacewith h2#replace_test').get(0), document.getElementsByClassName("replace_test")[0])

      //Multiple elements
      Mobird.$('.replacewith .replace_test_div').replaceWith('<div class="inner first">hi</div><div class="inner fourth">hello</div>')
      t.assertLength(4,Mobird.$('.replacewith div'))
      t.assertEqual("inner first", Mobird.$('.replacewith div')[0].className)
      t.assertEqual("inner fourth", Mobird.$('.replacewith div')[1].className)
    },

    testReplaceWithFragment: function(t) {
      var orphanDiv = Mobird.$("<div />")
      orphanDiv.replaceWith(Mobird.$("<div class='different' />"))
      t.assert(!orphanDiv.hasClass('different'))
    },

    testWrap: function(t) {
      var el = Mobird.$('#wrap_test')
      el.find('span').wrap('<p><i/></p>')
      t.assertEqual(
        '<p><i><span>hi</span></i></p><a></a><p><i><span>hello</span></i></p>',
        el.html()
      )

      // avoids unnecessary cloning of dom structure for wrapping
      el = Mobird.$('<div><a/></div>')
      var structure = Mobird.$('<span/>')
      el.find('a').wrap(structure)
      t.assertIdentical(structure.get(0), el.find('span').get(0))
      t.assert(el.find('a').parent().is('span'))
    },

    testWrapFunction: function(t) {
      var el = Mobird.$('<div><b>A</b><b>B</b></div>')
      el.find('b').wrap(function(index){
        return '<a class=link' + index + Mobird.$(this).text() + ' />'
      })
      t.assertEqual(
        '<a class="link0A"><b>A</b></a><a class="link1B"><b>B</b></a>',
        el.html()
      )
    },

    testWrapAll: function(t) {
      var el = Mobird.$('#wrapall_test')
      el.find('span').wrapAll('<p><a/></p>')
      t.assertEqual(
        '<b></b><p><a><span>hi</span><span>hello</span></a></p><i></i>',
        el.html()
      )
    },

    testWrapFragment: function(t) {
      var fragment = Mobird.$('<div id="fragment" />')
      fragment.wrapAll('<div id="wrap_test" />')
      t.assertEqual('wrap_test', fragment.parent().attr('id'))
      t.assertEqual(0, fragment.children().length)

      fragment = Mobird.$('<div id="fragment" />')
      fragment.wrap('<div id="wrap_test" />')
      t.assertEqual('wrap_test', fragment.parent().attr('id'))
      t.assertEqual(0, fragment.children().length)
    },

    testWrapInner: function(t) {
      var $el = Mobird.$('#wrapinner_test')
      $el.wrapInner('<div>')
      t.assertLength(1, $el.children())
      t.assertLength(1, $el.children('div'))
      t.assertLength(3, $el.find('div').contents())

      $el = Mobird.$('#wrapinner_empty_test')
      $el.wrapInner('<div>')
      t.assertLength(1, $el.children())
      t.assertLength(1, $el.children('div'))
      t.assertLength(0, $el.find('div').contents())
    },

    testWrapInnerFunction: function(t) {
      var el = Mobird.$('<div><b>A</b><b>B</b></div>')
      el.find('b').wrapInner(function(index){
        return '<a class=link' + index + Mobird.$(this).text() + ' />'
      })
      t.assertEqual(
        '<b><a class="link0A">A</a></b><b><a class="link1B">B</a></b>',
        el.html()
      )
    },

    testUnwrap: function(t){
      var context=Mobird.$("#unwrap_test")

      //Element With no siblings
      Mobird.$(".unwrap_one span",context).unwrap()
      t.assertLength(1,Mobird.$("b",context))

      //Element with siblings
      Mobird.$(".unwrap_two span",context).unwrap()
      t.assertLength(0,Mobird.$("b",context))
      //make sure siblings are unaffected
      t.assertLength(3,Mobird.$("span",context))
      //make sure parents are what they should be
      t.assertEqual(Mobird.$("span",context).parent().get(0), document.getElementsByClassName("unwrap_one")[0])
    },

    testUnwrapFragment: function(t){
      var fragment = Mobird.$('<div id=outer><div id=inner></div><div id=uninvolved></div></div>'),
        innerFragment = fragment.find("#inner"),
        uninvolved = fragment.find("#uninvolved")

      innerFragment.unwrap()
      t.assertLength(0, innerFragment.parent(), '#inner should be orphan')
      t.assertLength(0, uninvolved.parent(),    '#uninvolved should be orphan')
      t.assertLength(0, fragment.children(),    'fragment should be empty')
    },

    testClone: function(t){
      var el = Mobird.$('<div class=sheep><span></span></div>'),
        el2 = el.clone()

      t.assert(el2.hasClass('sheep'))
      el2.addClass('black')
      t.refute(el.hasClass('black'))

      el2.find('span').text('baa')
      t.assertIdentical('', el.find('span').text())
    },

    testFind: function(t){
      var found = Mobird.$('p#find1').find('span.findme')
      t.assertLength(4, found)
      t.assertEqual('1', found.get(0).innerHTML)
      t.assertEqual('2', found.get(1).innerHTML)
      t.assertEqual('4', found.get(2).innerHTML)
      t.assertEqual('5<span>6</span>', found.get(3).innerHTML)

      var found = Mobird.$('p#find1, #find2').find('span')
      t.assertLength(11, found)
    },

    testFindWithCollection: function(t){
      var targets = Mobird.$('#find1 span span, #find1 b, #find2 span')
      var found = Mobird.$('p#find1').find(targets)
      t.assertLength(2, found)
      t.assertEqual('B', found.get(0).tagName)
      t.assertEqual('6', found.get(1).innerHTML)
    },

    testFindWithElement: function(t){
      var target = Mobird.$('#find1 span span').get(0)
      var found = Mobird.$('p#find1').find(target)
      t.assertLength(1, found)
      t.assertEqual('6', found.get(0).innerHTML)

      found = Mobird.$('p#find1').find(document.body)
      t.assertLength(0, found, "no elements should have matched")
    },

    testFindWithInvalidNode: function(t) {
      var found = Mobird.$('<div><a>1</a></div>\n<div></div>').find('a')
      t.assertLength(1, found)
      t.assertEqual('1', found.get(0).innerHTML)
    },

    testFindWithFalsyValue: function(t){
      var element = '<div><a>1</a></div>';
      t.assertZeptoCollection(0, Mobird.$(element).find(undefined))
      t.assertZeptoCollection(0, Mobird.$(element).find(false))
      t.assertZeptoCollection(0, Mobird.$(element).find(0))
      t.assertZeptoCollection(0, Mobird.$(element).find(''))
    },

    testFilter: function(t){
      var found = Mobird.$('div')
      t.assertLength(2, found.filter('.filtertest'))
      t.assertLength(0, found.filter('.doesnotexist'))
      t.assertLength(1, found.filter('.filtertest').filter(':nth-child(2n)'))

      var nodes = Mobird.$('<select><option value=1>test1</option><option value=2>test2</option><option value=1>test1</option></select>')
      t.assertLength(2, nodes.find('option').filter(function(){ return this.value == '1' }))

      var indexes = []
      nodes.find('option').filter(function(index){ if (this.value=='1') indexes.push(index) })
      t.assertEqualCollection([0,2], indexes)
    },

    testFilterWithNonNativeArrayFilter: function(t){
      var nativeFilter = Array.prototype.filter
      try {
        // apply broken filter
        Array.prototype.filter = function(){ return [] }
        t.assertLength(2, Mobird.$('div').filter('.filtertest'))
      } finally {
        Array.prototype.filter = nativeFilter
      }
    },

    testHas: function(t){
      var result, el = Mobird.$('<b id=one><a></a></b><b id=two><i></i></b><b id=three><i></i></b>')
      result = el.has('a')
      t.assertEqual('one', result.pluck('id').join(' '))
      result = el.has('i')
      t.assertEqual('two three', result.pluck('id').join(' '))
      result = el.has(el.find('i').get(0))
      t.assertEqual('two', result.pluck('id').join(' '))
    },

    testAdd: function(t){
      var lis=Mobird.$("li"),spans=Mobird.$("span"),
        together=lis.add("span"),
        duplicates=spans.add("span"),
        disconnected=Mobird.$("<div></div>").add("<span></span>"),
        mainContext=Mobird.$("#addTest")

      //uniquness of collection
      t.assertLength(spans.length, duplicates)

      //selector only
      t.assertLength((lis.length + spans.length), together)

      //selector with context
      t.assertEqualCollection(Mobird.$("span",mainContext), Mobird.$(".add_span").add(".add_span_exclude",mainContext))

      //DOM Element + Chaining test
      t.assertEqualCollection(mainContext.children(), Mobird.$(".add_span").add(".add_span_exclude").add(document.getElementById("addTestDiv")))

      //Disconnected
      t.assert(!disconnected.get(0).parentNode)

      Mobird.$("#addTestDiv").append(disconnected)
      t.assertEqual('<div></div><span></span>', document.getElementById("addTestDiv").innerHTML)
    },

    testIs: function(t){
      t.assert(Mobird.$('#find1').is('p'))
      t.assert(Mobird.$('#li2').is(':first-child'))
      t.assert(!Mobird.$('#find1').is('doesnotexist'))
      //t.assert(!Mobird.$('#find1').is())

      t.assert(Mobird.$('#fixtures div').is('#some_element'))
      t.assert(!Mobird.$('#doesnotexist').is('p'))

      t.assert(!Mobird.$(window).is('p'))
    },

    testIsWithoutParent: function(t){
      var elem = Mobird.$('<div id=outOfDOM />')
      t.assert(elem.is('div'))
      t.assert(elem.is('#outOfDOM'))
      t.assert(!elem.is('p'))
      //t.assert(!elem.is())
    },

    testCSS: function(t){
      var el = Mobird.$('#some_element').get(0)

      // single assignments
      Mobird.$('#some_element').css('color', '#f00')
      Mobird.$('#some_element').css('margin-top', '10px')
      Mobird.$('#some_element').css('marginBottom', '5px')
      Mobird.$('#some_element').css('left', 42)
      Mobird.$('#some_element').css('z-index', 10)
      Mobird.$('#some_element').css('fontWeight', 300)
      Mobird.$('#some_element').css('border', '1px solid rgba(255,0,0,0)')
      t.assertEqual('rgb(255, 0, 0)', el.style.color)
      t.assertEqual('rgba(255, 0, 0, 0)', el.style.borderLeftColor)
      t.assertEqual('1px', el.style.borderLeftWidth)
      t.assertEqual('10px', el.style.marginTop)
      t.assertEqual('5px', el.style.marginBottom)
      t.assertEqual('42px', el.style.left)
      t.assertEqual(300, el.style.fontWeight)
      t.assertEqual(10, el.style.zIndex)

      // read single values, including shorthands
      t.assertEqual('rgb(255, 0, 0)',
        Mobird.$('#some_element').css('color'))
      t.assertEqual('1px solid rgba(255, 0, 0, 0)',
        Mobird.$('#some_element').css('border'))

      // multiple assignments
      Mobird.$('#some_element').css({
        'border': '2px solid #000',
        'color': 'rgb(0,255,0)',
        'padding-left': '2px'
      })
      t.assertEqual('2px', Mobird.$('#some_element').css('borderLeftWidth'))
      t.assertEqual('solid', Mobird.$('#some_element').css('borderLeftStyle'))
      t.assertEqual('rgb(0, 0, 0)', Mobird.$('#some_element').css('borderLeftColor'))
      t.assertEqual('rgb(0, 255, 0)', Mobird.$('#some_element').css('color'))
      t.assertEqual('2px', Mobird.$('#some_element').css('paddingLeft'))
      t.assertEqual('2px', Mobird.$('#some_element').css('border-left-width'))
      t.assertEqual('solid', Mobird.$('#some_element').css('border-left-style'))
      t.assertEqual('rgb(0, 0, 0)', Mobird.$('#some_element').css('border-left-color'))
      t.assertEqual('rgb(0, 255, 0)', Mobird.$('#some_element').css('color'))
      t.assertEqual('2px', Mobird.$('#some_element').css('padding-left'))

      // read multiple values, camelCased CSS
      var arrCamelCss = Mobird.$('#some_element').css(['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor', 'color'])
      t.assertEqual('2px', arrCamelCss['borderLeftWidth'])
      t.assertEqual('solid', arrCamelCss['borderLeftStyle'])
      t.assertEqual('rgb(0, 0, 0)', arrCamelCss['borderLeftColor'])
      t.assertEqual('rgb(0, 255, 0)', arrCamelCss['color'])
      t.assertUndefined(arrCamelCss['paddingLeft'])

      // read multiple values, dashed CSS property names
      var arrDashedCss = Mobird.$('#some_element').css(['border-left-width', 'border-left-style', 'border-left-color', 'color'])
      t.assertEqual('2px', arrDashedCss['border-left-width'])
      t.assertEqual('solid', arrDashedCss['border-left-style'])
      t.assertEqual('rgb(0, 0, 0)', arrDashedCss['border-left-color'])
      t.assertEqual('rgb(0, 255, 0)', arrDashedCss['color'])
      t.assertUndefined(arrDashedCss['padding-left'])

      // make sure reads from empty Zepto collections just return undefined
      t.assertUndefined(Mobird.$().css(['border-left-width']))

      var div = Mobird.$('#get_style_element')
      t.assertEqual('48px', div.css('font-size'))
      t.assertEqual('rgb(0, 0, 0)', div.css('color'))
    },

    testCSSUnset: function (t) {
      var el = Mobird.$('#some_element').css({ 'margin-top': '1px', 'margin-bottom': '1px' }),
        dom = el.get(0)

      el.css('color', '#000')
      el.css('color', '')
      t.assertIdentical('', dom.style.color)

      el.css('color', '#000')
      el.css('color', undefined)
      t.assertIdentical('', dom.style.color)

      el.css('color', '#000')
      el.css('color', null)
      t.assertIdentical('', dom.style.color)

      el.css('color', '#000')
      el.css({ color: '', 'margin-top': undefined, 'marginBottom': null })
      t.assertIdentical('', dom.style.color)
      t.assertIdentical('', dom.style.marginTop)
      t.assertIdentical('', dom.style.marginBottom)
    },

    testCSSZeroValue: function (t) {
      var el = Mobird.$('#some_element'), dom = el.get(0)
      el.css('opacity', 0)
      t.assertIdentical('0', dom.style.opacity)

      el.css('opacity', 1)
      el.css({ opacity: 0 })
      t.assertIdentical('0', dom.style.opacity)
    },

    testCSSOnNonExistingElement: function (t) {
      var errorWasRaised = false
      try {
        var color = Mobird.$('.some-non-exist-elm').css('color')
      } catch (e) {
        errorWasRaised = true
      }
      t.assert(!errorWasRaised)
    },

    testHtml: function(t){
      var div = Mobird.$('div.htmltest');

      div.text(undefined);
      t.assertEqual('', div.html());

      t.assertIdentical(div, div.html('yowza'))
      t.assertEqual('yowza', document.getElementById('htmltest1').innerHTML)
      t.assertEqual('yowza', document.getElementById('htmltest2').innerHTML)

      t.assertEqual('yowza', Mobird.$('div.htmltest').html())

      div.html('')
      t.assertEqual('', document.getElementById('htmltest2').innerHTML)

      t.assertEqual("", Mobird.$('#htmltest3').html())

      t.assertNull(Mobird.$('doesnotexist').html())

      div.html('yowza')
      div.html(function(idx, html){
        return html.toUpperCase()
      })
      t.assertEqual('YOWZA', div.html())

      div.html('<u>a</u><u>b</u><u>c</u>')

      Mobird.$('u').html(function(idx,html){
        return idx+html
      })
      t.assertEqual('<u>0a</u><u>1b</u><u>2c</u>', div.html())

      var table = Mobird.$('#htmltest4'),
        html = '<tbody><tr><td>ok</td></tr></tbody>'
      table.html('<tbody><tr><td>ok</td></tr></tbody>')
      t.assertEqual(html, table.html())
    },

    testText: function(t){
      // test basics with Zepto-created DOM elements
      t.assertEqual('',         Mobird.$('<h1/>').text())
      t.assertEqual('',         Mobird.$('<h1/>').text('').text())
      t.assertEqual('',         Mobird.$('<h1/>').text(undefined).text())
      t.assertEqual('',         Mobird.$('<h1/>').text(null).text())
      t.assertEqual('false',    Mobird.$('<h1/>').text(false).text())
      t.assertEqual('1',        Mobird.$('<h1/>').text(1).text())
      t.assertEqual('<b>a</b>', Mobird.$('<h1/>').text('<b>a</b>').text())

      t.assertEqual('&lt;b&gt;a&lt;/b&gt;',
        Mobird.$('<h1/>').text('<b>a</b>').html())

      // now test with some existing DOM elements
      Mobird.$('#texttest3').text(undefined)
      t.assertEqual('', Mobird.$('#texttest3').text())

      t.assertEqual('Here is some text', Mobird.$('div.texttest').text())
      t.assertEqual('And some more', Mobird.$('#texttest2').text())

      Mobird.$('div.texttest').text("Let's set it")
      t.assertEqual("Let's set it", Mobird.$('#texttest1').text())
      t.assertEqual("Let's set it", Mobird.$('#texttest2').text())

      Mobird.$('#texttest2').text('')
      t.assertEqual("Let's set it", Mobird.$('div.texttest').text())
      t.assertEqual('', Mobird.$('#texttest2').text())
    },

    testTextWithFunction: function(t) {
      var el = Mobird.$('<div><span>hello</span> <span></span> <span>world</span> <span>again</span></div>'),
        els = el.find('span')

      els.text(function(idx, oldText){
        if (idx > 2) return null
        if (oldText) return oldText.toUpperCase() + ' ' + idx
      })

      t.assertEqual('HELLO 0', els[0].textContent)
      t.assertEqual('', els[1].textContent)
      t.assertEqual('WORLD 2', els[2].textContent)
      t.assertEqual('', els[3].textContent)
    },

    testEmpty: function(t) {
      Mobird.$('#empty_test').empty()

      t.assertEqual(document.getElementById('empty_1'), null)
      t.assertEqual(document.getElementById('empty_2'), null)
      t.assertEqual(document.getElementById('empty_3'), null)
      t.assertEqual(document.getElementById('empty_4'), null)
    },

    testAttr: function(t){
      var els = Mobird.$('#attr_1, #attr_2')

      t.assertEqual('someId1', els.attr("data-id"))
      t.assertEqual('someName1', els.attr("data-name"))

      els.attr("data-id","someOtherId")
      els.attr("data-name","someOtherName")

      t.assertEqual('someOtherId', els.attr("data-id"))
      t.assertEqual('someOtherName', els.attr("data-name"))
      t.assertEqual('someOtherId', Mobird.$('#attr_2').attr('data-id'))

      t.assertNull(els.attr("nonExistentAttribute"))

      els.attr("data-id", false)
      t.assertEqual("false", els.attr("data-id"))

      els.attr("data-id", 0)
      t.assertEqual("0", els.attr("data-id"))

      els.attr({ 'data-id': 'id', 'data-name': 'name' })
      t.assertEqual('id', els.attr("data-id"))
      t.assertEqual('name', els.attr("data-name"))
      t.assertEqual('id', Mobird.$('#attr_2').attr('data-id'))

      els.attr('data-id', function(idx,oldvalue){
        return idx+oldvalue
      })
      t.assertEqual('0id', els.attr('data-id'))
      t.assertEqual('1id', Mobird.$('#attr_2').attr('data-id'))
    },

    testAttrSetterErase: function(t){
      var el = Mobird.$('<div data-name="foo">')
      t.assertIdentical(el, el.attr('data-name', undefined), 'setter should return self')
      t.assertNull(el.get(0).getAttribute('data-name'), 'attribute should be erased')
      t.assertNull(el.attr('data-name'), 'attr should reflect erased attribute')
    },

    testProp: function(t){
      var label = Mobird.$('#prop_test1')
      var input = Mobird.$('#prop_test2')
      var table = Mobird.$('#prop_test3')
      var td1 = Mobird.$('#prop_test4')
      var td2 = Mobird.$('#prop_test5')
      var img = Mobird.$('#prop_test6')
      var div = Mobird.$('#prop_test7')

      t.assertEqual(input.prop('tabindex'), -1)
      t.assertEqual(input.prop('readonly'), true)
      t.assertEqual(label.prop('for'), 'prop_test2')
      t.assertEqual(input.prop('class'), 'propTest')
      t.assertEqual(input.prop('maxlength'), 10)
      t.assertEqual(table.prop('cellspacing'), 10)
      t.assertEqual(table.prop('cellpadding'), 5)
      t.assertEqual(td1.prop('rowspan'), 2)
      t.assertEqual(td2.prop('colspan'), 2)
      t.assertEqual(img.prop('usemap'), '#imgMap')
      t.assertEqual(div.prop('contenteditable'), 'true')
    },

    testPropSetterErase: function(t){
      var input = Mobird.$('<input readonly>')
      t.assertIdentical(input, input.prop('readonly', false))
      t.assertFalse(input.prop('readonly'))

      input.get(0)._foo = 'bar'
      t.assertIdentical(input, input.prop('_foo', undefined))
      t.assertUndefined(input.get(0)._foo, 'custom property should be cleared')
      t.assertUndefined(input.prop('_foo'), 'prop should reflect cleared property')
    },

    testAttrNoElement: function(t){
      t.assertUndefined(Mobird.$().attr('yo'))
      t.assertUndefined(Mobird.$(document.createTextNode('')).attr('yo'))
      t.assertUndefined(Mobird.$(document.createComment('')).attr('yo'))

      var els = Mobird.$('<b></b> <i></i>').attr('id', function(i){ return this.nodeName + i })
      t.assertEqual('B0', els.eq(0).attr('id'))
      t.assertEqual('I2', els.eq(2).attr('id'))
      t.assertUndefined(els.eq(1).attr('id'))
    },

    testAttrEmpty: function(t){
      var el = Mobird.$('#data_attr')
      t.assertIdentical('', el.attr('data-empty'))
    },

    testAttrOnTextInputField: function(t) {
      var inputs, values

      // HTML is set here because IE does not reset
      // values of input fields on page reload
      document.getElementById('attr_with_text_input').innerHTML =
        '<input value="Default input">'+
        '<input type="text" value="Text input">'+
        '<input type="email" value="Email input">'+
        '<input type="search" value="Search input">'

      inputs = Mobird.$('#attr_with_text_input input')

      values = Mobird.$.map(inputs, function(i){ return Mobird.$(i).attr('value') })
      t.assertEqual('Default input, Text input, Email input, Search input', values.join(', '))

      // Only .attr('value', v) changes .attr('value')
      // rather than .val(v)
      inputs.attr('value', function(i, value){ return value.replace('input', 'changed') })

      values = Mobird.$.map(inputs, function(i){ return Mobird.$(i).attr('value') })
      t.assertEqual('Default changed, Text changed, Email changed, Search changed', values.join(', '))
    },

    testAttrNullUnset: function(t){
      var el = Mobird.$('<div id=hi>')
      el.attr('id', null)
      t.assertIdentical('', el.attr('id'))

      el.attr('id', 'hello')
      el.attr({ id:null })
      t.assertIdentical('', el.attr('id'))
    },

    testRemoveAttr: function(t) {
      var el = Mobird.$('#attr_remove')
      t.assertEqual('boom', el.attr('data-name'))
      el.removeAttr('data-name')
      t.assertNull(el.attr('data-name'))
    },

    testRemoveMultipleAttr: function(t) {
      var el = Mobird.$('#attr_remove_multi')
      t.assertEqual('someId1', el.attr('data-id'))
      t.assertEqual('someName1', el.attr('data-name'))

      el.removeAttr('data-id data-name')
      t.assertNull(el.attr('data-id'))
      t.assertNull(el.attr('data-name'))
    },

    testRemoveAttrNoElement: function(t){
      t.assert(Mobird.$().removeAttr('rel'))
      t.assert(Mobird.$(document.createTextNode('')).removeAttr('rel'))

      var els = Mobird.$('<b rel=up></b> <i rel=next></i>')
      t.assertIdentical(els, els.removeAttr('rel'))
      t.assertNull(els.eq(0).attr('rel'))
      t.assertUndefined(els.eq(1).attr('rel'))
      t.assertNull(els.eq(2).attr('rel'))
    },

    testData: function(t) {
      var el = Mobird.$('#data_attr')
      // existing attribute
      t.assertEqual('bar', el.data('foo'))
      t.assertEqual('baz', el.data('foo-bar'))
      t.assertEqual('baz', el.data('fooBar'))

      // camelCase
      el.data('fooBar', 'bam')
      t.assertEqual('bam', el.data('fooBar'))
      t.assertEqual('bam', el.data('foo-bar'))

      // new attribute
      el.data('fun', 'hello')
      //t.assertEqual('hello', el.attr('data-fun'))
      t.assertEqual('hello', el.data('fun'))

      // blank values
      t.assertIdentical('', el.data('empty'))
      t.assertUndefined(el.data('does-not-exist'))
    },

    testDataSetterErase: function(t) {
      var el = Mobird.$('<div data-name="foo">')
      // t.assertIdentical(el, el.data('name', undefined))
      //t.assertUndefined(el.data('name'))
    },

    testDataNumberType: function(t){
      var el = Mobird.$('<div data-num=42 />')
      t.assertIdentical(42, el.data('num'))

      t.assertIdentical(42.5,
        Mobird.$('<div data-float=42.5 />').data('float'))

      t.assertIdentical("08",
        Mobird.$('<div data-notnum=08 />').data('notnum'))

      t.assertIdentical("5903509451651483504",
        Mobird.$('<div data-bignum="5903509451651483504" />').data('bignum'))
    },

    testDataBooleanType: function(t){
      var el = Mobird.$('<div data-true=true data-false=false />')
      t.assertTrue(el.data('true'))
      t.assertFalse(el.data('false'))
    },

    testDataNullType: function(t){
      var el = Mobird.$('<div data-nil=null />')
      t.assertNull(el.data('nil'))
    },

    testDataJsonType: function(t){
      var el = Mobird.$('<div data-json=\'["one", "two"]\' data-invalid=\'[boom]\' />')
      var json = el.data('json')
      t.assertEqual(2, json.length)
      t.assertEqual("one", json[0])
      t.assertEqual("two", json[1])
      t.assertEqual('[boom]', el.data('invalid'))
    },

    testVal: function(t) {
      var input = Mobird.$('#attr_val')

      // some browsers like IE don't reset input values on reload
      // which messes up repeated test runs, so set the start value
      // directly via the DOM API
      document.getElementById('attr_val').value = 'Hello World'

      t.assertEqual('Hello World', input.val())

      input.val(undefined);
      t.assertEqual('undefined', input.val());

      input.val('')
      t.assertEqual('', input.val())

      input.get(0).value = 'Hello again'
      t.assertEqual('Hello again', input.val())

      input.val(function(i, val){ return val.replace('Hello', 'Bye') })
      t.assertEqual('Bye again', input.val())

      t.assertUndefined(Mobird.$('non-existent').val())

      var multiple =
        Mobird.$('<select multiple><option selected>1</option><option value=2 selected="selected">a</option><option>3</option></select>')
      t.assertEqualCollection(['1','2'], multiple.val())

      // FIXME
      // This is the "approved" way of de-selecting an option
      // Unfortunately, this fails on Chrome 29 for Android
      multiple.find('option')[0].selected = false

      t.assertEqualCollection(['2'], multiple.val(),
        "Expected val() to reflect changes to selected options in a <select multiple> element")
    },

    testValVsValueAttr: function(t) {
      var input

      input = Mobird.$('<input type="text" value="Original">')
      input.val('By .val(v)')
      t.assertEqual('Original', input.attr('value'))
      t.assertEqual('By .val(v)', input.val())

      input.attr('value', 'By .attr("value", v)')
      t.assertEqual('By .attr("value", v)', input.attr('value'))
      t.assertEqual('By .val(v)', input.val())

      // .attr('value', v) will change both
      // without applying .val(v) first
      input = Mobird.$('<input type="text" value="Original">')
      input.attr('value', 'By .attr("value", v)')
      t.assertEqual('By .attr("value", v)', input.attr('value'))
      t.assertEqual('By .attr("value", v)', input.val())
    },

    testChaining: function(t){
      t.assert(document.getElementById('nay').innerHTML == "nay")
      Mobird.$('span.nay').css('color', 'red').html('test')
      t.assert(document.getElementById('nay').innerHTML == "test")
    },

    testCachingForLater: function(t){
      var one = Mobird.$('div')
      var two = Mobird.$('span')

      t.assert(one.get(0) !== two.get(0))
    },

    testPlugins: function(t){
      var el = Mobird.$('#some_element').get(0)

      Mobird.$.fn.plugin = function(){
        return this.each(function(){ this.innerHTML = 'plugin!' })
      }
      Mobird.$('#some_element').plugin()
      t.assertEqual('plugin!', el.innerHTML)

      // test if existing Zepto objects receive new plugins
      if ('__proto__' in {}) {
        var $some_element = Mobird.$('#some_element')
        Mobird.$.fn.anotherplugin = function(){
          return this.each(function(){ this.innerHTML = 'anotherplugin!' })
        }
        t.assert(typeof $some_element.anotherplugin == 'function')
        $some_element.anotherplugin()
        t.assertEqual('anotherplugin!', el.innerHTML)
      } else
        window.console && console.warn &&
        console.warn("Browser doesn't support __proto__, skipping test of live extension of existing Zepto objects with plugins")
    },

    testAppendPrependBeforeAfter: function(t){
      Mobird.$('#beforeafter').append('append')
      Mobird.$('#beforeafter').prepend('prepend')
      Mobird.$('#beforeafter').before('before')
      Mobird.$('#beforeafter').after('after')

      t.assertEqual('before<div id="beforeafter">prependappend</div>after', Mobird.$('#beforeafter_container').html())

      //testing with TextNode as parameter
      Mobird.$('#beforeafter_container').html('<div id="beforeafter"></div>')

      function text(contents){
        return document.createTextNode(contents)
      }

      Mobird.$('#beforeafter').append(text('append'))
      Mobird.$('#beforeafter').prepend(text('prepend'))
      Mobird.$('#beforeafter').before(text('before'))
      Mobird.$('#beforeafter').after(text('after'))

      t.assertEqual('before<div id="beforeafter">prependappend</div>after', Mobird.$('#beforeafter_container').html())

      Mobird.$('#beforeafter_container').html('<div id="beforeafter"></div>')

      function div(contents){
        var el = document.createElement('div')
        el.innerHTML = contents
        return el
      }

      Mobird.$('#beforeafter').append(div('append'))
      Mobird.$('#beforeafter').prepend(div('prepend'))
      Mobird.$('#beforeafter').before(div('before'))
      Mobird.$('#beforeafter').after(div('after'))

      t.assertEqual(
        '<div>before</div><div id="beforeafter"><div>prepend</div>'+
        '<div>append</div></div><div>after</div>',
        Mobird.$('#beforeafter_container').html()
      )

      //testing with Zepto object as parameter
      Mobird.$('#beforeafter_container').html('<div id="beforeafter"></div>')

      Mobird.$('#beforeafter').append(Mobird.$(div('append')))
      Mobird.$('#beforeafter').prepend(Mobird.$(div('prepend')))
      Mobird.$('#beforeafter').before(Mobird.$(div('before')))
      Mobird.$('#beforeafter').after(Mobird.$(div('after')))

      t.assertEqual(
        '<div>before</div><div id="beforeafter"><div>prepend</div>'+
        '<div>append</div></div><div>after</div>',
        Mobird.$('#beforeafter_container').html()
      )

      //testing with a query object of more than one element as parameter
      Mobird.$(document.body).append('<div class="append">append1</div><div class="append">append2</div>')
      Mobird.$(document.body).append('<div class="prepend">prepend1</div><div class="prepend">prepend2</div>')
      Mobird.$(document.body).append('<div class="before">before1</div><div class="before">before2</div>')
      Mobird.$(document.body).append('<div class="after">after1</div><div class="after">after2</div>')

      Mobird.$('#beforeafter_container').html('<div id="beforeafter"></div>')

      Mobird.$('#beforeafter').append(Mobird.$('.append'))
      Mobird.$('#beforeafter').prepend(Mobird.$('.prepend'))
      Mobird.$('#beforeafter').before(Mobird.$('.before'))
      Mobird.$('#beforeafter').after(Mobird.$('.after'))

      t.assertEqual(
        '<div class="before">before1</div><div class="before">before2</div><div id="beforeafter"><div class="prepend">prepend1</div><div class="prepend">prepend2</div>'+
        '<div class="append">append1</div><div class="append">append2</div></div><div class="after">after1</div><div class="after">after2</div>',
        Mobird.$('#beforeafter_container').html()
      )

      //

      var helloWorlds = [], appendContainer1 = Mobird.$('<div> <div>Hello</div> <div>Hello</div> </div>'),
        helloDivs = appendContainer1.find('div')

      helloDivs.append(' world!')
      helloDivs.each(function() { helloWorlds.push(Mobird.$(this).text()) })
      t.assertEqual('Hello world!,Hello world!', helloWorlds.join(','))

      //

      var spans = [], appendContainer2 = Mobird.$('<div> <div></div> <div></div> </div>'),
        appendDivs = appendContainer2.find('div')

      appendDivs.append(Mobird.$('<span>Test</span>'))
      appendDivs.each(function() { spans.push(Mobird.$(this).html()) })
      t.assertEqual('<span>Test</span>,<span>Test</span>', spans.join(','))
    },

    testAppendNull: function(t){
      var el = Mobird.$(document.body)
      t.assertIdentical(el, el.append(null))
    },

    testBeforeAfterFragment: function(t){
      var fragment = Mobird.$('<div class=fragment />')
      fragment.before('before').after('after')
      t.assertLength(1, fragment)
      t.assert(fragment.hasClass('fragment'))
    },

    testAppendMultipleArguments: function(t){
      var el = Mobird.$('<div><span>original</span></div>')
      el.append(
        Mobird.$('<b>one</b>').get(0),
        Mobird.$('<b>two</b><b>three</b>').get(),
        Mobird.$('<b>four</b><b>five</b>'),
        '<b>six</b>'
      )
      t.assertEqual('original one two three four five six',
        Mobird.$.map(el.children(), function(c){ return Mobird.$(c).text() }).join(' '))
    },

    testAppendToPrependTo: function(t){
      // testing with Zepto object
      function div(contents){
        var el = document.createElement('div')
        el.innerHTML = contents
        return el
      }

      var ap = Mobird.$(div('appendto'))
      var pr = Mobird.$(div('prependto'))

      var ap2 = ap.appendTo(Mobird.$('#appendtoprependto'))
      var pr2 = pr.prependTo(Mobird.$('#appendtoprependto'))

      // the object returned is the correct one for method chaining
      t.assertSame(ap, ap2)
      t.assertSame(pr, pr2)

      t.assertEqual(
        '<div id="appendtoprependto"><div>prependto</div>'+
        '<div>appendto</div></div>',
        Mobird.$('#appendtoprependto_container').html()
      )

      // query object with more than one element
      Mobird.$(document.body).append('<div class="appendto">appendto1</div><div class="appendto">appendto2</div>')
      Mobird.$(document.body).append('<div class="prependto">prependto1</div><div class="prependto">prependto2</div>')

      // selector

      // Note that on IE resetting the parent element to be empty will
      // cause inserted elements to be emptied out, so we have to re-create
      // them. This is the same behavior as on jQuery.
      // (Other browsers don't exhibit this problem.)
      ap = Mobird.$(div('appendto'))
      pr = Mobird.$(div('prependto'))

      Mobird.$('#appendtoprependto_container').html('<div id="appendtoprependto"></div>')
      ap.appendTo('#appendtoprependto')
      pr.prependTo('#appendtoprependto')
      t.assertEqual(
        '<div id="appendtoprependto"><div>prependto</div>'+
        '<div>appendto</div></div>',
        Mobird.$('#appendtoprependto_container').html()
      )

      // reset test elements
      ap = Mobird.$(div('appendto'))
      pr = Mobird.$(div('prependto'))
      Mobird.$('#appendtoprependto_container').html('<div id="appendtoprependto"></div>')
      Mobird.$('.appendto').appendTo(Mobird.$('#appendtoprependto'))
      Mobird.$('.prependto').prependTo(Mobird.$('#appendtoprependto'))

      t.assertEqual(
        '<div id="appendtoprependto"><div class="prependto">prependto1</div><div class="prependto">prependto2</div><div class="appendto">appendto1</div><div class="appendto">appendto2</div></div>',
        Mobird.$('#appendtoprependto_container').html()
      )
    },

    testInsertBeforeInsertAfter: function(t){
      // testing with Zepto object
      function div(contents){
        var el = document.createElement('div')
        el.innerHTML = contents
        return el
      }

      var ib = Mobird.$(div('insertbefore'))
      var ia = Mobird.$(div('insertafter'))

      var ibia = Mobird.$('#insertbeforeinsertafter')
      var ib2 = ib.insertBefore(ibia)
      var ia2 = ia.insertAfter(ibia)

      // test the object returned is correct for method chaining
      t.assertEqual(
        '<div>insertbefore</div><div id="insertbeforeinsertafter">'+
        '</div><div>insertafter</div>',
        Mobird.$('#insertbeforeinsertafter_container').html()
      )

      // testing with a query object of more than one element as parameter
      Mobird.$(document.body).append('<div class="insertbefore">insertbefore1</div><div class="insertbefore">insertbefore2</div>')
      Mobird.$(document.body).append('<div class="insertafter">insertafter1</div><div class="insertafter">insertafter2</div>')

      Mobird.$('#insertbeforeinsertafter_container').html('<div id="insertbeforeinsertafter"></div>')

      Mobird.$('.insertbefore').insertBefore(Mobird.$('#insertbeforeinsertafter'))
      Mobird.$('.insertafter').insertAfter(Mobird.$('#insertbeforeinsertafter'))

      t.assertEqual(
        '<div class="insertbefore">insertbefore1</div><div class="insertbefore">insertbefore2</div>'+
        '<div id="insertbeforeinsertafter"></div><div class="insertafter">insertafter1</div>'+
        '<div class="insertafter">insertafter2</div>',
        Mobird.$('#insertbeforeinsertafter_container').html()
      )

      // testing with a selector as parameter
      Mobird.$('#insertbeforeinsertafter_container').html('<div id="insertbeforeinsertafter"></div>')

      // reset test elements
      ib = Mobird.$(div('insertbefore'))
      ia = Mobird.$(div('insertafter'))
      ib.insertBefore('#insertbeforeinsertafter')
      ia.insertAfter('#insertbeforeinsertafter')

      t.assertEqual(
        '<div>insertbefore</div><div id="insertbeforeinsertafter">'+
        '</div><div>insertafter</div>',
        Mobird.$('#insertbeforeinsertafter_container').html()
      )
    },

    testAppendEval: function (t) {
      window.someGlobalVariable = 0
      try {
        Mobird.$('#fixtures').append(
          '<div><b id="newByAppend">Hi</b>' +
          '<\script>this.someGlobalVariable += Mobird.$("#newByAppend").size()<\/script></div>'
        )
        t.assertIdentical(1, window.someGlobalVariable)
      } finally {
        delete window.someGlobalVariable
      }
    },

    testNoEvalWithSrc: function (t) {
      try {
        window.someGlobalVariable = false
        Mobird.$('<\script src="remote.js">window.someGlobalVariable = true<\/script>').appendTo('body')
        t.assert(!window.someGlobalVariable, 'expected SCRIPT with src not to be evaled')
      } finally {
        delete window.someGlobalVariable
      }
    },

    testHtmlEval: function (t) {
      window.someGlobalVariable = 0
      try {
        Mobird.$('<div>').appendTo('#fixtures').html(
          '<div><b id="newByHtml">Hi</b>' +
          '<\script>this.someGlobalVariable += Mobird.$("#newByHtml").size()<\/script></div>'
        )
        t.assertIdentical(1, window.someGlobalVariable)
      } finally {
        delete window.someGlobalVariable
      }
    },

    testPrependEval: function (t) {
      window.someGlobalVariable = 0
      try {
        Mobird.$('<div>').appendTo('#fixtures').prepend(
          '<b id="newByPrepend">Hi</b>' +
          '<\script>this.someGlobalVariable += Mobird.$("#newByPrepend").size()<\/script>'
        )
        t.assertIdentical(1, window.someGlobalVariable)
      } finally {
        delete window.someGlobalVariable
      }
    },

    testAppendTemplateNonEval: function (t) {
      try {
        window.someGlobalVariable = true
        Mobird.$('<' + 'script type="text/template">window.someGlobalVariable = false</script' + '>').appendTo('body')
        t.assert(window.someGlobalVariable)

        window.someGlobalVariable = true
        Mobird.$('<' + 'script type="text/template">this.someGlobalVariable = false</script' + '>').appendTo('body')
        t.assert(window.someGlobalVariable)
      } finally {
        delete window.someGlobalVariable
      }
    },

    testHtmlTemplateNonEval: function (t) {
      try {
        window.someGlobalVariable = true
        Mobird.$('<div></div>').appendTo('body')
          .html('<' + 'script type="text/template">window.someGlobalVariable = false</script' + '>')
        t.assert(window.someGlobalVariable)
      } finally {
        delete window.someGlobalVariable
      }
    },

    testRemove: function(t) {
      var el = Mobird.$('<div>').appendTo(document.body)
      t.assertLength(1, el.parent())
      t.assertIdentical(el, el.remove())
      t.assertLength(0, el.parent())
      t.assertIdentical(el, el.remove())  //=> ensure an error isn't raised
    },

    testNotInDocumentNonEval: function (t) {
      try {
        window.someGlobalVariable = 0
        Mobird.$('<div></div>')
          .html('<\script>window.someGlobalVariable += 1<\/script>')
          .appendTo('body')
        t.assertIdentical(1, window.someGlobalVariable)
      } finally {
        delete window.someGlobalVariable
      }
    },

    testAddRemoveClass: function(t){
      var el = Mobird.$('#some_element').get(0)

      Mobird.$('#some_element').addClass('green')
      t.assertEqual('green', el.className)
      Mobird.$('#some_element').addClass('green')
      t.assertEqual('green', el.className)
      Mobird.$('#some_element').addClass('red')
      t.assertEqual('green red', el.className)
      Mobird.$('#some_element').addClass('blue red')
      t.assertEqual('green red blue', el.className)
      Mobird.$('#some_element').removeClass('green blue')
      t.assertEqual('red', el.className)

      Mobird.$('#some_element').attr('class', ' red green blue ')
      t.assertEqual(' red green blue ', el.className) // sanity check that WebKit doesn't change original input
      Mobird.$('#some_element').removeClass('green')
      t.assertEqual('red blue', el.className)

      //addClass with function argument
      Mobird.$('#some_element').addClass(function(idx,classes){
        //test the value of "this"
        t.assertEqualCollection(Mobird.$('#some_element'), Mobird.$(this))
        //test original classes are being passed
        t.assertEqual('red blue', this.className)
        return "green"
      })
      t.assertEqual('red blue green', el.className)

      // addClass with no argument
      t.assertEqualCollection(Mobird.$('#some_element'), Mobird.$('#some_element').addClass())
      t.assertEqual('red blue green', el.className)
      t.assertEqualCollection(Mobird.$('#some_element'), Mobird.$('#some_element').addClass(''))
      t.assertEqual('red blue green', el.className)

      //removeClass with function argument
      Mobird.$('#some_element').removeClass(function(idx,classes){
        //test the value of "this"
        t.assertEqualCollection(Mobird.$('#some_element'), Mobird.$(this))
        //test original classes are being passed
        t.assertEqual('red blue green', this.className)
        return "blue"
      })
      t.assertEqual('red green', el.className)

      Mobird.$('#some_element').removeClass()
      t.assertEqual('', el.className)
    },

    testWindowClasses: function(t){
      // check that window is agnostic to class related functions
      Mobird.$(window).removeClass('non-existing-class')
      t.refute('className' in window)
      Mobird.$(window).addClass('some-class')
      t.refute('className' in window)
      t.refute(Mobird.$(window).hasClass('some-class'))
      Mobird.$(window).toggleClass('some-class')
      t.refute('className' in window)
    },

    testHasClass: function(t){
      var el = Mobird.$('#some_element')
      el.addClass('green')

      t.assert(el.hasClass('green'))
      t.assert(!el.hasClass('orange'))

      el.addClass('orange')
      t.assert(el.hasClass('green'))
      t.assert(el.hasClass('orange'))

      el = Mobird.$(document.body)
      t.assert(!el.hasClass('orange'), "body shouldn't have the class")
      el = el.add('#some_element')
      t.assert(el.hasClass('orange'), "an element in collection has the class")

      t.assertFalse(el.hasClass())
      t.assertFalse(el.hasClass(''))
    },

    testHasClassEmpty: function(t){
      var z = Mobird.$('#doesnotexist')
      t.assertEqual(0, z.size())
      t.assertFalse(z.hasClass('a'))
    },

    testToggleClass: function(t){
      var el = Mobird.$('#toggle_element').removeClass()

      t.assertIdentical(el, el.toggleClass('green'))
      t.assertTrue(el.hasClass('green'))
      t.assertFalse(el.hasClass('orange'))

      el.toggleClass('orange')
      t.assertTrue(el.hasClass('green'))
      t.assertTrue(el.hasClass('orange'))

      el.toggleClass('green')
      t.assertFalse(el.hasClass('green'))
      t.assertTrue(el.hasClass('orange'))

      el.toggleClass('orange')
      t.assertFalse(el.hasClass('green'))
      t.assertFalse(el.hasClass('orange'))

      el.toggleClass('orange green')
      t.assertTrue(el.hasClass('orange'))
      t.assertTrue(el.hasClass('green'))

      el.toggleClass('orange green blue')
      t.assertFalse(el.hasClass('orange'))
      t.assertFalse(el.hasClass('green'))
      t.assertTrue(el.hasClass('blue'))

      el.removeClass()

      el.toggleClass('orange', false)
      t.assertFalse(el.hasClass('orange'))
      el.toggleClass('orange', false)
      t.assertFalse(el.hasClass('orange'))

      el.toggleClass('orange', true)
      t.assertTrue(el.hasClass('orange'))
      el.toggleClass('orange', true)
      t.assertTrue(el.hasClass('orange'))

      //function argument
      el.toggleClass(function(idx,classes){
        t.assertIdentical(el.get(0), this)
        //test original classes are being passed
        t.assertEqual('orange', this.className)
        return "brown"
      })
      t.assertTrue(el.hasClass('brown'))

      el.toggleClass(function(idx,classes){
        return "yellow"
      }, false)
      t.assertFalse(el.hasClass('yellow'))

      el.toggleClass(function(idx,classes){
        return "yellow"
      }, true)
      t.assert(el.hasClass('yellow'))

      // no/empty argument
      t.assertIdentical(el, el.toggleClass())
      t.assertEqual('orange brown yellow', el.get(0).className)
      t.assertIdentical(el, el.toggleClass(''))
      t.assertEqual('orange brown yellow', el.get(0).className)
    },

    testClassSVG: function(t){
      var svg = Mobird.$('svg')
      t.assert(!svg.hasClass('foo'))
      svg.addClass('foo bar')
      t.assert(svg.hasClass('foo'))
      t.assert(svg.hasClass('bar'))
      svg.removeClass('foo')
      t.assert(!svg.hasClass('foo'))
      t.assert(svg.hasClass('bar'))
      svg.toggleClass('bar')
      t.assert(!svg.hasClass('foo'))
      t.assert(!svg.hasClass('bar'))
    },

    testIndex: function(t){
      t.assertEqual(Mobird.$("p > span").index("#nay"), 2)
      t.assertEqual(Mobird.$("p > span").index(".yay"), 0)
      t.assertEqual(Mobird.$("span").index("span"), 0)
      t.assertEqual(Mobird.$("span").index("boo"), -1)

      t.assertEqual(Mobird.$('#index_test > *').eq(-1).index(), 1)
    },

    testBoolAttr: function (t) {
      t.assertEqual(Mobird.$('#BooleanInput').attr('required'), true)
      t.assertEqual(Mobird.$('#BooleanInput').attr('non_existant_attr'), undefined)
    },

    testDocumentReady: function (t) {
      // Check that if document is already loaded, ready() immediately executes callback
      var arg1, arg2, arg3, arg4, fired = false
      Mobird.$(function (Z1) {
        arg1 = Z1
        Mobird.$(document).ready(function (Z2) {
          arg2 = Z2
          Mobird.$(document).on('ready', function (Z3) {
            arg3 = Z3
            Mobird.$(document).on('foo ready bar', function (Z4) {
              arg4 = Z4
              fired = true
            })
          })
        })
      })
      t.assertTrue(fired)
      t.assertIdentical(Mobird.$, arg1)
      t.assertIdentical(Mobird.$, arg2)
      t.assertIdentical(Mobird.$, arg3)
      t.assertIdentical(Mobird.$, arg4)
    },

    testSlice: function (t) {
      var $els = Mobird.$("#slice_test div")
      t.assertEqual($els.slice().length, 3)
      t.assertEqual(typeof $els.slice().ready, 'function')
      t.assertEqual($els.slice(-1)[0].className, 'slice3')
    },

    testScrollTop: function(t) {
      var $window = Mobird.$(window), $body = Mobird.$(document.body)
      t.assert($window.scrollTop() >= 0)
      t.assert($body.scrollTop() >= 0)

      t.assertIdentical($window.scrollTop(20), $window)
      t.assertIdentical($body.scrollTop(20),   $body)
    },

    testScrollLeft: function(t) {
      var $window = Mobird.$(window), $body = Mobird.$(document.body)
      t.assert($window.scrollLeft() >= 0)
      t.assert($body.scrollLeft() >= 0)

      t.assertIdentical($window.scrollLeft(20), $window)
      t.assertIdentical($body.scrollLeft(20),   $body)
    },

    testSort: function(t){
      var els = Mobird.$(['eight', 'nine', 'ten', 'eleven'])
      var result = els.sort(function(a,b){ return b.length > a.length ? -1 : 1 })
      t.assertIdentical(els, result)
      t.assertEqual(4, result.size())
      t.assertEqualCollection(['ten', 'nine', 'eight', 'eleven'], result)
    }
  })

  Evidence('EventTest', {
    tearDown: function(){
      Mobird.$('*').unbind()
    },

    testBind: function(t){
      var counter = 0
      Mobird.$(document.body).bind('click', function(){ counter++ })
      click(Mobird.$('#some_element').get(0))
      t.assertEqual(1, counter)

      counter = 0
      Mobird.$('#some_element').bind('click mousedown', function(){ counter++ })
      click(Mobird.$('#some_element').get(0))
      mousedown(Mobird.$('#some_element').get(0))
      t.assertEqual(3, counter) // 1 = body click, 2 = element click, 3 = element mousedown
    },

    testBindWithObject: function(t){
      var counter = 0, keyCounter = 0, el = Mobird.$('#some_element'),
        eventData = {
          click: function(){ counter++ },
          keypress: function(){ keyCounter++ }
        }

      Mobird.$(document.body).bind(eventData)

      el.trigger('click')
      el.trigger('click')
      t.assertEqual(2, counter)
      el.trigger('keypress')
      t.assertEqual(1, keyCounter)

      Mobird.$(document.body).unbind({ keypress: eventData.keypress })

      el.trigger('click')
      t.assertEqual(3, counter)
      el.trigger('keypress')
      t.assertEqual(1, keyCounter)
    },

    testBindContext: function(t){
      var context, handler = function(){
        context = Mobird.$(this)
      }
      Mobird.$('#empty_test').bind("click",handler)
      Mobird.$('#empty_test').bind("mousedown",handler)
      click(Mobird.$('#empty_test').get(0))
      t.assertEqualCollection(Mobird.$('#empty_test'), context)
      context = null
      mousedown(Mobird.$('#empty_test').get(0))
      t.assertEqualCollection(Mobird.$('#empty_test'), context)
    },

    testBindWithCustomArgument: function(t) {
      var data, numArgs, counter = 0,
        handler = function(ev, arg) {
          numArgs = arguments.length,
            data = ev.data
          counter = arg.counter
        }

      Mobird.$('#some_element').bind('custom', handler)
      Mobird.$('#some_element').trigger('custom', { counter: 10 })
      t.assertEqual(10, counter)
      t.assertEqual(2, numArgs)
      t.assertUndefined(data)
    },

    testBindPreventDefault: function (t) {
      var link = Mobird.$('<a href="#"></a>'),
        prevented = false

      link
        .appendTo('body')
        .bind('click', function () {
          return false
        })
        .bind('click', function (e) {
          prevented = e.isDefaultPrevented()
        })
        .trigger('click')

      t.assert(prevented)
    },

    testCreateEventObject: function(t){
      var e = Mobird.$.Event('custom')
      t.assertEqual('custom', e.type)

      var e2 = new Mobird.$.Event('custom')
      t.assertEqual('custom', e2.type)

      var e3 = Mobird.$.Event('custom', {customKey: 'customValue'})
      t.assertEqual('custom', e3.type)
      t.assertEqual('customValue', e3.customKey)

      var e4 = Mobird.$.Event('custom', {bubbles: false})
      t.assertFalse(e4.bubbles)

      var e5 = Mobird.$.Event({ type: 'keyup', keyCode: 40 })
      t.assertEqual('keyup', e5.type)
      t.assertEqual(40, e5.keyCode)
    },

    testTriggerObject: function(t){
      var el = Mobird.$('#some_element'),
        eventType, eventCode

      el.on('keyup', function(e){
        eventType = e.type
        eventCode = e.keyCode
      })
      el.trigger({ type: 'keyup', keyCode: 40 })

      t.assertEqual('keyup', eventType)
      t.assertEqual(40, eventCode)
    },

    testTriggerEventObject: function(t){
      var data, counter = 0,
        customEventKey = 0

      var handler = function(ev,customData) {
        data = ev.data
        counter = customData.counter
        customEventKey = ev.customKey
      }

      var customEventObject = Mobird.$.Event('custom', { customKey: 20 })

      Mobird.$('#some_element').bind('custom', handler)
      Mobird.$('#some_element').trigger(customEventObject, { counter: 10 })

      t.assertEqual(10, counter)
      t.assertEqual(20, customEventKey)
      t.assertUndefined(data)
    },

    testTriggerEventCancelled: function(t){
      var event = Mobird.$.Event('custom'),
        element = Mobird.$('<div/>'),
        isDefaultPrevented = false

      t.refute(event.isDefaultPrevented())

      element.bind('custom', function(e){
        e.preventDefault()
        isDefaultPrevented = e.isDefaultPrevented()
      })

      element.trigger(event)

      t.assertTrue(event.isDefaultPrevented())
      t.assertTrue(isDefaultPrevented)
    },

    testTriggerHandler: function(t){
      t.assertUndefined(Mobird.$('doesnotexist').triggerHandler('submit'))

      var form = Mobird.$('#trigger_handler form').get(0)
      Mobird.$('#trigger_handler').bind('submit', function(e) {
        t.fail("triggerHandler shouldn't bubble")
      })

      var executed = []
      Mobird.$(form).bind('submit', function(e) {
        executed.push("1")
        t.assertEqual(form, e.target)
        return 1
      })
      Mobird.$(form).bind('submit', function(e) {
        executed.push("2")
        t.assertEqual(form, e.target)
        e.stopImmediatePropagation()
        return 2
      })
      Mobird.$(form).bind('submit', function(e) {
        t.fail("triggerHandler shouldn't continue after stopImmediatePropagation")
      })
      t.assertIdentical(2, Mobird.$(form).triggerHandler('submit'))
      t.assertEqual('1 2', executed.join(' '))
    },

    testUnbind: function(t){
      var counter = 0, el = Mobird.$('#another_element').get(0)
      var handler = function(){ counter++ }
      Mobird.$('#another_element').bind('click mousedown', handler)
      click(el)
      mousedown(el)
      t.assertEqual(2, counter)

      Mobird.$('#another_element').unbind('click', handler)
      click(el)
      t.assertEqual(2, counter)
      mousedown(el)
      t.assertEqual(3, counter)

      Mobird.$('#another_element').unbind('mousedown')
      mousedown(el)
      t.assertEqual(3, counter)

      Mobird.$('#another_element').bind('click mousedown', handler)
      click(el)
      mousedown(el)
      t.assertEqual(5, counter)

      Mobird.$('#another_element').unbind()
      click(el)
      mousedown(el)
      t.assertEqual(5, counter)
    },

    testUnbindWithNamespace: function(t){
      var count = 0
      Mobird.$("#namespace_test").bind("click.bar", function() { count++ })
      Mobird.$("#namespace_test").bind("click.foo", function() { count++ })
      Mobird.$("#namespace_test").bind("mousedown.foo.bar", function() { count++ })

      Mobird.$("#namespace_test").trigger("click")
      t.assertEqual(2, count)

      Mobird.$("#namespace_test").unbind("click.baz")
      Mobird.$("#namespace_test").trigger("click")
      t.assertEqual(4, count)

      Mobird.$("#namespace_test").unbind("click.foo")
      Mobird.$("#namespace_test").trigger("click")
      t.assertEqual(5, count)

      Mobird.$("#namespace_test").trigger("mousedown")
      t.assertEqual(6, count)

      Mobird.$("#namespace_test").unbind(".bar")
      Mobird.$("#namespace_test").trigger("click").trigger("mousedown")
      t.assertEqual(6, count)
    },

    testDelegate: function(t){
      var counter = 0, pcounter = 0
      Mobird.$(document.body).delegate('#some_element', 'click', function(){ counter++ })
      Mobird.$('p').delegate('span.yay', 'click', function(){ counter++ })
      Mobird.$(document.body).delegate('p', 'click', function(){ pcounter++ })

      click(Mobird.$('#some_element').get(0))
      t.assertEqual(1, counter)

      click(Mobird.$('span.yay').get(0))
      t.assertEqual(2, counter)

      click(Mobird.$('span.nay').get(0))
      t.assertEqual(2, counter)

      click(Mobird.$('p').get(0))
      t.assertEqual(3, pcounter)
    },

    testDelegateBlurFocus: function(t) {
      var counter = 0
      Mobird.$('#delegate_blur_test').delegate('input', 'blur', function(){ counter++ })

      Mobird.$('#delegate_blur_test').find('input').focus()
      Mobird.$('#delegate_blur_test').find('input').blur()
      t.assertEqual(1, counter)

      Mobird.$('#delegate_blur_test').find('input').focus()
      Mobird.$('#delegate_blur_test').find('input').blur()
      t.assertEqual(2, counter)

      Mobird.$('#delegate_focus_test').delegate('input', 'focus', function(){ counter++ })

      Mobird.$('#delegate_focus_test').find('input').focus()
      Mobird.$('#delegate_focus_test').find('input').blur()
      t.assertEqual(3, counter)

      Mobird.$('#delegate_focus_test').find('input').focus()
      Mobird.$('#delegate_focus_test').find('input').blur()
      t.assertEqual(4, counter)
    },

    testDelegateNamespacedBlurFocus: function(t) {
      var counter = 0
      Mobird.$('#delegate_blur_test').delegate('input', 'blur.namespace_test', function(){ counter++ })

      Mobird.$('#delegate_blur_test').find('input').focus()
      Mobird.$('#delegate_blur_test').find('input').blur()
      t.assertEqual(1, counter)

      Mobird.$('#delegate_blur_test').find('input').focus()
      Mobird.$('#delegate_blur_test').find('input').blur()
      t.assertEqual(2, counter)

      Mobird.$('#delegate_focus_test').delegate('input', 'focus.namespace_test', function(){ counter++ })

      Mobird.$('#delegate_focus_test').find('input').focus()
      Mobird.$('#delegate_focus_test').find('input').blur()
      t.assertEqual(3, counter)

      Mobird.$('#delegate_focus_test').find('input').focus()
      Mobird.$('#delegate_focus_test').find('input').blur()
      t.assertEqual(4, counter)
    },

    testUndelegateNamespacedBlurFocus: function(t) {
      var el, counter = 0

      el = Mobird.$('#delegate_blur_test')

      el.delegate('input', 'blur.test', function(){ counter++ })
      el.find('input').focus().blur()
      t.assertEqual(1, counter, 'expected handler to be triggered')

      el.undelegate('input', '.test')
      el.find('input').focus().blur()
      t.assertEqual(1, counter, 'expected handler to unbind')

      el = Mobird.$('#delegate_focus_test')

      el.delegate('input', 'focus.test', function(){ counter++ })
      el.find('input').focus().blur()
      t.assertEqual(2, counter, 'expected handler to be triggered')

      el.undelegate('input', '.test')
      el.find('input').focus().blur()
      t.assertEqual(2, counter, 'expected handler to unbind')
    },

    testDelegateReturnFalse: function(t){
      Mobird.$(document.body).delegate('#link_that_will_be_prevented', 'click', function(){
        return false
      })

      var event = Mobird.$.Event('click')
      Mobird.$('#link_that_will_be_prevented').trigger(event)

      t.assertTrue(event.isDefaultPrevented())

      t.pause()
      setTimeout(function(){
        t.resume(function(){
          var text = Mobird.$('#link_target_iframe')[0].contentDocument.body.textContent
          t.assert(!text.match(/Hello from iframe/))
        })
      }, 500)
    },

    testDelegateReturnValueShouldntPreventDefault: function(t){
      Mobird.$(document.body).delegate('#link_that_will_be_prevented', 'click', function(){
      })

      var event = Mobird.$.Event('click')
      Mobird.$('#link_that_will_be_prevented').trigger(event)

      t.assertFalse(event.isDefaultPrevented())

      t.pause()
      setTimeout(function(){
        t.resume(function(){
          var text = Mobird.$('#link_target_iframe')[0].contentDocument.body.textContent
          t.assert(text.match(/Hello from iframe/))
        })
      }, 500)
    },

    testDelegateWithObject: function(t){
      var counter = 0, received, el = Mobird.$('p').first(),
        eventData = {
          click: function(){ counter++ },
          custom: function(e, arg){ received = arg }
        }

      Mobird.$(document.body).delegate('p', eventData)

      el.trigger('click')
      t.assertEqual(1, counter)
      el.trigger('click')
      t.assertEqual(2, counter)
      el.trigger('custom', 'boo')
      t.assertEqual('boo', received)

      Mobird.$(document.body).undelegate('p', {custom: eventData.custom})

      el.trigger('click')
      t.assertEqual(3, counter)
      el.trigger('custom', 'bam')
      t.assertEqual('boo', received)
    },

    testDelegateWithCustomArgument: function(t) {
      var received
      Mobird.$(document).delegate('#some_element', 'custom', function(e, arg, more){ received = arg + more })
      Mobird.$('p').delegate('span.yay', 'custom', function(e, arg){ received = arg })
      Mobird.$(document).delegate('p', 'custom', function(e, arg){ received = arg })

      Mobird.$('#some_element').trigger('custom', 'one')
      t.assertEqual('oneundefined', received)
      Mobird.$('#some_element').trigger('custom', ['one', 'two'])
      t.assertEqual('onetwo', received)

      Mobird.$('span.yay').trigger('custom', 'boom')
      t.assertEqual('boom', received)
      Mobird.$('span.yay').trigger('custom', ['bam', 'boom'])
      t.assertEqual('bam', received)

      Mobird.$('span.nay').trigger('custom', 'noes')
      t.assertEqual('noes', received)

      Mobird.$('p').first().trigger('custom', 'para')
      t.assertEqual('para', received)
    },

    testDelegateEventProxy: function(t){
      var content
      Mobird.$('div#delegate_test').delegate('span.second-level', 'click', function(e){
        t.assertEqual(Mobird.$('span.second-level').get(0), this)
        t.assertEqual(Mobird.$('span.second-level').get(0), e.currentTarget)
        t.refuteEqual(Mobird.$('span.second-level').get(0), e.originalEvent.currentTarget)
        t.assertEqual(Mobird.$('div#delegate_test').get(0), e.liveFired)
        content = Mobird.$(this).html()
      })
      click(Mobird.$('span.second-level').get(0))
      t.assertEqual('hi', content)

      var fired = false
      if (window.location.hash.length) window.location.hash = ''
      Mobird.$('div#delegate_test').html('<a href="#foo"></a>')
      Mobird.$('div#delegate_test').delegate('a', 'click', function(e){
        e.preventDefault()
        fired = true
      })
      click(Mobird.$('div#delegate_test a').get(0))
      t.assert(fired)
      t.refuteEqual('#foo', window.location.hash)

      fired = false
      if (window.location.hash.length) window.location.hash = ''
      Mobird.$('div#delegate_test').html('<a href="#bar"></a>')
      Mobird.$('div#delegate_test a').trigger('click')
      t.assert(fired)
      t.refuteEqual('#bar', window.location.hash)
    },

    testUndelegate: function(t){
      var count = 0, handler = function() { count++ }
      Mobird.$("#undelegate_test").bind("click mousedown", handler)
      Mobird.$("#undelegate_test").delegate("span.first-level", "click mousedown", handler)
      Mobird.$("#undelegate_test").delegate("span.second-level", "click mousedown", handler)
      Mobird.$("#undelegate_test span.second-level").trigger("click")
      t.assertEqual(3, count)

      Mobird.$("#undelegate_test").undelegate("span.second-level", "click", handler)
      Mobird.$("#undelegate_test span.second-level").trigger("click")
      t.assertEqual(5, count)

      Mobird.$("#undelegate_test").undelegate("span.first-level")
      Mobird.$("#undelegate_test span.second-level").trigger("click")
      t.assertEqual(6, count)

      Mobird.$("#undelegate_test").unbind("click")
      Mobird.$("#undelegate_test span.second-level").trigger("click")
      t.assertEqual(6, count)

      Mobird.$("#undelegate_test span.second-level").trigger("mousedown")
      t.assertEqual(8, count)

      Mobird.$("#undelegate_test").undelegate()
      Mobird.$("#undelegate_test span.second-level").trigger("mousedown")
      t.assertEqual(8, count)
    },

    testLive: function(t){
      var counter = 0
      Mobird.$('p.live').live('click', function(){ counter++ })

      Mobird.$(document.body).append('<p class="live" id="live_1"></p>')
      Mobird.$(document.body).append('<p class="live" id="live_2"></p>')

      click(Mobird.$('#live_1').get(0))
      click(Mobird.$('#live_2').get(0))

      Mobird.$('p.live').remove()
      Mobird.$(document.body).append('<p class="live" id="live_this_test"></p>')

      Mobird.$('p.live').live('click', function(){
        t.assertEqual(document.getElementById('live_this_test'), this)
      })
      click(Mobird.$('#live_this_test').get(0))

      t.assertEqual(3, counter)
    },

    testDie: function(t){
      var count = 0, handler = function() { count++ }
      Mobird.$("#another_element").live("click mousedown", handler)
      Mobird.$("#another_element").trigger("click")
      t.assertEqual(1, count)

      Mobird.$("#another_element").die("click", handler)
      Mobird.$("#another_element").trigger("click")
      t.assertEqual(1, count)

      Mobird.$("#another_element").trigger("mousedown")
      t.assertEqual(2, count)

      Mobird.$("#another_element").die()
      Mobird.$("#another_element").trigger("mousedown")
      t.assertEqual(2, count)
    },

    testOn: function(t){
      var el = Mobird.$('#some_element'), node = el.get(0), ret,
        bindTriggered = 0, delegateTriggered = 0

      ret = el.on('click', function(e){
        bindTriggered++
        t.assertIdentical(node, this)
      })
        .on({ click: function(){bindTriggered++} })
      t.assertIdentical(el, ret)

      ret = Mobird.$(document.body).on('click', 'div', function(e){
        delegateTriggered++
        t.assertIdentical(node, this)
      })
        .on({ click: function(){delegateTriggered++} }, '*[id^=some]')
      t.assertIdentical(document.body, ret.get(0))

      click(node)
      t.assertEqual(2, bindTriggered, "bind handlers")
      t.assertEqual(2, delegateTriggered, "delegate handlers")
    },

    testOnReturnFalse: function(t){
      var el = Mobird.$('#some_element')

      el.on('click', function(){
        setTimeout(function(){
          t.resume(function(){})
        }, 10)
        t.assert(true, "should have been called")
        return false
      })
      Mobird.$(document.body).on('click', function(){
        t.refute(true, "the event should have been stopped")
      })

      t.pause()
      click(el.get(0))
    },

    testOff: function(t){
      var el = Mobird.$('#some_element'), bindTriggered = 0, delegateTriggered = 0,
        handler = function(){ bindTriggered++ }

      el.bind('click', handler).bind('click', function(){ bindTriggered++ })
      el.live('click', function(){ delegateTriggered++ })

      click(el.get(0))
      t.assertEqual(2, bindTriggered, "bind handlers before unbind")
      t.assertEqual(1, delegateTriggered, "delegate handlers before unbind")

      el.off('click', handler)
      Mobird.$(document.body).off('click', '#some_element')

      click(el.get(0))
      t.assertEqual(3, bindTriggered, "bind handlers")
      t.assertEqual(1, delegateTriggered, "delegate handlers")
    },

    testOne: function(t){
      var counter = 0, context, received, el = Mobird.$('#some_element')
      Mobird.$(document.body).one('click', function(e, arg, more){
        context = this
        counter++
        received = arg + more
        t.assertIn('preventDefault', e)
        return false
      })

      var evt = Mobird.$.Event('click')
      el.trigger(evt, ['one', 'two'])
      t.assertEqual(1, counter)
      t.assertEqual('onetwo', received)
      t.assertIdentical(document.body, context)
      t.assertTrue(evt.isDefaultPrevented())

      el.trigger('click')
      t.assertEqual(1, counter, "the event handler didn't unbind itself")
    },

    testOneWithObject: function(t){
      var counter = 0, el = Mobird.$('#some_element')
      Mobird.$(document.body).one({
        click: function() { counter++ },
        custom: function() { counter-- }
      })

      el.trigger('click')
      t.assertEqual(1, counter)
      el.trigger('click')
      t.assertEqual(1, counter)

      el.trigger('custom')
      t.assertEqual(0, counter)
      el.trigger('custom')
      t.assertEqual(0, counter)
    },

    testDOMEventWrappers: function(t){
      var events = ('blur focus focusin focusout load resize scroll unload click dblclick '+
      'mousedown mouseup mousemove mouseover mouseout '+
      'change select keydown keypress keyup error').split(' ')

      var el = Mobird.$('#another_element'), count = 0

      events.forEach(function(event){
        t.assertTrue(Mobird.$.isFunction(el[event]), 'event type: ' + event)
      })

      el.click(function(){ count++ })
      click(el.get(0))

      t.assertEqual(1, count)
    },

    testCustomEvents: function (t) {
      var el = Mobird.$(document.body)

      el.bind('custom', function(evt, a, b) {
        t.assertEqual(a, 1)
        t.assertEqual(b, 2)
        el.unbind()
      })
      el.trigger('custom', [1, 2])

      el.bind('custom', function(evt, a) {
        t.assertEqual(a, 1)
        el.unbind()
      })
      el.trigger('custom', 1)

      var eventData = {z: 1}
      el.bind('custom', function(evt, a) {
        t.assertEqual(a, eventData)
        el.unbind()
      })
      el.trigger('custom', eventData)
    },

    testSpecialEvent: function (t) {
      var clickEvent     = Mobird.$.Event('click'),
        mouseDownEvent = Mobird.$.Event('mousedown'),
        mouseUpEvent   = Mobird.$.Event('mouseup'),
        mouseMoveEvent = Mobird.$.Event('mousemove'),
        submitEvent    = Mobird.$.Event('submit')

      t.assertEqual(MouseEvent, clickEvent.constructor)
      t.assertEqual(MouseEvent, mouseDownEvent.constructor)
      t.assertEqual(MouseEvent, mouseUpEvent.constructor)
      t.assertEqual(MouseEvent, mouseMoveEvent.constructor)
      t.assertEqual(Event,      submitEvent.constructor)
    }
  })
})()