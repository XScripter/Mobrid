var _requestAnimationFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 16);
    };
})();

var cancelAnimationFrame = window.cancelAnimationFrame ||
  window.webkitCancelAnimationFrame ||
  window.mozCancelAnimationFrame ||
  window.webkitCancelRequestAnimationFrame;

Mobird.requestAnimationFrame = function(cb) {
  return _requestAnimationFrame(cb);
};

Mobird.cancelAnimationFrame = function(requestId) {
  cancelAnimationFrame(requestId);
};

Mobird.animationFrameThrottle = function(cb) {
  var args, isQueued, context;
  return function() {
    args = arguments;
    context = this;
    if (!isQueued) {
      isQueued = true;
      Mobird.requestAnimationFrame(function() {
        cb.apply(context, args);
        isQueued = false;
      });
    }
  };
};

Mobird.adjustTitle = function(title) {
  Mobird.requestAnimationFrame(function() {
    document.title = title;
  });
};