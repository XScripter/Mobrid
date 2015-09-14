(function() {

  var gulp = require('gulp'),
    connect = require('gulp-connect'),
    open = require('gulp-open'),
    rename = require('gulp-rename'),
    header = require('gulp-header'),
    path = require('path'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    sass = require('gulp-sass'),
    minifyCSS = require('gulp-minify-css'),
    tap = require('gulp-tap'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    fs = require('fs'),
    template = require('gulp-template'),
    qunit = require('gulp-qunit'),
    argv = require('minimist')(process.argv.slice(2));

  var buildConfig = require('./config/build.config.js');
  var pkg = require('./package.json');

  function addJSIndent(file, t) {
    var addIndent = '  ';
    var filename = file.path.split('src/scripts/')[1];

    if (filename === 'core/mobird.prefix' || filename === 'core/mobird.suffix' || filename.indexOf('modules') >= 0) {
      addIndent = '';
    }

    if (addIndent !== '') {
      var fileLines = fs.readFileSync(file.path).toString().split('\n');
      var newFileContents = '';
      for (var i = 0; i < fileLines.length; i++) {
        newFileContents += addIndent + fileLines[i] + (i === fileLines.length ? '' : '\n');
      }
      file.contents = new Buffer(newFileContents);
    }
  }

  gulp.task('styles', function(done) {
    gulp.src('src/styles/**/*.scss')
      .pipe(sourcemaps.init())
      .pipe(header(buildConfig.banner, {
        pkg: pkg,
        date: buildConfig.date
      }))
      .pipe(sass({
        onError: function(err) {
          done(err);
        }
      }))
      .pipe(concat(buildConfig.filename + '.css'))
      .pipe(gulp.dest(buildConfig.paths.build.styles))
      .pipe(minifyCSS())
      .pipe(rename({
        extname: '.min.css'
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(buildConfig.paths.build.styles))
      .on('end', done);
  });

  /* ==================================================================
   * Build Mobird
   * ================================================================== */

  gulp.task('scripts', function(cb) {

    gulp.src(buildConfig.coreFiles.scripts)
      .pipe(tap(function(file, t) {
        addJSIndent(file, t);
      }))
      .pipe(template({ pkg: pkg }))
      .pipe(sourcemaps.init())
      .pipe(concat(buildConfig.filename + '.js'))
      .pipe(header(buildConfig.banner, {
        pkg: pkg,
        date: buildConfig.date
      }))
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(gulp.dest(buildConfig.paths.build.scripts))
      .pipe(uglify())
      .pipe(header(buildConfig.banner, {
        pkg: pkg,
        date: buildConfig.date
      }))
      .pipe(rename({
        extname: '.min.js'
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(buildConfig.paths.build.scripts))
      .pipe(connect.reload())
      .on('end', function() {
        cb();
      });
  });

  // --modules=template,url,http,storage,storage.cookie,storage.data,storage.local,storage.memory,storage.session,platform,scroller,touchclick,viewport
  gulp.task('custom', function() {
    var modules = argv.modules;
    modules = modules.toString();
    if (modules === '') {
      modules = [];
    } else {
      modules = modules.replace(/ /g, '').replace(/,,/g, ',');
      modules = modules.split(',');
    }

    var modulesJsList = [];
    var i, module;

    for (i = 0; i < modules.length; i++) {
      module = buildConfig.moduleFiles[modules[i]];
      if (module.dependencies.length > 0) {
        modules.push.apply(modules, module.dependencies);
      }
    }
    for (i = 0; i < modules.length; i++) {
      module = buildConfig.moduleFiles[modules[i]];
      if (!(module)) continue;

      if (module.scripts.length > 0) {
        modulesJsList.push.apply(modulesJsList, module.scripts);
      }
    }

    // Unique
    var customJsList = [];
    for (i = 0; i < modulesJsList.length; i++) {
      if (customJsList.indexOf(modulesJsList[i]) < 0) customJsList.push(modulesJsList[i]);
    }

    console.log(customJsList);

    gulp.src(customJsList)
      .pipe(tap(function(file, t) {
        addJSIndent(file, t);
      }))
      .pipe(concat(buildConfig.filename + '.custom.js'))
      .pipe(header(buildConfig.customBanner, {
        pkg: pkg,
        date: buildConfig.date,
        modulesList: modules.join(',')
      }))
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(gulp.dest(buildConfig.paths.custom.scripts))

      .pipe(uglify())
      .pipe(header(buildConfig.customBanner, {
        pkg: pkg,
        date: buildConfig.date,
        modulesList: modules.join(',')
      }))
      .pipe(rename(function(path) {
        path.basename = path.basename + '.min';
      }))
      .pipe(gulp.dest(buildConfig.paths.custom.scripts));

  });

  gulp.task('test-node', function() {
    return gulp.src('test/test-runner.html')
      .pipe(qunit());
  });

})();