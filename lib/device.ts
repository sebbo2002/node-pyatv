'use strict';

import {NodePyATVDeviceOptions, NodePyATVProtocol} from './types';

export default class NodePyATVDevice {
    private readonly options: NodePyATVDeviceOptions;

    constructor(options: NodePyATVDeviceOptions) {
        this.options = Object.assign({}, options);

        // @todo basic validation
    }

    get name(): string {
        return this.options.name;
    }

    get host(): string {
        return this.options.host;
    }

    get id(): string | undefined {
        return this.options.id;
    }

    get protocol(): NodePyATVProtocol | undefined {
        return this.options.protocol;
    }

    get debug(): true | ((msg: string) => void) | undefined {
        return this.options.debug;
    }

    set debug(debug: true | ((msg: string) => void) | undefined) {
        if(typeof debug === 'function') {
            this.options.debug = debug;
        } else {
            this.options.debug = Boolean(debug) || undefined;
        }
    }

    toJSON(): { name: string; host: string; id: string | undefined; protocol: NodePyATVProtocol | undefined } {
        return {
            name: this.name,
            host: this.host,
            id: this.id,
            protocol: this.protocol
        };
    }

    toString(): string {
        return `NodePyATVDevice(${this.name}, ${this.host})`;
    }

    /*async getState(options: NodePyATVGetStatusOptions) {

    }

    async getMediaType(options: NodePyATVGetStatusOptions) {
        const state = await this.getState(options);
        return state.mediaType;
    }*/
}
