Mobird.defineModule('modules/storage/data', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.Data = function(name, element) {
    this.name = name;
    this.element = element;
    this.$element = Mobird.$(element);
  };

  Mobird.extend(Storage.Data.prototype, {
    isAvailable: function() {
      return true;
    },
    exists: function(key) {
      return !!this.$element.data(this._key(key));
    },
    set: function(key, value) {
      return this.$element.data(this._key(key), value);
    },
    get: function(key) {
      return this.$element.data(this._key(key));
    },
    clear: function(key) {
      this.$element.removeData(this._key(key));
    },
    _key: function(key) {
      return ['store', this.name, key].join('.');
    }
  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/data');