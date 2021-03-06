'use strict';

import assert from 'assert';
import {addRequestId, debug, getExecutable, getParamters, parseState, removeRequestId} from '../src/lib/tools';
import {
    NodePyATVDeviceState,
    NodePyATVExecutableType,
    NodePyATVMediaType,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    NodePyATVShuffleState
} from '../src/lib/types';

describe('Tools', function () {
    describe('addRequestId() / removeRequestId()', function () {
        it('should return a string', function () {
            const id = addRequestId();
            assert.strictEqual(typeof id, 'string');
            removeRequestId(id);
        });
        it('should work if given id is not in index', function () {
            removeRequestId('FOO');
        });
    });

    describe('debug()', function () {
        it('should work without any options', function () {
            debug('TEST', 'Hello World.', {});
        });
        it('should work with default logger', function () {
            debug('TEST', 'Hello World.', {debug: true});
        });
        it('should work with custom logger', function () {
            debug('TEST', 'Hello World.', {
                debug: function (msg) {
                    assert.strictEqual(this, null);
                    assert.ok(msg.includes('Hello World'));
                }
            });
        });
        it('should work with colors disabled', function () {
            debug('TEST', 'Hello World.', {noColors: true});
        });
        it('should work with custom logger and colors disabled', function () {
            debug('TEST', 'Hello World.', {
                noColors: true,
                debug: function (msg) {
                    assert.strictEqual(this, null);
                    assert.strictEqual(msg, '[node-pyatv][TEST] Hello World.');
                }
            });
        });
    });

    describe('getExecutable()', function () {
        it('should handle atvremotePath if set', function () {
            const result = getExecutable(NodePyATVExecutableType.atvremote, {
                atvremotePath: '/tmp/1',
                atvscriptPath: '/tmp/2'
            });

            assert.strictEqual(result, '/tmp/1');
        });
        it('should handle atvscriptPath if set', function () {
            const result = getExecutable(NodePyATVExecutableType.atvscript, {
                atvremotePath: '/tmp/1',
                atvscriptPath: '/tmp/2'
            });

            assert.strictEqual(result, '/tmp/2');
        });
        it('should handle default for atvremote', function () {
            const result = getExecutable(NodePyATVExecutableType.atvremote, {
                atvscriptPath: '/tmp'
            });

            assert.strictEqual(result, 'atvremote');
        });
        it('should handle default for atvscript', function () {
            const result = getExecutable(NodePyATVExecutableType.atvscript, {
                atvremotePath: '/tmp'
            });

            assert.strictEqual(result, 'atvscript');
        });
    });

    describe('getParameters()', function () {
        it('empty case', async function () {
            const result = await getParamters();
            assert.deepEqual(result, []);
        });
        it('easy case', async function () {
            const result = await getParamters({
                host: '192.168.178.2'
            });
            assert.deepEqual(result, ['-s', '192.168.178.2']);
        });
        it('full case', async function () {
            const result = await getParamters({
                hosts: ['192.168.178.2', '192.168.178.3'],
                id: '****',
                protocol: NodePyATVProtocol.mrp,
                dmapCredentials: '****',
                mrpCredentials: '****',
                airplayCredentials: '****'
            });
            assert.deepEqual(result, [
                '-s', '192.168.178.2,192.168.178.3',
                '-i', '****',
                '--protocol', 'mrp',
                '--dmap-credentials', '****',
                '--mrp-credentials', '****',
                '--airplay-credentials', '****'
            ]);
        });
    });

    describe('parseState()', function () {
        it('should work with empty data', function () {
            const input = {};
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                dateTime: null,
                hash: null,
                mediaType: null,
                deviceState: null,
                title: null,
                artist: null,
                album: null,
                genre: null,
                totalTime: null,
                position: null,
                shuffle: null,
                repeat: null,
                app: null,
                appId: null,
                powerState: null
            });
        });
        it('should work without data', function () {
            // @ts-ignore
            const result = parseState(null, '', {});
            assert.deepStrictEqual(result, {
                dateTime: null,
                hash: null,
                mediaType: null,
                deviceState: null,
                title: null,
                artist: null,
                album: null,
                genre: null,
                totalTime: null,
                position: null,
                shuffle: null,
                repeat: null,
                app: null,
                appId: null,
                powerState: null
            });
        });
        it('should work with example data', function () {
            const input = {
                result: 'success',
                datetime: '2020-11-07T22:38:43.608030+01:00',
                hash: '100e0ab6-6ff5-4199-9c04-a7107ff78712',
                media_type: 'video',
                device_state: 'playing',
                title: 'Solo: A Star Wars Story',
                artist: null,
                album: null,
                genre: null,
                total_time: 8097,
                position: 27,
                shuffle: 'off',
                repeat: 'off',
                app: 'Disney+',
                app_id: 'com.disney.disneyplus',
                powerState: null
            };
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                dateTime: new Date('2020-11-07T22:38:43.608030+01:00'),
                hash: '100e0ab6-6ff5-4199-9c04-a7107ff78712',
                mediaType: NodePyATVMediaType.video,
                deviceState: NodePyATVDeviceState.playing,
                title: 'Solo: A Star Wars Story',
                artist: null,
                album: null,
                genre: null,
                totalTime: 8097,
                position: 27,
                shuffle: NodePyATVShuffleState.off,
                repeat: NodePyATVRepeatState.off,
                app: 'Disney+',
                appId: 'com.disney.disneyplus',
                powerState: null
            });
        });
        it('should ignore date if it\'s an invalid date', function () {
            const input = {datetime: 'today'};
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                dateTime: null,
                hash: null,
                mediaType: null,
                deviceState: null,
                title: null,
                artist: null,
                album: null,
                genre: null,
                totalTime: null,
                position: null,
                shuffle: null,
                repeat: null,
                app: null,
                appId: null,
                powerState: null
            });
        });
        it('should ignore data if unsupported type', function () {
            const input = {
                result: 'success',
                datetime: true,
                hash: 1337,
                media_type: false,
                device_state: 43,
                title: undefined,
                artist: 90,
                album: Infinity,
                genre: Math.PI,
                total_time: '23min',
                position: '0:30.123',
                shuffle: false,
                repeat: true,
                app: 0,
                app_id: 891645381647289,
                powerState: null
            };
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                dateTime: null,
                hash: null,
                mediaType: null,
                deviceState: null,
                title: null,
                artist: null,
                album: null,
                genre: null,
                totalTime: null,
                position: null,
                shuffle: null,
                repeat: null,
                app: null,
                appId: null,
                powerState: null
            });
        });
        it('should ignore enums with unsupported valid', function () {
            const input = {
                media_type: '3d-experience',
                device_state: 'initiating',
                shuffle: 'everything',
                repeat: 'nothing'
            };
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                dateTime: null,
                hash: null,
                mediaType: null,
                deviceState: null,
                title: null,
                artist: null,
                album: null,
                genre: null,
                totalTime: null,
                position: null,
                shuffle: null,
                repeat: null,
                app: null,
                appId: null,
                powerState: null
            });
        });
    });
});
