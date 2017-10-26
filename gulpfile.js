const gulp = require('gulp'),
      minifyCss = require('gulp-clean-css'),
      rename = require('gulp-rename');

gulp.task('minify-css', () => {
  gulp.src('content/styles/*.css')
    .pipe(minifyCss())
    .pipe(rename({
      suffix: '.min'
  }))
    .pipe(gulp.dest('content/styles'))
})