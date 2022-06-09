'use strict';

import {NodePyATVDevice} from '../lib';
import {NodePyATVEventValueType, NodePyATVStateIndex} from './types';

export default class NodePyATVDeviceEvent {
    protected readonly values: {key: NodePyATVStateIndex, old: NodePyATVEventValueType, new: NodePyATVEventValueType, device: NodePyATVDevice};

    /**
     *
     * @param values
     * @internal
     */
    constructor(values: {key: NodePyATVStateIndex, old: NodePyATVEventValueType, new: NodePyATVEventValueType, device: NodePyATVDevice}) {
        this.values = Object.assign({}, values, {
            key: values.key as NodePyATVStateIndex
        });
    }

    /**
     * References the attribute name which was changed. So if the
     * title has been updated, this would be `title`.
     */
    get key(): NodePyATVStateIndex {
        return this.values.key;
    }

    /**
     * Holds the old value which was there
     * before the value was changed.
     */
    get oldValue(): NodePyATVEventValueType {
        return this.values.old;
    }

    /**
     * @alias value
     */
    get newValue(): NodePyATVEventValueType {
        return this.values.new;
    }

    /**
     * New, current value for `key`
     */
    get value(): NodePyATVEventValueType {
        return this.values.new;
    }

    /**
     * References the device instance this
     * event originates from
     */
    get device(): NodePyATVDevice {
        return this.values.device;
    }
}
