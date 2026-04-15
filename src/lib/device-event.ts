'use strict';

import type { NodePyATVEventValueType, NodePyATVStateIndex } from './types.js';

import { NodePyATVDevice } from '../lib/index.js';

export default class NodePyATVDeviceEvent {
    /**
     * References the device instance this
     * event originates from
     */
    get device(): NodePyATVDevice {
        return this.values.device;
    }

    /**
     * References the attribute name which was changed. So if the
     * title has been updated, this would be `title`.
     */
    get key(): NodePyATVStateIndex {
        return this.values.key;
    }

    /**
     * @alias value
     */
    get newValue(): NodePyATVEventValueType {
        return this.values.new;
    }

    /**
     * Holds the old value which was there
     * before the value was changed.
     */
    get oldValue(): NodePyATVEventValueType {
        return this.values.old;
    }

    /**
     * New, current value for `key`
     */
    get value(): NodePyATVEventValueType {
        return this.values.new;
    }

    protected readonly values: {
        device: NodePyATVDevice;
        key: NodePyATVStateIndex;
        new: NodePyATVEventValueType;
        old: NodePyATVEventValueType;
    };

    /**
     *
     * @param values
     * @internal
     */
    constructor(values: {
        device: NodePyATVDevice;
        key: NodePyATVStateIndex;
        new: NodePyATVEventValueType;
        old: NodePyATVEventValueType;
    }) {
        this.values = Object.assign({}, values, {
            key: values.key as NodePyATVStateIndex,
        });
    }
}
