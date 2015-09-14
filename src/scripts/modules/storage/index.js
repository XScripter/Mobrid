Mobird.defineModule('modules/storage', function(require, exports, module) {

  var Storage = function(options) {

    var store = this;
    this.options = options || {};
    this.name = this.options.name || 'store';
    this.element = this.options.element || 'body';
    this.$element = Mobird.$(this.element);

    if (Mobird.isArray(this.options.type)) {
      Mobird.each(this.options.type, function(type, i) {
        if (Storage.isAvailable(type)) {
          store.type = type;
          return false;
        }
      });
    } else {
      this.type = this.options.type || 'memory';
    }
    this.meta_key = this.options.meta_key || '__keys__';
    this.storage = new Storage[Storage.stores[this.type]](this.name, this.element, this.options);
  };

  Storage.stores = {
    'memory': 'Memory',
    'data': 'Data',
    'local': 'LocalStorage',
    'session': 'SessionStorage',
    'cookie': 'Cookie'
  };

  Mobird.extend(Storage.prototype, {

    isAvailable: function() {
      if (Mobird.isFunction(this.storage.isAvailable)) {
        return this.storage.isAvailable();
      } else {
        return true;
      }
    },

    exists: function(key) {
      return this.storage.exists(key);
    },

    set: function(key, value) {
      var string_value = (typeof value == 'string') ? value : JSON.stringify(value);
      key = key.toString();
      this.storage.set(key, string_value);
      if (key != this.meta_key) {
        this._addKey(key);
        this.$element.trigger('set-' + this.name, {
          key: key,
          value: value
        });
        this.$element.trigger('set-' + this.name + '-' + key, {
          key: key,
          value: value
        });
      }
      // always return the original value
      return value;
    },

    get: function(key) {
      var value = this.storage.get(key);
      if (typeof value == 'undefined' || value == null || value == '') {
        return value;
      }
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    },

    clear: function(key) {
      this._removeKey(key);
      return this.storage.clear(key);
    },

    clearAll: function() {
      var self = this;
      this.each(function(key, value) {
        self.clear(key);
      });
    },

    keys: function() {
      return this.get(this.meta_key) || [];
    },

    each: function(callback) {
      var i = 0,
        keys = this.keys(),
        returned;

      for (i; i < keys.length; i++) {
        returned = callback(keys[i], this.get(keys[i]));
        if (returned === false) {
          return false;
        }
      }
    },

    filter: function(callback) {
      var found = [];
      this.each(function(key, value) {
        if (callback(key, value)) {
          found.push([key, value]);
        }
        return true;
      });
      return found;
    },

    first: function(callback) {
      var found = false;
      this.each(function(key, value) {
        if (callback(key, value)) {
          found = [key, value];
          return false;
        }
      });
      return found;
    },

    fetch: function(key, callback) {
      if (!this.exists(key)) {
        return this.set(key, callback.apply(this));
      } else {
        return this.get(key);
      }
    },

    _addKey: function(key) {
      var keys = this.keys();
      if (Mobird.inArray(key, keys) == -1) {
        keys.push(key);
      }
      this.set(this.meta_key, keys);
    },
    _removeKey: function(key) {
      var keys = this.keys();
      var index = Mobird.inArray(key, keys);
      if (index != -1) {
        keys.splice(index, 1);
      }
      this.set(this.meta_key, keys);
    }
  });

  Storage.isAvailable = function(type) {
    try {
      return Storage[Storage.stores[type]].prototype.isAvailable();
    } catch (e) {
      return false;
    }
  };

  module.exports = Storage;

});
Mobird.Storage = Mobird.requireModule('modules/storage');