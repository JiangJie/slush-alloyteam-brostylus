'use strict';

var tmpl = require('./tmpl/header');

tmpl = tmpl();
console.log(tmpl);

var main = document.getElementById('main');

main.innerHTML = tmpl;