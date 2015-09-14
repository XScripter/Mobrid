var __base = Mobird.__base = {};

__base.isNodeAttached = function(el) {
  return Mobird.$.contains(document.documentElement, el);
};

__base._triggerMethod = (function() {
  var splitter = /(^|:)(\w)/gi;

  function getEventName(match, prefix, eventName) {
    return eventName.toUpperCase();
  }

  return function(context, event, args) {
    var noEventArg = arguments.length < 3;
    if (noEventArg) {
      args = event;
      event = args[0];
    }

    var methodName = 'on' + event.replace(splitter, getEventName);
    var method = context[methodName];
    var result;

    if (Mobird.isFunction(method)) {
      result = method.apply(context, noEventArg ? Mobird.rest(args) : args);
    }

    if (Mobird.isFunction(context.trigger)) {
      if (noEventArg + args.length > 1) {
        context.trigger.apply(context, noEventArg ? args : [event].concat(Mobird.rest(args, 0)));
      } else {
        context.trigger(event);
      }
    }

    return result;
  };
})();

__base.triggerMethod = function(event) {
  return __base._triggerMethod(this, arguments);
};

__base.triggerMethodOn = function(context) {
  var fnc = Mobird.isFunction(context.triggerMethod) ? context.triggerMethod : __base.triggerMethod;

  return fnc.apply(context, Mobird.rest(arguments));
};

__base.mergeOptions = function(options, keys) {
  if (!options) {
    return;
  }
  Mobird.extend(this, Mobird.pick(options, keys));
};

__base.getOption = function(target, optionName) {
  if (!target || !optionName) {
    return;
  }
  if (target.options && (target.options[optionName] !== undefined)) {
    return target.options[optionName];
  } else {
    return target[optionName];
  }
};

__base.proxyGetOption = function(optionName) {
  return __base.getOption(this, optionName);
};

__base._getValue = function(value, context, params) {
  if (Mobird.isFunction(value)) {
    value = params ? value.apply(context, params) : value.call(context);
  }
  return value;
};

function __baseBindFromStrings(target, entity, evt, methods) {
  var methodNames = methods.split(/\s+/);

  Mobird.each(methodNames, function(methodName) {

    var method = target[methodName];
    if (!method) {
      throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
    }

    target.listenTo(entity, evt, method);
  });
}

function __baseBindToFunction(target, entity, evt, method) {
  target.listenTo(entity, evt, method);
}

function __baseUnbindFromStrings(target, entity, evt, methods) {
  var methodNames = methods.split(/\s+/);

  Mobird.each(methodNames, function(methodName) {
    var method = target[methodName];
    target.stopListening(entity, evt, method);
  });
}

function __baseUnbindToFunction(target, entity, evt, method) {
  target.stopListening(entity, evt, method);
}

function __baseIterateEvents(target, entity, bindings, functionCallback, stringCallback) {
  if (!entity || !bindings) {
    return;
  }

  if (!Mobird.isObject(bindings)) {
    throw new Error('Bindings must be an object or function.');
  }

  // allow the bindings to be a function
  bindings = __base._getValue(bindings, target);

  // iterate the bindings and bind them
  Mobird.each(bindings, function(methods, evt) {

    // allow for a function as the handler,
    // or a list of event names as a string
    if (Mobird.isFunction(methods)) {
      functionCallback(target, entity, evt, methods);
    } else {
      stringCallback(target, entity, evt, methods);
    }

  });
}

__base.bindEntityEvents = function(target, entity, bindings) {
  __baseIterateEvents(target, entity, bindings, __baseBindToFunction, __baseBindFromStrings);
};

__base.unbindEntityEvents = function(target, entity, bindings) {
  __baseIterateEvents(target, entity, bindings, __baseUnbindToFunction, __baseUnbindFromStrings);
};

__base.proxyBindEntityEvents = function(entity, bindings) {
  return __base.bindEntityEvents(this, entity, bindings);
};

__base.proxyUnbindEntityEvents = function(entity, bindings) {
  return __base.unbindEntityEvents(this, entity, bindings);
};