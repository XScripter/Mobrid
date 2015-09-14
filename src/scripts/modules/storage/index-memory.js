Mobird.defineModule('modules/storage/memory', function(require, exports, module) {

  var Storage = require('modules/storage');

  Storage.Memory = function(name, element) {
    this.name = name;
    this.element = element;
    this.namespace = [this.element, this.name].join('.');
    Storage.Memory.store = Storage.Memory.store || {};
    Storage.Memory.store[this.namespace] = Storage.Memory.store[this.namespace] || {};
    this.store = Storage.Memory.store[this.namespace];
  };

  Mobird.extend(Storage.Memory.prototype, {
    isAvailable: function() {
      return true;
    },
    exists: function(key) {
      return (typeof this.store[key] != 'undefined');
    },
    set: function(key, value) {
      return this.store[key] = value;
    },
    get: function(key) {
      return this.store[key];
    },
    clear: function(key) {
      delete this.store[key];
    }
  });

  module.exports = Storage;

});
Mobird.requireModule('modules/storage/memory');