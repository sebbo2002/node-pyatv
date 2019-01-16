'use strict';

// const pyatv = require('@sebbo2002/node-pyatv');
const pyatv = require('../src');
pyatv
    .scan({debug: true})
    .then(results => {
        results.forEach(atv => {
            const listener = atv.push({debug: true});

            listener.on('state', playing => {
                console.log(playing);
            });
            listener.on('error', error => {
                console.log(`Listener Error for ${atv.name}: ${error}`);
            });
            listener.on('close', () => {
                console.log(`Listener for ${atv.name} closed`);
            });

            setTimeout(() => {
                listener.close();
            }, 60000);
        });
    })
    .catch(error => {
        console.log('Error during scan:', error);
    });
