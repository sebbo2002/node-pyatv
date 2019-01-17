'use strict';

const globalDebugIndex = [];

/**
 * @author Sebastian Pekarek
 * @module @sebbo2002/node-pyatv
 * @class NodePyATVInstance
 */
class NodePyATVInstance {


    /**
     * Scanning for devices on network
     *
     * @param {object} [options]
     * @param {number} [options.timeout]
     * @param {string} [options.atvremoteBinary]
     * @param {string} [options.unbufferBinary]
     * @param {boolean} [options.debug]
     * @param {function} [options.log]
     * @returns Promise<Array<NodePyATVInstance>>
     */
    static async scan(options = {}) {
        const result = await this._request('scan', options);

        return result
            .split('\n')
            .map(line => {
                const p = line.match(/^ - (.+) at (.+) \([\w\s]+: ([\w-]+)\)$/);
                if (!p) {
                    return;
                }

                return new NodePyATVInstance({
                    name: p[1],
                    address: p[2],
                    loginId: p[3]
                });
            })
            .filter(m => m);
    }


    /**
     * Returns relevant version information
     *
     * @param {object} [options]
     * @param {string} [options.atvremoteBinary]
     * @param {string} [options.unbufferBinary]
     * @param {boolean} [options.debug]
     * @param {function} [options.log]
     * @returns {Promise<object>}
     */
    static async version(options = {}) {
        let module = null;

        try {
            module = require('../package.json').version;
        } catch (err) {
            // do nothing
        }

        let pyatv = await this._request([], Object.assign({version: true}, options));
        pyatv = pyatv.replace('atvremote', '');
        pyatv = pyatv.trim();

        return {
            pyatv,
            module
        };
    }


    /**
     * Returns an apple tv instance
     *
     * @param {string} [address]
     * @param {string} [loginId]
     * @param {object} [options]
     * @param {string} [options.name]
     * @param {string} [options.atvremoteBinary]
     * @param {string} [options.unbufferBinary]
     * @param {boolean} [options.debug]
     * @returns {NodePyATVInstance}
     */
    static connect(address, loginId, options = {}) {
        return new NodePyATVInstance(Object.assign({
            address,
            loginId
        }, options));
    }


    /**
     * Constructor
     *
     * @param {object} [options]
     * @param {string} [options.name]
     * @param {string} [options.address]
     * @param {number} [options.timeout]
     * @param {string} [options.remoteName]
     * @param {string} [options.pin]
     * @param {string} [options.pairingGUID]
     * @param {string} [options.loginId]
     * @param {string} [options.airplayCredentials]
     * @param {string} [options.atvremoteBinary]
     * @param {string} [options.unbufferBinary]
     * @param {boolean} [options.debug]
     */
    constructor(options) {
        this._options = Object.assign({}, options);
    }


