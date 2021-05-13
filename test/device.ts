'use strict';

import assert from 'assert';
import NodePyATVDevice from '../src/lib/device';
import {
    NodePyATVDeviceState,
    NodePyATVKeys,
    NodePyATVMediaType,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    NodePyATVShuffleState
} from '../src/lib/types';
import NodePyATVInstance from '../src/lib/instance';
import {createFakeSpawn} from '../src/lib/fake-spawn';

describe('NodePyATVDevice', function () {
    describe('get name()', function () {
        it('should return the name', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2'
            });

            assert.strictEqual(device.name, 'My Testdevice');
        });
    });

    describe('get host()', function () {
        it('should return the host', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2'
            });

            assert.strictEqual(device.host, '192.168.178.2');
        });
    });

    describe('get id()', function () {
        it('should return the id', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                id: '*****'
            });

            assert.strictEqual(device.id, '*****');
        });
    });

    describe('get protocol()', function () {
        it('should return the protocol', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                protocol: NodePyATVProtocol.airplay
            });

            assert.strictEqual(device.protocol, NodePyATVProtocol.airplay);
        });
    });

    describe('get debug()', function () {
        it('should return true if set to true', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                debug: true
            });

            assert.strictEqual(device.debug, true);
        });
        it('should return fn if set to custom function', function () {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const fn = () => {
            };

            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                debug: fn
            });

            assert.strictEqual(device.debug, fn);
        });
        it('should return false if unset', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2'
            });

            assert.strictEqual(device.debug, undefined);
        });
    });

    describe('set debug()', function () {
        it('should work for debug = true', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2'
            });

            assert.strictEqual(device.debug, undefined);
            device.debug = true;
            assert.strictEqual(device.debug, true);
        });
        it('should work for debug = undefined', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                debug: true
            });

            assert.strictEqual(device.debug, true);
            device.debug = undefined;
            assert.strictEqual(device.debug, undefined);
        });
        it('should work for debug = undefined', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                debug: true
            });

            assert.strictEqual(device.debug, true);
            device.debug = undefined;
            assert.strictEqual(device.debug, undefined);
        });
        it('should work for debug = fn', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2'
            });

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const fn = () => {
            };

            assert.strictEqual(device.debug, undefined);
            device.debug = fn;
            assert.strictEqual(device.debug, fn);
        });
    });

    describe('toJSON()', function () {
        it('should return a object representation', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                id: '*****',
                protocol: NodePyATVProtocol.airplay
            });

            assert.deepEqual(device.toJSON(), {
                name: 'My Testdevice',
                host: '192.168.178.2',
                id: '*****',
                protocol: NodePyATVProtocol.airplay
            });
        });
        it('should be possible to create a new device from this', function () {
            const config = {
                name: 'My Testdevice',
                host: '192.168.178.2',
                id: '*****',
                protocol: NodePyATVProtocol.airplay
            };

            const deviceA = new NodePyATVDevice(config);
            const deviceB = new NodePyATVDevice(deviceA.toJSON());
            assert.deepEqual(deviceB.toJSON(), config);
        });
    });

    describe('toString()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2'
            });

            assert.strictEqual(device.toString(), 'NodePyATVDevice(My Testdevice, 192.168.178.2)');
        });
    });

    describe('getState()', function () {
        it('should work [I]', process.env.ENABLE_INTEGRATION ? async function () {
            this.timeout(12000);

            const devices = await NodePyATVInstance.find();
            assert.ok(devices.length > 0, 'Device(s) found');

            const device = devices[0];
            await device.getState();
        } : undefined);
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
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
                        app_id: 'com.disney.disneyplus'
                    });
                })
            });

            const result = await device.getState();
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
        it('should cache requests for a bit', async function () {
            let executions = 0;
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    executions++;
                    cp.end({
                        result: 'success',
                        datetime: new Date().toJSON(),
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
                        app_id: 'com.disney.disneyplus'
                    });
                })
            });

            const firstResult = await device.getState();
            const secondResult = await device.getState();

            assert.strictEqual(firstResult.dateTime, secondResult.dateTime);
            assert.strictEqual(executions, 1);
        });
        it('should update the position if cache was used', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        datetime: new Date(new Date().getTime() - 1000).toJSON(),
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
                        app_id: 'com.disney.disneyplus'
                    });
                })
            });

            const firstResult = await device.getState();
            assert.strictEqual(firstResult.position, 27);

            const secondResult = await device.getState();
            assert.ok(secondResult.position);
            assert.ok(secondResult.position > 27, `Position should be > 27, was ${secondResult.position}`);
            assert.ok(secondResult.position < 30, `Position should be > 27, was ${secondResult.position}`);
        });
    });

    describe('clearState()', function () {
        it('should work', async function () {
            let executions = 0;
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    executions++;
                    cp.end({
                        result: 'success',
                        datetime: '2020-11-07T22:38:43.608030+01:00',
                        title: 'Solo: A Star Wars Story'
                    });
                })
            });

            assert.deepStrictEqual(await device.getTitle(), 'Solo: A Star Wars Story');

            device.clearState();
            assert.deepStrictEqual(await device.getTitle(), 'Solo: A Star Wars Story');
            assert.strictEqual(executions, 2);
        });
    });

    describe('getDateTime()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        datetime: new Date().toJSON()
                    });
                })
            });

            const result = await device.getDateTime();
            assert.ok(result instanceof Date);
        });
    });

    describe('getHash()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        hash: '12345'
                    });
                })
            });

            const result = await device.getHash();
            assert.strictEqual(result, '12345');
        });
    });

    describe('getMediaType()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        media_type: 'video'
                    });
                })
            });

            const result = await device.getMediaType();
            assert.deepStrictEqual(result, NodePyATVMediaType.video);
            assert.deepStrictEqual(result, 'video');
        });
    });

    describe('getDeviceState()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        device_state: 'seeking'
                    });
                })
            });

            const result = await device.getDeviceState();
            assert.deepStrictEqual(result, NodePyATVDeviceState.seeking);
            assert.deepStrictEqual(result, 'seeking');
        });
    });

    describe('getTitle()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        title: 'My Movie'
                    });
                })
            });

            const result = await device.getTitle();
            assert.strictEqual(result, 'My Movie');
        });
    });

    describe('getArtist()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        artist: 'My Artist'
                    });
                })
            });

            const result = await device.getArtist();
            assert.strictEqual(result, 'My Artist');
        });
    });

    describe('getAlbum()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        album: 'My ALbum'
                    });
                })
            });

            const result = await device.getAlbum();
            assert.strictEqual(result, 'My ALbum');
        });
    });

    describe('getGenre()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        genre: 'My Genre'
                    });
                })
            });

            const result = await device.getGenre();
            assert.strictEqual(result, 'My Genre');
        });
    });

    describe('getTotalTime()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        total_time: 45
                    });
                })
            });

            const result = await device.getTotalTime();
            assert.strictEqual(result, 45);
        });
    });

    describe('getPosition()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        position: 30
                    });
                })
            });

            const result = await device.getPosition();
            assert.strictEqual(result, 30);
        });
    });

    describe('getShuffle()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        shuffle: 'songs'
                    });
                })
            });

            const result = await device.getShuffle();
            assert.deepStrictEqual(result, NodePyATVShuffleState.songs);
            assert.deepStrictEqual(result, 'songs');
        });
    });

    describe('getRepeat()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        repeat: 'all'
                    });
                })
            });

            const result = await device.getRepeat();
            assert.deepStrictEqual(result, NodePyATVRepeatState.all);
            assert.deepStrictEqual(result, 'all');
        });
    });

    describe('getApp()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        app: 'My App'
                    });
                })
            });

            const result = await device.getApp();
            assert.strictEqual(result, 'My App');
        });
    });

    describe('getAppId()', function () {
        it('should work', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end({
                        result: 'success',
                        app_id: 'app.example.com'
                    });
                })
            });

            const result = await device.getAppId();
            assert.strictEqual(result, 'app.example.com');
        });
    });

    describe('pressKey()', function () {
        it('should work with valid key', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end('{"result":"success"}');
                })
            });

            await device.pressKey(NodePyATVKeys.home);
        });
        it('should throw error with invalid key', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2'
            });

            await assert.rejects(async () => {
                // @ts-ignore
                await device.pressKey('foo');
            }, /Unsupported key value foo/);
        });
        it('should throw error if pyatv result is not success', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.end('{"result":"failure"}');
                })
            });

            await assert.rejects(async () => {
                await device.pressKey(NodePyATVKeys.home);
            }, /Unable to parse pyatv response/);
        });
    });

    Object.keys(NodePyATVKeys).forEach(key => {
        describe(key + '()', function () {
            it('should work', async function () {
                const device = new NodePyATVDevice({
                    name: 'My Testdevice',
                    host: '192.168.178.2',
                    spawn: createFakeSpawn(cp => {
                        cp.end('{"result":"success"}');
                    })
                });

                // @ts-ignore
                await device[key]();
            });
        });
    });

});
