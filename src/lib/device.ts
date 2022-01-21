'use strict';

import {
    NodePyATVDeviceOptions,
    NodePyATVDeviceState,
    NodePyATVExecutableType,
    NodePyATVGetStateOptions,
    NodePyATVInternalKeys,
    NodePyATVKeys,
    NodePyATVMediaType,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    NodePyATVShuffleState,
    NodePyATVState
} from './types';

import { addRequestId, getParamters, parseState, removeRequestId, request } from './tools';
import { NodePyATVDeviceEvent, NodePyATVDeviceEvents } from '../lib';
import { EventEmitter } from 'events';

/**
 * Represents an Apple TV. Use [[getState]] to query the current state (e.g. media
 * type and title). You can also use the attribute methods (e.g. [[getTitle]] to get
 * the state. If you want realtime updates, subscribe to it's events with an
 * `EventEmitter` like API, so for example by using [[on]], [[once]] or [[addListener]].
 * It's also possible to send key commands by using [[pressKey]] or methods like [[pause]].
 */
export default class NodePyATVDevice implements EventEmitter{
    private readonly options: NodePyATVDeviceOptions;
    private readonly state: NodePyATVState;
    private readonly events: NodePyATVDeviceEvents;

    constructor(options: NodePyATVDeviceOptions) {
        this.options = Object.assign({}, options);
        this.state = parseState({}, '', {});
        this.events = new NodePyATVDeviceEvents(this.state, this, this.options);

        // @todo basic validation
    }

    /**
     * Get the name of the Apple TV.
     *
     * ```typescript
     * import pyatv from '@sebbo2002/node-pyatv';
     * const devices = await pyatv.find();
     * devices.forEach(device =>
     *     console.log(device.name)
     * );
     * ```
     */
    get name(): string {
        return this.options.name;
    }

    /**
     * Get the IP address of the Apple TV.
     */
    get host(): string {
        return this.options.host;
    }

    /**
     * Get the ID of the Apple TV.
     */
    get id(): string | undefined {
        return this.options.id;
    }

    /**
     * Get the used protocol to connect to the Apple TV.
     */
    get protocol(): NodePyATVProtocol | undefined {
        return this.options.protocol;
    }

    /**
     * Returns true, if debugging is enabled. Returns the custom
     * logging method, if one was specified. Otherwise, if debug
     * log is disabled, returns undefined.
     */
    get debug(): true | ((msg: string) => void) | undefined {
        return this.options.debug;
    }

    /**
     * Enable or disable debugging or set a custom
     * debugging method to use.
     *
     * @param debug
     */
    set debug(debug: true | ((msg: string) => void) | undefined) {
        if (typeof debug === 'function') {
            this.options.debug = debug;
        }
        else {
            this.options.debug = Boolean(debug) || undefined;
        }
    }

    /**
     * Returns an object with `name`, `host`, `id` and `protocol`.
     * Can be used to initiate a new device instance.
     *
     * @category Basic
     */
    toJSON(): { name: string; host: string; id: string | undefined; protocol: NodePyATVProtocol | undefined } {
        return {
            name: this.name,
            host: this.host,
            id: this.id,
            protocol: this.protocol
        };
    }

    /**
     * Returns a string. Just for debugging, etc.
     *
     * @category Basic
     */
    toString(): string {
        return `NodePyATVDevice(${this.name}, ${this.host})`;
    }

