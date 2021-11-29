'use strict';

import {
    NodePyATVDeviceOptions,
    NodePyATVExecutableType,
    NodePyATVInternalState,
    NodePyATVListenerState,
    NodePyATVState,
    NodePyATVStateIndex
} from './types';
import {ChildProcess} from 'child_process';

import {EventEmitter} from 'events';
import {NodePyATVDevice, NodePyATVDeviceEvent} from '../lib';
import {addRequestId, debug, execute, getParamters, parseState, removeRequestId} from './tools';
import {FakeChildProcess} from './fake-spawn';

/**
 * @internal
 */
export default class NodePyATVDeviceEvents extends EventEmitter {
    private readonly options: NodePyATVDeviceOptions;
    private readonly state: NodePyATVState;
    private readonly device: NodePyATVDevice;
    private pyatv: ChildProcess | FakeChildProcess | undefined;
    private timeout: NodeJS.Timeout | undefined;
    private listenerState: NodePyATVListenerState;

    constructor(state: NodePyATVState, device: NodePyATVDevice, options: NodePyATVDeviceOptions) {
        super();

        this.state = state;
        this.device = device;
        this.options = Object.assign({}, options);
        this.listenerState = NodePyATVListenerState.stopped;
    }

    applyStateAndEmitEvents(newState: NodePyATVState): void {
        Object.keys(this.state).forEach((key: string) => {

            // @ts-ignore
            const oldValue = this.state[key];

            // @ts-ignore
            const newValue = newState[key];

            if(oldValue === undefined || newValue === undefined || oldValue === newValue) {
                return;
            }

            const event = new NodePyATVDeviceEvent({
                key: key as NodePyATVStateIndex,
                old: oldValue,
                new: newValue,
                device: this.device
            });

            // @ts-ignore
            this.state[key] = newState[key];

            try {
                this.emit('update:' + key, event);
                this.emit('update', event);
            }
            catch(error) {
                this.emit('error', error);
            }
        });
    }

    private parsePushUpdate(reqId: string, data: string): void {
        let json: NodePyATVInternalState;

        try {
            json = JSON.parse(data);
        }
        catch(error) {
            const msg = `Unable to parse stdout json: ${error}`;
            debug(reqId, msg, this.options);
            this.emit('error', new Error(msg));
            return;
        }

        this.applyPushUpdate(json, reqId);

        if(this.listenerState === NodePyATVListenerState.starting) {
            this.listenerState = NodePyATVListenerState.started;
            this.checkListener();
        }
    }

    private applyPushUpdate(update: NodePyATVInternalState, reqId: string): void {
        try {
            const newState = parseState(update, reqId, this.options);
            this.applyStateAndEmitEvents(newState);
        }
        catch(error) {
            this.emit('error', error);
        }
    }

