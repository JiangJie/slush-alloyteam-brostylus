'use strict';

var gulp = require('gulp'),
    install = require('gulp-install'),
    conflict = require('gulp-conflict'),
    template = require('gulp-template'),
    inquirer = require('inquirer');

gulp.task('default', function (fn) {
  // inquirer.prompt([
  //   {type: 'input', name: 'name', message: 'Give your app a name', default: gulp.args.join(' ')}, // Get app name from arguments by default
  //   {type: 'confirm', name: 'moveon', message: 'Continue?'}
  // ],
  // function(answers) {
  //   if(!answers.moveon) return fn();

  //   gulp.src(__dirname + '/templates/**')      // Note use of __dirname to be relative to generator
  //     // .pipe(template(answers))                 // Lodash template support
  //     .pipe(conflict('./'))                    // Confirms overwrites on file conflicts
  //     .pipe(gulp.dest('./'))                   // Without __dirname here = relative to cwd
  //     .pipe(install())                         // Run `bower install` and/or `npm install` if necessary
  //     .on('finish', function () {
  //       fn();                                  // Finished!
  //     });
  // });
  gulp.src(__dirname + '/templates/**')      // Note use of __dirname to be relative to generator
    // .pipe(template(answers))                 // Lodash template support
    .pipe(conflict('./'))                    // Confirms overwrites on file conflicts
    .pipe(gulp.dest('./'))                   // Without __dirname here = relative to cwd
    .pipe(install())                         // Run `bower install` and/or `npm install` if necessary
    .on('finish', function () {
      fn();                                  // Finished!
    });
});