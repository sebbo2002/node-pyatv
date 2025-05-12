'use strict';

import assert from 'assert';

import { createFakeSpawn } from '../src/lib/fake-spawn.js';
import {
    NodePyATVDevice,
    NodePyATVDeviceEvent,
    NodePyATVPowerState,
} from '../src/lib/index.js';
import { NodePyATVFocusState } from '../src/lib/types.js';

describe('NodePyATVDeviceEvents', function () {
    describe('applyStateAndEmitEvents()', function () {
        it('should emit update:key event', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
            });

            await new Promise((cb) => {
                device.once('update:title', (event) => {
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
            });

            await new Promise((cb) => {
                device.once('update', (event) => {
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
            });

            const sort: string[] = [];
            await Promise.race([
                new Promise((cb) => {
                    device.once('update', () => {
                        sort.push('update');
                        cb(undefined);
                    });
                }),
                new Promise((cb) => {
                    device.once('update:title', () => {
                        sort.push('update:title');
                        cb(undefined);
                    });
                }),
            ]);

            assert.deepStrictEqual(sort, ['update:title', 'update']);
        });
        it('should emit error events on failures', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        datetime: '2021-11-24T21:13:36.424576+03:00',
                        exception: 'invalid credentials: 321',
                        result: 'failure',
                        stacktrace:
                            'Traceback (most recent call last):\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/scripts/atvscript.py", line 302, in appstart\n    print(args.output(await _handle_command(args, abort_sem, loop)), flush=True)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/scripts/atvscript.py", line 196, in _handle_command\n    atv = await connect(config, loop, protocol=Protocol.MRP)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/__init__.py", line 96, in connect\n    for setup_data in proto_methods.setup(\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/protocols/airplay/__init__.py", line 192, in setup\n    stream = AirPlayStream(config, service)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/protocols/airplay/__init__.py", line 79, in __init__\n    self._credentials: HapCredentials = parse_credentials(self.service.credentials)\n  File "/Users/free/Library/Python/3.8/lib/python/site-packages/pyatv/auth/hap_pairing.py", line 139, in parse_credentials\n    raise exceptions.InvalidCredentialsError("invalid credentials: " + detail_string)\npyatv.exceptions.InvalidCredentialsError: invalid credentials: 321\n',
                    });
                }),
            });

            await new Promise((cb) => {
                device.once('error', (error) => {
                    assert.ok(error instanceof Error);
                    assert.ok(
                        error.toString().includes('invalid credentials: 321'),
                    );
                    cb(undefined);
                });
            });
        });
        it('should not emit an update if new value is same as old one', async function () {
            let spawnCounter = 0;
            let eventCounter = 0;
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    if (spawnCounter === 0) {
                        cp.onStdIn(() => cp.end());
                    }

                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });

                    spawnCounter++;
                    if (spawnCounter >= 2) {
                        cp.end();
                    }
                }),
            });

            const listener = () => {
                eventCounter++;
            };

            device.on('update', listener);
            await new Promise((cb) => setTimeout(cb, 0));
            await device.getState();

            device.off('update', listener);

            assert.strictEqual(spawnCounter, 2);
            assert.strictEqual(eventCounter, 1);
        });
        it('should emit error event if event listener throws an exception', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
            });

            let callCounter = 0;
            const error = new Error('This is an error. Be nice.');
            device.once('error', (err) => {
                assert.strictEqual(err, error);
                callCounter++;
            });

            const listener = () => {
                throw error;
            };
            device.on('update', listener);

            await new Promise((cb) => setTimeout(cb, 0));
            device.off('update', listener);

            assert.strictEqual(callCounter, 1);
        });
        it('should also work with powerState', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        datetime: new Date().toJSON(),
                        power_state: 'off',
                        result: 'success',
                    });
                }),
            });

            await new Promise((cb) => {
                device.once('update:powerState', (event) => {
                    assert.ok(event instanceof NodePyATVDeviceEvent);
                    assert.strictEqual(event.key, 'powerState');
                    assert.strictEqual(event.oldValue, null);
                    assert.strictEqual(event.newValue, 'off');
                    assert.strictEqual(event.newValue, NodePyATVPowerState.off);
                    assert.strictEqual(event.value, 'off');
                    assert.strictEqual(event.value, NodePyATVPowerState.off);
                    assert.deepStrictEqual(event.device, device);
                    cb(undefined);
                });
            });
        });
        it('should only one event for powerState changes', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        datetime: new Date().toJSON(),
                        power_state: 'off',
                        result: 'success',
                    });
                    cp.end();
                }),
            });

            let counter = 0;
            device.on('update', (event) => {
                assert.ok(event instanceof NodePyATVDeviceEvent);
                assert.strictEqual(event.key, 'powerState');
                assert.strictEqual(event.oldValue, null);
                assert.strictEqual(event.newValue, 'off');
                assert.strictEqual(event.newValue, NodePyATVPowerState.off);
                assert.strictEqual(event.value, 'off');
                assert.strictEqual(event.value, NodePyATVPowerState.off);
                assert.deepStrictEqual(event.device, device);
                counter++;
            });

            await new Promise((cb) => setTimeout(cb, 10));
            assert.strictEqual(counter, 1);
            device.removeAllListeners('update');
        });
        it('should only one event for focusState changes', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        datetime: new Date().toJSON(),
                        focus_state: 'unfocused',
                        result: 'success',
                    });
                    cp.end();
                }),
            });

            let counter = 0;
            device.on('update', (event) => {
                assert.ok(event instanceof NodePyATVDeviceEvent);
                assert.strictEqual(event.key, 'focusState');
                assert.strictEqual(event.oldValue, null);
                assert.strictEqual(event.newValue, 'unfocused');
                assert.strictEqual(
                    event.newValue,
                    NodePyATVFocusState.unfocused,
                );
                assert.strictEqual(event.value, 'unfocused');
                assert.strictEqual(event.value, NodePyATVFocusState.unfocused);
                assert.deepStrictEqual(event.device, device);
                counter++;
            });

            await new Promise((cb) => setTimeout(cb, 10));
            assert.strictEqual(counter, 1);
            device.removeAllListeners('update');
        });
        it('should only one event for outputDevices changes', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        datetime: new Date().toJSON(),
                        output_devices: [
                            {
                                identifier:
                                    'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
                                name: 'Living room',
                            },
                        ],
                        result: 'success',
                    });
                    cp.end();
                }),
            });

            let counter = 0;
            device.on('update', (event) => {
                assert.ok(event instanceof NodePyATVDeviceEvent);
                assert.strictEqual(event.key, 'outputDevices');
                assert.strictEqual(event.oldValue, null);
                assert.deepStrictEqual(event.newValue, [
                    {
                        identifier: 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
                        name: 'Living room',
                    },
                ]);
                assert.deepStrictEqual(event.value, [
                    {
                        identifier: 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
                        name: 'Living room',
                    },
                ]);
                assert.deepStrictEqual(event.device, device);

                counter++;
            });

            await new Promise((cb) => setTimeout(cb, 10));
            assert.strictEqual(counter, 1);
            device.removeAllListeners('update');
        });
        it('should only one event for volume changes', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        datetime: new Date().toJSON(),
                        result: 'success',
                        volume: 20.0,
                    });
                    cp.end();
                }),
            });

            let counter = 0;
            device.on('update', (event) => {
                assert.ok(event instanceof NodePyATVDeviceEvent);
                assert.strictEqual(event.key, 'volume');
                assert.strictEqual(event.oldValue, null);
                assert.strictEqual(event.newValue, 20);
                assert.strictEqual(event.value, 20);
                assert.deepStrictEqual(event.device, device);
                counter++;
            });

            await new Promise((cb) => setTimeout(cb, 10));
            assert.strictEqual(counter, 1);
            device.removeAllListeners('update');
        });
        it('should not trigger any events for newly added fields', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        datetime: new Date().toJSON(),
                        foo: 'bar',
                        result: 'success',
                    });
                    cp.end();
                }),
            });

            device.on('update', (event) => {
                assert.fail(`Got an update event for a new field: ${event}`);
            });

            await new Promise((cb) => setTimeout(cb, 10));
            device.removeAllListeners('update');
        });
    });

    describe('start|stopListening()', function () {
        it('should emit error if spawn fails', async function () {
            const error = new Error();
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.error(error).end();
                }),
            });
            const listener = () => {
                // empty listener
            };

            device.on('update', listener);

            await new Promise((cb) => {
                device.once('error', (err) => {
                    assert.strictEqual(err, error);
                    cb(undefined);
                });
            });

            device.off('update', listener);
        });
        it('should emit error on stderr data', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.stderr('Hello World!').end();
                }),
            });
            const listener = () => {
                // empty listener
            };

            device.on('update', listener);

            await new Promise((cb) => {
                device.once('error', (err) => {
                    assert.ok(err instanceof Error);
                    assert.ok(
                        err
                            .toString()
                            .includes(
                                'Got stderr output from pyatv: Hello World!',
                            ),
                    );
                    cb(undefined);
                });
            });

            device.off('update', listener);
        });
        it('should emit error if stdout is not valid json', async function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.stdout('#').end();
                }),
            });
            const listener = () => {
                // empty listener
            };

            device.on('update', listener);

            await new Promise((cb) => {
                device.once('error', (err) => {
                    assert.ok(err instanceof Error);
                    assert.ok(
                        err
                            .toString()
                            .includes(
                                'Unable to parse stdout json: SyntaxError',
                            ),
                    );
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                }),
            });
            const event = new NodePyATVDeviceEvent({
                device,
                key: 'dateTime',
                new: 'bar',
                old: 'foo',
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                }),
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                }),
            });

            const result = device.getMaxListeners();
            assert.ok(typeof result, 'number');
            assert.ok(result >= 10);
        });
    });

    describe('listenerCount()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                }),
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                }),
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
            });

            device.prependOnceListener('update', () => done());
        });
    });

    describe('rawListeners()', function () {
        it('should work', function () {
            const device = new NodePyATVDevice({
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                }),
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
                host: '192.168.178.2',
                name: 'My Testdevice',
                spawn: createFakeSpawn((cp) => {
                    cp.onStdIn(() => cp.end());
                    cp.stdout({
                        result: 'success',
                        title: 'My Movie',
                    });
                }),
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
