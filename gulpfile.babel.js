import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';
import babel from 'gulp-babel';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';

/**
 * @name SRC
 * @type {string}
 */
const SRC = './src/**/*.js';

/**
 * @name SCRIPTS_STREAM
 * @constructor
 */
const SCRIPTS_STREAM = () => gulp.src(SRC).pipe(babel());

/**
 * @name DIST
 * @type {string}
 */
const DIST = './dist';

/**
 * @name clean
 */
gulp.task('clean', cb => {
    return del(DIST, {force: true}, cb);
});

/**
 * @name scripts
 */
gulp.task('scripts', () => {
    return SCRIPTS_STREAM()
        .pipe(gulp.dest(DIST));
});

/**
 * @name scripts:dist
 */
gulp.task('scripts:dist', () => {
    return SCRIPTS_STREAM()
        .pipe(concat('index.js'))
        .pipe(uglify())
        .pipe(gulp.dest(DIST));
});

/**
 * @name build
 */
gulp.task('build', cb => {
    return runSequence('clean', 'scripts', cb);
});

/**
 * @name dev
 */
gulp.task('dev', ['build'], () => gulp.watch(SRC, ['scripts']));

/**
 * @name dist
 */
gulp.task('dist', cb => {
    return runSequence('clean', ['scripts', 'scripts:dist'], cb);
});
