const config = require('./CONFIG');
const watch = require('gulp-watch');
const gulp = require('gulp');
const runSequence = require('run-sequence');

gulp.task('watch-files', () => {
  global.watch = true;
  watch(config.img.src, () => runSequence('img-optymize'));
  watch(config.img.opti, () => runSequence('img-to-build'));
  watch(config.html.watch, () => runSequence('html'));
  watch(config.scss.watch, () => runSequence('scss'));

  watch(['./source/blocks/**/*.js','!./source/blocks/**/_*.js'], () => runSequence('jsBlocks'));
  watch(['./source/blocks/_*.js', './source/js/app.js'], () => runSequence('jsApp'));
  watch('./source/vendor/*.js', () => runSequence('jsCommon'));

});
