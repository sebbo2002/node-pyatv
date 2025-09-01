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
    NodePyATVShuffleState,
} from '../src/lib/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const version =
    JSON.parse(readFileSync(__dirname + '/../package.json', 'utf8'))?.version ||
    null;

describe('NodePyATVInstance', function () {
    describe('static version()', function () {
        it('should work with pyatv [L]', async function () {
            this.timeout(4000);
            const result = await NodePyATVInstance.version();
            if (result.pyatv === null) {
                throw new Error(
                    'No version found for pyatv. Is it installed in test environment?',
                );
            }

            assert.equal(
                typeof result.pyatv,
                'string',
                'result.pyatv is a string',
            );
            assert.ok(result.pyatv.length >= 5, 'result.pyatv has content');
            assert.strictEqual(result.module, version);
        });
        it('should return the pyatv version', async function () {
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn((cp) => {
                    cp.code(1);
                    cp.end('atvremote 0.7.4');
                }),
            });

            assert.ok(result.pyatv);
            assert.strictEqual(result.pyatv, '0.7.4');
        });
        it('should return the module version', async function () {
            const result = await NodePyATVInstance.version({
                noColors: true,
                spawn: createFakeSpawn((cp) => cp.code(1).end()),
            });

            assert.strictEqual(result.module, version);
        });
        it('should handle option.atvremotePath', async function () {
            await NodePyATVInstance.version({
                atvremotePath: '/foo/bar',
                spawn: createFakeSpawn((cp) => {
                    assert.strictEqual(cp.cmd(), '/foo/bar');
                    cp.code(1).end();
                }),
            });
        });
        it('should work with option.debug = true', async function () {
            await NodePyATVInstance.version({
                debug: true,
                spawn: createFakeSpawn((cp) => cp.code(1).end()),
            });
        });
        it('should work with option.noColors', async function () {
            await NodePyATVInstance.version({
                debug: () => {
                    // no debug log
                },
                noColors: true,
                spawn: createFakeSpawn((cp) => cp.code(1).end()),
            });
        });
        it('should return null on pyatv stderr output', async function () {
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn((cp) =>
                    cp.stderr('Hello World!').code(123).end(),
                ),
            });

            assert.strictEqual(result.pyatv, null);
        });
        it('should return null on pyatv error', async function () {
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn((cp) => {
                    cp.error(new Error('Hello world!')).end();
                }),
            });

            assert.strictEqual(result.pyatv, null);
        });
        it('should return null on invalid pyatv version', async function () {
            const result = await NodePyATVInstance.version({
                spawn: createFakeSpawn((cp) => {
                    cp.stdout('atvremote 42').code(1).end();
                }),
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
                    spawn: createFakeSpawn((cp) => {
                        cp.error(new Error('spawn atvremote ENOENT'))
                            .code(1)
                            .end();
                    }),
                });
            }, /Unable to find pyatv. Is it installed?/);
        });
        it('should return nice error message if myatv is too old', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.check({
                    spawn: createFakeSpawn((cp) => {
                        cp.stdout('atvremote 0.5.1').code(1).end();
                    }),
                });
            }, /Found pyatv, but unforunately it's too old. Please update pyatv./);
        });
        it('should return nice error message if scan failed', async function () {
            let i = 0;
            await assert.rejects(async () => {
                await NodePyATVInstance.check({
                    spawn: createFakeSpawn((cp) => {
                        if (i === 0) {
                            cp.stdout('atvremote 0.7.0').code(1).end();
                            i++;
                        } else {
                            cp.error(new Error('spawn atvremote ENOENT'))
                                .code(1)
                                .end();
                        }
                    }),
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
                spawn: createFakeSpawn((cp) => {
                    assert.strictEqual(cp.cmd(), '/foo/bar');
                    cp.stdout({
                        datetime: '2020-11-06T20:47:30.840022+01:00',
                        devices: [],
                        result: 'success',
                    }).end();
                }),
            });
        });
        it('should throw error on stderr output', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn((cp) => {
                        cp.stderr('Hello World!').code(1).end();
                    }),
                });
            }, /Unable to execute request/);
        });
        it('should throw error on error', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn((cp) => {
                        cp.error(new Error('Hello world!')).code(1).end();
                    }),
                });
            }, /Hello world!/);
        });
        it('should throw error on pyatv failure', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn((cp) => {
                        // Example output from @maxileith
                        // https://github.com/sebbo2002/node-pyatv/issues/324#issue-2360854902
                        cp.stdout({
                            datetime: '2020-11-06T20:47:30.840022+01:00',
                            error: 'Task exception was never retrieved',
                            exception: '[Errno 113] Connect call failed',
                            result: 'failure',
                        })
                            .code(1)
                            .end();
                    }),
                });
            }, /Unable to find any devices, but received 1 error: /);
        });
        it('should throw error if atvscript result is not valid json', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn((cp) => {
                        cp.stdout(
                            JSON.stringify({
                                datetime: '2020-11-06T20:47:30.840022+01:00',
                                devices: [],
                                result: 'success',
                            }).substr(1),
                        ).end();
                    }),
                });
            }, /Unable to parse result/);
        });
        it('should throw error if atvscript result is not successfull', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn((cp) => {
                        cp.stdout({
                            result: 'error',
                        })
                            .code(1)
                            .end();
                    }),
                });
            }, /Unable to parse pyatv response: /);
        });
        it('should throw error if atvscript result is without device array', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: createFakeSpawn((cp) => {
                        cp.stdout({
                            result: 'success',
                        })
                            .code(1)
                            .end();
                    }),
                });
            }, /Unable to parse pyatv response: /);
        });
        it('should work if devices are without device_info / services', async function () {
            const devices = await NodePyATVInstance.find({
                spawn: createFakeSpawn((cp) => {
                    cp.stdout({
                        datetime: '2020-11-06T20:47:30.840022+01:00',
                        devices: [
                            {
                                address: '10.0.10.81',
                                identifier: 'xxx',
                                name: 'Vardagsrum',
                            },
                        ],
                        result: 'success',
                    })
                        .code(1)
                        .end();
                }),
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
                spawn: createFakeSpawn((cp) => {
                    cp.stdout({
                        datetime: '2020-11-06T20:47:30.840022+01:00',
                        devices: [
                            {
                                address: '10.0.10.81',
                                device_info: {
                                    model: 'Gen4K',
                                    model_str: 'Apple TV 4K',
                                    operating_system: 'TvOS',
                                    version: '15.5.1',
                                },
                                identifier: 'xxx',
                                name: 'Vardagsrum',
                                services: [
                                    {
                                        port: 49152,
                                        protocol: 'mrp',
                                    },
                                    {
                                        port: 7000,
                                        protocol: 'airplay',
                                    },
                                ],
                            },
                        ],
                        result: 'success',
                    })
                        .code(1)
                        .end();
                }),
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
                    port: 49152,
                    protocol: NodePyATVProtocol.mrp,
                },
                {
                    port: 7000,
                    protocol: NodePyATVProtocol.airplay,
                },
            ]);
        });
        it('should work for unicast scans', async function () {
            const devices = await NodePyATVInstance.find({
                spawn: createFakeSpawn((cp) => {
                    // Example output from @maxileith
                    // https://github.com/sebbo2002/node-pyatv/issues/324#issue-2360854902
                    cp.stdout(
                        `{"result": "failure", "datetime": "2024-05-18T16:20:18.103087-06:00", "error": "Task exception was never retrieved", "exception": "[Errno 113] Connect call failed ('10.0.0.232', 32498)", "stacktrace": "Traceback (most recent call last):\\n  File \\"/var/lib/homebridge/appletv-enhanced/.venv/lib/python3.11/site-packages/pyatv/support/knock.py\\", line 28, in _async_knock\\n    _, writer = await asyncio.wait_for(\\n                ^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/tasks.py\\", line 479, in wait_for\\n    return fut.result()\\n           ^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/streams.py\\", line 48, in open_connection\\n    transport, _ = await loop.create_connection(\\n                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 1085, in create_connection\\n    raise exceptions[0]\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 1069, in create_connection\\n    sock = await self._connect_sock(\\n           ^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 973, in _connect_sock\\n    await self.sock_connect(sock, address)\\n  File \\"/usr/lib/python3.11/asyncio/selector_events.py\\", line 634, in sock_connect\\n    return await fut\\n           ^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/selector_events.py\\", line 674, in _sock_connect_cb\\n    raise OSError(err, f'Connect call failed {address}')\\nOSError: [Errno 113] Connect call failed ('10.0.0.232', 32498)\\n"}
{"result": "failure", "datetime": "2024-05-18T16:20:18.114744-06:00", "error": "Task exception was never retrieved", "exception": "[Errno 113] Connect call failed ('10.0.0.229', 32498)", "stacktrace": "Traceback (most recent call last):\\n  File \\"/var/lib/homebridge/appletv-enhanced/.venv/lib/python3.11/site-packages/pyatv/support/knock.py\\", line 28, in _async_knock\\n    _, writer = await asyncio.wait_for(\\n                ^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/tasks.py\\", line 479, in wait_for\\n    return fut.result()\\n           ^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/streams.py\\", line 48, in open_connection\\n    transport, _ = await loop.create_connection(\\n                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 1085, in create_connection\\n    raise exceptions[0]\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 1069, in create_connection\\n    sock = await self._connect_sock(\\n           ^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 973, in _connect_sock\\n    await self.sock_connect(sock, address)\\n  File \\"/usr/lib/python3.11/asyncio/selector_events.py\\", line 634, in sock_connect\\n    return await fut\\n           ^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/selector_events.py\\", line 674, in _sock_connect_cb\\n    raise OSError(err, f'Connect call failed {address}')\\nOSError: [Errno 113] Connect call failed ('10.0.0.229', 32498)\\n"}
{"result": "success", "datetime": "2024-05-18T16:20:20.042648-06:00", "devices": [{"name": "Living Room", "address": "10.0.0.30", "identifier": "37323C0E-99E6-4CC3-A006-1ED5368FFF8C", "all_identifiers": ["86B730B2-5189-4B6A-BCAA-CDDB18F05FA8", "C8:D0:83:E9:D0:49", "37323C0E-99E6-4CC3-A006-1ED5368FFF8C", "C8D083E9D049"], "device_info": {"mac": "C8:D0:83:E9:D0:49", "model": "Gen4K", "model_str": "Apple TV 4K", "operating_system": "TvOS", "version": "17.5"}, "services": [{"protocol": "companion", "port": 49153}, {"protocol": "airplay", "port": 7000}, {"protocol": "mrp", "port": 49154}, {"protocol": "raop", "port": 7000}]}, {"name": "Kitchen", "address": "10.0.0.79", "identifier": "45B6A67A-9FAD-497D-95EF-7FC5ECB3371C", "all_identifiers": ["B163C908-000F-4983-BDC7-BEFD76887EF5", "C8:69:CD:63:2A:11", "45B6A67A-9FAD-497D-95EF-7FC5ECB3371C", "C869CD632A11"], "device_info": {"mac": "C8:69:CD:63:2A:11", "model": "Gen4", "model_str": "Apple TV 4", "operating_system": "TvOS", "version": "17.4"}, "services": [{"protocol": "companion", "port": 49153}, {"protocol": "airplay", "port": 7000}, {"protocol": "mrp", "port": 49157}, {"protocol": "raop", "port": 7000}]}, {"name": "Bedroom", "address": "10.0.0.20", "identifier": "CA55DA36-ADEF-4DBC-A0B3-BA68B0C53E40", "all_identifiers": ["08:66:98:BC:37:1F", "108F35A0-FF21-4884-96C2-145AAAB1B4C4", "CA55DA36-ADEF-4DBC-A0B3-BA68B0C53E40", "086698BC371F"], "device_info": {"mac": "08:66:98:BC:37:1F", "model": "Gen4", "model_str": "Apple TV 4", "operating_system": "TvOS", "version": "17.4"}, "services": [{"protocol": "airplay", "port": 7000}, {"protocol": "companion", "port": 49153}, {"protocol": "mrp", "port": 49154}, {"protocol": "raop", "port": 7000}]}, {"name": "Basement", "address": "10.0.0.156", "identifier": "C02B27DB-2AF3-43E7-8EF7-885E1E9AB3B4", "all_identifiers": ["8BDB6773-479F-4C01-A185-29FF5516F2C2", "D0:03:4B:4C:2A:2E", "C02B27DB-2AF3-43E7-8EF7-885E1E9AB3B4", "D0034B4C2A2E"], "device_info": {"mac": "D0:03:4B:4C:2A:2E", "model": "Gen4", "model_str": "Apple TV 4", "operating_system": "TvOS", "version": "17.4"}, "services": [{"protocol": "companion", "port": 49153}, {"protocol": "airplay", "port": 7000}, {"protocol": "mrp", "port": 49154}, {"protocol": "raop", "port": 7000}]}]}`,
                    )
                        .code(1)
                        .end();
                }),
            });

            assert.strictEqual(devices.length, 4);

            assert.strictEqual(devices[0].name, 'Living Room');
            assert.strictEqual(devices[0].host, '10.0.0.30');
            assert.strictEqual(
                devices[0].id,
                '37323C0E-99E6-4CC3-A006-1ED5368FFF8C',
            );

            assert.strictEqual(devices[1].name, 'Kitchen');
            assert.strictEqual(devices[1].host, '10.0.0.79');
            assert.strictEqual(
                devices[1].id,
                '45B6A67A-9FAD-497D-95EF-7FC5ECB3371C',
            );

            assert.strictEqual(devices[2].name, 'Bedroom');
            assert.strictEqual(devices[2].host, '10.0.0.20');
            assert.strictEqual(
                devices[2].id,
                'CA55DA36-ADEF-4DBC-A0B3-BA68B0C53E40',
            );

            assert.strictEqual(devices[3].name, 'Basement');
            assert.strictEqual(devices[3].host, '10.0.0.156');
            assert.strictEqual(
                devices[3].id,
                'C02B27DB-2AF3-43E7-8EF7-885E1E9AB3B4',
            );
        });
        it('should work for unicast scans with returnDevicesAndErrors = true', async function () {
            const response = await NodePyATVInstance.find(
                {
                    spawn: createFakeSpawn((cp) => {
                        // Example output from @maxileith
                        // https://github.com/sebbo2002/node-pyatv/issues/324#issue-2360854902
                        cp.stdout(
                            `{"result": "failure", "datetime": "2024-05-18T16:20:18.103087-06:00", "error": "Task exception was never retrieved", "exception": "[Errno 113] Connect call failed ('10.0.0.232', 32498)", "stacktrace": "Traceback (most recent call last):\\n  File \\"/var/lib/homebridge/appletv-enhanced/.venv/lib/python3.11/site-packages/pyatv/support/knock.py\\", line 28, in _async_knock\\n    _, writer = await asyncio.wait_for(\\n                ^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/tasks.py\\", line 479, in wait_for\\n    return fut.result()\\n           ^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/streams.py\\", line 48, in open_connection\\n    transport, _ = await loop.create_connection(\\n                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 1085, in create_connection\\n    raise exceptions[0]\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 1069, in create_connection\\n    sock = await self._connect_sock(\\n           ^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 973, in _connect_sock\\n    await self.sock_connect(sock, address)\\n  File \\"/usr/lib/python3.11/asyncio/selector_events.py\\", line 634, in sock_connect\\n    return await fut\\n           ^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/selector_events.py\\", line 674, in _sock_connect_cb\\n    raise OSError(err, f'Connect call failed {address}')\\nOSError: [Errno 113] Connect call failed ('10.0.0.232', 32498)\\n"}
{"result": "failure", "datetime": "2024-05-18T16:20:18.114744-06:00", "error": "Task exception was never retrieved", "exception": "[Errno 113] Connect call failed ('10.0.0.229', 32498)", "stacktrace": "Traceback (most recent call last):\\n  File \\"/var/lib/homebridge/appletv-enhanced/.venv/lib/python3.11/site-packages/pyatv/support/knock.py\\", line 28, in _async_knock\\n    _, writer = await asyncio.wait_for(\\n                ^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/tasks.py\\", line 479, in wait_for\\n    return fut.result()\\n           ^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/streams.py\\", line 48, in open_connection\\n    transport, _ = await loop.create_connection(\\n                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 1085, in create_connection\\n    raise exceptions[0]\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 1069, in create_connection\\n    sock = await self._connect_sock(\\n           ^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/base_events.py\\", line 973, in _connect_sock\\n    await self.sock_connect(sock, address)\\n  File \\"/usr/lib/python3.11/asyncio/selector_events.py\\", line 634, in sock_connect\\n    return await fut\\n           ^^^^^^^^^\\n  File \\"/usr/lib/python3.11/asyncio/selector_events.py\\", line 674, in _sock_connect_cb\\n    raise OSError(err, f'Connect call failed {address}')\\nOSError: [Errno 113] Connect call failed ('10.0.0.229', 32498)\\n"}
{"result": "success", "datetime": "2024-05-18T16:20:20.042648-06:00", "devices": [{"name": "Living Room", "address": "10.0.0.30", "identifier": "37323C0E-99E6-4CC3-A006-1ED5368FFF8C", "all_identifiers": ["86B730B2-5189-4B6A-BCAA-CDDB18F05FA8", "C8:D0:83:E9:D0:49", "37323C0E-99E6-4CC3-A006-1ED5368FFF8C", "C8D083E9D049"], "device_info": {"mac": "C8:D0:83:E9:D0:49", "model": "Gen4K", "model_str": "Apple TV 4K", "operating_system": "TvOS", "version": "17.5"}, "services": [{"protocol": "companion", "port": 49153}, {"protocol": "airplay", "port": 7000}, {"protocol": "mrp", "port": 49154}, {"protocol": "raop", "port": 7000}]}, {"name": "Kitchen", "address": "10.0.0.79", "identifier": "45B6A67A-9FAD-497D-95EF-7FC5ECB3371C", "all_identifiers": ["B163C908-000F-4983-BDC7-BEFD76887EF5", "C8:69:CD:63:2A:11", "45B6A67A-9FAD-497D-95EF-7FC5ECB3371C", "C869CD632A11"], "device_info": {"mac": "C8:69:CD:63:2A:11", "model": "Gen4", "model_str": "Apple TV 4", "operating_system": "TvOS", "version": "17.4"}, "services": [{"protocol": "companion", "port": 49153}, {"protocol": "airplay", "port": 7000}, {"protocol": "mrp", "port": 49157}, {"protocol": "raop", "port": 7000}]}, {"name": "Bedroom", "address": "10.0.0.20", "identifier": "CA55DA36-ADEF-4DBC-A0B3-BA68B0C53E40", "all_identifiers": ["08:66:98:BC:37:1F", "108F35A0-FF21-4884-96C2-145AAAB1B4C4", "CA55DA36-ADEF-4DBC-A0B3-BA68B0C53E40", "086698BC371F"], "device_info": {"mac": "08:66:98:BC:37:1F", "model": "Gen4", "model_str": "Apple TV 4", "operating_system": "TvOS", "version": "17.4"}, "services": [{"protocol": "airplay", "port": 7000}, {"protocol": "companion", "port": 49153}, {"protocol": "mrp", "port": 49154}, {"protocol": "raop", "port": 7000}]}, {"name": "Basement", "address": "10.0.0.156", "identifier": "C02B27DB-2AF3-43E7-8EF7-885E1E9AB3B4", "all_identifiers": ["8BDB6773-479F-4C01-A185-29FF5516F2C2", "D0:03:4B:4C:2A:2E", "C02B27DB-2AF3-43E7-8EF7-885E1E9AB3B4", "D0034B4C2A2E"], "device_info": {"mac": "D0:03:4B:4C:2A:2E", "model": "Gen4", "model_str": "Apple TV 4", "operating_system": "TvOS", "version": "17.4"}, "services": [{"protocol": "companion", "port": 49153}, {"protocol": "airplay", "port": 7000}, {"protocol": "mrp", "port": 49154}, {"protocol": "raop", "port": 7000}]}]}`,
                        )
                            .code(1)
                            .end();
                    }),
                },
                true,
            );

            assert.strictEqual(response.devices.length, 4);
            assert.strictEqual(response.errors.length, 2);

            assert.strictEqual(response.devices[0].name, 'Living Room');
            assert.strictEqual(response.devices[0].host, '10.0.0.30');
            assert.strictEqual(
                response.devices[0].id,
                '37323C0E-99E6-4CC3-A006-1ED5368FFF8C',
            );

            assert.strictEqual(response.devices[1].name, 'Kitchen');
            assert.strictEqual(response.devices[1].host, '10.0.0.79');
            assert.strictEqual(
                response.devices[1].id,
                '45B6A67A-9FAD-497D-95EF-7FC5ECB3371C',
            );

            assert.strictEqual(response.devices[2].name, 'Bedroom');
            assert.strictEqual(response.devices[2].host, '10.0.0.20');
            assert.strictEqual(
                response.devices[2].id,
                'CA55DA36-ADEF-4DBC-A0B3-BA68B0C53E40',
            );

            assert.strictEqual(response.devices[3].name, 'Basement');
            assert.strictEqual(response.devices[3].host, '10.0.0.156');
            assert.strictEqual(
                response.devices[3].id,
                'C02B27DB-2AF3-43E7-8EF7-885E1E9AB3B4',
            );

            assert.strictEqual(
                response.errors[0].exception,
                "[Errno 113] Connect call failed ('10.0.0.232', 32498)",
            );
            assert.strictEqual(
                response.errors[1].exception,
                "[Errno 113] Connect call failed ('10.0.0.229', 32498)",
            );
        });
    });

    describe('static device()', function () {
        it('should pass options to constructor', function () {
            const device = NodePyATVInstance.device({
                host: '192.168.178.6',
                name: 'My Testdevice',
            });
            assert.strictEqual(device.host, '192.168.178.6');
            assert.strictEqual(device.name, 'My Testdevice');
        });
    });

    describe('version()', function () {
        it('should merge options from constructor', async function () {
            const i = new NodePyATVInstance({ atvremotePath: 'test' });
            await i.version({
                spawn: createFakeSpawn((cp) => {
                    assert.strictEqual(cp.cmd(), 'test');
                    cp.code(1).end();
                }),
            });
        });
    });

    describe('check()', function () {
        it('should merge options from constructor', async function () {
            const i = new NodePyATVInstance({ atvremotePath: 'test' });
            await assert.rejects(async () => {
                await i.check({
                    spawn: createFakeSpawn((cp) => {
                        assert.strictEqual(cp.cmd(), 'test');
                        cp.error(new Error('spawn atvremote ENOENT'))
                            .code(1)
                            .end();
                    }),
                });
            }, /Unable to find pyatv. Is it installed?/);
        });
    });

    describe('find()', function () {
        it('should merge options from constructor', async function () {
            const i = new NodePyATVInstance({ atvscriptPath: 'test' });
            await i.find({
                spawn: createFakeSpawn((cp) => {
                    assert.strictEqual(cp.cmd(), 'test');
                    cp.stdout({
                        datetime: '2020-11-06T20:47:30.840022+01:00',
                        devices: [],
                        result: 'success',
                    }).end();
                }),
            });
        });
    });

    describe('device()', function () {
        it('should merge options from constructor', async function () {
            const i = new NodePyATVInstance({ debug: true });
            const d = i.device({
                host: '192.168.178.2',
                name: 'My Testdevice',
            });
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