    private checkListener(): void {
        if(this.listenerState === NodePyATVListenerState.stopped && this.listenerCount() === 0 && this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        else if(this.listenerState === NodePyATVListenerState.stopped && this.listenerCount() > 0) {
            const id = addRequestId();
            debug(id, `Start listeing to events from device ${this.options.name}`, this.options);

            this.startListening(id);
            removeRequestId(id);
        }
        else if(
            [NodePyATVListenerState.starting, NodePyATVListenerState.started].includes(this.listenerState) &&
            this.listenerCount() === 0
        ) {
            const id = addRequestId();
            debug(id, `Stop listening to events from device ${this.options.name}`, this.options);

            this.stopListening(id)
                .catch(error => debug(id, `Unable to stop listeing: ${error}`, this.options))
                .finally(() => removeRequestId(id));
        }
    }

    private startListening(reqId: string): void {
        if(this.listenerState !== NodePyATVListenerState.stopped) {
            return;
        }

        this.listenerState = NodePyATVListenerState.starting;

        const listenStart = new Date().getTime();
        const parameters = getParamters(this.options);
        this.pyatv = execute(reqId, NodePyATVExecutableType.atvscript, [...parameters, 'push_updates'], this.options);

        const onError = (error: Error) => {
            debug(reqId, `Got error from child process: ${error}`, this.options);
            this.emit('error', error);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onStdErr = (data: any) => {
            const error = new Error(`Got stderr output from pyatv: ${data}`);
            debug(reqId, data.toString(), this.options);
            this.emit('error', error);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onStdOut = (data: any) => {
            String(data)
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean)
                .forEach(s => this.parsePushUpdate(reqId, s));
        };
        const onClose = (code: number) => {
            if(this.pyatv === undefined) {
                // this should never happen… :/
                return;
            }

            this.listenerState = NodePyATVListenerState.stopped;
            debug(reqId, `Listening with atvscript exited with code ${code}`, this.options);
            if(this.timeout !== undefined) {
                clearTimeout(this.timeout);
                this.timeout = undefined;
            }

            if (this.pyatv.stdout) {
                this.pyatv.stdout.off('data', onStdOut);
            }
            if (this.pyatv.stderr) {
                this.pyatv.stderr.off('data', onStdErr);
            }
            this.pyatv.off('error', onError);
            this.pyatv.off('close', onClose);


            if(this.listenerCount() > 0 && new Date().getTime() - listenStart < 30000) {
                debug(reqId, `Wait 15s and restart listeing to events from device ${this.options.name}`, this.options);

                this.timeout = setTimeout(() => {
                    this.checkListener();
                }, 15000);
            }
            else if(this.listenerCount() > 0) {
                debug(reqId, `Restart listeing to events from device ${this.options.name}`, this.options);
                this.checkListener();
            }

            removeRequestId(reqId);
        };

        this.pyatv.on('error', onError);
        this.pyatv.on('close', onClose);

        if (this.pyatv.stdout) {
            this.pyatv.stdout.on('data', onStdOut);
        }
        if (this.pyatv.stderr) {
            this.pyatv.stderr.on('data', onStdErr);
        }
    }

    protected async stopListening(reqId: string): Promise<void> {
        if(
            this.listenerState !== NodePyATVListenerState.starting &&
            this.listenerState !== NodePyATVListenerState.started
        ) {
            return;
        }

        this.listenerState = NodePyATVListenerState.stopping;
        if(this.pyatv === undefined) {
            throw new Error(
                'Unable to stop listening due to internal error: state is stopping, but there\'s no child process. ' +
                'This should never happen, please report this.'
            );
        }

        if(this.pyatv.stdin) {
            debug(reqId, 'Pressing enter to close atvscript…', this.options);
            this.pyatv.stdin.write('\n');

            await new Promise(cb => this.timeout = setTimeout(cb, 250));
        }

        if(this.listenerState === NodePyATVListenerState.stopping && this.pyatv) {
            this.pyatv.kill();
        }

        this.listenerState = NodePyATVListenerState.stopped;
        return;
    }

    addListener(event: string | symbol, listener: (event: NodePyATVDeviceEvent) => void): this {
        super.addListener(event, listener);
        this.checkListener();
        return this;
    }

    on(event: string | symbol, listener: (event: NodePyATVDeviceEvent) => void): this {
        super.on(event, listener);
        this.checkListener();
        return this;
    }

    once(event: string | symbol, listener: (event: NodePyATVDeviceEvent) => void): this {
        super.once(event, (event: NodePyATVDeviceEvent) => {
            listener(event);
            setTimeout(() => this.checkListener(), 0);
        });
        this.checkListener();
        return this;
    }

    prependListener(event: string | symbol, listener: (event: NodePyATVDeviceEvent) => void): this {
        super.prependListener(event, listener);
        this.checkListener();
        return this;
    }

    off(event: string | symbol, listener: (event: NodePyATVDeviceEvent) => void): this {
        super.off(event, listener);
        this.checkListener();
        return this;
    }

    removeAllListeners(event?: string | symbol): this {
        super.removeAllListeners(event);
        this.checkListener();
        return this;
    }

    removeListener(event: string | symbol, listener: (event: NodePyATVDeviceEvent) => void): this {
        super.removeListener(event, listener);
        this.checkListener();
        return this;
    }

    listenerCount(event?: string | symbol): number {
        if(event !== undefined) {
            return super.listenerCount(event);
        }

        return this.eventNames()
            .map(event => this.listenerCount(event))
            .reduce((a, b) => a + b, 0);
    }
}
