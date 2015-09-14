(function(){
  Evidence('SelectorTest', {
    testFirst: function(t) {
      var li = Mobird.$('#list li:first')
      t.assertEqual(1, li.size())
      t.assertEqual('one', li.text())
      t.assertEqual('two', Mobird.$('#list li:eq(1)').text())
    },
    testLast: function(t) {
      var li = Mobird.$('#list li:last')
      t.assertEqual(1, li.size())
      t.assertEqual('two', li.text())
    },
    testParent: function(t) {
      var list = Mobird.$('#list li:parent')
      t.assertEqual(1, list.size())
      t.assertEqual('list', list.attr('id'))
    },
    testContains: function(t) {
      t.assertEqual('two', Mobird.$('#list li:contains("two")').text())
    },
    testVisibility: function(t) {
      t.assertEqual('vis', Mobird.$('.visibility:visible').attr('id'))
      t.assertEqual('invis', Mobird.$('.visibility:hidden').attr('id'))
    },
    testIs: function(t) {
      t.assert(Mobird.$('#list').is('ul'))
      t.assert(Mobird.$('#vis').is(':visible'))
      t.refute(Mobird.$('#invis').is(':visible'))
    },
    testChild: function(t) {
      var items = Mobird.$('#child').find('> li'),
        results = items.map(function(){
          return Mobird.$(this).find('> span').text()
        }).get()

      t.assertEqual('child1 child2', results.join(' '))
      t.assertEqual('test', Mobird.$('#child').prop('class'))
    },
    testChildHas: function(t) {
      var items = Mobird.$('#child').find('> li:has(ul)'),
        results = items.map(function(){
          return Mobird.$(this).find('> span').text()
        }).get()

      t.assertEqual('child2', results.join(' '))
    },
    testEmptyHref: function(t) {
      var result, el = Mobird.$('<div><a href="#">one</a><a href="#">two</a></div>')
      result = el.find('a[href=#]')
      t.assertEqual('one two', result.map(function(){ return Mobird.$(this).text() }).get().join(' '))
    }
  })
})()