'use strict';

var fs = require('fs');
var path = require('path');

var gulp = require('gulp');
var gulpif = require('gulp-if');

var del = require('del');

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var template = require('gulp-lodash-template');

var stylus = require('gulp-stylus');
var nib = require('nib');

var usemin = require('gulp-usemin');
var revall = require('gulp-rev-all');

var cdnReplace = require('gulp-cdn-replace');

var sprite = require('css-sprite').stream;

var zip = require('gulp-zip');

var run = require('run-sequence');

var project = require('./project');

var src = './src';
var dest = {
    root: './public',
    webserver: './public/webserver',
    cdn: './public/cdn',
    offline: './public/offline'
};
var offline = './offline';
var cdn = {
    js: typeof project.cdn === 'string' ? project.cdn : (project.cdn.js || ''),
    css: typeof project.cdn === 'string' ? project.cdn : (project.cdn.css || '')
};

function getDirFromUrl(url) {
    url = url.split('//');
    return url[url.length - 1];
}

gulp.task('clean', function(fn) {
    del(dest.root, fn);
});
gulp.task('clean-dev', function(fn) {
    del([src + '/js', src + '/css'], fn);
});
gulp.task('clean-offline', function(fn) {
    del(offline, fn);
});

gulp.task('tmpl', function() {
    return gulp.src(src + '/browserify/tmpl/*.html')
        .pipe(template({
            strict: true,
            commonjs: true
        }))
        .pipe(gulp.dest(src + '/browserify/tmpl/'));
});

gulp.task('browserify', ['tmpl'], function() {
    return browserify(src + '/browserify/index.js')
        .bundle()
        .pipe(source('index.js'))
        .pipe(gulp.dest(src + '/js/'));
});

gulp.task('jslib', function() {
    return gulp.src(src + '/browserify/lib/**.js')
        .pipe(gulp.dest(src + '/js/lib/'));
});

gulp.task('stylus', function() {
    return gulp.src(src + '/stylus/!(_)*.styl')
        .pipe(stylus({use: [nib()]}))
        .pipe(gulp.dest(src + '/css/'));
});

gulp.task('img', function() {
    return gulp.src(src + '/stylus/img/**')
        .pipe(gulp.dest(src + '/css/img/'));
});

// gulp.task('usemin', ['clean'], function() {
//     gulp.src(src + '/*.html')
//         .pipe(usemin({
//             zepto: [revall({hashLength: 5})],
//             index_js: [
//                 revall({
//                     // prefix: 'http://s1.url.cn/qqweb/m/gulper/',
//                     hashLength: 5
//                 })
//             ],
//             index_css: [
//                 revall({
//                     hashLength: 5
//                 })
//             ]
//         }))
//         .pipe(gulp.dest(dest));
// });

gulp.task('rev-js', function() {
    return gulp.src(src+ '/js/**')
        .pipe(revall({
            hashLength: 5
        }))
        .pipe(gulp.dest(dest.cdn + '/js/'));
});
gulp.task('rev-css', function() {
    return gulp.src(src+ '/css/**')
        .pipe(revall({
            hashLength: 5
        }))
        .pipe(gulp.dest(dest.cdn + '/css/'));
});

gulp.task('cdn', function() {
    return gulp.src(src + '/*.html')
        .pipe(cdnReplace({
            dir: dest.cdn,
            root: cdn
        }))
        .pipe(gulp.dest(dest.webserver));
});

gulp.task('sprite', function() {
    return gulp.src(src + '/stylus/icon/*.png')
        .pipe(sprite({
            name: 'sprite',
            style: '_sprite.styl',
            processor: 'stylus',
            retina: true,
            cssPath: 'img'
        }))
        .pipe(gulpif('*.png', gulp.dest(src + '/stylus/img/'), gulp.dest(src + '/stylus/')));
});

gulp.task('default', ['clean-dev'], function() {
    run(['jslib', 'browserify']);
    run('sprite', ['stylus', 'img']);
});

gulp.task('dist', ['clean'], function() {
    run(['rev-js', 'rev-css'], 'cdn');
});

gulp.task('zip-html', function() {
    return gulp.src(dest.webserver + '/**')
        .pipe(gulp.dest(offline + '/' + getDirFromUrl(project.webServer)));
});
gulp.task('zip-js', function() {
    return gulp.src(dest.cdn + '/js/**')
        .pipe(gulp.dest(offline + '/' + getDirFromUrl(cdn.js)));
});
gulp.task('zip-css', function() {
    return gulp.src(dest.cdn + '/css/**')
        .pipe(gulp.dest(offline + '/' + getDirFromUrl(cdn.css)));
});
gulp.task('zip-local', function() {
    return gulp.src(offline + '/**')
        .pipe(zip('local.zip'))
        .pipe(gulp.dest(dest.offline));
});

gulp.task('zip', ['clean-offline'], function() {
    run(['zip-html', 'zip-js', 'zip-css'], 'zip-local', 'clean-offline');
});