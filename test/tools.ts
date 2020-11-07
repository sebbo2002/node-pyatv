'use strict';

import assert from 'assert';
import {addRequestId, debug, getExecutable, getParamters, removeRequestId} from '../lib/tools';
import {NodePyATVExecutableType, NodePyATVProtocol} from '../lib/types';

describe('Tools', function () {
    describe('addRequestId() / removeRequestId()', function () {
        it('should return a string', function () {
            const id = addRequestId();
            assert.strictEqual(typeof id, 'string');
            removeRequestId(id);
        });
        it('should work if given id is not in index', function () {
            removeRequestId('FOO');
        });
    });

    describe('debug()', function () {
        it('should work without any options', function () {
            debug('TEST', 'Hello World.', {});
        });
        it('should work with default logger', function () {
            debug('TEST', 'Hello World.', {debug: true});
        });
        it('should work with custom logger', function () {
            debug('TEST', 'Hello World.', {
                debug: function (msg) {
                    assert.strictEqual(this, null);
                    assert.ok(msg.includes('Hello World'));
                }
            });
        });
        it('should work with colors disabled', function () {
            debug('TEST', 'Hello World.', {noColors: true});
        });
        it('should work with custom logger and colors disabled', function () {
            debug('TEST', 'Hello World.', {
                noColors: true,
                debug: function (msg) {
                    assert.strictEqual(this, null);
                    assert.strictEqual(msg, '[node-pyatv][TEST] Hello World.');
                }
            });
        });
    });

    describe('getExecutable()', function () {
        it('should handle atvremotePath if set', function () {
            const result = getExecutable(NodePyATVExecutableType.atvremote, {
                atvremotePath: '/tmp/1',
                atvscriptPath: '/tmp/2'
            });

            assert.strictEqual(result, '/tmp/1');
        });
        it('should handle atvscriptPath if set', function () {
            const result = getExecutable(NodePyATVExecutableType.atvscript, {
                atvremotePath: '/tmp/1',
                atvscriptPath: '/tmp/2'
            });

            assert.strictEqual(result, '/tmp/2');
        });
        it('should handle default for atvremote', function () {
            const result = getExecutable(NodePyATVExecutableType.atvremote, {
                atvscriptPath: '/tmp'
            });

            assert.strictEqual(result, 'atvremote');
        });
        it('should handle default for atvscript', function () {
            const result = getExecutable(NodePyATVExecutableType.atvscript, {
                atvremotePath: '/tmp'
            });

            assert.strictEqual(result, 'atvscript');
        });
    });

    describe('getParameters()', function () {
        it('empty case', async function () {
            const result = await getParamters();
            assert.deepEqual(result, []);
        });
        it('easy case', async function () {
            const result = await getParamters({
                host: '192.168.178.2'
            });
            assert.deepEqual(result, ['-s', '192.168.178.2']);
        });
        it('full case', async function () {
            const result = await getParamters({
                hosts: ['192.168.178.2', '192.168.178.3'],
                id: '****',
                protocol: NodePyATVProtocol.mrp,
                dmapCredentials: '****',
                mrpCredentials: '****',
                airplayCredentials: '****'
            });
            assert.deepEqual(result, [
                '-s', '192.168.178.2,192.168.178.3',
                '-i', '****',
                '--protocol', 'mrp',
                '--dmap-credentials', '****',
                '--mrp-credentials', '****',
                '--airplay-credentials', '****'
            ]);
        });
    });
});
