'use strict';
// ===================================================================================================
// varables for nodejs
// ===================================================================================================
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    sassGlob = require('gulp-sass-glob'),
    cssnano = require('gulp-cssnano'),
    sassVars = require('gulp-sass-variables'),
    pug = require('gulp-pug'),
    autoprefixer = require('gulp-autoprefixer'),
    del = require('del'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    plumber = require('gulp-plumber'),
    gulpif = require('gulp-if'),
    runSequence = require('run-sequence'),
    zip = require('gulp-zip'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync'),
    express = require('express'),
    fs      = require('fs'),
    favicon = require('serve-favicon'),
    newer = require('gulp-newer');
var app = express();
var listener, port;
// ===================================================================================================
// flags - minify, browserSync and no watching)
// ===================================================================================================
var flags = {
  minify: false,
  bs: true,
  watch: true
};

gulp.task('isMinify', function () {
  flags.minify = true;
  console.log('===> minify - ', flags.minify);
});

gulp.task('isNoWatch', function () {
  flags.watch = false;
  console.log('===> watching - ', flags.watch);
});
gulp.task('isNoBs', function () {
  flags.bs = false;
  console.log('===> browser-sync - ', flags.bs);
});
// ===================================================================================================
// include PATH SCSS Список путей для поиска файла (имя файла для поиска в style.scss)
// ===================================================================================================
var sassPaths = ["./node_modules/node-normalize-scss/"];
// ===================================================================================================
// settings PATH
// ===================================================================================================
var path = {
    dist: {
        html: 'docs/',
        js: 'docs/js/',
        css: 'docs/css/',
        images: 'docs/images/',
        i: 'docs/i/',
        fonts: 'docs/fonts/'
    },
    src: {
        html: 'src/pug/*.pug',
        js: 'src/js/components/*.js',
        css: ['src/scss/style.scss'],
        images: 'src/images/**/*.*',
        i: 'src/i/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
      // 'Path must be a string' for gulp-watch
        html: 'src/pug/**/*.pug',
        js: 'src/js/**/*.js',
        css: 'src/scss/**/*.scss',
        images: 'src/images/**/*.*',
        i: 'src/i/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    cleanFolder: './docs'
};
// ===================================================================================================
// tasks CLEAN
// ===================================================================================================
gulp.task('clean-css', function() {
    return del(path.dist.css);
});
gulp.task('clean-html', function() {
    return del(path.dist.html + '*.html');
});
gulp.task('clean-images', function() {
    return del(path.dist.images);
});
gulp.task('clean-i', function() {
    return del(path.dist.i);
});
gulp.task('clean-fonts', function() {
    return del(path.dist.fonts);
});
gulp.task('clean-js', function() {
    return del(path.dist.js);
});
gulp.task('clean-all', function() {
    return del(path.cleanFolder);
});
// ===================================================================================================
// tasks SASS/SCSS
// ===================================================================================================
gulp.task('sass', function() {
  return gulp.src(path.src.css)
        .pipe(plumber())
        .pipe(gulpif(flags.bs, sourcemaps.init()))
        .pipe(sassGlob())
        .pipe(sass({ includePaths: sassPaths }).on('error', sass.logError) )
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'ie >= 10'],
            cascade: false
        }))
        .pipe(gulpif(flags.minify, cssnano() ))
        .pipe(gulpif(flags.bs, sourcemaps.write() ))
        .pipe(gulp.dest(path.dist.css));
});
// ===================================================================================================
// tasks Pugjs
// ===================================================================================================
gulp.task('pug', function () {

  if (flags.bs) {
    // отключаем кеширования
    app.disable('view cache');
    // указываем какой шаблонизатор использовать
    app.set('view engine', 'pug');
    // расположение шаблонов ('src/pug')
    app.set('views', './');
    // путь до наших стилей, картинок, скриптов и т.д.
    app.use('/css', express.static('docs/css'));
    app.use('/fonts', express.static('docs/fonts'));
    app.use('/i', express.static('docs/i'));
    app.use('/images', express.static('docs/images'));
    app.use('/js', express.static('docs/js'));
    app.use(favicon('src/favicon/index.ico'));
    // роутинг на наши страницы
    app.get('/*.*', function(req, res) {
      // регулярка для получения пути до шаблона
      // \ или \. . * ноль или более в конце строки $, g - все совпадения
      var regexp = /\/|\..*$/g;
      var fileName = req.url.replace(regexp, '') || 'index';
      res.render('src/pug/' + fileName, {});
    });
    // редирект на главную страницу
    app.get('/static', function(req, res) {
      res.redirect('/index.html');
    });

    listener    = app.listen(2999);
    port        = listener.address().port;

  }

  if ( (!flags.bs && flags.watch) || (!flags.bs && !flags.watch) ) {

    return gulp.src(path.src.html)
          .pipe(plumber())
          .pipe(pug({
              pretty: true,
              cache: true,
              locals: {minify: flags.minify}
          }))
          .pipe(gulp.dest(path.dist.html));

  }

});


