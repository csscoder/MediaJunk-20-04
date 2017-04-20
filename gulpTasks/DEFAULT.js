import gulp from 'gulp';
import runSequence from 'run-sequence';
const args = require('yargs').argv;

gulp.task('default', () => {

  if (args.dev) {
    return runSequence(
      'img-optymize',
      'img-to-build',
      'jsBlocks',
      ['jsApp','jsCommon'],
       'copy',
      ['scss', 'html'],
      'watch-files'
    );
  } else if (args.deploy) {
    // for deploy to SFTP server
    return runSequence(
      'del',
      'img-optymize',
      'img-to-build',
      'jsBlocks',
      ['jsApp','jsCommon'],
      'copy',
      ['scss', 'html'],
      'sftp'
    );
  } else {
    // for dev version
    return runSequence(
      'del',
      'img-optymize',
      'img-to-build',
      'jsBlocks',
      ['jsApp','jsCommon'],
      'copy',
      ['scss', 'html']
    );
  }

});
