const build = './build';
const src = './source';
const config = {
  build: build,
  src: src,
  img: {
    src: [src + '/img-source/**/*.png', src + '/img-source/**/*.jpg', src + '/img-source/**/*.svg'],
    dest: build + '/img',
    opti: src + '/img/',
    optiSrc: [src + '/img/**/*', `!${src}/img/sprite/**/*`, `!${src}/img/svgSprite/**/*`]
  },

  fonts: {
    src: src + '/fonts/**/*',
    dest: build + '/fonts'
  },

  js: {
    src: src + '/js/**/*.js',
    dest: build + '/js',
    watch: build + '/js/*.js'
  },

  html: {
    src: src + '/templates/pages/*.pug',
    watch: [src + '/templates/**/*.pug', src + '/blocks/**/*.pug']
  },

  toRoot: {
    src: [src + '/toRoot/**/*', src + '/img-source/favicon/favicon.ico'],
    dest: build
  },

  scss: {
    src: src + '/scss/*.scss',
    watch: [src + '/scss/**/*.scss', src + '/blocks/**/*.scss'],
    vendor: src + '/vendor/**/*.scss',
    check: [src + '/scss/main.scss'],
    dest: build + '/css'
  },
  autoprefixer: ['last 2 versions', 'ie >= 9', 'Android >= 4.1', 'Safari >= 8', 'iOS >= 7'],
  cleanBuild: [
    build,
    src + '/img/',
    src + '/blocks/_*.js'
  ]
};

// core modules
//******************************************
const gulp = require('gulp');
const runSequence = require('run-sequence');
const chalk = require('chalk');
const args = require('yargs').argv;
const plumber = require('gulp-plumber');
const gulpif = require('gulp-if');
const pkg = require('./package.json');
const newer = require('gulp-newer');
const concat = require('gulp-concat');
const cached = require('gulp-cached');
const cache = require('gulp-cache');

// clean project
//******************************************
const del = require('del');

gulp.task('remove-files', (cb) => {
  return del(config.cleanBuild, cb);
});

gulp.task('clear-cache', () => {
  cached.caches = {};
  cache.clearAll();
});

gulp.task('del', (cb) => {
  return runSequence(
    [
      'remove-files',
      'clear-cache'
    ],
    cb
  );
});

// COPY
//******************************************
gulp.task('copyFonts', () => {
  return gulp.src(config.fonts.src)
  .pipe(gulp.dest(config.fonts.dest));
});

gulp.task('toRoot', () => {
  return gulp.src(config.toRoot.src)
  .pipe(gulp.dest(config.toRoot.dest));
});

gulp.task('faviconCopy', () => {
  return gulp.src([config.src + '/img-source/favicon/browserconfig.xml', config.src + '/img-source/favicon/manifest.json'])
  .pipe(gulp.dest(config.build + '/img/favicon/'));
});

gulp.task('imgOptimizedCopy', function () {
  return gulp.src(config.img.optiSrc)
  .pipe(gulp.dest(config.img.dest));
});

gulp.task('copy', (cb) => {
  return runSequence(
    [
      'copyFonts',
      'faviconCopy',
      'toRoot',
      'imgOptimizedCopy'
    ],
    cb
  );
});

// html
//******************************************
const moment = require('moment-timezone');
const time = moment().tz(pkg.clientTimeZone).format('DD MMM YYYY, HH:mm');
const pug = require('gulp-pug');
const ip = require('ip');
const data = require('gulp-data');

gulp.task('html', () => {
  return gulp.src(config.html.src)
  .pipe(gulpif(
    args.dev,
    plumber({
      errorHandler: (error) => {
        console.log(chalk.red(`ERROR in PUG: ${error.message}`));
      }
    }))
  )
  .pipe(data({
    time: time,
    timeZone: pkg.clientTimeZone,
    project: pkg.title,
    path: '',
    ver: Math.round(+new Date()),
    lang: pkg.lang,
    urlRepo: pkg.repository.url,
    IP: ip.address(),
    develop: args.dev
  }))
  .pipe(pug({
    pretty: true
  }))
  .pipe(gulp.dest(config.build))
  .on('end', () => {
    console.log(chalk.green('✔ HTML build is completed!'));
  });
});

// images
//******************************************
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const jpegoptim = require('imagemin-jpegoptim');

