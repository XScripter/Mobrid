Mobird.Application = Class.extend({

  constructor: function(options) {
    this._initializeScreens(options);
    this._initCallbacks = new Callbacks();
    this.commands = new Commands();

    this.appRouter = new Router();

    if (options && options.routers) {
      this._initializeRouters(options.routers);
    }

    if (options && options.commands) {
      this._initializeCommands(options.commands);
    }

    Mobird.extend(this, options);

    Class.call(this, options);
  },

  addInitializer: function(initializer) {
    this._initCallbacks.add(initializer);
  },

  start: function(options) {
    this.triggerMethod('before:start', options);
    this._initCallbacks.run(options, this);
    this.triggerMethod('start', options);
  },

  addScreens: function(screens) {
    return this._screenManager.addScreens(screens);
  },

  emptyScreens: function() {
    return this._screenManager.emptyScreens();
  },

  removeScreen: function(screen) {
    return this._screenManager.removeScreen(screen);
  },

  getScreen: function(screen) {
    return this._screenManager.get(screen);
  },

  getScreens: function() {
    return this._screenManager.getScreens();
  },

  getScreenManager: function() {
    return new ScreenManager();
  },

  _initializeRouters: function(routers) {
    for(var matcher in routers) {
      this.appRouter.addRoute(matcher, routers[matcher]);
    }
  },

  _initializeCommands: function(commands) {
    this.commands.add(commands);
  },

  _initializeScreens: function(options) {
    var screens = Mobird.isFunction(this.screens) ? this.screens(options) : this.screens || {};

    this._initScreenManager();

    // Enable users to define `screens` in instance options.
    var optionScreens = __base.getOption(options, 'screens');

    // Enable screen options to be a function
    if (Mobird.isFunction(optionScreens)) {
      optionScreens = optionScreens.call(this, options);
    }

    // Overwrite current screens with those passed in options
    Mobird.extend(screens, optionScreens);

    this.addScreens(screens);

    return this;
  },

  _initScreenManager: function() {
    this._screenManager = this.getScreenManager();
    this._screenManager._parent = this;

    this.listenTo(this._screenManager, 'before:add:screen', function() {
      __base._triggerMethod(this, 'before:add:screen', arguments);
    });

    this.listenTo(this._screenManager, 'add:screen', function(name, screen) {
      this[name] = screen;
      __base._triggerMethod(this, 'add:screen', arguments);
    });

    this.listenTo(this._screenManager, 'before:remove:screen', function() {
      __base._triggerMethod(this, 'before:remove:screen', arguments);
    });

    this.listenTo(this._screenManager, 'remove:screen', function(name) {
      delete this[name];
      __base._triggerMethod(this, 'remove:screen', arguments);
    });
  }
});