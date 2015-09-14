(function(){

  function colorToHex (color) {
    if (color.substr(0, 1) === '#') {
      return color
    }

    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec( color.toLowerCase() ),
      red    = parseInt(digits[2]),
      green  = parseInt(digits[3]),
      blue   = parseInt(digits[4]),
      rgb = blue | (green << 8) | (red << 16)

    return digits[1] + '#' + rgb.toString(16)
  }

  function defer(delay, fn) {
    setTimeout(fn, delay || 0)
  }

  function camelize(str) {
    return str.replace(/-+(.)?/g, function(_, chr){ return chr ? chr.toUpperCase() : '' })
  }

  var stylePrefix = Mobird.$.fx.cssPrefix

  Evidence.Assertions.assertStyle = function(expected, object, property, message) {
    if (/^(transform|transition|animation)/.test(property)) property = stylePrefix + property
    if (!('nodeName' in object)) object = object.get(0)

    var actual = object.style[camelize(property)],
      expression = expected instanceof RegExp ? expected.test(actual) : expected === actual

    this._assertExpression(expression, message || 'Failed assertion.',
      'Expected '+property+' to be '+expected+', got '+actual+'.\n'+
      Mobird.$.fx.stylePrefix +':\n' +
      object.style.cssText)
  }

  Evidence('ZeptoFXTest', {

    testAnimate: function(t){
      var el = Mobird.$('#animtest_1'), el2 = Mobird.$('#animtest_2')

      el.animate({
        translate3d: '80px, 20px, 100px',
        rotateZ: '90deg',
        scale: '0.8',
        opacity: 0.5,
        backgroundColor: '#BADA55'
      }, 200, 'ease-out')

      el2.animate({
        translate3d: '80px, 20px, 100px',
        rotateZ: '-90deg',
        backgroundColor: '#BADA55'
      }, {
        duration: 180,
        easing: 'ease-out'
      })

      t.assertStyle('ease-out', el, 'transition-timing-function')
      t.assertStyle('0.2s', el, 'transition-duration')
      t.assertStyle(/\bbackground-color\b/, el, 'transition-property')
      t.assertStyle(/\btransform\b/, el, 'transition-property')
      t.assertStyle('0.18s', el2, 'transition-duration')

      t.pause()
      defer(250, function(){
        t.resume(function(){
          t.assertStyle('translate3d(80px, 20px, 100px) rotateZ(90deg) scale(0.8)', el, 'transform')
          t.assertStyle('0.5', el, 'opacity')
          t.assertEqual('#BADA55', colorToHex(el.get(0).style.backgroundColor).toUpperCase())
        })
      })
    },

    testDuration: function(t){
      var el1 = Mobird.$('#durationtest_1').anim({
        translate3d: '80px, 20px, 100px',
        rotateZ: '90deg',
        opacity: 0.5
      })

      var el2 = Mobird.$('#durationtest_2').anim({
        translate3d: '80px, 20px, 100px',
        rotateZ: '90deg',
        opacity: 0.5
      }, 0)

      t.assertStyle('0.4s', el1, 'transition-duration', 'expected default duration')
      t.assertStyle('', el2, 'transition-duration', 'expected no animation')
    },

    testDurationString: function(t){
      var el = Mobird.$('#durationtest_3').animate({
        translate3d: '80px, 20px, 100px',
        rotateZ: '90deg',
        opacity: 0.5
      }, 'fast')

      t.assertStyle('0.2s', el, 'transition-duration', 'expected fast duration')
    },

    testDelay: function(t){
      var duration = 100, delay = 50,
        start = new Date().getTime()

      t.pause()
      var el1 = Mobird.$('#delaytest').animate({
        translate3d: '80px, 20px, 100px',
        rotateZ: '90deg',
        opacity: 0.5
      }, {
        duration: duration,
        delay: delay,
        complete: function() {
          t.resume(function(){
            var ms = new Date().getTime() - start
            t.assert(ms >= (duration + delay),
              'Fired too early (' + ms + ' ms) after having delay')
          })
        }
      })

      t.assertStyle('0.05s', el1, 'transition-delay', 'expected delay to be set')
    },

    testCallback: function(t){
      var duration = 250, start = new Date().getTime()

      t.pause()
      Mobird.$('#callbacktest').animate({
          translate3d: '80px, 20px, 100px',
          rotateZ: '90deg',
          opacity: 0.5
        }, duration, 'linear',
        function(){
          var context = this
          t.resume(function(){
            t.assert(Mobird.$(context).is('#callbacktest'), "context for callback is wrong")
            t.assert((new Date().getTime() - start) >= duration, 'Fired too early')
            t.assertStyle('', context, 'transition')
            t.assertStyle('', context, 'transition-property')
            t.assertStyle('', context, 'transition-timing-function')
            t.assertStyle('', context, 'transition-duration')
            t.assertStyle('', context, 'animation-name')
            t.assertStyle('', context, 'animation-duration')
          })
        })
    },

    testCallbackWithoutEasing: function(t){
      var duration = 250, start = new Date().getTime()

      t.pause()
      Mobird.$('#callbacktest').animate({
          translate3d: '10px, 20px, 400px',
          rotateZ: '-90deg',
          opacity: 0.2
        }, duration,
        function(){
          var context = this
          t.resume(function(){
            t.assert(Mobird.$(context).is('#callbacktest'), "context for callback is wrong")
            t.assert((new Date().getTime() - start) >= duration, 'Fired too early')
            t.assertStyle('', context, 'transition')
            t.assertStyle('', context, 'transition-property')
            t.assertStyle('', context, 'transition-timing-function')
            t.assertStyle('', context, 'transition-duration')
            t.assertStyle('', context, 'animation-name')
            t.assertStyle('', context, 'animation-duration')
          })
        })
    },

    testCallbackWithoutEasingAndWithoutDuration: function(t){
      var duration = 250, start = new Date().getTime()

      t.pause()
      Mobird.$('#callbacktest').animate({
          translate3d: '30px, 220px, 40px',
          rotateZ: '180deg',
          opacity: 0.9
        },
        function(){
          var context = this
          t.resume(function(){
            t.assert(Mobird.$(context).is('#callbacktest'), "context for callback is wrong")
            t.assert((new Date().getTime() - start) >= duration, 'Fired too early')
            t.assertStyle('', context, 'transition')
            t.assertStyle('', context, 'transition-property')
            t.assertStyle('', context, 'transition-timing-function')
            t.assertStyle('', context, 'transition-duration')
            t.assertStyle('', context, 'animation-name')
            t.assertStyle('', context, 'animation-duration')
          })
        })
    },

    testBubbling: function(t){
      Mobird.$('#callbacktest div').anim({ opacity: 0.0 }, 0.1, 'linear')

      var el = Mobird.$('#anim_zero_duration_callback_test'),
        callbackCalled = false

      el.anim({ opacity: 0.5 }, 0, 'linear', function () {
        t.assert(Mobird.$(this).is('#anim_zero_duration_callback_test'), "context for callback is wrong")
        t.assertStyle('0.5', this, 'opacity')
        callbackCalled = true
      })

      t.pause()
      defer(30, function(){
        t.resume(function(){
          t.assert(callbackCalled)
        })
      })
    },

    testKeyFrameAnimation: function(t){
      var el = Mobird.$('#keyframetest').animate('animName', 200)

      t.assertStyle('animName', el, 'animation-name')
      t.assertStyle('0.2s',     el, 'animation-duration')
      t.assertStyle('linear',   el, 'animation-timing-function')
    },

    testEmptyCollection: function(t){
      t.assert(Mobird.$(null).animate({opacity:0}))
    }
  })
})()