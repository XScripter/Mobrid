var __viewDelegateEventSplitter = /^(\S+)\s*(.*)$/;
var __viewOptions = ['data', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

var View = Mobird.View = function(options) {
  this.cid = Mobird.uniqueId('view');
  Mobird.extend(this, Mobird.pick(options, __viewOptions));
  this._ensureElement();
  this.initialize.apply(this, arguments);
};

Mobird.extend(View.prototype, Events, {

  tagName: 'div',

  $: function(selector) {
    return this.$el.find(selector);
  },

  initialize: function() {},

  render: function() {
    return this;
  },

  remove: function() {
    this._removeElement();
    this.stopListening();
    return this;
  },

  _removeElement: function() {
    this.$el.remove();
  },

  setElement: function(element) {
    this.undelegateEvents();
    this._setElement(element);
    this.delegateEvents();
    return this;
  },

  _setElement: function(el) {
    this.$el = el instanceof Mobird.$ ? el : Mobird.$(el);
    this.el = this.$el[0];
  },

  delegateEvents: function(events) {
    events || (events = Mobird.result(this, 'events'));
    if (!events) return this;
    this.undelegateEvents();
    for (var key in events) {
      var method = events[key];
      if (!Mobird.isFunction(method)) method = this[method];
      if (!method) continue;
      var match = key.match(__viewDelegateEventSplitter);
      this.delegate(match[1], match[2], Mobird.bind(method, this));
    }
    return this;
  },

  delegate: function(eventName, selector, listener) {
    this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
    return this;
  },

  undelegateEvents: function() {
    if (this.$el) this.$el.off('.delegateEvents' + this.cid);
    return this;
  },

  undelegate: function(eventName, selector, listener) {
    this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
    return this;
  },

  _createElement: function(tagName) {
    return document.createElement(tagName);
  },

  _ensureElement: function() {
    if (!this.el) {
      var attrs = Mobird.extend({}, Mobird.result(this, 'attributes'));
      if (this.id) attrs.id = Mobird.result(this, 'id');
      if (this.className) attrs['class'] = Mobird.result(this, 'className');
      this.setElement(this._createElement(Mobird.result(this, 'tagName')));
      this._setAttributes(attrs);
    } else {
      this.setElement(Mobird.result(this, 'el'));
    }
  },

  _setAttributes: function(attributes) {
    this.$el.attr(attributes);
  }

});

View.extend = Mobird.inherits;