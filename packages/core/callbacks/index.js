var Callbacks = Mobird.Callbacks = function() {
  this._deferred = Deferred();
  this._callbacks = [];
};

Mobird.extend(Callbacks.prototype, {

  add: function(callback, contextOverride) {
    var promise = Mobird.result(this._deferred, 'promise');

    this._callbacks.push({
      cb: callback,
      ctx: contextOverride
    });

    promise.then(function(args) {
      if (contextOverride) {
        args.context = contextOverride;
      }
      callback.call(args.context, args.options);
    });
  },

  run: function(options, context) {
    this._deferred.resolve({
      options: options,
      context: context
    });
  },

  reset: function() {
    var callbacks = this._callbacks;
    this._deferred = Deferred();
    this._callbacks = [];

    Mobird.each(callbacks, function(cb) {
      this.add(cb.cb, cb.ctx);
    }, this);
  }
});