    /**
     * Internal method which handles default pyatv requests
     *
     * @private
     * @param {Array<string>|string} cmd
     * @param {object} [options]
     * @param {string} [options.name]
     * @param {string} [options.address]
     * @param {number} [options.timeout]
     * @param {string} [options.remoteName]
     * @param {string} [options.pin]
     * @param {string} [options.pairingGUID]
     * @param {string} [options.loginId]
     * @param {string} [options.airplayCredentials]
     * @param {string} [options.atvremoteBinary]
     * @param {string} [options.unbufferBinary]
     * @param {boolean} [options.debug]
     * @param {boolean} [options.log]
     * @returns {ChildProcess|Promise<string>}
     */
    static _request(cmd, options = {}) {
        const {spawn} = require('child_process');

        const atvremoteBinary = options.atvremoteBinary || 'atvremote';
        const unbufferBinary = options.unbufferBinary || 'unbuffer';
        const cmds = Array.isArray(cmd) ? cmd : [cmd];
        const parameters = [atvremoteBinary];

        let debugRequestId = null;
        if (options.debug) {

            for (let i = 0; true; i += 1) {
                debugRequestId = i.toString(36).toUpperCase();
                if (globalDebugIndex.indexOf(debugRequestId) === -1) {
                    globalDebugIndex.push(debugRequestId);
                    break;
                }
            }

            (options.log || console.log).apply(this, [`[node-pyatv][${debugRequestId}] New request`]);
        }

        if (options.name && (!options.loginId || !options.address)) {
            parameters.push('--name');
            parameters.push(options.name);
        }
        if (options.address) {
            parameters.push('--address');
            parameters.push(options.address);
        }
        if (options.timeout) {
            parameters.push('-t');
            parameters.push(options.timeout);
        }
        if (options.version) {
            parameters.push('--version');
        }
        if (options.remoteName) {
            parameters.push('--remote-name');
            parameters.push(options.remoteName);
        }
        if (options.pin) {
            parameters.push('-p');
            parameters.push(options.pin);
        }
        if (options.pairingGUID) {
            parameters.push('--pairing-guid');
            parameters.push(options.pairingGUID);
        }
        if (options.loginId) {
            parameters.push('--login_id');
            parameters.push(options.loginId);
        } else if (!options.version) {
            parameters.push('-a');
        }
        if (options.airplayCredentials) {
            parameters.push('--airplay_credentials');
            parameters.push(options.airplayCredentials);
        }

        cmds.forEach(cmd => parameters.push(cmd));

        if (options.debug) {
            (options.log || console.log).apply(this, [
                `[node-pyatv][${debugRequestId}] Command: ${unbufferBinary} ${parameters.join(' ')}`
            ]);
        }
        if (options.childProcess) {
            const child = spawn(unbufferBinary, parameters, {
                env: process.env
            });

            child.stdout.on('data', data => {
                if (options.debug) {
                    (options.log || console.log).apply(this, [`[node-pyatv][${debugRequestId}] stdout: ${data}`]);
                }
            });
            child.stderr.on('data', data => {
                if (options.debug) {
                    (options.log || console.log).apply(this, [`[node-pyatv][${debugRequestId}] stderr: ${data}`]);
                }
            });

            child.on('error', error => {
                if (options.debug) {
                    (options.log || console.log).apply(this, [`[node-pyatv][${debugRequestId}] Error: ${error}`]);
                }
            });
            child.on('close', code => {
                if (options.debug) {
                    (options.log || console.log).apply(this, [`[node-pyatv][${debugRequestId}] pyatv exited with code: ${code}`]);
                }

                if (globalDebugIndex.indexOf(debugRequestId) > -1) {
                    globalDebugIndex.splice(globalDebugIndex.indexOf(debugRequestId), 1);
                }
            });

            return child;
        }


        return new Promise((resolve, reject) => {
            const result = {
                result: '',
                errors: []
            };
            const pyatv = spawn(unbufferBinary, parameters, {
                env: process.env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            pyatv.stdout.on('data', data => {
                result.result += data.toString();

                if (options.debug) {
                    (options.log || console.log).apply(this, [`[node-pyatv][${debugRequestId}] stdout: ${data}`]);
                }
            });
            pyatv.stderr.on('data', data => {
                if (data.indexOf('atvremote: error: ') > -1) {
                    result.errors.push(data.toString().split('atvremote: error: ')[1].toString().trim());
                } else {
                    result.errors.push(data.toString().trim());
                }

                if (options.debug) {
                    (options.log || console.log).apply(this, [`[node-pyatv][${debugRequestId}] stderr: ${data}`]);
                }
            });

            pyatv.on('error', error => {
                result.errors.push(error);

                if (options.debug) {
                    (options.log || console.log).apply(this, [`[node-pyatv][${debugRequestId}] Error: ${error}`]);
                }
            });
            pyatv.on('close', code => {
                if (code !== 0 && !options.version) {
                    result.errors.push('Exit Code ' + code);
                }

                if (options.debug) {
                    (options.log || console.log).apply(this, [
                        `[node-pyatv][${debugRequestId}] pyatv exited with code: ${code}`
                    ]);
                }
                if (globalDebugIndex.indexOf(debugRequestId) > -1) {
                    globalDebugIndex.splice(globalDebugIndex.indexOf(debugRequestId), 1);
                }

                if (result.errors.length === 1) {
                    return reject(result.errors[0]);
                }
                if (result.errors.length > 1) {
                    return reject(new Error(result.errors.map(e => e.toString()).join(', ')));
                }

                resolve(result.result);
            });
        });
    }

    /**
     * Internal method which handles default pyatv requests
     *
     * @private
     * @param {Array<string>|string} cmd
     * @param {object} [options]
     * @param {string} [options.name]
     * @param {string} [options.address]
     * @param {number} [options.timeout]
     * @param {string} [options.remoteName]
     * @param {string} [options.pin]
     * @param {string} [options.pairingGUID]
     * @param {string} [options.loginId]
     * @param {string} [options.airplayCredentials]
     * @param {string} [options.atvremoteBinary]
     * @param {string} [options.unbufferBinary]
     * @param {boolean} [options.debug]
     * @returns {ChildProcess|Promise<string>}
     */
    _request(cmd, options = {}) {
        const mergedOptions = Object.assign({}, this._options);
        Object.assign(mergedOptions, options);

        return NodePyATVInstance._request(cmd, mergedOptions);
    }

    /**
     * Parse the pyatv playing string
     *
     * @param {string} str
     * @returns {object}
     * @private
     */
    _parsePlayingStr(str) {
        const parts = str
            .split(/^-{15,}$/m)
            .map(s => s.trim())
            .filter(s => s);
        if (!parts.length) {
            return;
        }

        const relevant = parts.pop();
        const result = {};

        relevant
            .split('\n')
            .map(l => {
                const kv = l.split(':');

                let key = kv.shift().trim();
                key = key.substr(0, 1).toLowerCase() + key.substr(1);
                key = key
                    .split(/\s+/)
                    .map((s, i) => i === 0 ? s : s.substr(0, 1).toUpperCase() + s.substr(1))
                    .join('');

                result[key] = kv.join(':').trim();
            });

        ['mediaType', 'playState', 'repeat', 'shuffle'].forEach(key => {
            if (result[key]) {
                result[key] = result[key].toLowerCase();
            }
        });

        if (result.position) {
            const r = result.position.match(/(\d+)\/(\d+)s/);
            if (r) {
                result.position = parseInt(r[1], 10);
                result.totalTime = parseInt(r[2], 10);
            }
        }

        if (result.repeat === 'off') {
            result.repeat = false;
        }

        if (result.shuffle === 'false') {
            result.shuffle = false;
        }

        return result;
    }


    /**
     * Press key down
     * @returns {Promise}
     */
    async down(options = {}) {
        await this._request('down', options);
    }

    /**
     * Press key left
     * @returns {Promise}
     */
    async left(options = {}) {
        await this._request('left', options);
    }

    /**
     * Press key menu
     * @returns {Promise}
     */
    async menu(options = {}) {
        await this._request('menu', options);
    }

    /**
     * Press key next
     * @returns {Promise}
     */
    async next(options = {}) {
        await this._request('next', options);
    }

    /**
     * Press key pause
     * @returns {Promise}
     */
    async pause(options = {}) {
        await this._request('pause', options);
    }

    /**
     * Press key play
     * @returns {Promise}
     */
    async play(options = {}) {
        await this._request('play', options);
    }

    /**
     * Press key previous
     * @returns {Promise}
     */
    async previous(options = {}) {
        await this._request('previous', options);
    }

    /**
     * Press key right
     * @returns {Promise}
     */
    async right(options = {}) {
        await this._request('right', options);
    }

    /**
     * Press key stop
     * @returns {Promise}
     */
    async stop(options = {}) {
        await this._request('stop', options);
    }

    /**
     * Press key top_menu
     * @returns {Promise}
     */
    async topMenu(options = {}) {
        await this._request('top_menu', options);
    }

    /**
     * Press key select
     * @returns {Promise}
     */
    async select(options = {}) {
        await this._request('select', options);
    }

    /**
     * Press key up
     * @returns {Promise}
     */
    async up(options = {}) {
        await this._request('up', options);
    }


    /**
     * Return artwork URL for what is currently playing
     *
     * @returns {Promise<string>}
     */
    async artworkUrl(options = {}) {
        await this._request('artwork_url', options);
    }

    /**
     * Return a unique identifier for current device
     *
     * @returns {Promise<string>}
     */
    async deviceId(options = {}) {
        await this._request('device_id', options);
    }

    /**
     * Return what is currently playing
     *
     * @returns {Promise<object>}
     */
    async playing(options = {}) {
        const str = await this._request('playing', options);
        return this._parsePlayingStr(str);
    }


    /**
     * Album of the currently playing song
     *
     * @returns {Promise<string>}
     */
    async album(options = {}) {
        await this._request('album', options);
    }

    /**
     * Artist of the currently playing song
     *
     * @returns {Promise<string>}
     */
    async artist(options = {}) {
        await this._request('artist', options);
    }

    /**
     * Create a unique hash for what is currently playing
     *
     * @returns {Promise<string>}
     */
    async hash(options = {}) {
        await this._request('hash', options);
    }

    /**
     * Type of media is currently playing, e.g. video, music
     *
     * @returns {Promise<string>}
     */
    async mediaType(options = {}) {
        await this._request('media_type', options);
    }

    /**
     * Play state, e.g. playing or paused
     *
     * @returns {Promise<string>}
     */
    async playState(options = {}) {
        await this._request('play_state', options);
    }

    /**
     * Position in the playing media (seconds)
     *
     * @returns {Promise<number>}
     */
    async position(options = {}) {
        await this._request('position', options);
    }

    /**
     * Repeat mode
     *
     * @returns {Promise<string>}
     */
    async repeat(options = {}) {
        await this._request('repeat', options);
    }

    /**
     * If shuffle is enabled or not
     *
     * @returns {Promise<boolean>}
     */
    async shuffle(options = {}) {
        await this._request('shuffle', options);
    }

    /**
     * Title of the current media, e.g. movie or song name
     *
     * @returns {Promise<string>}
     */
    async title(options = {}) {
        await this._request('title', options);
    }

    /**
     * Total play time in seconds
     *
     * @returns {Promise<number>}
     */
    async totalTime(options = {}) {
        await this._request('total_time', options);
    }


    /**
     * Listen for push updates
     * @returns {Promise<NodePyATVListener>}
     */
    push(options = {}) {
        const EventEmitter = require('events');
        const response = new EventEmitter();
        const pyatv = this._request('push_updates', Object.assign(options, {childProcess: true}));

        pyatv.stdout.on('data', data => {
            const str = data.toString();
            response.emit('data', str);
            response.emit('state', this._parsePlayingStr(str));
        });
        pyatv.stderr.on('data', data => {
            response.emit('error', new Error(
                data.indexOf('atvremote: error: ') > -1 ?
                    data.toString().split('atvremote: error: ')[1].toString().trim() :
                    data.toString().trim()
            ));
        });

        pyatv.on('error', error => {
            response.emit('error', error);
        });
        pyatv.on('close', code => {
            if (code !== 0 && !options.version) {
                response.emit('error', `Exit Code ${code}`);
            }

            response.emit('close');
        });

        response.close = () => {
            pyatv.stdin.write('\n');
        };

        pyatv.stdin.write('a');

        return response;
    }


    toString() {
        return '[node-pytv Instance %s]' + JSON.stringify(this._options);
    }
}


module.exports = NodePyATVInstance;
