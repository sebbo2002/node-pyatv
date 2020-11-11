'use strict';

import assert from 'assert';
import NodePyATVDeviceEvents from '../lib/device-events';
import NodePyATVDevice from '../lib/device';
import {createFakeSpawn} from '../lib/fake-spawn';
import NodePyATVDeviceEvent from '../lib/device-event';

describe('NodePyATVDeviceEvents', function () {
    describe('applyStateAndEmitEvents()', function () {
        it('should emit update:key event', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie'
                    });
                })
            });

            await new Promise(cb => {
                device.once('update:title', event => {
                    assert.ok(event instanceof NodePyATVDeviceEvent);
                    assert.strictEqual(event.key, 'title');
                    assert.strictEqual(event.oldValue, null);
                    assert.strictEqual(event.newValue, 'My Movie');
                    assert.strictEqual(event.value, 'My Movie');
                    assert.deepStrictEqual(event.device, device);
                    cb();
                });
            });
        });
        it('should emit update event', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie'
                    });
                })
            });

            await new Promise(cb => {
                device.once('update', event => {
                    assert.ok(event instanceof NodePyATVDeviceEvent);
                    assert.strictEqual(event.key, 'title');
                    assert.strictEqual(event.oldValue, null);
                    assert.strictEqual(event.newValue, 'My Movie');
                    assert.strictEqual(event.value, 'My Movie');
                    assert.deepStrictEqual(event.device, device);
                    cb();
                });
            });
        });
        it('should emit update:key event before update', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie'
                    });
                })
            });

            const sort: string[] = [];
            await Promise.race([
                new Promise(cb => {
                    device.once('update', () => {
                        sort.push('update');
                        cb();
                    });
                }),
                new Promise(cb => {
                    device.once('update:title', () => {
                        sort.push('update:title');
                        cb();
                    });
                })
            ]);

            assert.deepStrictEqual(sort, ['update:title', 'update']);
        });
        it('should not emit an update if new value is same as old one', async function () {
            let spawnCounter = 0;
            let eventCounter = 0;
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    if (spawnCounter === 0) {
                        cp.onStdIn(() => cp.end());
                    }

                    cp.stdout({
                        result: 'success',
                        title: 'My Movie'
                    });

                    spawnCounter++;
                    if (spawnCounter >= 2) {
                        cp.end();
                    }
                })
            });

            const listener = () => {
                eventCounter++;
            };

            device.on('update', listener);
            await new Promise(cb => setTimeout(cb, 0));
            await device.getState();

            device.off('update', listener);

            assert.strictEqual(spawnCounter, 2);
            assert.strictEqual(eventCounter, 1);
        });
        it('should emit error event if event listener throws an exception', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie'
                    });
                })
            });

            let callCounter = 0;
            const error = new Error('This is an error. Be nice.');
            device.once('error', err => {
                assert.strictEqual(err, error);
                callCounter++;
            });

            const listener = () => {
                throw error;
            };
            device.on('update', listener);

            await new Promise(cb => setTimeout(cb, 0));
            device.off('update', listener);

            assert.strictEqual(callCounter, 1);
        });
    });

    describe('start|stopListening()', function () {
        it('should emit error if spawn fails', async function () {
            const error = new Error();
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.error(error).end();
                })
            });
            const listener = () => {
                // empty listener
            };

            device.on('update', listener);

            await new Promise(cb => {
                device.once('error', err => {
                    assert.strictEqual(err, error);
                    cb();
                });
            });

            device.off('update', listener);
        });
        it('should emit error on stderr data', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.stderr('Hello World!').end();
                })
            });
            const listener = () => {
                // empty listener
            };

            device.on('update', listener);

            await new Promise(cb => {
                device.once('error', err => {
                    assert.ok(err instanceof Error);
                    assert.ok(err.toString().includes('Got stderr output from pyatv: Hello World!'));
                    cb();
                });
            });

            device.off('update', listener);
        });
        it('should emit error if stdout is not valid json', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.stdout('#').end();
                })
            });
            const listener = () => {
                // empty listener
            };

            device.on('update', listener);

            await new Promise(cb => {
                device.once('error', err => {
                    assert.ok(err instanceof Error);
                    assert.ok(err.toString().includes(
                        'Unable to parse stdout json: SyntaxError: '+
                        'Unexpected token # in JSON at position 0'
                    ));
                    cb();
                });
            });

            device.off('update', listener);
        });
        it('should restart the process if it gets killed');
    });

    describe('addListener() / removeAllListeners()', function () {
        it('should work without any exceptions', async function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie'
                    });
                })
            });

            const listener = (event: NodePyATVDeviceEvent) => {
                // empty listener
            };
            device.addListener('update', listener);
            device.removeAllListeners('update');
        });
    });
});
