import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';
import babel from 'rollup-plugin-babel';
import {rollup} from 'rollup';
import file from 'gulp-file';

const MODULE_NAME = 'myModule';

/**
 * @name SRC
 * @type {string}
 */
const SRC = './src/**/*.js';

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
    return rollup({
            entry: './src/index.js',
            plugins: [
                babel({
                    presets: [
                        [
                            "es2015",
                            {
                                modules: false
                            }
                        ]
                    ],
                    "babelrc": false
                })
            ]
        })
        .then(bundle => bundle.generate({
            format: 'umd',
            moduleName: MODULE_NAME
        }))
        .then(bundle => file('index.js', bundle.code, {src: true})
            .pipe(gulp.dest(DIST)));
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
    return runSequence('clean', ['scripts'], cb);
});