// ===================================================================================================
// tasks IMAGES
// ===================================================================================================
gulp.task('images', function () {
  return gulp.src(path.src.images)
        .pipe(gulpif(flags.bs, newer(path.dist.images)))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.dist.images))
        .pipe(gulpif(flags.watch, browserSync.stream()) );
});
// ===================================================================================================
// task temp images
// ===================================================================================================
gulp.task('i', function() {
  return gulp.src(path.src.i)
        .pipe(gulpif(flags.bs, newer(path.dist.i)))
        .pipe(gulp.dest(path.dist.i))
        .pipe(gulpif(flags.watch, browserSync.stream()) );
});
// ===================================================================================================
// task FONT
// ===================================================================================================
gulp.task('fonts', function() {
  return gulp.src([path.src.fonts])
        .pipe(gulp.dest(path.dist.fonts));
});
// ===================================================================================================
// tasks JS
// ===================================================================================================
gulp.task('js-App', function() {
  return gulp.src(path.src.js)
        .pipe(gulpif(flags.minify, uglify()))
        .pipe(concat('app.js'))
        .pipe(gulp.dest(path.dist.js));
});
// ===================================================================================================
// BrowserSync and settings
// ===================================================================================================
var initBrowserSync = function(){
    return browserSync.init({
        // Customize the Browsersync console logging prefix
        logPrefix: 'BrowserSync',
        // Sync viewports to TOP position
        scrollProportionally: true,
        //Открывать страницу в браузере по умолчанию
        open: true,
        // true включать изменения, false перезагрузка страницы
        injectChanges: false,
        //watch files ["app/css/style.css", "app/js/*.js"]
        files: ["./docs",'./src/pug/**/*'],
        // Wait for 1 seconds before any browsers should try to inject/reload a file.
        // reloadDelay: 1000,
        // proxy на локальный сервер Express
        proxy: 'http://localhost:' + port,
        startPath: '/static/',
        notify: false,
        tunnel: false,
        host: 'localhost',
        port: port,
    });
};

gulp.task('browser-sync', function() {

  if (flags.bs) {
    initBrowserSync();
  } else {
    console.log('===> Browser-Sync - OFF!');
  }

});
// ===================================================================================================
// tasks ZIP Archive
// ===================================================================================================
gulp.task('zipArchive', function() {
  return gulp.src('docs/**/*.*')
        .pipe(zip('archive.zip'))
        .pipe(gulp.dest('docs'));
});
// ===================================================================================================
// tasks Watch
// ===================================================================================================
gulp.task('watch', function () {

  if(flags.watch) {
    console.log("===> watching - ", flags.watch);

    gulp.watch(path.watch.css, ["sass"]);
    gulp.watch(path.watch.images, ["images"]);
    gulp.watch(path.watch.i, ["i"]);
    gulp.watch(path.watch.fonts, ["fonts"]);
    gulp.watch(path.watch.js, ["js-App"]);
        
  } else {
    console.log('===> WATCHING - OFF!');
  }

  if (!flags.bs && flags.watch) {
    gulp.watch(path.watch.html, ["pug"]);
  }

});
// ===================================================================================================
// tasks JOBS
// ===================================================================================================
// * runSequence
// * 'clean-all' последовательно
// * [] параллейно
gulp.task('default', function() {
  runSequence('clean-all',
              'isNoBs',
              ['sass', 'images', 'i', 'fonts', 'js-App'],
              'pug', 'watch'
              );
});

gulp.task('dev', function() {
  runSequence('clean-all',
              ['sass', 'images', 'i', 'fonts', 'js-App'],
              'pug',
              ['watch', 'browser-sync']
              );
});

gulp.task('minify', function(){
  runSequence('isMinify', 'isNoBs', 'isNoWatch', 'default');
});

gulp.task('build', function(){
  runSequence('isNoBs', 'isNoWatch', 'default');
});

gulp.task('zip', function () {
    runSequence('clean-all',
                'isNoBs', 'isNoWatch',
                ['sass', 'images', 'i', 'fonts', 'js-App'],
                'pug',
                'zipArchive'
                );
});
