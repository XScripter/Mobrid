var __viewDelegateEventSplitter = /^(\S+)\s*(.*)$/;
var __viewOptions = ['data', 'options', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

var BaseView = function(options) {
  this.cid = Mobird.uniqueId('view');
  Mobird.extend(this, Mobird.pick(options, __viewOptions));
  this._ensureElement();
  this.initialize.apply(this, arguments);
};

Mobird.extend(BaseView.prototype, Events, {

  tagName: 'div',

  _touching: false,

  touchPrevents: true,

  touchThreshold: 10,

  isTouch: window.document && 'ontouchstart' in window.document && !('callPhantom' in window),

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
    if ((Mobird.$.query && Mobird.$.query.isQ(el)) || (el instanceof Mobird.$)) {
      this.$el = el;
    } else {
      this.$el = Mobird.$(el);
    }

    this.el = this.$el[0];
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
  },

  delegateEvents: function(events) {
    if (!(events || (events = __base.getValue(this, 'events')))) {
      return;
    }
    this.undelegateEvents();
    var suffix = '.delegateEvents' + this.cid;
    Mobird(events).each(function(method, key) {
      if (!Mobird.isFunction(method)) {
        method = this[events[key]];
      }
      if (!method) {
        throw new Error('Method "' + events[key] + '" does not exist');
      }
      var match = key.match(__viewDelegateEventSplitter);
      var eventName = match[1],
        selector = match[2];
      var boundHandler = Mobird.bind(this._touchHandler, this);
      method = Mobird.bind(method, this);
      if (this._useTouchHandlers(eventName, selector)) {
        this.$el.on('touchstart' + suffix, selector, boundHandler);
        this.$el.on('touchend' + suffix, selector, {
            method: method
          },
          boundHandler
        );
      } else {
        eventName += suffix;
        if (selector === '') {
          this.$el.bind(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
    }, this);
  },

  _useTouchHandlers: function(eventName, selector) {
    return this.isTouch && eventName === 'click';
  },

  _touchHandler: function(e) {
    var oe = e.originalEvent || e;
    if (!('changedTouches' in oe)) return;
    var touch = oe.changedTouches[0];
    var x = touch.clientX;
    var y = touch.clientY;
    switch (e.type) {
      case 'touchstart':
        this._touching = [x, y];
        break;
      case 'touchend':
        var oldX = this._touching[0];
        var oldY = this._touching[1];
        var threshold = this.touchThreshold;
        if (x < (oldX + threshold) && x > (oldX - threshold) &&
          y < (oldY + threshold) && y > (oldY - threshold)) {
          this._touching = false;
          if (this.touchPrevents) {
            var tagName = e.currentTarget.tagName;
            if (tagName === 'BUTTON' ||
              tagName === 'A') {
              e.preventDefault();
              e.stopPropagation();
            }
          }
          e.data.method(e);
        }
        break;
    }
  }

});

BaseView.extend = Mobird.inherits;