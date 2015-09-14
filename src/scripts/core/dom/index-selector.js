(function($) {

  if (Mobird.isUndefined($)) {
    return;
  }

  var query = $.query,
    oldQsa = query.qsa,
    oldMatches = query.matches

  function visible(elem) {
    elem = $(elem)
    return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
  }

  var filters = $.expr[':'] = {
    visible: function() {
      if (visible(this)) return this
    },
    hidden: function() {
      if (!visible(this)) return this
    },
    selected: function() {
      if (this.selected) return this
    },
    checked: function() {
      if (this.checked) return this
    },
    parent: function() {
      return this.parentNode
    },
    first: function(idx) {
      if (idx === 0) return this
    },
    last: function(idx, nodes) {
      if (idx === nodes.length - 1) return this
    },
    eq: function(idx, _, value) {
      if (idx === value) return this
    },
    contains: function(idx, _, text) {
      if ($(this).text().indexOf(text) > -1) return this
    },
    has: function(idx, _, sel) {
      if (query.qsa(this, sel).length) return this
    }
  }

  var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
    childRe = /^\s*>/,
    classTag = 'Zepto' + (+new Date())

  function process(sel, fn) {
    // quote the hash in `a[href^=#]` expression
    sel = sel.replace(/=#\]/g, '="#"]')
    var filter, arg, match = filterRe.exec(sel)
    if (match && match[2] in filters) {
      filter = filters[match[2]], arg = match[3]
      sel = match[1]
      if (arg) {
        var num = Number(arg)
        if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '')
        else arg = num
      }
    }
    return fn(sel, filter, arg)
  }

  query.qsa = function(node, selector) {
    return process(selector, function(sel, filter, arg) {
      try {
        var taggedParent
        if (!sel && filter) sel = '*'
        else if (childRe.test(sel))
        // support "> *" child queries by tagging the parent node with a
        // unique class and prepending that classname onto the selector
          taggedParent = $(node).addClass(classTag), sel = '.' + classTag + ' ' + sel

        var nodes = oldQsa(node, sel)
      } catch (e) {
        console.error('error performing selector: %o', selector)
        throw e
      } finally {
        if (taggedParent) taggedParent.removeClass(classTag)
      }
      return !filter ? nodes :
        query.uniq($.map(nodes, function(n, i) {
          return filter.call(n, i, nodes, arg)
        }))
    })
  }

  query.matches = function(node, selector) {
    return process(selector, function(sel, filter, arg) {
      return (!sel || oldMatches(node, sel)) &&
        (!filter || filter.call(node, null, arg) === node)
    })
  }

})(Mobird.Query);