'use strict';

import NodePyATVDevice from './device';
import {NodePyATVStateIndex} from './types';

export default class NodePyATVDeviceEvent {
    protected readonly values: {key: NodePyATVStateIndex, old: string, new: string, device: NodePyATVDevice};

    constructor(values: {key: NodePyATVStateIndex, old: string, new: string, device: NodePyATVDevice}) {
        this.values = Object.assign({}, values, {
            key: values.key as NodePyATVStateIndex
        });
    }

    get key(): NodePyATVStateIndex {
        return this.values.key;
    }

    get oldValue(): string {
        return this.values.old;
    }

    get newValue(): string {
        return this.values.new;
    }

    get value(): string {
        return this.values.new;
    }

    get device(): NodePyATVDevice {
        return this.values.device;
    }
}
