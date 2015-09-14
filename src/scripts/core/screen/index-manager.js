var ScreenManager = Mobird.ScreenManager = Class.extend({
  constructor: function(options) {
    this._screens = {};
    this.length = 0;

    Class.call(this, options);

    this.addScreens(this.getOption('screens'));
  },

  addScreens: function(screenDefinitions, defaults) {
    screenDefinitions = __base._getValue(screenDefinitions, this, arguments);

    return Mobird.reduce(screenDefinitions, function(screens, definition, name) {
      if (Mobird.isString(definition)) {
        definition = {
          selector: definition
        };
      }
      if (definition.selector) {
        definition = Mobird.defaults({}, definition, defaults);
      }

      screens[name] = this.addScreen(name, definition);
      return screens;
    }, {}, this);
  },

  addScreen: function(name, definition) {
    var screen;

    if (definition instanceof Screen) {
      screen = definition;
    } else {
      screen = Screen.buildScreen(definition, Screen);
    }

    this.triggerMethod('before:add:screen', name, screen);

    screen._parent = this;
    this._store(name, screen);

    this.triggerMethod('add:screen', name, screen);
    return screen;
  },

  get: function(name) {
    return this._screens[name];
  },

  getScreens: function() {
    return Mobird.clone(this._screens);
  },

  removeScreen: function(name) {
    var screen = this._screens[name];
    this._remove(name, screen);

    return screen;
  },

  removeScreens: function() {
    var screens = this.getScreens();
    Mobird.each(this._screens, function(screen, name) {
      this._remove(name, screen);
    }, this);

    return screens;
  },

  emptyScreens: function() {
    var screens = this.getScreens();
    Mobird.invoke(screens, 'empty');
    return screens;
  },

  destroy: function() {
    this.removeScreens();
    return Class.prototype.destroy.apply(this, arguments);
  },

  _store: function(name, screen) {
    if (!this._screens[name]) {
      this.length++;
    }

    this._screens[name] = screen;
  },

  _remove: function(name, screen) {
    this.triggerMethod('before:remove:screen', name, screen);
    screen.empty();
    screen.stopListening();

    delete screen._parent;
    delete this._screens[name];
    this.length--;
    this.triggerMethod('remove:screen', name, screen);
  }
});