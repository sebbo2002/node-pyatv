'use strict';

import assert from 'assert';

import NodePyATVDeviceEvent from '../src/lib/device-event.js';
import NodePyATVDevice from '../src/lib/device.js';

describe('NodePyATVDeviceEvent', function () {
    describe('get key()', function () {
        it('should work', function () {
            const event = new NodePyATVDeviceEvent({
                device: new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testinstance',
                }),
                key: 'genre',
                new: 'Rock',
                old: 'Jazz',
            });

            assert.strictEqual(event.key, 'genre');
        });
    });

    describe('get oldValue()', function () {
        it('should work', function () {
            const event = new NodePyATVDeviceEvent({
                device: new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testinstance',
                }),
                key: 'genre',
                new: 'Rock',
                old: 'Jazz',
            });

            assert.strictEqual(event.oldValue, 'Jazz');
        });
    });

    describe('get newValue()', function () {
        it('should work', function () {
            const event = new NodePyATVDeviceEvent({
                device: new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testinstance',
                }),
                key: 'genre',
                new: 'Rock',
                old: 'Jazz',
            });

            assert.strictEqual(event.newValue, 'Rock');
        });
    });

    describe('get value()', function () {
        it('should work', function () {
            const event = new NodePyATVDeviceEvent({
                device: new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testinstance',
                }),
                key: 'genre',
                new: 'Rock',
                old: 'Jazz',
            });

            assert.strictEqual(event.value, 'Rock');
        });
    });

    describe('get device()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testinstance',
            });
            const event = new NodePyATVDeviceEvent({
                device,
                key: 'genre',
                new: 'Rock',
                old: 'Jazz',
            });

            assert.deepEqual(event.device, device);
        });
    });
});
