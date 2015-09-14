var Screen = Mobird.Screen = Class.extend({

  constructor: function(options) {

    this.options = options || {};
    this.el = this.getOption('el');

    this.el = this.el instanceof Mobird.$ ? this.el[0] : this.el;

    if (!this.el) {
      throw new Error('An "el" must be specified for a screen.');
    }

    this.$el = this.getEl(this.el);
    Class.call(this, options);
  },

  adjustTitle: function(title) {
    title = title || this.$el.attr('mo-title');

    if (title) {
      Mobird.adjustTitle(title);
    }

  },

  _toggleScreen: function() {
    var self = this;
    var transition = self.$el.attr('mo-transition');
    if (transition !== 'none') {
      ScreenTransition.goTo(self.$el, transition || 'slideleft', location.hash);
    } else {
      self.$el.siblings().removeClass('current');
      self.$el.addClass('current');
    }
  },

  show: function(view, options) {
    if (!this._ensureElement()) {
      return;
    }

    this._ensureViewIsIntact(view);

    this.adjustTitle();
    this._toggleScreen();

    var showOptions = options || {};
    var isDifferentView = view !== this.currentView;
    var preventDestroy = !!showOptions.preventDestroy;
    var forceShow = !!showOptions.forceShow;

    var isChangingView = !!this.currentView;

    var _shouldDestroyView = isDifferentView && !preventDestroy;

    var _shouldShowView = isDifferentView || forceShow;

    if (isChangingView) {
      this.triggerMethod('before:swapOut', this.currentView, this, options);
    }

    if (this.currentView) {
      delete this.currentView._parent;
    }

    if (_shouldDestroyView) {
      this.empty();

    } else if (isChangingView && _shouldShowView) {
      this.currentView.off('destroy', this.empty, this);
    }

    if (_shouldShowView) {

      view.once('destroy', this.empty, this);
      view.render();

      view._parent = this;

      if (isChangingView) {
        this.triggerMethod('before:swap', view, this, options);
      }

      this.triggerMethod('before:show', view, this, options);
      __base.triggerMethodOn(view, 'before:show', view, this, options);

      if (isChangingView) {
        this.triggerMethod('swapOut', this.currentView, this, options);
      }

      var attachedScreen = __base.isNodeAttached(this.el);

      var displayedViews = [];

      var attachOptions = Mobird.extend({
        triggerBeforeAttach: this.triggerBeforeAttach,
        triggerAttach: this.triggerAttach
      }, showOptions);

      if (attachedScreen && attachOptions.triggerBeforeAttach) {
        displayedViews = this._displayedViews(view);
        this._triggerAttach(displayedViews, 'before:');
      }

      this.attachHtml(view);
      this.currentView = view;

      if (attachedScreen && attachOptions.triggerAttach) {
        displayedViews = this._displayedViews(view);
        this._triggerAttach(displayedViews);
      }

      if (isChangingView) {
        this.triggerMethod('swap', view, this, options);
      }

      this.triggerMethod('show', view, this, options);
      __base.triggerMethodOn(view, 'show', view, this, options);

      return this;
    }

    return this;
  },

  triggerBeforeAttach: true,
  triggerAttach: true,

  _triggerAttach: function(views, prefix) {
    var eventName = (prefix || '') + 'attach';
    Mobird.each(views, function(view) {
      __base.triggerMethodOn(view, eventName, view, this);
    }, this);
  },

  _displayedViews: function(view) {
    return Mobird.union([view], Mobird.result(view, '_getNestedViews') || []);
  },

  _ensureElement: function() {
    if (!Mobird.isObject(this.el)) {
      this.$el = this.getEl(this.el);
      this.el = this.$el[0];
    }

    if (!this.$el || this.$el.length === 0) {
      if (this.getOption('allowMissingEl')) {
        return false;
      } else {
        throw new Error('An "el" ' + this.$el.selector + ' must exist in DOM');
      }
    }
    return true;
  },

  _ensureViewIsIntact: function(view) {
    if (!view) {
      throw new Error('The view passed is undefined and therefore invalid. You must pass a view instance to show.');
    }

    if (view.isDestroyed) {
      throw new Error('View (cid: "' + view.cid + '") has already been destroyed and cannot be used.');
    }
  },

  getEl: function(el) {
    return Mobird.$(el, __base._getValue(this.options.parentEl, this));
  },

  attachHtml: function(view) {
    this.$el.contents().detach();

    this.el.appendChild(view.el);
  },

  empty: function(options) {
    var view = this.currentView;

    var preventDestroy = __base._getValue(options, 'preventDestroy', this);
    if (!view) {
      return;
    }

    view.off('destroy', this.empty, this);
    this.triggerMethod('before:empty', view);
    if (!preventDestroy) {
      this._destroyView();
    }
    this.triggerMethod('empty', view);

    // Remove screen pointer to the currentView
    delete this.currentView;

    if (preventDestroy) {
      this.$el.contents().detach();
    }

    return this;
  },

  _destroyView: function() {
    var view = this.currentView;

    if (view.destroy && !view.isDestroyed) {
      view.destroy();
    } else if (view.remove) {
      view.remove();

      view.isDestroyed = true;
    }
  },

  attachView: function(view) {
    this.currentView = view;
    return this;
  },

  hasView: function() {
    return !!this.currentView;
  },

  reset: function() {
    this.empty();

    if (this.$el) {
      this.el = this.$el.selector;
    }

    delete this.$el;
    return this;
  }

}, {
  buildScreen: function(screenConfig, DefaultScreenClass) {
    if (Mobird.isString(screenConfig)) {
      return this._buildScreenFromSelector(screenConfig, DefaultScreenClass);
    }

    if (screenConfig.selector || screenConfig.el || screenConfig.screenClass) {
      return this._buildScreenFromObject(screenConfig, DefaultScreenClass);
    }

    if (Mobird.isFunction(screenConfig)) {
      return this._buildScreenFromScreenClass(screenConfig);
    }

    throw new Error('Improper screen configuration type.');
  },

  _buildScreenFromSelector: function(selector, DefaultScreenClass) {
    return new DefaultScreenClass({
      el: selector
    });
  },

  _buildScreenFromObject: function(screenConfig, DefaultScreenClass) {
    var ScreenClass = screenConfig.screenClass || DefaultScreenClass;
    var options = Mobird.omit(screenConfig, 'selector', 'screenClass');

    if (screenConfig.selector && !options.el) {
      options.el = screenConfig.selector;
    }

    return new ScreenClass(options);
  },

  _buildScreenFromScreenClass: function(ScreenClass) {
    return new ScreenClass();
  }
});