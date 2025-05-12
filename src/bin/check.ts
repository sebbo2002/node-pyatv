'use strict';

import NodePyATVInstance from '../lib/instance.js';

(async () => {
    try {
        await NodePyATVInstance.check();

        console.log('');
        console.log('✔ node-pyatv seems to be ready to use!');
        console.log('  Thank you and have a great day. Or night. Whatever.');
        console.log('');
    } catch (error) {
        console.log('');
        console.log('#'.repeat(60));
        console.log('#' + ' '.repeat(58) + '#');
        console.log(
            '# ⚠ Warning: node-pyatv is not ready to be used!' +
                ' '.repeat(10) +
                '#',
        );
        console.log('#' + ' '.repeat(58) + '#');
        console.log(
            '# To use the JavaScript module, pyatv >= 0.6.0 must be     #',
        );
        console.log(
            '# installed. Unfortunately this could not be found. During #',
        );
        console.log(
            '# the check following error message was reported:          #',
        );
        console.log('#' + ' '.repeat(58) + '#');
        console.log(
            String(error)
                .replace('Error: ', '')
                .replace(/(.{1,54})/g, '$1\n')
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => Boolean(l))
                .map((l) => `# > ${l}${' '.repeat(55 - l.length)}#`)
                .join('\n'),
        );
        console.log('#' + ' '.repeat(58) + '#');
        console.log(
            '# You can probably find more information here:             #',
        );
        console.log(
            '# https://github.com/sebbo2002/node-pyatv                  #',
        );
        console.log('#' + ' '.repeat(58) + '#');
        console.log('#'.repeat(60));
        console.log('');
    }
})();
