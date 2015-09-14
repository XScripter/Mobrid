var CommandCache = function(options) {
  this.options = options;
  this._commands = {};
};

Mobird.extend(CommandCache.prototype, Events, {

  get: function(commandName) {
    var commands = this._commands[commandName];

    if (!commands) {
      commands = {
        command: commandName,
        instances: []
      };

      this._commands[commandName] = commands;
    }

    return commands;
  },

  add: function(commandName, args) {
    var command = this.get(commandName);
    command.instances.push(args);
  },

  clear: function(commandName) {
    var command = this.get(commandName);
    command.instances = [];
  }
});

var Commands = Mobird.Commands = function(options) {
  this.options = options;
  this._handlers = {};

  if (Mobird.isFunction(this.initialize)) {
    this.initialize(options);
  }

  this._initializeCommandCache();
  this.on('handler:add', this._executeCommands, this);
};

Commands.extend = Mobird.inherits;

Mobird.extend(Commands.prototype, Events, {

  add: function(commands){
    Mobird.each(commands, function(handler, name){
      var context = null;

      if (Mobird.isObject(handler) && !Mobird.isFunction(handler)){
        context = handler.context;
        handler = handler.callback;
      }

      this.set(name, handler, context);
    }, this);
  },

  set: function(name, handler, context) {
    var config = {
      callback: handler,
      context: context
    };

    this._handlers[name] = config;

    this.trigger('handler:add', name, handler, context);
  },

  has: function(name) {
    return !!this._handlers[name];
  },

  get: function(name) {
    var config = this._handlers[name];

    if (!config) {
      return;
    }

    return function() {
      return config.callback.apply(config.context, arguments);
    };
  },

  remove: function(name) {
    delete this._handlers[name];
  },

  removeAll: function() {
    this._handlers = {};
  },

  execute: function(name) {
    name = arguments[0];
    var args = Mobird.rest(arguments);

    if (this.has(name)) {
      this.get(name).apply(this, args);
    } else {
      this.commandCache.add(name, args);
    }

  },

  _executeCommands: function(name, handler, context) {
    var command = this.commandCache.get(name);

    Mobird.each(command.instances, function(args) {
      handler.apply(context, args);
    });

    this.commandCache.clear(name);
  },

  _initializeCommandCache: function() {
    this.commandCache = new CommandCache();
  }

});