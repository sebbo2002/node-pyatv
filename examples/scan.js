'use strict';

// const pyatv = require('@sebbo2002/node-pyatv');
const pyatv = require('../src');

pyatv
    .scan({debug: true})
    .then(results => {
        results.forEach(atv =>
            console.log(atv.toString())
        );
    })
    .catch(error => {
        console.log(error);
    });