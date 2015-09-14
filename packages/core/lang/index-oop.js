var result = function(instance, obj) {
  return instance._chain ? Mobird(obj).chain() : obj;
};

Mobird.mixin = function(obj) {
  Mobird.each(Mobird.functions(obj), function(name) {
    var func = Mobird[name] = obj[name];
    Mobird.prototype[name] = function() {
      var args = [this._wrapped];
      push.apply(args, arguments);
      return result(this, func.apply(Mobird, args));
    };
  });
};

Mobird.mixin(Mobird);

Mobird.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
  var method = ArrayProto[name];
  Mobird.prototype[name] = function() {
    var obj = this._wrapped;
    method.apply(obj, arguments);
    if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
    return result(this, obj);
  };
});

Mobird.each(['concat', 'join', 'slice'], function(name) {
  var method = ArrayProto[name];
  Mobird.prototype[name] = function() {
    return result(this, method.apply(this._wrapped, arguments));
  };
});

Mobird.prototype.value = function() {
  return this._wrapped;
};

Mobird.prototype.valueOf = Mobird.prototype.toJSON = Mobird.prototype.value;

Mobird.prototype.toString = function() {
  return '' + this._wrapped;
};