var __mobuleRequire;
var __mobuleDefine;
var __modules = {};
var __moduleRequireStack = [];
var __moduleInProgressModules = {};

function __moduleBuild(module) {
  var factory = module.factory,
    SEPERATOR = '.',
    localRequire = function(id) {
      var resultantId = id;
      //Its a relative path, so lop off the last portion and add the id (minus './')
      if (id.charAt(0) === SEPERATOR) {
        resultantId = module.id.slice(0, module.id.lastIndexOf(SEPERATOR)) + SEPERATOR + id.slice(2);
      }
      return __mobuleRequire(resultantId);
    };
  module.exports = {};
  delete module.factory;
  factory(localRequire, module.exports, module);
  return module.exports;
}

Mobird.requireModule = __mobuleRequire = function(id) {
  if (!__modules[id]) {
    throw 'module ' + id + ' not found';
  } else if (id in __moduleInProgressModules) {
    var cycle = __moduleRequireStack.slice(__moduleInProgressModules[id]).join('->') + '->' + id;
    throw 'Cycle in module require graph: ' + cycle;
  }
  if (__modules[id].factory) {
    try {
      __moduleInProgressModules[id] = __moduleRequireStack.length;
      __moduleRequireStack.push(id);
      return __moduleBuild(__modules[id]);
    } finally {
      delete __moduleInProgressModules[id];
      __moduleRequireStack.pop();
    }
  }
  return __modules[id].exports;
};

Mobird.defineModule = __mobuleDefine = function(id, factory) {
  if (__modules[id]) {
    throw 'module ' + id + ' already defined';
  }

  __modules[id] = {
    id: id,
    factory: factory
  };
};

Mobird.Module = {

  require: __mobuleRequire,

  define: __mobuleDefine,

  remove: function(id) {
    delete __modules[id];
  },

  map: function() {
    return __modules;
  }

};