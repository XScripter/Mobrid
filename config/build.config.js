module.exports = {

  filename: 'mobird',

  banner: [
    '/**',
    ' * <%= pkg.name %> <%= pkg.version %>',
    ' * <%= pkg.description %>',
    ' * ',
    ' * <%= pkg.homepage %>',
    ' * ',
    ' * Copyright <%= date.year %>, <%= pkg.author %>',
    ' * The XScripter.com',
    ' * http://www.xscripter.com/',
    ' * ',
    ' * Licensed under <%= pkg.license.join(" & ") %>',
    ' * ',
    ' * Released on: <%= date.month %> <%= date.day %>, <%= date.year %>',
    ' */',
    ''
  ].join('\n'),

  customBanner: [
    '/**',
    ' * <%= pkg.name %> <%= pkg.version %> - Custom Build',
    ' * <%= pkg.description %>',
    ' * ',
    ' * Included modules: <%= modulesList %>',
    ' * ',
    ' * <%= pkg.homepage %>',
    ' * ',
    ' * Copyright <%= date.year %>, <%= pkg.author %>',
    ' * The XScripter.com',
    ' * http://www.xscripter.com/',
    ' * ',
    ' * Licensed under <%= pkg.license.join(" & ") %>',
    ' * ',
    ' * Released on: <%= date.month %> <%= date.day %>, <%= date.year %>',
    ' */',
    ''
  ].join('\n'),

  date: {
    year: new Date().getFullYear(),
    month: ('January February March April May June July August September October November December').split(' ')[new Date().getMonth()],
    day: new Date().getDate()
  },

  paths: {
    root: './',
    build: {
      root: 'build/',
      styles: 'build/css/',
      scripts: 'build/js/'
    },
    custom: {
      root: 'custom/',
      styles: 'custom/css/',
      scripts: 'custom/js/',
    },
    dist: {
      root: 'dist/',
      styles: 'dist/css/',
      scripts: 'dist/js/'
    },
    source: {
      root: 'src/',
      styles: 'src/styles/',
      scripts: 'src/scripts/*.js'
    }
  },

  coreFiles: {
    'scripts': [
      'src/scripts/core/mobird.prefix',
      'src/scripts/core/mobird.js',
      'src/scripts/core/lang/index.js',
      'src/scripts/core/lang/index-collections.js',
      'src/scripts/core/lang/index-arrays.js',
      'src/scripts/core/lang/index-objects.js',
      'src/scripts/core/lang/index-functions.js',
      'src/scripts/core/lang/index-utility.js',
      'src/scripts/core/lang/index-oop.js',
      'src/scripts/core/lang/index-dom.js',
      'src/scripts/core/module/index.js',
      'src/scripts/core/dom/index.js',
      'src/scripts/core/dom/index-data.js',
      'src/scripts/core/dom/index-event.js',
      'src/scripts/core/dom/index-selector.js',
      'src/scripts/core/dom/index-fx.js',
      'src/scripts/core/base/index.js',
      'src/scripts/core/support/index.js',
      'src/scripts/core/events/index.js',
      'src/scripts/core/class/index.js',
      'src/scripts/core/deferred/index.js',
      'src/scripts/core/callbacks/index.js',
      'src/scripts/core/commands/index.js',
      'src/scripts/core/router/index.js',
      'src/scripts/core/view/index.js',
      'src/scripts/core/view/index-view.js',
      'src/scripts/core/view/index-component.js',
      'src/scripts/core/screen/index.js',
      'src/scripts/core/screen/index-transition.js',
      'src/scripts/core/screen/index-manager.js',
      'src/scripts/core/application/index.js',
      'src/scripts/core/mobird.suffix'
    ],
    'styles': []
  },

  moduleFiles: {

    'template': {
      'scripts': [
        'src/scripts/modules/template/index.js'
      ],
      'styles': [],
      'dependencies': []
    },

    'url': {
      'scripts': [
        'src/scripts/modules/url/index.js'
      ],
      'styles': [],
      'dependencies': []
    },

    'http': {
      'scripts': [
        'src/scripts/modules/http/index.js'
      ],
      'styles': [],
      'dependencies': ['url']
    },

    'storage': {
      'scripts': [
        'src/scripts/modules/storage/index.js'
      ],
      'styles': [],
      'dependencies': []
    },

    'storage.cookie': {
      'scripts': [
        'src/scripts/modules/storage/index-cookie.js'
      ],
      'styles': [],
      'dependencies': ['storage']
    },

    'storage.data': {
      'scripts': [
        'src/scripts/modules/storage/index-data.js'
      ],
      'styles': [],
      'dependencies': ['storage']
    },

    'storage.local': {
      'scripts': [
        'src/scripts/modules/storage/index-local.js'
      ],
      'styles': [],
      'dependencies': ['storage']
    },

    'storage.memory': {
      'scripts': [
        'src/scripts/modules/storage/index-memory.js'
      ],
      'styles': [],
      'dependencies': ['storage']
    },

    'storage.session': {
      'scripts': [
        'src/scripts/modules/storage/index-session.js'
      ],
      'styles': [],
      'dependencies': ['storage']
    },

    'platform': {
      'scripts': [
        'src/scripts/modules/platform/index.js'
      ],
      'styles': [],
      'dependencies': []
    },

    'scroller': {
      'scripts': [
        'src/scripts/modules/scroller/index.js'
      ],
      'styles': [],
      'dependencies': []
    },

    'touchclick': {
      'scripts': [
        'src/scripts/modules/touchclick/index.js'
      ],
      'styles': [],
      'dependencies': []
    },

    'viewport': {
      'scripts': [
        'src/scripts/modules/viewport/index.js'
      ],
      'styles': [],
      'dependencies': ['platform']
    },

    'swipe': {
      'scripts': [
        'src/scripts/modules/swipe/index.js'
      ],
      'styles': [],
      'dependencies': []
    },

    'imagelazy': {
      'scripts': [
        'src/scripts/modules/imagelazy/index.js'
      ],
      'styles': [],
      'dependencies': []
    }

  }

};