'use strict';

import assert from 'assert';

import {
    addRequestId,
    debug,
    getExecutable,
    getParameters,
    parseState,
    removeRequestId,
} from '../src/lib/tools.js';
import {
    NodePyATVDeviceState,
    NodePyATVExecutableType,
    NodePyATVInternalState,
    NodePyATVMediaType,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    NodePyATVShuffleState,
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
                },
            });
        });
        it('should work with colors disabled', function () {
            debug('TEST', 'Hello World.', { noColors: true });
        });
        it('should work with custom logger and colors disabled', function () {
            debug('TEST', 'Hello World.', {
                debug: function (msg) {
                    assert.strictEqual(this, null);
                    assert.strictEqual(msg, '[node-pyatv][TEST] Hello World.');
                },
                noColors: true,
            });
        });
    });

    describe('getExecutable()', function () {
        it('should handle atvremotePath if set', function () {
            const result = getExecutable(NodePyATVExecutableType.atvremote, {
                atvremotePath: '/tmp/1',
                atvscriptPath: '/tmp/2',
            });

            assert.strictEqual(result, '/tmp/1');
        });
        it('should handle atvscriptPath if set', function () {
            const result = getExecutable(NodePyATVExecutableType.atvscript, {
                atvremotePath: '/tmp/1',
                atvscriptPath: '/tmp/2',
            });

            assert.strictEqual(result, '/tmp/2');
        });
        it('should handle default for atvremote', function () {
            const result = getExecutable(NodePyATVExecutableType.atvremote, {
                atvscriptPath: '/tmp',
            });

            assert.strictEqual(result, 'atvremote');
        });
        it('should handle default for atvscript', function () {
            const result = getExecutable(NodePyATVExecutableType.atvscript, {
                atvremotePath: '/tmp',
            });

            assert.strictEqual(result, 'atvscript');
        });
    });

    describe('getParameters()', function () {
        it('empty case', async function () {
            const result = await getParameters();
            assert.deepEqual(result, []);
        });
        it('easy case', async function () {
            const result = await getParameters({
                host: '192.168.178.2',
            });
            assert.deepEqual(result, ['-s', '192.168.178.2']);
        });
        it('full case', async function () {
            const result = await getParameters({
                airplayCredentials: '****',
                companionCredentials: '1234',
                dmapCredentials: '****',
                hosts: ['192.168.178.2', '192.168.178.3'],
                id: '****',
                mrpCredentials: '****',
                protocol: NodePyATVProtocol.mrp,
                raopCredentials: '::foo:',
            });
            assert.deepEqual(result, [
                '-s',
                '192.168.178.2,192.168.178.3',
                '-i',
                '****',
                '--protocol',
                'mrp',
                '--dmap-credentials',
                '****',
                '--mrp-credentials',
                '****',
                '--airplay-credentials',
                '****',
                '--companion-credentials',
                '1234',
                '--raop-credentials',
                '::foo:',
            ]);
        });
    });

    describe('parseState()', function () {
        it('should work with empty data', function () {
            const input = {};
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                album: null,
                app: null,
                appId: null,
                artist: null,
                contentIdentifier: null,
                dateTime: null,
                deviceState: null,
                episodeNumber: null,
                focusState: null,
                genre: null,
                hash: null,
                iTunesStoreIdentifier: null,
                mediaType: null,
                outputDevices: null,
                position: null,
                powerState: null,
                repeat: null,
                seasonNumber: null,
                seriesName: null,
                shuffle: null,
                title: null,
                totalTime: null,
                volume: null,
            });
        });
        it('should work without data', function () {
            // @ts-ignore
            const result = parseState(null, '', {});
            assert.deepStrictEqual(result, {
                album: null,
                app: null,
                appId: null,
                artist: null,
                contentIdentifier: null,
                dateTime: null,
                deviceState: null,
                episodeNumber: null,
                focusState: null,
                genre: null,
                hash: null,
                iTunesStoreIdentifier: null,
                mediaType: null,
                outputDevices: null,
                position: null,
                powerState: null,
                repeat: null,
                seasonNumber: null,
                seriesName: null,
                shuffle: null,
                title: null,
                totalTime: null,
                volume: null,
            });
        });
        it('should work with example data', function () {
            const input: NodePyATVInternalState = {
                album: null,
                app: 'Disney+',
                app_id: 'com.disney.disneyplus',
                artist: null,
                content_identifier: null,
                datetime: '2020-11-07T22:38:43.608030+01:00',
                device_state: 'playing',
                episode_number: null,
                focus_state: null,
                genre: null,
                hash: '100e0ab6-6ff5-4199-9c04-a7107ff78712',
                itunes_store_identifier: null,
                media_type: 'video',
                output_devices: null,
                position: 27,
                power_state: null,
                repeat: 'off',
                result: 'success',
                season_number: null,
                series_name: null,
                shuffle: 'off',
                title: 'Solo: A Star Wars Story',
                total_time: 8097,
                volume: null,
            };
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                album: null,
                app: 'Disney+',
                appId: 'com.disney.disneyplus',
                artist: null,
                contentIdentifier: null,
                dateTime: new Date('2020-11-07T22:38:43.608030+01:00'),
                deviceState: NodePyATVDeviceState.playing,
                episodeNumber: null,
                focusState: null,
                genre: null,
                hash: '100e0ab6-6ff5-4199-9c04-a7107ff78712',
                iTunesStoreIdentifier: null,
                mediaType: NodePyATVMediaType.video,
                outputDevices: null,
                position: 27,
                powerState: null,
                repeat: NodePyATVRepeatState.off,
                seasonNumber: null,
                seriesName: null,
                shuffle: NodePyATVShuffleState.off,
                title: 'Solo: A Star Wars Story',
                totalTime: 8097,
                volume: null,
            });
        });
        it('should throw an error for pyatv exceptions', function () {
            const input: NodePyATVInternalState = {
                datetime: '2021-11-24T21:13:36.424576+03:00',
                exception: 'invalid credentials: 321',
                result: 'failure',
                stacktrace:
                    'Traceback (most recent call last):\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/scripts/atvscript.py", line 302, in appstart\n    print(args.output(await _handle_command(args, abort_sem, loop)), flush=True)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/scripts/atvscript.py", line 196, in _handle_command\n    atv = await connect(config, loop, protocol=Protocol.MRP)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/__init__.py", line 96, in connect\n    for setup_data in proto_methods.setup(\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/protocols/airplay/__init__.py", line 192, in setup\n    stream = AirPlayStream(config, service)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/protocols/airplay/__init__.py", line 79, in __init__\n    self._credentials: HapCredentials = parse_credentials(self.service.credentials)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/auth/hap_pairing.py", line 139, in parse_credentials\n    raise exceptions.InvalidCredentialsError("invalid credentials: " + detail_string)\npyatv.exceptions.InvalidCredentialsError: invalid credentials: 321\n',
            };
            assert.throws(() => {
                parseState(input, '', {});
            }, /Got pyatv Error: invalid credentials: 321/);
        });
        it("should ignore date if it's an invalid date", function () {
            const input: NodePyATVInternalState = { datetime: 'today' };
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                album: null,
                app: null,
                appId: null,
                artist: null,
                contentIdentifier: null,
                dateTime: null,
                deviceState: null,
                episodeNumber: null,
                focusState: null,
                genre: null,
                hash: null,
                iTunesStoreIdentifier: null,
                mediaType: null,
                outputDevices: null,
                position: null,
                powerState: null,
                repeat: null,
                seasonNumber: null,
                seriesName: null,
                shuffle: null,
                title: null,
                totalTime: null,
                volume: null,
            });
        });
        it('should ignore data if unsupported type', function () {
            const input: NodePyATVInternalState = {
                album: Infinity,
                app: 0,
                app_id: 891645381647289,
                artist: 90,
                content_identifier: null,
                datetime: true,
                device_state: 43,
                episode_number: null,
                focus_state: null,
                genre: Math.PI,
                hash: 1337,
                itunes_store_identifier: null,
                media_type: false,
                output_devices: null,
                position: '0:30.123',
                power_state: null,
                repeat: true,
                result: 'success',
                season_number: null,
                series_name: null,
                shuffle: false,
                title: undefined,
                total_time: '23min',
                volume: null,
            };
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                album: null,
                app: null,
                appId: null,
                artist: null,
                contentIdentifier: null,
                dateTime: null,
                deviceState: null,
                episodeNumber: null,
                focusState: null,
                genre: null,
                hash: null,
                iTunesStoreIdentifier: null,
                mediaType: null,
                outputDevices: null,
                position: null,
                powerState: null,
                repeat: null,
                seasonNumber: null,
                seriesName: null,
                shuffle: null,
                title: null,
                totalTime: null,
                volume: null,
            });
        });
        it('should ignore enums with unsupported valid', function () {
            const input: NodePyATVInternalState = {
                device_state: 'initiating',
                media_type: '3d-experience',
                repeat: 'nothing',
                shuffle: 'everything',
            };
            const result = parseState(input, '', {});
            assert.deepStrictEqual(result, {
                album: null,
                app: null,
                appId: null,
                artist: null,
                contentIdentifier: null,
                dateTime: null,
                deviceState: null,
                episodeNumber: null,
                focusState: null,
                genre: null,
                hash: null,
                iTunesStoreIdentifier: null,
                mediaType: null,
                outputDevices: null,
                position: null,
                powerState: null,
                repeat: null,
                seasonNumber: null,
                seriesName: null,
                shuffle: null,
                title: null,
                totalTime: null,
                volume: null,
            });
        });
    });
});