    /**
     * Returns an [[NodePyATVState]] object representing the current state
     * of the device. Has an internal cache, which has a default TTL of 5s.
     * You can change this default value by passing the `maxAge` option.
     *
     * ```typescript
     * await device.getState({maxAge: 10000}); // cache TTL: 10s
     * ```
     *
     * @param options
     * @category State
     */
    async getState(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVState> {
        if (this.state?.dateTime && new Date().getTime() - this.state.dateTime.getTime() < (options.maxAge || 5000)) {
            let position = null;
            if (this.state.position && this.state.dateTime) {
                position = Math.round(
                    this.state.position +
                    ((new Date().getTime() - this.state.dateTime.getTime()) / 1000)
                );
            }

            return Object.assign({}, this.state, {position});
        }

        const id = addRequestId();

        try {
            const parameters = getParamters(this.options);

            const result = await request(id, NodePyATVExecutableType.atvscript, [...parameters, 'playing'], this.options);
            const newState = parseState(result, id, this.options);

            this.applyState(newState);
            return newState;
        }
        finally {
            removeRequestId(id);
        }
    }

    /**
     * Removes the state node-pyatv cached for this device.
     *
     * @category State
     */
    clearState(): void {
        this.applyState(parseState({}, '', {}));
    }

    private applyState(newState: NodePyATVState): void {
        this.events.applyStateAndEmitEvents(newState);
    }

    /**
     * Get the date and time when the state was last updated.
     * @param options
     * @category State
     */
    async getDateTime(options: NodePyATVGetStateOptions = {}): Promise<Date | null> {
        const state = await this.getState(options);
        return state.dateTime;
    }

    /**
     * Get the hash of the current media
     * @param options
     * @category State
     */
    async getHash(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.hash;
    }

    /**
     * Get the media type of the current media
     * @param options
     * @category State
     */
    async getMediaType(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVMediaType | null> {
        const state = await this.getState(options);
        return state.mediaType;
    }

    /**
     * Get the state of this device (e.g. playing, etc.)
     * @param options
     * @category State
     */
    async getDeviceState(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVDeviceState | null> {
        const state = await this.getState(options);
        return state.deviceState;
    }

    /**
     * Returns the title of the current playing media
     * @param options
     * @category State
     */
    async getTitle(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.title;
    }

    /**
     * Returns the artist of the current playing media
     * @param options
     * @category State
     */
    async getArtist(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.artist;
    }

    /**
     * Returns the album of the current playing media
     * @param options
     * @category State
     */
    async getAlbum(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.album;
    }

    /**
     * Returns the genre of the current playing media
     * @param options
     * @category State
     */
    async getGenre(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.genre;
    }

    /**
     * Returns the media length of the current playing media
     * @param options
     * @category State
     */
    async getTotalTime(options: NodePyATVGetStateOptions = {}): Promise<number | null> {
        const state = await this.getState(options);
        return state.totalTime;
    }

    /**
     * Returns the title of the current playing media
     * @param options
     * @category State
     */
    async getPosition(options: NodePyATVGetStateOptions = {}): Promise<number | null> {
        const state = await this.getState(options);
        return state.position;
    }

    /**
     * Returns the shuffle state
     * @param options
     * @category State
     */
    async getShuffle(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVShuffleState | null> {
        const state = await this.getState(options);
        return state.shuffle;
    }

    /**
     * Returns the repeat state
     * @param options
     * @category State
     */
    async getRepeat(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVRepeatState | null> {
        const state = await this.getState(options);
        return state.repeat;
    }

    /**
     * Returns the currently used app
     * @param options
     * @category State
     */
    async getApp(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.app;
    }

    /**
     * Returns the id of the currently used app
     * @param options
     * @category State
     */
    async getAppId(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.appId;
    }

    private async _pressKey(key: NodePyATVInternalKeys, executableType = NodePyATVExecutableType.atvscript) {
        const id = addRequestId();
        const parameters = getParamters(this.options);

        const result = await request(id, executableType, [...parameters, key], this.options);
        if (
            executableType === NodePyATVExecutableType.atvscript &&
            (typeof result !== 'object' || result.result !== 'success')
        ) {
            throw new Error(`Unable to parse pyatv response: ${JSON.stringify(result, null, '  ')}`);
        }

        removeRequestId(id);
    }

    /**
     * Send a key press to the Apple TV
     *
     * ```typescript
     * await device.pressKey(NodePyATVKeys.home);
     * ```
     *
     * <br />
     *
     * ```javascript
     * await device.pressKey('home');
     * ```
     *
     * @param key
     * @category Control
     */
    async pressKey(key: NodePyATVKeys): Promise<void> {
        const internalKeyEntry = Object.entries(NodePyATVInternalKeys)
            .find(([k]) => key === k);

        if(!internalKeyEntry) {
            throw new Error(`Unsupported key value ${key}!`);
        }

        const internalKey = internalKeyEntry[1];
        await this._pressKey(internalKey);
    }

    /**
     * Send the "down" command
     * @category Control
     */
    async down(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.down);
    }

    /**
     * Send the "home" command
     * @category Control
     */
    async home(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.home);
    }

    /**
     * Send the "homeHold" command
     * @category Control
     */
    async homeHold(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.homeHold);
    }

    /**
     * Send the "left" command
     * @category Control
     */
    async left(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.left);
    }

    /**
     * Send the "menu" command
     * @category Control
     */
    async menu(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.menu);
    }