gulp.task('imgOptimize', function () {
  return gulp.src(config.img.src)
  .pipe(newer(config.img.opti))
  .pipe(cache(imagemin({
    removeViewBox: true,
    cleanupAttrs: true,
    addAttributesToSVGElement: true,
    progressive: true,
    verbose: true,
    interlaced: true,
    optimizationLevel: 4,
    use: [
      pngquant({
        quality: '97',
        speed: 4
      }),
      jpegoptim({
        progressive: true,
        max: 80
      })
    ]
  })))
  .pipe(gulp.dest(config.img.opti))
  .on('end', () => {
    console.log(chalk.green('✔ Images optimize is completed!'));
  });
});

// Styles
//******************************************
const csscomb = require('gulp-csscomb');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const postcssGulp = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const lost = require('lost');

let postCSS = [lost, autoprefixer({browsers: config.autoprefixer})];

gulp.task('scss', () => {
  return gulp.src(config.scss.src)
  .pipe(gulpif(
    args.dev,
    plumber({
      errorHandler: (error) => {
        console.log(chalk.red(`ERROR in SCSS: ${error.message}`));
      }
    }))
  )
  .pipe(gulpif(args.dev, sourcemaps.init()))
  .pipe(sass())
  .pipe(postcssGulp(postCSS))
  .pipe(gulpif(
    args.dev,
    postcssGulp(postCSS),
    postcssGulp(postCSS.concat([mqpacker({sort: true})]))
  ))
  .pipe(gulpif(!args.dev, csscomb()))
  .pipe(gulpif(
    args.compress,
    postcssGulp([cssnano()])
  ))
  .pipe(gulpif(args.dev, sourcemaps.write({sourceRoot: './source/scss/'})))
  .pipe(gulp.dest(config.scss.dest))
  .on('end', () => {
    console.log(chalk.green('✔ Build CSS is completed!'));
  });
});

// JavaScripts
//******************************************
const include = require('gulp-include');
const uglify = require('gulp-uglify');
const stripDebug = require('gulp-strip-debug');

gulp.task('jsBlocks', function () {
  return gulp.src(['./source/blocks/**/*.js', '!./source/blocks/**/_*.js', '!./source/blocks/**/bootstrap/*.js'])
  .pipe(cached('jsBlockCache'))
  .pipe(concat('_blocks.js'))
  .pipe(gulp.dest('./source/blocks/'));
});

gulp.task('jsApp', function () {
  return gulp.src('./source/js/app.js')
  .pipe(include())
  .pipe(gulpif(!args.dev, stripDebug()))
  .pipe(gulpif(args.compress, uglify()))
  .pipe(gulp.dest('./build/js/'));
});

gulp.task('jsCommon', function () {
  return gulp.src(['./source/vendor/*.js'])
  .pipe(newer(config.build + '/js/common.js'))
  .pipe(concat('common.js'))
  .pipe(uglify({preserveComments: 'all'}))
  .pipe(gulp.dest('./build/js/'));
});

gulp.task('js', (cb) => {
  return runSequence(
    'jsBlocks',
    [
      'jsApp',
      'jsCommon'
    ],
    cb
  );
});

// Watch
//******************************************
const watch = require('gulp-watch');
gulp.task('watch', () => {
  watch(config.img.src, () => runSequence('imgOptimize'));
  watch(config.img.opti, () => runSequence('imgOptimizedCopy'));
  watch(config.html.watch, () => runSequence('html'));
  watch(config.scss.watch, () => runSequence('scss'));
  watch([config.src + '/blocks/**/*.js', '!' + config.src + '/blocks/**/_*.js'], () => runSequence('jsBlocks'));
  watch([config.src + '/blocks/_*.js', config.src + '/js/app.js'], () => runSequence('jsApp'));
  watch(config.src + '/vendor/*.js', () => runSequence('jsCommon'));
});

// SFTP deploy
//******************************************
const access = require('./.ftpaccess.json');
const sftp = require('gulp-sftp');
gulp.task('sftp', function () {
  return gulp.src('./build/**/*')
  .pipe(sftp({
    host: access.host,
    port: access.port,
    user: access.user,
    pass: access.pass,
    remotePath: access.rootPath + pkg.name
  }))
  .on('finish', function () {
    console.log(chalk.green(`✔ ${access.site}${pkg.name}`));
  });
});

// default task
//******************************************
gulp.task('default', () => {

  if (args.dev) {
    return runSequence(
      ['imgOptimize', 'scss', 'html', 'js'],
      'copy',
      'watch'
    );
  } else if (args.deploy) {
    return runSequence(
      'del',
      ['imgOptimize', 'scss', 'html', 'js'],
      'copy',
      'sftp'
    );
  } else {
    return runSequence(
      'del',
      ['imgOptimize', 'scss', 'html', 'js'],
      'copy'
    );
  }

});


