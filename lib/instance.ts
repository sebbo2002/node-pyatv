'use strict';

import semver from 'semver';

import {
    NodePyATVDeviceOptions,
    NodePyATVExecutableType,
    NodePyATVFindAndInstanceOptions,
    NodePyATVInstanceOptions,
    NodePyATVVersionResponse
} from './types';

import {addRequestId, debug, getParamters, removeRequestId, request} from './tools';
import NodePyATVDevice from './device';

export default class NodePyATVInstance {
    private readonly options: NodePyATVInstanceOptions = {};

    public static async check(options: NodePyATVInstanceOptions = {}): Promise<void> {
        const versions = await this.version(options);
        if (!versions.pyatv) {
            throw new Error('Unable to find pyatv. Is it installed?');
        }
        if (semver.lt(versions.pyatv, '0.6.0')) {
            throw new Error('Found pyatv, but unforunately it\'s too old. Please update pyatv.');
        }

        try {
            await this.find(options);
        }
        catch (error) {
            throw new Error(`Unable to scan for devices: ${String(error).replace('Error: ', '')}`);
        }
    }

    public static async version(options: NodePyATVInstanceOptions = {}): Promise<NodePyATVVersionResponse> {
        const id = addRequestId();
        let pyatv = null;
        let module = null;

        try {
            pyatv = await request(id, NodePyATVExecutableType.atvremote, ['--version'], options) as string;
        }
        catch (error) {
            debug(id, `Unable to get pyatv version due to ${error}`, options);
        }

        if (pyatv && pyatv.substr(0, 10) === 'atvremote ') {
            pyatv = pyatv.substr(10);
        }
        if (!semver.valid(pyatv)) {
            debug(id, `String "${pyatv}" is not a valid pyatv version, set it to null`, options);
            pyatv = null;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            module = require(__dirname + '/../package.json').version || null;
        }
        catch (error) {
            debug(id, `Unable to get module version due to ${error}`, options);
        }
        if (module && !semver.valid(module)) {
            debug(id, `String "${module}" is not a valid module version, set it to null`, options);
            module = null;
        }

        removeRequestId(id);
        return {
            pyatv,
            module
        };
    }

    public static async find(options: NodePyATVFindAndInstanceOptions = {}): Promise<NodePyATVDevice[]> {
        const id = addRequestId();
        const parameters = getParamters(options);

        const result = await request(id, NodePyATVExecutableType.atvscript, [...parameters, 'scan'], options);
        if (typeof result !== 'object' || result.result !== 'success' || !Array.isArray(result.devices)) {
            throw new Error(`Unable to parse pyatv response: ${JSON.stringify(result, null, '  ')}`);
        }

        const objects = result.devices.map((device: { address: string, identifier: string, name: string }) =>
            this.device(Object.assign({}, options, {
                host: device.address,
                id: device.identifier,
                name: device.name
            }))
        );

        removeRequestId(id);
        return objects;
    }

    public static device(options: NodePyATVDeviceOptions): NodePyATVDevice {
        return new NodePyATVDevice(options);
    }

    public constructor(options: NodePyATVInstanceOptions = {}) {
        this.options = Object.assign({}, options);
    }

    public async check(options: NodePyATVInstanceOptions = {}): Promise<void> {
        return NodePyATVInstance.check(Object.assign({}, this.options, options));
    }

    public async version(options: NodePyATVInstanceOptions = {}): Promise<NodePyATVVersionResponse> {
        return NodePyATVInstance.version(Object.assign({}, this.options, options));
    }

    public async find(options: NodePyATVFindAndInstanceOptions = {}): Promise<NodePyATVDevice[]> {
        return NodePyATVInstance.find(Object.assign({}, this.options, options));
    }

    public device(options: NodePyATVDeviceOptions): NodePyATVDevice {
        return NodePyATVInstance.device(Object.assign({}, this.options, options));
    }
}

export {
    NodePyATVProtocol,
    NodePyATVMediaType,
    NodePyATVDeviceState,
    NodePyATVRepeatState,
    NodePyATVShuffleState,
    NodePyATVKeys,
    NodePyATVInstanceOptions,
    NodePyATVVersionResponse,
    NodePyATVFindOptions,
    NodePyATVFindAndInstanceOptions,
    NodePyATVDeviceOptions,
    NodePyATVGetStateOptions,
    NodePyATVState
} from './types';

export {default as NodePyATVDeviceEvent} from './device-event';
