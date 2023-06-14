'use strict';

import assert from 'assert';
import { addRequestId, debug, getExecutable, getParamters, parseState, removeRequestId } from '../src/lib/tools.js';
import {
    NodePyATVDeviceState,
    NodePyATVExecutableType,
    NodePyATVMediaType,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    NodePyATVShuffleState
} from '../src/lib/types.js';

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
            debug('TEST', 'Hello World.', { debug: true });
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
            debug('TEST', 'Hello World.', { noColors: true });
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
                airplayCredentials: '****',
                companionCredentials: '1234',
                raopCredentials: '::foo:'
            });
            assert.deepEqual(result, [
                '-s', '192.168.178.2,192.168.178.3',
                '-i', '****',
                '--protocol', 'mrp',
                '--dmap-credentials', '****',
                '--mrp-credentials', '****',
                '--airplay-credentials', '****',
                '--companion-credentials', '1234',
                '--raop-credentials', '::foo:'
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
                powerState: null,
                focusState: null,
                volume: null
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
                powerState: null,
                focusState: null,
                volume: null
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
                powerState: null,
                focusState: null,
                volume: null
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
                powerState: null,
                focusState: null,
                volume: null
            });
        });
        it('should throw an error for pyatv exceptions', function () {
            const input = {
                result: 'failure',
                datetime: '2021-11-24T21:13:36.424576+03:00',
                exception: 'invalid credentials: 321',
                stacktrace: 'Traceback (most recent call last):\n  File \"/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/scripts/atvscript.py\", line 302, in appstart\n    print(args.output(await _handle_command(args, abort_sem, loop)), flush=True)\n  File \"/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/scripts/atvscript.py\", line 196, in _handle_command\n    atv = await connect(config, loop, protocol=Protocol.MRP)\n  File \"/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/__init__.py\", line 96, in connect\n    for setup_data in proto_methods.setup(\n  File \"/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/protocols/airplay/__init__.py\", line 192, in setup\n    stream = AirPlayStream(config, service)\n  File \"/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/protocols/airplay/__init__.py\", line 79, in __init__\n    self._credentials: HapCredentials = parse_credentials(self.service.credentials)\n  File \"/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/auth/hap_pairing.py\", line 139, in parse_credentials\n    raise exceptions.InvalidCredentialsError(\"invalid credentials: \" + detail_string)\npyatv.exceptions.InvalidCredentialsError: invalid credentials: 321\n'
            };
            assert.throws(() => {
                parseState(input, '', {});
            }, /Got pyatv Error: invalid credentials: 321/);
        });
        it('should ignore date if it\'s an invalid date', function () {
            const input = { datetime: 'today' };
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
                powerState: null,
                focusState: null,
                volume: null
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
                powerState: null,
                focusState: null,
                volume: null
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
                powerState: null,
                focusState: null,
                volume: null
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
                powerState: null,
                focusState: null,
                volume: null
            });
        });
    });
});
