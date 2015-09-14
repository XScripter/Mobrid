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

Mobird.VERSION = '0.2.1';

Mobird.$ = $;

Mobird.noConflict = function() {
  root.Mobird = previousMobird;
  return this;
};