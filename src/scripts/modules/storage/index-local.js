Mobird.defineModule('modules/storage/local', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.LocalStorage = function(name, element) {
    this.name = name;
    this.element = element;
  };

  Mobird.extend(Storage.LocalStorage.prototype, {

    isAvailable: function() {
      return ('localStorage' in window) && (window.location.protocol != 'file:');
    },
    exists: function(key) {
      return (this.get(key) != null);
    },
    set: function(key, value) {
      return window.localStorage.setItem(this._key(key), value);
    },
    get: function(key) {
      return window.localStorage.getItem(this._key(key));
    },
    clear: function(key) {
      window.localStorage.removeItem(this._key(key));
    },
    _key: function(key) {
      return ['store', this.element, this.name, key].join('.');
    }

  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/local');