    /**
     * Send the "next" command
     * @category Control
     */
    async next(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.next);
    }

    /**
     * Send the "pause" command
     * @category Control
     */
    async pause(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.pause);
    }

    /**
     * Send the "play" command
     * @category Control
     */
    async play(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.play);
    }

    /**
     * Send the "playPause" command
     * @category Control
     */
    async playPause(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.playPause);
    }

    /**
     * Send the "previous" command
     * @category Control
     */
    async previous(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.previous);
    }

    /**
     * Send the "right" command
     * @category Control
     */
    async right(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.right);
    }

    /**
     * Send the "select" command
     * @category Control
     */
    async select(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.select);
    }

    /**
     * Send the "skipBackward" command
     * @category Control
     */
    async skipBackward(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.skipBackward);
    }

    /**
     * Send the "skipForward" command
     * @category Control
     */
    async skipForward(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.skipForward);
    }

    /**
     * Send the "stop" command
     * @category Control
     */
    async stop(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.stop);
    }

    /**
     * Send the "suspend" command
     * @category Control
     * @deprecated
     */
    async suspend(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.suspend);
    }

    /**
     * Send the "topMenu" command
     * @category Control
     */
    async topMenu(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.topMenu);
    }

    /**
     * Send the "up" command
     * @category Control
     */
    async up(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.up);
    }

    /**
     * Send the "volumeDown" command
     * @category Control
     */
    async volumeDown(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.volumeDown);
    }

    /**
     * Send the "volumeUp" command
     * @category Control
     */
    async volumeUp(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.volumeUp);
    }

    /**
     * Send the "wakeup" command
     * @category Control
     * @deprecated
     */
    async wakeup(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.wakeup);
    }

    /**
     * Send the "turn_off" command
     * @category Control
     */
    async turnOff(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.turnOff, NodePyATVExecutableType.atvremote);
    }

    /**
     * Send the "turn_on" command
     * @category Control
     */
    async turnOn(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.turnOn, NodePyATVExecutableType.atvremote);
    }

    /**
     * Add an event listener. Will start the event subscription with the
     * Apple TV as long as there are listeners for any event registered.
     * @param event
     * @param listener
     * @category Event
     */
    addListener(event: string | symbol, listener: (event: NodePyATVDeviceEvent) => void): this {
        this.events.addListener(event, listener);
        return this;
    }

    /**
     * Emit an event.
     * @param event
     * @param payload
     * @category Event
     */
    emit(event: string | symbol, payload: NodePyATVDeviceEvent): boolean {
        return this.events.emit(event, payload);
    }

    /**
     * Get all event names which are currently known.
     * @category Event
     */
    eventNames(): Array<string | symbol> {
        return this.events.eventNames();
    }

    /**
     * Get max number of listeners allowed
     * @category Event
     */
    getMaxListeners(): number {
        return this.events.getMaxListeners();
    }

    /**
     * Get number of listeners for event
     * @param event
     * @category Event
     */
    listenerCount(event: string | symbol): number {
        return this.events.listenerCount(event);
    }

    /**
     * Get listeners for event. Will also return
     * node-pyatv wrappers (e.g. once)
     *
     * @param event
     * @category Event
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    listeners(event: string | symbol): Function[] {
        return this.events.listeners(event);
    }

    /**
     * Remove an event listener. Will stop the event subscription with the
     * Apple TV if this was the last event listener.
     * @param event
     * @param listener
     * @category Event
     */
    off(event: string | symbol, listener: (event: NodePyATVDeviceEvent | Error) => void): this {
        this.events.off(event, listener);
        return this;
    }

    /**
     * Add an event listener. Will start the event subscription with the
     * Apple TV as long as there are listeners for any event registered.
     * @param event
     * @param listener
     * @category Event
     */
    on(event: string | symbol, listener: (event: NodePyATVDeviceEvent | Error) => void): this {
        this.events.on(event, listener);
        return this;
    }

    /**
     * Add an event listener. Will start the event subscription with the
     * Apple TV as long as there are listeners for any event registered.
     * Removes the listener automatically after the first occurrence.
     * @param event
     * @param listener
     * @category Event
     */
    once(event: string | symbol, listener: (event: NodePyATVDeviceEvent | Error) => void): this {
        this.events.once(event, listener);
        return this;
    }

    /**
     * @param event
     * @param listener
     * @category Event
     */
    prependListener(event: string | symbol, listener: (event: NodePyATVDeviceEvent | Error) => void): this {
        this.events.prependListener(event, listener);
        return this;
    }

    /**
     * @param event
     * @param listener
     * @category Event
     */
    prependOnceListener(event: string | symbol, listener: (event: NodePyATVDeviceEvent | Error) => void): this {
        this.events.prependOnceListener(event, listener);
        return this;
    }

    /**
     * @param event
     * @category Event
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    rawListeners(event: string | symbol): Function[] {
        return this.events.rawListeners(event);
    }

    /**
     * Removes all listeners, either for the given event or
     * for every event. Will stop the event subscription with
     * the Apple TV if this was the last event listener.
     *
     * @param event
     * @category Event
     */
    removeAllListeners(event?: string | symbol): this {
        this.events.removeAllListeners(event);
        return this;
    }

    /**
     * Remove an event listener. Will stop the event subscription with the
     * Apple TV if this was the last event listener.
     * @param event
     * @param listener
     * @category Event
     */
    removeListener(event: string | symbol, listener: (event: NodePyATVDeviceEvent) => void): this {
        this.events.removeListener(event, listener);
        return this;
    }

    /**
     * @param n
     * @category Event
     */
    setMaxListeners(n: number): this {
        this.events.setMaxListeners(n);
        return this;
    }
}
