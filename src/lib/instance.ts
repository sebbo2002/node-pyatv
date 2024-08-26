'use strict';

import semver from 'semver';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';

import {
    NodePyATVExecutableType,
    type NodePyATVDeviceOptions,
    type NodePyATVFindAndInstanceOptions,
    type NodePyATVFindResponseObject,
    type NodePyATVInstanceOptions,
    type NodePyATVInternalScanDevice,
    type NodePyATVVersionResponse
} from './types.js';

import { addRequestId, debug, getParameters, removeRequestId, request } from './tools.js';
import { NodePyATVDevice } from '../lib/index.js';

/**
 * Default class exported by `@sebbo2002/node-pyatv`. Use [[find]] to scan for devices in your local network. Use
 * [[device]] to connect to a known device by passing (at least) it's name and IP.
 *
 * ```typescript
 * import pyatv from '@sebbo2002/node-pyatv';
 * ```
 */
export default class NodePyATVInstance {
    private readonly options: NodePyATVInstanceOptions = {};

    /**
     * Checks if pyatv is installed and ready to be used.
     * Will throw an error if not.
     *
     * @param options
     */
    public static async check (options: NodePyATVInstanceOptions = {}): Promise<void> {
        const versions = await this.version(options);
        if (!versions.pyatv) {
            throw new Error('Unable to find pyatv. Is it installed?');
        }
        if (semver.lt(versions.pyatv, '0.6.0')) {
            throw new Error('Found pyatv, but unforunately it\'s too old. Please update pyatv.');
        }

        try {
            await this.find(options);
        } catch (error) {
            throw new Error(`Unable to scan for devices: ${String(error).replace('Error: ', '')}`);
        }
    }

    /**
     * Resolves with the version of pyatv and of the module itself.
     * If a value can't be found, null is returned instead.
     *
     * @param options
     */
    public static async version (options: NodePyATVInstanceOptions = {}): Promise<NodePyATVVersionResponse> {
        const id = addRequestId();
        let pyatv = null;
        let module = null;

        try {
            pyatv = await request(id, NodePyATVExecutableType.atvremote, ['--version'], options) as string;
        } catch (error) {
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
            const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json');
            const json = JSON.parse(await fsPromises.readFile(packageJsonPath, 'utf8'));
            module = json?.version || null;
        } catch (error) {
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

    /**
     * Scan the network for Apple TVs by using pyatv's atvscript. See [[NodePyATVFindAndInstanceOptions]]
     * for the options allowed. Use the `host` / `hosts` attribute to filter by IP addresses. Resolves with
     * an array of [[NodePyATVDevice]].
     *
     * ```typescript
     * import pyatv from '@sebbo2002/node-pyatv';
     * const devices = await pyatv.find();
     * console.log(devices);
     * ```
     *
     * Normally `node-pyatv` ignores error messages if at least one device has been found, but if you
     * always want to receive the error messages, you can set the second argument to `true`:
     *
     * ```typescript
     * const result = await pyatv.find({}, true);
     * console.log(result.devices);
     * console.log(result.errors);
     * ```
     *
     * @param options
     */
    public static async find (options?: NodePyATVFindAndInstanceOptions): Promise<NodePyATVDevice[]>;
    public static async find (options: NodePyATVFindAndInstanceOptions, returnDevicesAndErrors: true): Promise<NodePyATVFindResponseObject>
    public static async find (options: NodePyATVFindAndInstanceOptions = {}, returnDevicesAndErrors?: boolean): Promise<NodePyATVDevice[]|NodePyATVFindResponseObject> {
        const id = addRequestId();
        const parameters = getParameters(options);

        const devices: NodePyATVDevice[] = [];
        const errors: Record<string, unknown>[] = [];
        const response = await request(
            id,
            NodePyATVExecutableType.atvscript,
            [...parameters, 'scan'],
            { ...(options || {}), allowMultipleResponses: true }
        );

        for (const item of response) {
            if (typeof item === 'object' && 'result' in item && item.result === 'failure') {
                errors.push(item);
            }
            else if (typeof item === 'object' && 'result' in item && item.result === 'success' && Array.isArray(item.devices)) {
                devices.push(
                    ...item.devices.map((device: NodePyATVInternalScanDevice) =>
                        this.device(Object.assign({}, options, {
                            host: device.address,
                            id: device.identifier,
                            allIDs: device.all_identifiers,
                            name: device.name,
                            mac: device.device_info?.mac || undefined,
                            model: device.device_info?.model,
                            modelName: device.device_info?.model_str,
                            os: device.device_info?.operating_system,
                            version: device.device_info?.version,
                            services: device.services
                        }))
                    )
                );
            }
            else {
                throw new Error(`Unable to parse pyatv response: ${JSON.stringify(item, null, '  ')}`);
            }
        }
        removeRequestId(id);

        if (returnDevicesAndErrors) {
            return { devices, errors };
        }
        if(!devices.length && errors.length) {
            throw new Error(`Unable to find any devices, but received ${errors.length} error${errors.length !== 1 ? 's' : ''}: ${JSON.stringify(errors, null, '  ')}`);
        }

        return devices;
    }

    /**
     * Create a [[NodePyATVDevice]] to query the state and control it.
     * At least `host` and `name` are required.
     *
     * @param options
     */
    public static device (options: NodePyATVDeviceOptions): NodePyATVDevice {
        return new NodePyATVDevice(options);
    }

    /**
     * Use this to apply [[NodePyATVInstanceOptions]]
     * (e.g. debug log method) to all further requests
     *
     * ```typescript
     * import pyatv from '@sebbo2002/node-pyatv';
     * const myPyatv = new pyatv({debug: true});
     * const devices = myPyatv.find();
     * console.log(devices);
     * ```
     * @param options
     */
    public constructor (options: NodePyATVInstanceOptions = {}) {
        this.options = Object.assign({}, options);
    }

    /**
     * Checks if pyatv is installed and ready to be used.
     * Will throw an error if not.
     *
     * @param options
     */
    public async check (options: NodePyATVInstanceOptions = {}): Promise<void> {
        return NodePyATVInstance.check(Object.assign({}, this.options, options));
    }

    /**
     * Resolves with the version of pyatv and of the module itself.
     * If a value can't be found, null is returned instead.
     *
     * @param options
     */
    public async version (options: NodePyATVInstanceOptions = {}): Promise<NodePyATVVersionResponse> {
        return NodePyATVInstance.version(Object.assign({}, this.options, options));
    }

    /**
     * Scan the network for Apple TVs by using pyatv's atvscript. See [[NodePyATVFindAndInstanceOptions]]
     * for the options allowed. Use the `host` / `hosts` attribute to filter by IP addresses. Resolves with
     * an array of [[NodePyATVDevice]].
     *
     * ```typescript
     * import pyatv from '@sebbo2002/node-pyatv';
     * const myPyATV = new pyatv({debug: true});
     * const devices = await myPyATV.find();
     * console.log(devices);
     * ```
     *
     * @param options
     */
    public async find (options: NodePyATVFindAndInstanceOptions = {}): Promise<NodePyATVDevice[]> {
        return NodePyATVInstance.find(Object.assign({}, this.options, options));
    }

    /**
     * Create a [[NodePyATVDevice]] to query the state and control it.
     * At least `host` and `name` are required.
     *
     * @param options
     */
    public device (options: NodePyATVDeviceOptions): NodePyATVDevice {
        return NodePyATVInstance.device(Object.assign({}, this.options, options));
    }
}
