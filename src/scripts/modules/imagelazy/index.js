Mobird.defineModule('modules/imageLazy', function(require, exports, module) {

  var ImageLazy = {};

  var callback = function () {};

  var offset, poll, delay, useDebounce, unload;

  var inView = function (element, view) {
    var box = element.getBoundingClientRect();
    return (box.right >= view.l && box.bottom >= view.t && box.left <= view.r && box.top <= view.b);
  };

  var debounceOrThrottle = function () {
    if(!useDebounce && !!poll) {
      return;
    }
    clearTimeout(poll);
    poll = setTimeout(function(){
      ImageLazy.render();
      poll = null;
    }, delay);
  };

  ImageLazy.init = function (opts) {
    opts = opts || {};
    var offsetAll = opts.offset || 0;
    var offsetVertical = opts.offsetVertical || offsetAll;
    var offsetHorizontal = opts.offsetHorizontal || offsetAll;
    var optionToInt = function (opt, fallback) {
      return parseInt(opt || fallback, 10);
    };
    offset = {
      t: optionToInt(opts.offsetTop, offsetVertical),
      b: optionToInt(opts.offsetBottom, offsetVertical),
      l: optionToInt(opts.offsetLeft, offsetHorizontal),
      r: optionToInt(opts.offsetRight, offsetHorizontal)
    };
    delay = optionToInt(opts.throttle, 250);
    useDebounce = opts.debounce !== false;
    unload = !!opts.unload;
    callback = opts.callback || callback;
    ImageLazy.render();
    if (document.addEventListener) {
      window.addEventListener('scroll', debounceOrThrottle, false);
      window.addEventListener('load', debounceOrThrottle, false);
    } else {
      window.attachEvent('onscroll', debounceOrThrottle);
      window.attachEvent('onload', debounceOrThrottle);
    }
  };

  ImageLazy.render = function () {
    var nodes = document.querySelectorAll('img[data-lazy], [data-lazy-background]');
    var length = nodes.length;
    var src, elem;
    var view = {
      l: 0 - offset.l,
      t: 0 - offset.t,
      b: (window.innerHeight || document.documentElement.clientHeight) + offset.b,
      r: (window.innerWidth || document.documentElement.clientWidth) + offset.r
    };
    for (var i = 0; i < length; i++) {
      elem = nodes[i];
      if (inView(elem, view)) {

        if (unload) {
          elem.setAttribute('data-lazy-placeholder', elem.src);
        }

        if (elem.getAttribute('data-lazy-background') !== null) {
          elem.style.backgroundImage = 'url(' + elem.getAttribute('data-lazy-background') + ')';
        }
        else {
          elem.src = elem.getAttribute('data-lazy');
        }

        if (!unload) {
          elem.removeAttribute('data-lazy');
          elem.removeAttribute('data-lazy-background');
        }

        callback(elem, 'load');
      }
      else if (unload && !!(src = elem.getAttribute('data-lazy-placeholder'))) {

        if (elem.getAttribute('data-lazy-background') !== null) {
          elem.style.backgroundImage = 'url(' + src + ')';
        }
        else {
          elem.src = src;
        }

        elem.removeAttribute('data-lazy-placeholder');
        callback(elem, 'unload');
      }
    }
    if (!length) {
      ImageLazy.detach();
    }
  };

  ImageLazy.detach = function () {
    if (document.removeEventListener) {
      window.removeEventListener('scroll', debounceOrThrottle);
    } else {
      window.detachEvent('onscroll', debounceOrThrottle);
    }
    clearTimeout(poll);
  };

  ImageLazy.initialize = function(options) {
    options = Mobird.extend({
      offset: 100,
      throttle: 250,
      unload: false,
      callback: Mobird.noop
    }, options || {});

    ImageLazy.init(options);
  };

  module.exports = ImageLazy;

});
Mobird.ImageLazy = Mobird.requireModule('modules/imageLazy');
Mobird.initializeImageLazy = function(options) {
  Mobird.ImageLazy.initialize(options);
};