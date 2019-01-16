'use strict';

const assert = require('assert');
const NodePyATVInstance = require(__dirname + '/../src');

async function goToYoutube (client) {
    const steps = process.env.ATV_TEST_YOUTUBE.split(',');

    await client.topMenu();
    await new Promise(c => setTimeout(c, 500));
    await client.right();
    await new Promise(c => setTimeout(c, 500));
    await client.menu();

    for(const i in steps) {
        await client[steps[i]]();
    }

    await client.select();
    await new Promise(c => setTimeout(c, 1000));
}

describe('NodePyATVInstance', function () {
    describe('static scan()', function () {
        this.timeout(10000);

        it('should find something valid', async function () {
            const results = await NodePyATVInstance.scan();
            assert.ok(results.length > 0, 'found apple tv in scan');

            assert.ok(typeof results[0]._options.name, 'name is a string');
            assert.ok(typeof results[0]._options.name.length, 'name is set');

            assert.ok(typeof results[0]._options.address, 'address is a string');
            assert.ok(typeof results[0]._options.address.length, 'address is set');

            assert.ok(typeof results[0]._options.loginId, 'loginId is a string');
            assert.ok(typeof results[0]._options.loginId.length, 'loginId is set');
        });
    });

    describe('static version()', function () {
        it('should return a valid response', async function () {
            const results = await NodePyATVInstance.version();
            assert.equal(typeof results.pyatv, 'string', 'pyatv is a string');
            assert.ok(results.pyatv.length > 5, 'pyatv has content');
        });
    });

    describe('constructor()', function () {
        it('should save options', async function () {
            const client = new NodePyATVInstance({foo: 'bar'});
            assert.equal(client._options.foo, 'bar', 'foo found in options');
        });
    });

    describe('_parsePlayingStr()', function () {
        it('basic test', async function () {
            const client = new NodePyATVInstance();
            const str = 'Media type: Video\n' +
                'Play state: Playing\n' +
                '     Title:\n' +
                '  Position: 658/2591s (25.4%)\n' +
                '    Repeat: Off\n' +
                '   Shuffle: False\n' +
                '--------------------';

            assert.deepEqual(client._parsePlayingStr(str), {
                mediaType: 'video',
                playState: 'playing',
                title: '',
                position: 658,
                totalTime: 2591,
                repeat: false,
                shuffle: false
            });
        });
    });

    describe('up(), down(), right(), left()', function () {
        it('should work', async function () {
            this.timeout(4000);

            const client = new NodePyATVInstance({
                address: process.env.ATV_ADDRESS,
                loginId: process.env.ATV_LOGIN_ID
            });

            await client.right();
            await client.down();
            await client.left();
            await client.up();
        });
    });

    describe('select()', function () {
        it('should work', async function () {
            this.timeout(20000);

            const client = new NodePyATVInstance({
                address: process.env.ATV_ADDRESS,
                loginId: process.env.ATV_LOGIN_ID,
                debug: true
            });

            await goToYoutube(client);

            await client.select();
            await new Promise(c => setTimeout(c, 8000));
            await client.menu();
            await new Promise(c => setTimeout(c, 500));
            await client.topMenu();
            await client.menu();
        });
    });
});
