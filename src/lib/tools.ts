'use strict';

import {
    NodePyATVDeviceState,
    NodePyATVExecutableType,
    NodePyATVFocusState,
    NodePyATVMediaType,
    NodePyATVPowerState,
    NodePyATVRepeatState,
    NodePyATVShuffleState,
    type NodePyATVFindAndInstanceOptions,
    type NodePyATVInstanceOptions,
    type NodePyATVInternalState,
    type NodePyATVRequestOptions,
    type NodePyATVState
} from './types.js';

import {ChildProcess, spawn, type SpawnOptions} from 'child_process';
import {FakeChildProcess} from './fake-spawn.js';

const requestIds: string[] = [];

export function addRequestId(): string {
    let id = '?';

    for (let i = 0; i < 1000; i += 1) {
        id = Math.round(Math.random() * (i + 6) * 36).toString(36).toUpperCase();
        if (!requestIds.includes(id)) {
            requestIds.push(id);
            break;
        }
    }

    return id;
}

export function removeRequestId(id: string | undefined): void {
    if (id && requestIds.includes(id)) {
        requestIds.splice(requestIds.indexOf(id), 1);
    }
}

export function debug(id: string, message: string, options: NodePyATVInstanceOptions): void {
    if (options.debug) {
        const log = typeof options.debug === 'function' ? options.debug : console.log;
        const enableColors = !process.env.NO_COLOR && !options.noColors;

        const parts = [
            enableColors ? '\x1b[0m' : '', // Color Reset
            enableColors ? '\x1b[90m' : '', // Grey
            '[node-pyatv][',
            enableColors ? '\x1b[37m' : '', // Light Grey
            id,
            enableColors ? '\x1b[90m' : '', // Grey
            '] ',
            enableColors ? '\x1b[0m' : '', // Color Reset
            message
        ];

        log.apply(null, [parts.join('')]);
    }
}

export function getExecutable(executable: NodePyATVExecutableType, options: NodePyATVInstanceOptions): string {
    if (executable === NodePyATVExecutableType.atvremote && typeof options.atvremotePath === 'string') {
        return options.atvremotePath;
    }
    else if (executable === NodePyATVExecutableType.atvscript && typeof options.atvscriptPath === 'string') {
        return options.atvscriptPath;
    }
    else {
        return executable;
    }
}

export function execute(
    requestId: string,
    executableType: NodePyATVExecutableType,
    parameters: string[],
    options: NodePyATVInstanceOptions
): ChildProcess | FakeChildProcess {
    const executable = getExecutable(executableType, options);
    const mySpawn: ((command: string, args: Array<string>, options: SpawnOptions) => (ChildProcess | FakeChildProcess)) = typeof options.spawn === 'function' ? options.spawn : spawn;

    debug(requestId, `${executable} ${parameters.join(' ')}`, options);
    const child = mySpawn(executable, parameters, {
        env: process.env
    });

    /* eslint-disable @typescript-eslint/no-explicit-any*/
    const onStdOut = (data: any) => debug(requestId, `stdout: ${String(data).trim()}`, options);
    const onStdErr = (data: any) => debug(requestId, `stderr: ${String(data).trim()}`, options);
    const onError = (data: any) => debug(requestId, `error: ${String(data).trim()}`, options);
    /* eslint-enable @typescript-eslint/no-explicit-any*/

    const onClose = (code: number) => {
        debug(requestId, `${executable} exited with code: ${code}`, options);

        if (child.stdout) {
            child.stdout.off('data', onStdOut);
        }
        if (child.stderr) {
            child.stderr.off('data', onStdErr);
        }

        child.off('error', onError);
        child.off('close', onClose);
    };

    if (child.stdout) {
        child.stdout.on('data', onStdOut);
    }
    if (child.stderr) {
        child.stderr.on('data', onStdErr);
    }

    child.on('error', onError);
    child.on('close', onClose);

    return child;
}

type NodePyATVScriptResponse<O extends NodePyATVRequestOptions> = O['allowMultipleResponses'] extends true
    ? Record<string,unknown>[]
    : Record<string,unknown>;

