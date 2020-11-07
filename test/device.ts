'use strict';

import assert from 'assert';
import NodePyATVDevice from '../lib/device';
import {NodePyATVProtocol} from '../lib/types';

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
            const fn = () => {};

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
            const fn = () => {};

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
});
