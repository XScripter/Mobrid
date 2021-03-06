Evidence('ZeptoExtendedDataTest', {
  testEmptyCollection: function(t){
    var el = Mobird.$('#does_not_exist')
    t.assertUndefined(el.data('one'))
  },

  testAttributeDoesNotExist: function(t){
    var el = Mobird.$('#data_attr')
    t.assertUndefined(el.data('missing'))
  },

  testReadingAttribute: function(t){
    var el = Mobird.$('#data_attr')
    t.assertEqual('uno', el.data('one'))
  },

  testCamelized: function(t){
    var el = Mobird.$('#data_attr')
    t.assertEqual('baz', el.data('foo-bar'))
    t.assertEqual('baz', el.data('fooBar'))

    el.data('fooBar', 'bam')
    t.assertEqual('bam', el.data('foo-bar'))
    t.assertEqual('bam', el.data('fooBar'))

    el.data('a-b', 'c')
    t.assertEqual('c', el.data().aB)
    t.assertUndefined(el.data()['a-b'])
  },

  testUnderscore: function(t){
    var el = Mobird.$('#data_attr')
    t.assertEqual('kuuq', el.data('under_score'))
    t.assertUndefined(el.data('under-score'))
    t.assertUndefined(el.data('underScore'))
  },

  testNotChangingAttribute: function(t){
    var el = Mobird.$('#data_attr')
    t.assertEqual('due', el.data('two'))
    el.data('two', 'changed')
    t.assertEqual('due', el.attr('data-two'))
  },

  testExtendedData: function(t){
    var els = Mobird.$('#data_attr'),
      els2 = Mobird.$('#data_attr'),
      obj  = { a: 'A', b: 'B' }

    els.data('obj', obj)
    t.assertIdentical(obj, els.data('obj'))
    t.assertIdentical(obj, els2.data('obj'))

    els2.data('els', els)
    t.assertIdentical(els, els.data('els'))
  },

  testMultipleElements: function(t){
    var items = Mobird.$('#data_list li')

    items.data('each', 'mark')

    var values = items.map(function(){ return Mobird.$(this).data('each') }).get()
    t.assertEqual('mark, mark', values.join(', '))
  },

  testFunctionArg: function(t){
    var els = Mobird.$('#data_attr')

    var data = "hello"

    els.data("addio", function () {
      data = "goodbye"
    })

    t.assertEqual('hello', data)

    els.data("addio")()

    t.assertEqual('goodbye', data)
  },

  testAllData: function(t){
    var el = Mobird.$('#data_full')

    el.data().samurai = 7
    el.data('one', 'ichi').data('two', 'ni')
    el.data('person', {name: 'Kurosawa'})

    var all = el.data()
    t.assertEqual(7, all.samurai)
    t.assertEqual('ichi', all.one)
    t.assertEqual('ni', all.two)
    t.assertEqual('Kurosawa', all.person.name)
  },

  testInitialDataFromAttributes: function(t){
    var el = Mobird.$('<div data-foo=bar data-foo-bar=baz data-empty data-num=42 />'),
      store = el.data()

    t.assertEqual('bar', store.foo)
    t.assertEqual('baz', store.fooBar)
    t.assertUndefined(store['foo-bar'])
    t.assertIdentical('', store.empty)
    t.assertIdentical(42, store.num)
  },

  testGettingBlanks: function(t){
    var el = Mobird.$('#data_attr'),
      store = el.data()

    store.nil = null
    store.undef = undefined
    store.blank = ''
    store.bool = false

    t.assertNull(el.data('nil'))
    t.assertUndefined(el.data('undef'))
    t.assertIdentical('', el.data('blank'))
    t.assertFalse(el.data('bool'))
  },

  testRemoveData: function(t){
    var el = Mobird.$('<div data-foo=bar />')

    el.data('foo', 'bam').data('bar', 'baz')
    el.removeData('foo').removeData('bar')
    t.assertEqual('bar', el.data('foo'))
    t.assertUndefined(el.data('bar'))

    el.data('uno', 'one').data('due', 'two')
    el.removeData('uno due')
    t.assertUndefined(el.data('uno'))
    t.assertUndefined(el.data('due'))

    el.data('one', 1).data('twoThree', 23)
    el.removeData(['one', 'two-three'])
    t.assertUndefined(el.data('one'))
    t.assertUndefined(el.data('twoThree'))
  },

  testRemoveAllData: function(t){
    var el = Mobird.$('<div data-attr-test=val />')

    el.data('one', { foo: 'bar' })
    el.data('two', 'two').data('three', 3)
    el.removeData()

    t.assertEqual('val', el.data('attrTest'))
    t.assertUndefined(el.data('one'))
    t.assertUndefined(el.data('two'))
    t.assertUndefined(el.data('three'))
  },

  testRemoveDataNoop: function(t){
    var empty = Mobird.$(),
      vanilla = Mobird.$('<div />')

    t.assertIdentical(empty, empty.removeData('foo'))
    t.assertIdentical(vanilla, vanilla.removeData('foo'))
  },

  testRemoveDataOnElementRemoval: function(t){
    var el = Mobird.$('<div data-attr-test=val />'),
      childEl = Mobird.$('<span />').appendTo(el),
      elData = { foo: 'bar' }

    el.data('test', elData)
    childEl.data('test', 1)

    el.remove()
    t.assertEqual('val', el.data('attrTest'))
    t.assertUndefined(el.data('test'))
    t.assertUndefined(childEl.data('test'))
  },

  testRemoveDataOnElementEmpty: function(t){
    var el = Mobird.$('<div data-attr-test=val />'),
      childEl = Mobird.$('<span />').appendTo(el),
      elData = { foo: 'bar' }

    el.data('test', elData)
    childEl.data('test', 1)

    el.empty()
    t.assertEqual('val', el.data('attrTest'))
    t.assertEqual(elData, el.data('test'))
    t.assertUndefined(childEl.data('test'))
  },

  testRemoveDataOnElementReplacement: function(t){
    var el = Mobird.$('<div data-attr-test=val />'),
      childEl = Mobird.$('<span />').appendTo(el),
      elData = { foo: 'bar' }

    el.data('test', elData)
    childEl.data('test', 1)

    el.replaceWith('<div />')
    t.assertEqual('val', el.data('attrTest'))
    t.assertUndefined(el.data('test'))
    t.assertUndefined(childEl.data('test'))
  },

  testRemoveDataOnElementReplacementHtml: function(t){
    var el = Mobird.$('<div data-attr-test=val />'),
      childEl = Mobird.$('<span />').appendTo(el),
      wrapper = Mobird.$('<div />'),
      elData = { foo: 'bar' }

    el.wrap(wrapper).data('test', elData)
    childEl.data('test', 1)

    wrapper.html('<b>New content</b>')
    t.assertEqual('val', el.data('attrTest'))
    t.assertUndefined(el.data('test'))
    t.assertUndefined(childEl.data('test'))
  },

  testKeepDataOnElementDetach: function(t){
    var el = Mobird.$('<div data-attr-test=val />'),
      childEl = Mobird.$('<span />').appendTo(el),
      elData = { foo: 'bar' }

    el.data('test', elData)
    childEl.data('test', 1)

    el.detach()
    t.assertEqual('val', el.data('attrTest'))
    t.assertEqual(elData, el.data('test'))
    t.assertEqual(1, childEl.data('test'))
  },

  testSettingDataWithObj: function(t){
    var el = Mobird.$('#data_obj')

    el.data({
      'foo': 'bar',
      'answer': 42,
      'color': 'blue'
    })

    var all = el.data()

    t.assertEqual(all.answer, 42)
    t.assertEqual(all.color, 'blue')
    t.assertEqual(all.foo, 'bar')

    el.data('foo', 'baz')

    t.assertEqual(all.foo, 'baz')
    t.assertEqual(all.answer, 42)
  },

  testSettingDataWithObjOnManyElements: function(t){
    var items = Mobird.$('#data_list2 li')

    items.data({
      'foo': 'bar',
      'answer': 42,
      'color': 'purple'
    })

    var values = items.map(function(){ return Mobird.$(this).data('foo') }).get()
    t.assertEqual('bar, bar', values.join(', '))

    var values2 = items.map(function(){ return Mobird.$(this).data('answer') }).get()
    t.assertEqual('42, 42', values2.join(', '))
  },

  testSettingDataOnObjectWithoutAttributes: function(t) {
    var el = Mobird.$(window)

    t.assertUndefined(el.data('foo'))
    el.data('foo', 'bar')
    t.assertEqual(el.data('foo'), 'bar')
  }

})