export async function request<O extends NodePyATVRequestOptions>(
    requestId: string,
    executableType: NodePyATVExecutableType.atvscript,
    parameters: string[],
    options: O
): Promise<NodePyATVScriptResponse<O>>;
export async function request<O extends NodePyATVRequestOptions>(
    requestId: string,
    executableType: NodePyATVExecutableType.atvremote,
    parameters: string[],
    options: O
): Promise<string>;
export async function request<O extends NodePyATVRequestOptions>(
    requestId: string,
    executableType: NodePyATVExecutableType,
    parameters: string[],
    options: O
): Promise<string|Record<string,unknown>[]|Record<string,unknown>> {
    const result = {
        stdout: '',
        stderr: '',
        code: 0
    };

    await new Promise((resolve, reject) => {
        const pyatv = execute(requestId, executableType, parameters, options);

        /* eslint-disable @typescript-eslint/no-explicit-any*/
        const onStdOut = (data: any) => result.stdout += String(data).trim();
        const onStdErr = (data: any) => result.stderr += String(data).trim();
        const onError = (data: any) => reject(data instanceof Error ? data : new Error(String(data)));
        /* eslint-enable @typescript-eslint/no-explicit-any*/

        const onClose: (code: number) => void = (code: number) => {
            result.code = code;

            if (pyatv.stdout) {
                pyatv.stdout.off('data', onStdOut);
            }
            if (pyatv.stderr) {
                pyatv.stderr.off('data', onStdErr);
            }

            pyatv.off('error', onError);
            pyatv.off('close', onClose);
            resolve(undefined);
        };

        if (pyatv.stdout) {
            pyatv.stdout.on('data', onStdOut);
        }
        if (pyatv.stderr) {
            pyatv.stderr.on('data', onStdErr);
        }

        pyatv.on('error', onError);
        pyatv.on('close', onClose);
    });

    if (result.stderr.length > 0) {
        const msg = `Unable to execute request ${requestId}: ${result.stderr}`;
        debug(requestId, msg, options);
        throw new Error(msg);
    }

    if (executableType === NodePyATVExecutableType.atvscript) {
        try {

            // response with multiple lines
            // https://github.com/sebbo2002/node-pyatv/issues/324
            if (options.allowMultipleResponses) {
                return result.stdout
                    .split('\n')
                    .filter(line => line.trim().length > 0)
                    .map(line => JSON.parse(line));
            }

            return JSON.parse(result.stdout);
        }
        catch (error) {
            const msg = `Unable to parse result ${requestId} json: ${error}`;
            debug(requestId, msg, options);
            throw new Error(msg);
        }
    }

    return result.stdout;
}

export function getParameters(options: NodePyATVFindAndInstanceOptions = {}): string[] {
    const parameters: string[] = [];

    if (options.hosts) {
        parameters.push('-s', options.hosts.join(','));
    }
    else if (options.host) {
        parameters.push('-s', options.host);
    }
    if (options.id) {
        parameters.push('-i', options.id);
    }
    if (options.protocol) {
        parameters.push('--protocol', options.protocol);
    }
    if (options.dmapCredentials) {
        parameters.push('--dmap-credentials', options.dmapCredentials);
    }
    if (options.mrpCredentials) {
        parameters.push('--mrp-credentials', options.mrpCredentials);
    }
    if (options.airplayCredentials) {
        parameters.push('--airplay-credentials', options.airplayCredentials);
    }
    if (options.companionCredentials) {
        parameters.push('--companion-credentials', options.companionCredentials);
    }
    if (options.raopCredentials) {
        parameters.push('--raop-credentials', options.raopCredentials);
    }

    return parameters;
}

function parseStateStringAttr(
    input: NodePyATVInternalState,
    output: NodePyATVState,
    inputAttr: ('hash' | 'title' | 'album' | 'artist' | 'genre' | 'app' | 'app_id'),
    outputAttr: ('hash' | 'title' | 'album' | 'artist' | 'genre' | 'app' | 'appId'),
    d: (msg: string) => void
): void {
    if (typeof input[inputAttr] === 'string') {
        output[outputAttr] = input[inputAttr] as string;
        return;
    }

    d(`No ${outputAttr} value found in input (${JSON.stringify(input)})`);
}

