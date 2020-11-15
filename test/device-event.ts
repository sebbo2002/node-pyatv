'use strict';

import assert from 'assert';
import NodePyATVDevice from '../lib/device';
import NodePyATVDeviceEvent from '../lib/device-event';

describe('NodePyATVDeviceEvent', function () {
    describe('get key()', function () {
        it('should work', function () {
            const event = new NodePyATVDeviceEvent({
                key: 'genre',
                old: 'Jazz',
                new: 'Rock',
                device: new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testinstance'
                })
            });

            assert.strictEqual(event.key, 'genre');
        });
    });

    describe('get oldValue()', function () {
        it('should work', function () {
            const event = new NodePyATVDeviceEvent({
                key: 'genre',
                old: 'Jazz',
                new: 'Rock',
                device: new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testinstance'
                })
            });

            assert.strictEqual(event.oldValue, 'Jazz');
        });
    });

    describe('get newValue()', function () {
        it('should work', function () {
            const event = new NodePyATVDeviceEvent({
                key: 'genre',
                old: 'Jazz',
                new: 'Rock',
                device: new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testinstance'
                })
            });

            assert.strictEqual(event.newValue, 'Rock');
        });
    });

    describe('get value()', function () {
        it('should work', function () {
            const event = new NodePyATVDeviceEvent({
                key: 'genre',
                old: 'Jazz',
                new: 'Rock',
                device: new NodePyATVDevice({
                    host: '192.168.178.2',
                    name: 'My Testinstance'
                })
            });

            assert.strictEqual(event.value, 'Rock');
        });
    });

    describe('get device()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testinstance'
            });
            const event = new NodePyATVDeviceEvent({
                key: 'genre',
                old: 'Jazz',
                new: 'Rock',
                device
            });

            assert.deepEqual(event.device, device);
        });
    });
});
