'use strict';

import assert from 'assert';
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
                    cb(undefined);
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
                    cb(undefined);
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
                        cb(undefined);
                    });
                }),
                new Promise(cb => {
                    device.once('update:title', () => {
                        sort.push('update:title');
                        cb(undefined);
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
                    cb(undefined);
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
                    cb(undefined);
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
                    cb(undefined);
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

            const listener = () => {
                // empty listener
            };
            device.addListener('update', listener);
            device.removeAllListeners('update');
        });
    });

    describe('emit()', function () {
        it('should work', function (done) {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                })
            });
            const event = new NodePyATVDeviceEvent({
                key: 'dateTime',
                old: 'foo',
                new: 'bar',
                device
            });

            let executions = 0;
            device.once('test', (e) => {
                executions++;
                assert.strictEqual(e, event);
                assert.strictEqual(executions, 1);
                done();
            });

            device.emit('test', event);
        });
    });

    describe('eventNames()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                })
            });

            const listener = () => {
                // ignore
            };

            device.on('test', listener);
            assert.deepStrictEqual(device.eventNames(), ['test']);
            device.off('test', listener);
        });
    });

    describe('getMaxListeners()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                })
            });

            const result = device.getMaxListeners();
            assert.ok(typeof result, 'number');
            assert.ok(result >= 10);
        });
    });

    describe('listenerCount()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                })
            });

            const listener = () => {
                // ignore
            };

            assert.deepStrictEqual(device.listenerCount('test'), 0);
            device.on('test', listener);
            assert.deepStrictEqual(device.listenerCount('test'), 1);
            device.off('test', listener);
        });
    });

    describe('listeners()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                })
            });

            const listener = () => {
                // ignore
            };

            assert.deepStrictEqual(device.listeners('test').length, 0);
            device.on('test', listener);
            assert.deepStrictEqual(device.listeners('test').length, 1);
            assert.deepStrictEqual(device.listeners('test')[0], listener);
            device.off('test', listener);
        });
    });

    describe('prependListener()', function () {
        it('should work', function (done) {
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

            const listener = () => {
                device.removeAllListeners('update');
                done();
            };
            device.prependListener('update', listener);
        });
    });

    describe('prependOnceListener()', function () {
        it('should work', function (done) {
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

            device.prependOnceListener('update', () => done());
        });
    });

    describe('rawListeners()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                name: 'My Testdevice',
                host: '192.168.178.2',
                spawn: createFakeSpawn(cp => {
                    cp.onStdIn(() => cp.end());
                })
            });

            const listener = () => {
                // ignore
            };

            assert.deepStrictEqual(device.rawListeners('test').length, 0);
            device.on('test', listener);
            assert.deepStrictEqual(device.rawListeners('test').length, 1);
            assert.deepStrictEqual(device.rawListeners('test')[0], listener);
            device.off('test', listener);
        });
    });

    describe('removeListener()', function () {
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

            const listener = () => {
                // empty listener
            };
            device.addListener('update', listener);
            assert.deepStrictEqual(device.listenerCount('update'), 1);
            device.removeListener('update', listener);
            assert.deepStrictEqual(device.listenerCount('update'), 0);
        });
    });
});
