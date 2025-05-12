'use strict';

import assert from 'assert';

import NodePyATVDevice from '../src/lib/device.js';
import { createFakeSpawn } from '../src/lib/fake-spawn.js';
import NodePyATVInstance from '../src/lib/instance.js';
import {
    NodePyATVDeviceState,
    NodePyATVFocusState,
    NodePyATVKeys,
    NodePyATVMediaType,
    NodePyATVPowerState,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    NodePyATVShuffleState,
} from '../src/lib/types.js';

describe('NodePyATVDevice', function () {
    describe('get name()', function () {
        it('should return the name', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.name, 'My Testdevice');
        });
    });

    describe('get host()', function () {
        it('should return the host', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.host, '192.168.178.2');
        });
    });

    describe('get id()', function () {
        it('should return the id', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                id: '*****',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.id, '*****');
        });
    });

    describe('get allIDs()', function () {
        it('should return all the IDs', function () {
            const device = new NodePyATVDevice({
                allIDs: ['some_id_1', 'some_id_2', 'some_id_3'],
                host: '192.168.178.2',
                id: '*****',
                name: 'My Testdevice',
            });

            assert.deepStrictEqual(device.allIDs, [
                'some_id_1',
                'some_id_2',
                'some_id_3',
            ]);
        });
    });

    describe('get protocol()', function () {
        it('should return the protocol', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                protocol: NodePyATVProtocol.airplay,
            });

            assert.strictEqual(device.protocol, NodePyATVProtocol.airplay);
        });
    });

    describe('get mac()', function () {
        it('should return the mac', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                mac: 'AA:BB:CC:DD:EE:FF',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.mac, 'AA:BB:CC:DD:EE:FF');
        });
    });

    describe('get model()', function () {
        it('should return the model if set by scan', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                id: 'xxx',
                model: 'Gen4K',
                name: 'Vardagsrum',
            });

            assert.strictEqual(device.model, 'Gen4K');
        });
        it('should return undefined otherwise', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                name: 'Vardagsrum',
            });

            assert.strictEqual(device.model, undefined);
        });
    });

    describe('get modelName()', function () {
        it('should return the model name if set by scan', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                id: 'xxx',
                modelName: 'Apple TV 4K',
                name: 'Vardagsrum',
            });

            assert.strictEqual(device.modelName, 'Apple TV 4K');
        });
        it('should return undefined otherwise', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                name: 'Vardagsrum',
            });

            assert.strictEqual(device.modelName, undefined);
        });
    });

    describe('get os()', function () {
        it('should return the operating system if set by scan', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                id: 'xxx',
                name: 'Vardagsrum',
                os: 'TvOS',
            });

            assert.strictEqual(device.os, 'TvOS');
        });
        it('should return undefined otherwise', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                name: 'Vardagsrum',
            });

            assert.strictEqual(device.os, undefined);
        });
    });

    describe('get version()', function () {
        it('should return the version if set by scan', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                id: 'xxx',
                name: 'Vardagsrum',
                version: '15.5.1',
            });

            assert.strictEqual(device.version, '15.5.1');
        });
        it('should return undefined otherwise', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                name: 'Vardagsrum',
            });

            assert.strictEqual(device.version, undefined);
        });
    });

    describe('get services()', function () {
        it('should return the services if set by scan', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                id: 'xxx',
                name: 'Vardagsrum',
                services: [
                    {
                        port: 49152,
                        protocol: NodePyATVProtocol.mrp,
                    },
                    {
                        port: 7000,
                        protocol: NodePyATVProtocol.airplay,
                    },
                ],
            });

            assert.deepStrictEqual(device.services, [
                {
                    port: 49152,
                    protocol: 'mrp',
                },
                {
                    port: 7000,
                    protocol: 'airplay',
                },
            ]);
        });
        it('should return undefined otherwise', function () {
            const device = new NodePyATVDevice({
                host: '10.0.10.81',
                name: 'Vardagsrum',
            });

            assert.strictEqual(device.services, undefined);
        });
    });

    describe('get debug()', function () {
        it('should return true if set to true', function () {
            const device = new NodePyATVDevice({
                debug: true,
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.debug, true);
        });
        it('should return fn if set to custom function', function () {
            const fn = () => {};

            const device = new NodePyATVDevice({
                debug: fn,
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.debug, fn);
        });
        it('should return false if unset', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.debug, undefined);
        });
    });

    describe('set debug()', function () {
        it('should work for debug = true', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.debug, undefined);
            device.debug = true;
            assert.strictEqual(device.debug, true);
        });
        it('should work for debug = undefined', function () {
            const device = new NodePyATVDevice({
                debug: true,
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.debug, true);
            device.debug = undefined;
            assert.strictEqual(device.debug, undefined);
        });
        it('should work for debug = undefined', function () {
            const device = new NodePyATVDevice({
                debug: true,
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(device.debug, true);
            device.debug = undefined;
            assert.strictEqual(device.debug, undefined);
        });
        it('should work for debug = fn', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            const fn = () => {};

            assert.strictEqual(device.debug, undefined);
            device.debug = fn;
            assert.strictEqual(device.debug, fn);
        });
    });

    describe('toJSON()', function () {
        it('should return a object representation', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                id: '*****',
                name: 'My Testdevice',
                protocol: NodePyATVProtocol.airplay,
            });

            assert.deepEqual(device.toJSON(), {
                host: '192.168.178.2',
                id: '*****',
                mac: undefined,
                name: 'My Testdevice',
                protocol: NodePyATVProtocol.airplay,
            });
        });
        it('should be possible to create a new device from this', function () {
            const config = {
                host: '192.168.178.2',
                id: '*****',
                mac: '469943881251875',
                name: 'My Testdevice',
                protocol: NodePyATVProtocol.airplay,
            };

            const deviceA = new NodePyATVDevice(config);
            const deviceB = new NodePyATVDevice(deviceA.toJSON());
            assert.deepEqual(deviceB.toJSON(), config);
        });
    });

    describe('toString()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            assert.strictEqual(
                device.toString(),
                'NodePyATVDevice(My Testdevice, 192.168.178.2)',
            );
        });
    });

    describe('getState()', function () {
        it(
            'should work [I]',
            process.env.ENABLE_INTEGRATION
                ? async function () {
                      this.timeout(12000);

                      const devices = await NodePyATVInstance.find();
                      assert.ok(devices.length > 0, 'Device(s) found');

                      const device = devices[0];
                      await device.getState();
                  }
                : undefined,
        );
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        album: null,
                        app: 'Disney+',
                        app_id: 'com.disney.disneyplus',
                        artist: null,
                        datetime: '2020-11-07T22:38:43.608030+01:00',
                        device_state: 'playing',
                        genre: null,
                        hash: '100e0ab6-6ff5-4199-9c04-a7107ff78712',
                        media_type: 'video',
                        position: 27,
                        repeat: 'off',
                        result: 'success',
                        shuffle: 'off',
                        title: 'Solo: A Star Wars Story',
                        total_time: 8097,
                    });
                }),
            });

            const result = await device.getState();
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
        it('should reject with error if pyatv fails', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        datetime: '2021-11-24T21:13:36.424576+03:00',
                        exception: 'invalid credentials: 321',
                        result: 'failure',
                        stacktrace:
                            'Traceback (most recent call last):\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/scripts/atvscript.py", line 302, in appstart\n    print(args.output(await _handle_command(args, abort_sem, loop)), flush=True)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/scripts/atvscript.py", line 196, in _handle_command\n    atv = await connect(config, loop, protocol=Protocol.MRP)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/__init__.py", line 96, in connect\n    for setup_data in proto_methods.setup(\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/protocols/airplay/__init__.py", line 192, in setup\n    stream = AirPlayStream(config, service)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/protocols/airplay/__init__.py", line 79, in __init__\n    self._credentials: HapCredentials = parse_credentials(self.service.credentials)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/auth/hap_pairing.py", line 139, in parse_credentials\n    raise exceptions.InvalidCredentialsError("invalid credentials: " + detail_string)\npyatv.exceptions.InvalidCredentialsError: invalid credentials: 321\n',
                    });
                }),
            });

            assert.rejects(async () => {
                await device.getState();
            }, /Got pyatv Error: invalid credentials: 321/);
        });
        it('should cache requests for a bit', async function () {
            let executions = 0;
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    executions++;
                    cp.end({
                        album: null,
                        app: 'Disney+',
                        app_id: 'com.disney.disneyplus',
                        artist: null,
                        datetime: new Date().toJSON(),
                        device_state: 'playing',
                        genre: null,
                        hash: '100e0ab6-6ff5-4199-9c04-a7107ff78712',
                        media_type: 'video',
                        position: 27,
                        repeat: 'off',
                        result: 'success',
                        shuffle: 'off',
                        title: 'Solo: A Star Wars Story',
                        total_time: 8097,
                    });
                }),
            });

            const firstResult = await device.getState();
            const secondResult = await device.getState();

            assert.strictEqual(firstResult.dateTime, secondResult.dateTime);
            assert.strictEqual(executions, 1);
        });
        it('should update the position if cache was used', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        album: null,
                        app: 'Disney+',
                        app_id: 'com.disney.disneyplus',
                        artist: null,
                        datetime: new Date(
                            new Date().getTime() - 1000,
                        ).toJSON(),
                        device_state: 'playing',
                        genre: null,
                        hash: '100e0ab6-6ff5-4199-9c04-a7107ff78712',
                        media_type: 'video',
                        position: 27,
                        repeat: 'off',
                        result: 'success',
                        shuffle: 'off',
                        title: 'Solo: A Star Wars Story',
                        total_time: 8097,
                    });
                }),
            });

            const firstResult = await device.getState();
            assert.strictEqual(firstResult.position, 27);

            const secondResult = await device.getState();
            assert.ok(secondResult.position);
            assert.ok(
                secondResult.position > 27,
                `Position should be > 27, was ${secondResult.position}`,
            );
            assert.ok(
                secondResult.position < 30,
                `Position should be > 27, was ${secondResult.position}`,
            );
        });
    });

    describe('clearState()', function () {
        it('should work', async function () {
            let executions = 0;
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    executions++;
                    cp.end({
                        datetime: '2020-11-07T22:38:43.608030+01:00',
                        result: 'success',
                        title: 'Solo: A Star Wars Story',
                    });
                }),
            });

            assert.deepStrictEqual(
                await device.getTitle(),
                'Solo: A Star Wars Story',
            );

            device.clearState();
            assert.deepStrictEqual(
                await device.getTitle(),
                'Solo: A Star Wars Story',
            );
            assert.strictEqual(executions, 2);
        });
    });

    describe('getDateTime()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        datetime: new Date().toJSON(),
                        result: 'success',
                    });
                }),
            });

            const result = await device.getDateTime();
            assert.ok(result instanceof Date);
        });
    });

    describe('getHash()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        hash: '12345',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getHash();
            assert.strictEqual(result, '12345');
        });
    });

    describe('getMediaType()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        media_type: 'video',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getMediaType();
            assert.deepStrictEqual(result, NodePyATVMediaType.video);
            assert.deepStrictEqual(result, 'video');
        });
    });

    describe('getDeviceState()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        device_state: 'seeking',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getDeviceState();
            assert.deepStrictEqual(result, NodePyATVDeviceState.seeking);
            assert.deepStrictEqual(result, 'seeking');
        });
    });

    describe('getTitle()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
            });

            const result = await device.getTitle();
            assert.strictEqual(result, 'My Movie');
        });
    });

    describe('getArtist()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        artist: 'My Artist',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getArtist();
            assert.strictEqual(result, 'My Artist');
        });
    });

    describe('getAlbum()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        album: 'My ALbum',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getAlbum();
            assert.strictEqual(result, 'My ALbum');
        });
    });

    describe('getGenre()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        genre: 'My Genre',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getGenre();
            assert.strictEqual(result, 'My Genre');
        });
    });

    describe('getTotalTime()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        result: 'success',
                        total_time: 45,
                    });
                }),
            });

            const result = await device.getTotalTime();
            assert.strictEqual(result, 45);
        });
    });

    describe('getPosition()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        position: 30,
                        result: 'success',
                    });
                }),
            });

            const result = await device.getPosition();
            assert.strictEqual(result, 30);
        });
    });

    describe('getShuffle()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        result: 'success',
                        shuffle: 'songs',
                    });
                }),
            });

            const result = await device.getShuffle();
            assert.deepStrictEqual(result, NodePyATVShuffleState.songs);
            assert.deepStrictEqual(result, 'songs');
        });
    });

    describe('getRepeat()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        repeat: 'all',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getRepeat();
            assert.deepStrictEqual(result, NodePyATVRepeatState.all);
            assert.deepStrictEqual(result, 'all');
        });
    });

    describe('getApp()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        app: 'My App',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getApp();
            assert.strictEqual(result, 'My App');
        });
    });

    describe('getAppId()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        app_id: 'app.example.com',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getAppId();
            assert.strictEqual(result, 'app.example.com');
        });
    });

    describe('getPowerState()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        power_state: 'on',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getPowerState();
            assert.strictEqual(result, NodePyATVPowerState.on);
        });
    });

    describe('getVolume()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        result: 'success',
                        volume: 50,
                    });
                }),
            });

            const result = await device.getVolume();
            assert.strictEqual(result, 50);
        });
    });

    describe('getFocusState()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        focus_state: 'focused',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getFocusState();
            assert.strictEqual(result, NodePyATVFocusState.focused);
        });
    });

    describe('getOutputDevices()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        output_devices: [
                            {
                                identifier: 'foo',
                                name: 'Apple TV',
                            },
                        ],
                        result: 'success',
                    });
                }),
            });

            const result = await device.getOutputDevices();
            assert.deepStrictEqual(result, [
                {
                    identifier: 'foo',
                    name: 'Apple TV',
                },
            ]);
        });
    });

    describe('getContentIdentifier()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        content_identifier: '1234',
                        result: 'success',
                    });
                }),
            });

            const result = await device.getContentIdentifier();
            assert.strictEqual(result, '1234');
        });
    });

    describe('getiTunesStoreIdentifier()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        itunes_store_identifier: 1234,
                        result: 'success',
                    });
                }),
            });

            const result = await device.getiTunesStoreIdentifier();
            assert.strictEqual(result, 1234);
        });
    });

    describe('getEpisodeNumber()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        episode_number: 12,
                        result: 'success',
                    });
                }),
            });

            const result = await device.getEpisodeNumber();
            assert.strictEqual(result, 12);
        });
    });

    describe('getSeasonNumber()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        result: 'success',
                        season_number: 2,
                    });
                }),
            });

            const result = await device.getSeasonNumber();
            assert.strictEqual(result, 2);
        });
    });

    describe('getSeriesName()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end({
                        result: 'success',
                        series_name: 'The Testing Disaster',
                    });
                }),
            });

            const result = await device.getSeriesName();
            assert.strictEqual(result, 'The Testing Disaster');
        });
    });

    describe('listApps()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end(
                        'App: Fitness (com.apple.Fitness), App: Podcasts (com.apple.podcasts), ' +
                            'App: Filme (com.apple.TVMovies), App: Prime Video (com.amazon.aiv.AIVApp), ' +
                            'App: TV (com.apple.TVWatchList), App: Fotos (com.apple.TVPhotos), App: App Store ' +
                            '(com.apple.TVAppStore), App: Arcade (com.apple.Arcade), App: TV-Sendungen (com.apple.TVShows), ' +
                            'App: Suchen (com.apple.TVSearch), App: Live TV (de.couchfunk.WM2014), App: RTL+ ' +
                            '(com.rtlinteractive.tvnow), App: Computer (com.apple.TVHomeSharing), App: ARTE ' +
                            '(tv.arte.plus7), App: YouTube (com.google.ios.youtube), App: ARD Mediathek ' +
                            '(de.swr.avp.ard.tablet), App: Disney+ (com.disney.disneyplus), App: Plex (com.plexapp.plex), ' +
                            'App: Joyn (de.prosiebensat1digital.seventv), App: Einstellungen (com.apple.TVSettings), ' +
                            'App: ZDFmediathek (de.zdf.mediathek.universal), App: Crossy Road (com.hipsterwhale.crossy), ' +
                            'App: Netflix (com.netflix.Netflix), App: Infuse (com.firecore.infuse), ' +
                            'App: Musik (com.apple.TVMusic)',
                    );
                }),
            });

            const result = await device.listApps();
            assert.strictEqual(result.length, 25);
            assert.strictEqual(result[0].id, 'com.apple.Fitness');
            assert.strictEqual(result[0].name, 'Fitness');
        });
    });

    describe('pressKey()', function () {
        it('should work with valid key', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end('{"result":"success"}');
                }),
            });

            await device.pressKey(NodePyATVKeys.home);
        });
        it('should throw error with invalid key', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
            });

            await assert.rejects(async () => {
                // @ts-ignore
                await device.pressKey('foo');
            }, /Unsupported key value foo/);
        });
        it('should throw error if pyatv result is not success', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end('{"result":"failure"}');
                }),
            });

            await assert.rejects(async () => {
                await device.pressKey(NodePyATVKeys.home);
            }, /Unable to parse pyatv response/);
        });
    });

    Object.keys(NodePyATVKeys).forEach((key) => {
        describe(key + '()', function () {
            it('should work', async function () {
                const device = new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testdevice',
                    spawn: createFakeSpawn((cp) => {
                        cp.end('{"result":"success"}');
                    }),
                });

                // @ts-ignore
                await device[key]();
            });
        });
    });

    describe('launchApp()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.end('');
                }),
            });

            await device.launchApp('com.apple.TVShows');
        });
    });
});
