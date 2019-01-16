'use strict';

// const pyatv = require('@sebbo2002/node-pyatv');
const pyatv = require('../src');

pyatv
    .version({debug: false})
    .then(version => {
        console.log(`pyatv version: ${version.pyatv}`);
        console.log(`node-pyatv version: ${version.module}`);
    })
    .catch(error => {
        console.log(error);
    });