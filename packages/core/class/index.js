var Class = Mobird.Class = function(options) {
  this.options = Mobird.extend({}, Mobird.result(this, 'options'), options);

  this.initialize.apply(this, arguments);
};

Class.extend = Mobird.inherits;

Mobird.extend(Class.prototype, Events, {

  initialize: function() {},

  destroy: function() {
    this.triggerMethod('before:destroy');
    this.triggerMethod('destroy');
    this.stopListening();

    return this;
  },

  triggerMethod: __base.triggerMethod,

  mergeOptions: __base.mergeOptions,

  getOption: __base.proxyGetOption,

  bindEntityEvents: __base.proxyBindEntityEvents,

  unbindEntityEvents: __base.proxyUnbindEntityEvents
});