export function parseState(input: NodePyATVInternalState, id: string, options: NodePyATVInstanceOptions): NodePyATVState {
    const d = (msg: string) => debug(id, msg, options);
    const result: NodePyATVState = {
        dateTime: null,
        hash: null,
        mediaType: null,
        deviceState: null,
        title: null,
        artist: null,
        album: null,
        genre: null,
        totalTime: null,
        position: null,
        shuffle: null,
        repeat: null,
        app: null,
        appId: null,
        powerState: null,
        volume: null,
        focusState: null,
        outputDevices: null
    };
    if (!input || typeof input !== 'object') {
        return result;
    }
    if(input.exception) {
        let errorStr = 'Got pyatv Error: ' + input.exception;
        if(input.stacktrace) {
            errorStr += '\n\npyatv Stacktrace:\n' + input.stacktrace;
        }

        throw new Error(errorStr);
    }

    // datetime
    if (typeof input.datetime === 'string') {
        const date = new Date(input.datetime);
        if (!isNaN(date.getTime())) {
            result.dateTime = date;
        }
        else {
            d(`Invalid datetime value ${input.datetime}, ignore attribute`);
        }
    }
    else {
        d(`No datetime value found in input (${JSON.stringify(input)})`);
    }

    // hash
    parseStateStringAttr(input, result, 'hash', 'hash', d);

    // mediaType
    if(typeof input.media_type === 'string') {
        const validValues = Object.keys(NodePyATVMediaType).map(o => String(o));
        if (validValues.includes(input.media_type)) {
            result.mediaType = NodePyATVMediaType[input.media_type as NodePyATVMediaType];
        }
        else {
            d(`Unsupported mediaType value ${input.media_type}, ignore attribute`);
        }
    } else {
        d(`No mediaType value found in input (${JSON.stringify(input)})`);
    }

    // deviceState
    if(typeof input.device_state === 'string') {
        const validValues = Object.keys(NodePyATVDeviceState).map(o => String(o));
        if (validValues.includes(input.device_state)) {
            result.deviceState = NodePyATVDeviceState[input.device_state as NodePyATVDeviceState];
        }
        else {
            d(`Unsupported deviceState value ${input.device_state}, ignore attribute`);
        }
    } else {
        d(`No deviceState value found in input (${JSON.stringify(input)})`);
    }

    // title
    parseStateStringAttr(input, result, 'title', 'title', d);

    // artist
    parseStateStringAttr(input, result, 'artist', 'artist', d);

    // album
    parseStateStringAttr(input, result, 'album', 'album', d);

    // genre
    parseStateStringAttr(input, result, 'genre', 'genre', d);

    // totalTime
    if (typeof input.total_time === 'number') {
        result.totalTime = input.total_time;
    }
    else {
        d(`No totalTime value found in input (${JSON.stringify(input)})`);
    }

    // position
    if (typeof input.position === 'number') {
        result.position = input.position;
    }
    else {
        d(`No position value found in input (${JSON.stringify(input)})`);
    }

    // shuffle
    if(typeof input.shuffle === 'string') {
        const validValues = Object.keys(NodePyATVShuffleState).map(o => String(o));
        if (validValues.includes(input.shuffle)) {
            result.shuffle = NodePyATVShuffleState[input.shuffle as NodePyATVShuffleState];
        }
        else {
            d(`Unsupported shuffle value ${input.shuffle}, ignore attribute`);
        }
    } else {
        d(`No shuffle value found in input (${JSON.stringify(input)})`);
    }

    // repeat
    if(typeof input.repeat === 'string') {
        const validValues = Object.keys(NodePyATVRepeatState).map(o => String(o));
        if (validValues.includes(input.repeat)) {
            result.repeat = NodePyATVRepeatState[input.repeat as NodePyATVRepeatState];
        }
        else {
            d(`Unsupported repeat value ${input.repeat}, ignore attribute`);
        }
    } else {
        d(`No repeat value found in input (${JSON.stringify(input)})`);
    }

    // app
    parseStateStringAttr(input, result, 'app', 'app', d);
    parseStateStringAttr(input, result, 'app_id', 'appId', d);

    // powerState
    if(typeof input.power_state === 'string') {
        const validValues = Object.keys(NodePyATVPowerState).map(o => String(o));
        if (validValues.includes(input.power_state)) {
            result.powerState = NodePyATVPowerState[input.power_state as NodePyATVPowerState];
        }
        else {
            d(`Unsupported powerState value ${input.power_state}, ignore attribute`);
        }
    } else {
        d(`No powerState value found in input (${JSON.stringify(input)})`);
    }

    // volume
    if (typeof input.volume === 'number') {
        result.volume = input.volume;
    }

    // focusState
    if(typeof input.focus_state === 'string') {
        const validValues = Object.keys(NodePyATVFocusState).map(o => String(o));
        if (validValues.includes(input.focus_state)) {
            result.focusState = NodePyATVFocusState[input.focus_state as NodePyATVFocusState];
        }
        else {
            d(`Unsupported focusState value ${input.focus_state}, ignore attribute`);
        }
    } else {
        d(`No focusState value found in input (${JSON.stringify(input)})`);
    }

    // outputDevices
    if (Array.isArray(input.output_devices)) {
        result.outputDevices = input.output_devices;
    }

    return result;
}

export function compareOutputDevices (a: NodePyATVState['outputDevices'], b: NodePyATVState['outputDevices']) {
    return Boolean(
        Array.isArray(a) &&
        Array.isArray(b) &&
        JSON.stringify(a.sort((a, b) => a.identifier < b.identifier ? -1 : 1)) ===
        JSON.stringify(b.sort((a, b) => a.identifier < b.identifier ? -1 : 1))
    );
}
