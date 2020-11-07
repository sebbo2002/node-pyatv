'use strict';

import assert from 'assert';
import {mockSpawn} from 'spawn-mock';
import NodePyATVInstance from '../lib/instance';

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

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            assert.strictEqual(result.module, require(__dirname + '/../package.json').version || null);
        });
        it('should return the pyatv version', async function () {
            const result = await NodePyATVInstance.version({
                spawn: mockSpawn(cp => {
                    cp.stdout.write('atvremote 0.7.4');
                    cp.kill('', 1);
                })
            });

            assert.ok(result.pyatv);
            assert.strictEqual(result.pyatv, '0.7.4');
        });
        it('should return the module version', async function () {
            const result = await NodePyATVInstance.version({
                noColors: true,
                spawn: mockSpawn(cp => cp.kill('', 1))
            });

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            assert.strictEqual(result.module, require(__dirname + '/../package.json').version || null);
        });
        it('should handle option.atvremotePath', async function () {
            await NodePyATVInstance.version({
                atvremotePath: '/foo/bar',
                spawn: mockSpawn(cp => {
                    assert.strictEqual(cp.cmd, '/foo/bar');
                    cp.kill('', 1);
                })
            });
        });
        it('should work with option.debug = true', async function () {
            await NodePyATVInstance.version({
                debug: true,
                spawn: mockSpawn(cp => cp.kill('', 1))
            });
        });
        it('should work with option.noColors', async function () {
            await NodePyATVInstance.version({
                debug: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
                noColors: true,
                spawn: mockSpawn(cp => cp.kill('', 1))
            });
        });
        it('should return null on pyatv stderr output', async function () {
            const result = await NodePyATVInstance.version({
                spawn: mockSpawn(cp => {
                    cp.stderr.write('Hello World!');
                    cp.kill('', 123);
                })
            });

            assert.strictEqual(result.pyatv, null);
        });
        it('should return null on pyatv error', async function () {
            const result = await NodePyATVInstance.version({
                spawn: mockSpawn(cp => {
                    cp.emit('error', new Error('Hello world!'));
                })
            });

            assert.strictEqual(result.pyatv, null);
        });
        it('should return null on pyatv error (which are not errors)', async function () {
            const result = await NodePyATVInstance.version({
                spawn: mockSpawn(cp => {
                    cp.emit('error', 'Hello world!');
                })
            });

            assert.strictEqual(result.pyatv, null);
        });
        it('should return null on invalid pyatv version', async function () {
            const result = await NodePyATVInstance.version({
                spawn: mockSpawn(cp => {
                    cp.stdout.write('atvremote 42');
                    cp.kill('', 1);
                })
            });

            assert.strictEqual(result.pyatv, null);
        });
        it('should return null on empty module version', async function () {
            const path = require.resolve(__dirname + '/../package.json');
            require(path);

            const cache = require.cache[path];
            assert.ok(cache, 'package.json is in require cache');

            cache.exports = {};
            const result = await NodePyATVInstance.version({
                spawn: mockSpawn(cp => {
                    cp.stdout.write('atvremote 0.7.4');
                    cp.kill('', 1);
                })
            });

            assert.strictEqual(result.module, null);
        });
        it('should return null on invalid module version', async function () {
            const path = require.resolve(__dirname + '/../package.json');
            require(path);

            const cache = require.cache[path];
            assert.ok(cache, 'package.json is in require cache');

            cache.exports = {version: 42};
            const result = await NodePyATVInstance.version({
                spawn: mockSpawn(cp => {
                    cp.stdout.write('atvremote 0.7.4');
                    cp.kill('', 1);
                })
            });

            assert.strictEqual(result.module, null);
        });
    });

    describe('static check()', function () {
        it('should resolve in test environment [L]', async function () {
            this.timeout(12000);
            await NodePyATVInstance.check();
        });
        it('should return nice error message if pyatv was not found', async function() {
            await assert.rejects(async () => {
                await NodePyATVInstance.check({
                    spawn: mockSpawn(cp => {
                        cp.emit('error', new Error('spawn atvremote ENOENT'));
                        cp.kill('', 1);
                    })
                });
            }, /Unable to find pyatv. Is it installed?/);
        });
        it('should return nice error message if myatv is too old', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.check({
                    spawn: mockSpawn(cp => {
                        cp.stdout.write('atvremote 0.5.1');
                        cp.kill('', 1);
                    })
                });
            }, /Found pyatv, but unforunately it's too old. Please update pyatv./);
        });
        it('should return nice error message if scan failed', async function() {
            let i = 0;
            await assert.rejects(async () => {
                await NodePyATVInstance.check({
                    spawn: mockSpawn(cp => {
                        if(i === 0) {
                            cp.stdout.write('atvremote 0.7.0');
                            cp.kill('', 1);
                            i++;
                        } else {
                            cp.emit('error', new Error('spawn atvremote ENOENT'));
                            cp.kill('', 1);
                        }
                    })
                });
            }, /Unable to scan for devices/);
        });
    });

    describe('static find()', function () {
        it('should work [L]', async function () {
            this.timeout(8000);
            const result = await NodePyATVInstance.find();
            assert.ok(Array.isArray(result));
        });
        it('should handle option.atvscriptPath', async function () {
            await NodePyATVInstance.find({
                atvscriptPath: '/foo/bar',
                spawn: mockSpawn(cp => {
                    assert.strictEqual(cp.cmd, '/foo/bar');
                    cp.stdout.write(JSON.stringify({
                        'result': 'success',
                        'datetime': '2020-11-06T20:47:30.840022+01:00',
                        'devices': []
                    }));
                    cp.kill('', 0);
                })
            });
        });
        it('should throw error on stderr output');
        it('should throw error on error', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: mockSpawn(cp => {
                        cp.emit('error', new Error('Hello world!'));
                    })
                });
            }, /Hello world!/);
        });
        it('should throw error on error (which are not errors)', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: mockSpawn(cp => {
                        cp.emit('error', 'Hello world!');
                    })
                });
            }, /Hello world!/);
        });
        it('should throw error if atvscript result is not valid json', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: mockSpawn(cp => {
                        cp.stdout.write(JSON.stringify({
                            'result': 'success',
                            'datetime': '2020-11-06T20:47:30.840022+01:00',
                            'devices': []
                        }).substr(1));
                        cp.kill('', 0);
                    })
                });
            }, /Unable to parse result/);
        });
        it('should throw error if atvscript result is not successfull', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: mockSpawn(cp => {
                        cp.stdout.write(JSON.stringify({
                            result: 'error'
                        }));
                        cp.kill('', 1);
                    })
                });
            }, /Unable to parse pyatv response: /);
        });
        it('should throw error if atvscript result is without device array', async function () {
            await assert.rejects(async () => {
                await NodePyATVInstance.find({
                    spawn: mockSpawn(cp => {
                        cp.stdout.write(JSON.stringify({
                            result: 'success'
                        }));
                        cp.kill('', 1);
                    })
                });
            }, /Unable to parse pyatv response: /);
        });
    });

    describe('static device()', function () {
        it('should pass options to constructor', function () {
            const device = NodePyATVInstance.device({host: '192.168.178.6', name: 'My Testdevice'});
            assert.strictEqual(device.host, '192.168.178.6');
            assert.strictEqual(device.name, 'My Testdevice');
        });
    });

    describe('version()', function() {
        it('should merge options from constructor', async function() {
            const i = new NodePyATVInstance({atvremotePath: 'test'});
            await i.version({
                spawn: mockSpawn(cp => {
                    assert.strictEqual(cp.cmd, 'test');
                    cp.kill('', 1);
                })
            });
        });
    });

    describe('check()', function() {
        it('should merge options from constructor', async function() {
            const i = new NodePyATVInstance({atvremotePath: 'test'});
            await assert.rejects(async () => {
                await i.check({
                    spawn: mockSpawn(cp => {
                        assert.strictEqual(cp.cmd, 'test');
                        cp.emit('error', new Error('spawn atvremote ENOENT'));
                        cp.kill('', 1);
                    })
                });
            }, /Unable to find pyatv. Is it installed?/);
        });
    });

    describe('find()', function() {
        it('should merge options from constructor', async function() {
            const i = new NodePyATVInstance({atvscriptPath: 'test'});
            await i.find({
                spawn: mockSpawn(cp => {
                    assert.strictEqual(cp.cmd, 'test');
                    cp.stdout.write(JSON.stringify({
                        'result': 'success',
                        'datetime': '2020-11-06T20:47:30.840022+01:00',
                        'devices': []
                    }));
                    cp.kill('', 0);
                })
            });
        });
    });

    describe('device()', function () {
        it('should merge options from constructor', async function() {
            const i = new NodePyATVInstance({debug: true});
            const d = i.device({name: 'My Testdevice', host: '192.168.178.2'});
            assert.deepStrictEqual(d.debug, true);
        });
    });
});
