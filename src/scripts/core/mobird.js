var previousMobird = root.Mobird;

var Mobird = function(obj) {
  if (obj instanceof Mobird) {
    return obj;
  }
  if (!(this instanceof Mobird)) {
    return new Mobird(obj);
  }
  this._wrapped = obj;
};

Mobird.VERSION = '<%= pkg.version %>';

Mobird.$ = $;

Mobird.noConflict = function() {
  root.Mobird = previousMobird;
  return this;
};