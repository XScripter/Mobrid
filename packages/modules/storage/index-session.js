Mobird.defineModule('modules/storage/session', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.SessionStorage = function(name, element) {
    this.name = name;
    this.element = element;
  };

  Mobird.extend(Storage.SessionStorage.prototype, {
    isAvailable: function() {
      return ('sessionStorage' in window) &&
        (window.location.protocol != 'file:') &&
        (Mobird.isFunction(window.sessionStorage.setItem));
    },
    exists: function(key) {
      return (this.get(key) != null);
    },
    set: function(key, value) {
      return window.sessionStorage.setItem(this._key(key), value);
    },
    get: function(key) {
      var value = window.sessionStorage.getItem(this._key(key));
      if (value && typeof value.value != 'undefined') {
        value = value.value
      }
      return value;
    },
    clear: function(key) {
      window.sessionStorage.removeItem(this._key(key));
    },
    _key: function(key) {
      return ['store', this.element, this.name, key].join('.');
    }
  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/session');