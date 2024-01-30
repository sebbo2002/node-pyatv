'use strict';

import assert from 'assert';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createFakeSpawn } from '../src/lib/fake-spawn.js';
import NodePyATVInstance, {
    NodePyATVDeviceEvent,
    NodePyATVDeviceState,
    NodePyATVKeys,
    NodePyATVListenerState,
    NodePyATVMediaType,
    NodePyATVPowerState,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    NodePyATVShuffleState
} from '../src/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const version = JSON.parse(readFileSync(__dirname + '/../package.json', 'utf8'))?.version || null;

describe('NodePyATVInstance', function () {
    describe('static version()', function () {
        it('should work with pyatv [L]', async function () {
            this.timeout(4000);
            const result = await NodePyATVInstance.version();
            if (result.pyatv === null) {
                throw new Error('No version found for pyatv. Is it installed in test environment?');
            }

            assert.equal(typeof result.pyatv, 'string', 'result.pyatv is a string');
            assert.ok(result.pyatv.length >= 5, 'result.pyatv has content');
            assert.strictEqual(result.module, version);
        });
        it('should return the pyatv version', async function () {
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn(cp => {
                    cp.code(1);
                    cp.end('atvremote 0.7.4');
                })
            });

            assert.ok(result.pyatv);
            assert.strictEqual(result.pyatv, '0.7.4');
        });
        it('should return the module version', async function () {
            const result = await NodePyATVInstance.version({
                noColors: true,
                spawn: createFakeSpawn(cp =>
                    cp.code(1).end()
                )
            });

            assert.strictEqual(result.module, version);
        });
        it('should handle option.atvremotePath', async function () {
            await NodePyATVInstance.version({
                atvremotePath: '/foo/bar',
                spawn: createFakeSpawn(cp => {
                    assert.strictEqual(cp.cmd(), '/foo/bar');
                    cp.code(1).end();
                })
            });
        });
        it('should work with option.debug = true', async function () {
            await NodePyATVInstance.version({
                debug: true,
                spawn: createFakeSpawn(cp =>
                    cp.code(1).end()
                )
            });
        });
        it('should work with option.noColors', async function () {
            await NodePyATVInstance.version({
                debug: () => {
                    // no debug log
                },
                noColors: true,
                spawn: createFakeSpawn(cp =>
                    cp.code(1).end()
                )
            });
        });
        it('should return null on pyatv stderr output', async function () {
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn(cp =>
                    cp.stderr('Hello World!').code(123).end()
                )
            });

            assert.strictEqual(result.pyatv, null);
        });
        it('should return null on pyatv error', async function () {
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn(cp => {
                    cp.error(new Error('Hello world!')).end();
                })
            });

            assert.strictEqual(result.pyatv, null);
        });
        it('should return null on invalid pyatv version', async function () {
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn(cp => {
                    cp.stdout('atvremote 42').code(1).end();
                })
            });

            assert.strictEqual(result.pyatv, null);
        });
        /* it('should return null on empty module version', async function () {
            const path = require.resolve(__dirname + '/../package.json');
            require(path);

            const cache = require.cache[path];
            assert.ok(cache, 'package.json is in require cache');

            cache.exports = {};
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn(cp => {
                    cp.stdout('atvremote 0.7.4').code(1).end();
                })
            });

            assert.strictEqual(result.module, null);
        }); */
        /* it('should return null on invalid module version', async function () {
            const path = require.resolve(__dirname + '/../package.json');
            require(path);

            const cache = require.cache[path];
            assert.ok(cache, 'package.json is in require cache');

            cache.exports = {version: 42};
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn(cp => {
                    cp.stdout('atvremote 0.7.4').code(1).end();
                })
            });

            assert.strictEqual(result.module, null);
        }); */
    });

    describe('static check()', function () {
        it('should resolve in test environment [L]', async function () {
            this.timeout(12000);
            await NodePyATVInstance.check();
        });
        it('should return nice error message if pyatv was not found', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.check({
                    spawn: createFakeSpawn(cp => {
                        cp.error(new Error('spawn atvremote ENOENT')).code(1).end();
                    })
                });
            }, /Unable to find pyatv. Is it installed?/);
        });
        it('should return nice error message if myatv is too old', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.check({
                    spawn: createFakeSpawn(cp => {
                        cp.stdout('atvremote 0.5.1').code(1).end();
                    })
                });
            }, /Found pyatv, but unforunately it's too old. Please update pyatv./);
        });
        it('should return nice error message if scan failed', async function () {
            let i = 0;
            await assert.rejects(async () => {
                await NodePyATVInstance.check({
                    spawn: createFakeSpawn(cp => {
                        if (i === 0) {
                            cp.stdout('atvremote 0.7.0').code(1).end();
                            i++;
                        } else {
                            cp.error(new Error('spawn atvremote ENOENT')).code(1).end();
                        }
                    })
                });
            }, /Unable to scan for devices/);
        });
    });

    describe('static find()', function () {
        it('should work [L]', async function () {
            this.timeout(10000);
            const result = await NodePyATVInstance.find();
            assert.ok(Array.isArray(result));
        });
        it('should handle option.atvscriptPath', async function () {
            await NodePyATVInstance.find({
                atvscriptPath: '/foo/bar',
                spawn: createFakeSpawn(cp => {
                    assert.strictEqual(cp.cmd(), '/foo/bar');
                    cp.stdout({
                        'result': 'success',
                        'datetime': '2020-11-06T20:47:30.840022+01:00',
                        'devices': []
                    }).end();
                })
            });
        });
        it('should throw error on stderr output', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn(cp => {
                        cp.stderr('Hello World!').code(1).end();
                    })
                });
            }, /Unable to execute request/);
        });
        it('should throw error on error', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn(cp => {
                        cp.error(new Error('Hello world!')).code(1).end();
                    })
                });
            }, /Hello world!/);
        });
        it('should throw error if atvscript result is not valid json', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn(cp => {
                        cp.stdout(JSON.stringify({
                            'result': 'success',
                            'datetime': '2020-11-06T20:47:30.840022+01:00',
                            'devices': []
                        }).substr(1)).end();
                    })
                });
            }, /Unable to parse result/);
        });
        it('should throw error if atvscript result is not successfull', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn(cp => {
                        cp.stdout({
                            result: 'error'
                        }).code(1).end();
                    })
                });
            }, /Unable to parse pyatv response: /);
        });
        it('should throw error if atvscript result is without device array', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn(cp => {
                        cp.stdout({
                            result: 'success'
                        }).code(1).end();
                    })
                });
            }, /Unable to parse pyatv response: /);
        });
        it('should work if devices are without device_info / services', async function () {
            const devices = await NodePyATVInstance.find({
                spawn: createFakeSpawn(cp => {
                    cp.stdout({
                        result: 'success',
                        datetime: '2020-11-06T20:47:30.840022+01:00',
                        devices: [
                            {
                                name: 'Vardagsrum',
                                address: '10.0.10.81',
                                identifier: 'xxx'
                            }
                        ]
                    }).code(1).end();
                })
            });

            assert.strictEqual(devices.length, 1);
            assert.strictEqual(devices[0].name, 'Vardagsrum');
            assert.strictEqual(devices[0].host, '10.0.10.81');
            assert.strictEqual(devices[0].id, 'xxx');
            assert.strictEqual(devices[0].model, undefined);
            assert.strictEqual(devices[0].modelName, undefined);
            assert.strictEqual(devices[0].os, undefined);
            assert.strictEqual(devices[0].version, undefined);
            assert.deepStrictEqual(devices[0].services, undefined);
        });
        it('should work if devices are with device_info / services', async function () {
            const devices = await NodePyATVInstance.find({
                spawn: createFakeSpawn(cp => {
                    cp.stdout({
                        result: 'success',
                        datetime: '2020-11-06T20:47:30.840022+01:00',
                        devices: [
                            {
                                name: 'Vardagsrum',
                                address: '10.0.10.81',
                                identifier: 'xxx',
                                device_info: {
                                    'model': 'Gen4K',
                                    'model_str': 'Apple TV 4K',
                                    'operating_system': 'TvOS',
                                    'version': '15.5.1'
                                },
                                services: [
                                    {
                                        protocol: 'mrp',
                                        port: 49152
                                    },
                                    {
                                        protocol: 'airplay',
                                        port: 7000
                                    }
                                ]
                            }
                        ]
                    }).code(1).end();
                })
            });

            assert.strictEqual(devices.length, 1);
            assert.strictEqual(devices[0].name, 'Vardagsrum');
            assert.strictEqual(devices[0].host, '10.0.10.81');
            assert.strictEqual(devices[0].id, 'xxx');
            assert.strictEqual(devices[0].model, 'Gen4K');
            assert.strictEqual(devices[0].modelName, 'Apple TV 4K');
            assert.strictEqual(devices[0].os, 'TvOS');
            assert.strictEqual(devices[0].version, '15.5.1');
            assert.deepStrictEqual(devices[0].services, [
                {
                    protocol: NodePyATVProtocol.mrp,
                    port: 49152
                },
                {
                    protocol: NodePyATVProtocol.airplay,
                    port: 7000
                }
            ]);
        });
    });

    describe('static device()', function () {
        it('should pass options to constructor', function () {
            const device = NodePyATVInstance.device({ host: '192.168.178.6', name: 'My Testdevice' });
            assert.strictEqual(device.host, '192.168.178.6');
            assert.strictEqual(device.name, 'My Testdevice');
        });
    });

    describe('version()', function () {
        it('should merge options from constructor', async function () {
            const i = new NodePyATVInstance({ atvremotePath: 'test' });
            await i.version({
                spawn: createFakeSpawn(cp => {
                    assert.strictEqual(cp.cmd(), 'test');
                    cp.code(1).end();
                })
            });
        });
    });

    describe('check()', function () {
        it('should merge options from constructor', async function () {
            const i = new NodePyATVInstance({ atvremotePath: 'test' });
            await assert.rejects(async () => {
                await i.check({
                    spawn: createFakeSpawn(cp => {
                        assert.strictEqual(cp.cmd(), 'test');
                        cp.error(new Error('spawn atvremote ENOENT')).code(1).end();
                    })
                });
            }, /Unable to find pyatv. Is it installed?/);
        });
    });

    describe('find()', function () {
        it('should merge options from constructor', async function () {
            const i = new NodePyATVInstance({ atvscriptPath: 'test' });
            await i.find({
                spawn: createFakeSpawn(cp => {
                    assert.strictEqual(cp.cmd(), 'test');
                    cp.stdout({
                        'result': 'success',
                        'datetime': '2020-11-06T20:47:30.840022+01:00',
                        'devices': []
                    }).end();
                })
            });
        });
    });

    describe('device()', function () {
        it('should merge options from constructor', async function () {
            const i = new NodePyATVInstance({ debug: true });
            const d = i.device({ name: 'My Testdevice', host: '192.168.178.2' });
            assert.deepStrictEqual(d.debug, true);
        });
    });

    describe('Type Exports', function () {
        it('Type NodePyATVProtocol should be exported', function () {
            assert.ok(NodePyATVProtocol);
        });
        it('Type NodePyATVMediaType should be exported', function () {
            assert.ok(NodePyATVMediaType);
        });
        it('Type NodePyATVDeviceEvent should be exported', function () {
            assert.ok(NodePyATVDeviceEvent);
        });
        it('Type NodePyATVDeviceState should be exported', function () {
            assert.ok(NodePyATVDeviceState);
        });
        it('Type NodePyATVRepeatState should be exported', function () {
            assert.ok(NodePyATVRepeatState);
        });
        it('Type NodePyATVShuffleState should be exported', function () {
            assert.ok(NodePyATVShuffleState);
        });
        it('Type NodePyATVKeys should be exported', function () {
            assert.ok(NodePyATVKeys);
        });
        it('Type NodePyATVInstanceOptions should be exported', function () {
            assert.ok(NodePyATVListenerState);
        });
        it('Type NodePyATVPowerState should be exported', function () {
            assert.ok(NodePyATVPowerState);
        });
    });
});
