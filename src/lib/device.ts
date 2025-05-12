'use strict';

import { EventEmitter } from 'events';

import { NodePyATVDeviceEvent, NodePyATVDeviceEvents } from '../lib/index.js';
import {
    addRequestId,
    getParameters,
    parseState,
    removeRequestId,
    request,
} from './tools.js';
import {
    type NodePyATVApp,
    type NodePyATVDeviceOptions,
    NodePyATVDeviceState,
    NodePyATVExecutableType,
    NodePyATVFocusState,
    type NodePyATVGetStateOptions,
    NodePyATVInternalKeys,
    NodePyATVKeys,
    NodePyATVMediaType,
    NodePyATVPowerState,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    type NodePyATVService,
    NodePyATVShuffleState,
    type NodePyATVState,
} from './types.js';

/**
 * Represents an Apple TV. Use [[getState]] to query the current state (e.g. media
 * type and title). You can also use the attribute methods (e.g. [[getTitle]] to get
 * the state. If you want realtime updates, subscribe to it's events with an
 * `EventEmitter` like API, so for example by using [[on]], [[once]] or [[addListener]].
 * It's also possible to send key commands by using [[pressKey]] or methods like [[pause]].
 */
export default class NodePyATVDevice implements EventEmitter {
    /**
     * Get all IDs of the Apple TV.
     * Requires pyatv >= 0.14.5.
     */
    get allIDs(): string[] | undefined {
        return this.options.allIDs;
    }
    /**
     * Returns true, if debugging is enabled. Returns the custom
     * logging method, if one was specified. Otherwise, if debug
     * log is disabled, returns undefined.
     */
    get debug(): ((msg: string) => void) | true | undefined {
        return this.options.debug;
    }
    /**
     * Enable or disable debugging or set a custom
     * debugging method to use.
     *
     * @param debug
     */
    set debug(debug: ((msg: string) => void) | true | undefined) {
        if (typeof debug === 'function') {
            this.options.debug = debug;
        } else {
            this.options.debug = Boolean(debug) || undefined;
        }
    }

    /**
     * Get the IP address of the Apple TV.
     */
    get host(): string | undefined {
        return this.options.host;
    }

    /**
     * Get the ID of the Apple TV.
     */
    get id(): string | undefined {
        return this.options.id;
    }

    /**
     * Get the MAC address of the Apple TV.
     * Requires pyatv >= 0.14.5.
     */
    get mac(): string | undefined {
        return this.options.mac;
    }

    /**
     * Get the model identifier of the device. Only set, if the
     * device was found using [[find()]]. Requires pyatv ≧ 0.10.3.
     *
     * @example device.model → "Gen4K"
     */
    get model(): string | undefined {
        return this.options.model;
    }

    /**
     * Get the model name of the device. Only set, if the device
     * was found with [[find()]]. Requires pyatv ≧ 0.10.3.
     *
     * @example device.modelName → "Apple TV 4K"
     */
    get modelName(): string | undefined {
        return this.options.modelName;
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
     * Get the operating system of the device. Only set, if the
     * device was found with [[find()]]. Requires pyatv ≧ 0.10.3.
     *
     * @example device.os → "TvOS"
     */
    get os(): string | undefined {
        return this.options.os;
    }

    /**
     * Get the used protocol to connect to the Apple TV.
     */
    get protocol(): NodePyATVProtocol | undefined {
        return this.options.protocol;
    }

    /**
     * Returns a list of services supported by the device. Ony set, if
     * the device was found during a scan using [[find()]]. Requires
     * pyatv ≧ 0.10.3.
     *
     * @example device.services → [
     *   {
     *     "protocol": "airplay",
     *     "port": 7000
     *   },
     *   {
     *     "protocol": "dmap",
     *     "port": 3689
     *   }
     * ]
     */
    get services(): NodePyATVService[] | undefined {
        return this.options.services;
    }

    /**
     * Get the device version. Only set, if the device was found
     * during a scan using [[find()]]. Requires pyatv ≧ 0.10.3.
     *
     * @example device.version → "15.5.1"
     */
    get version(): string | undefined {
        return this.options.version;
    }

    private readonly events: NodePyATVDeviceEvents;

    private readonly options: NodePyATVDeviceOptions;

    private readonly state: NodePyATVState;

    constructor(options: NodePyATVDeviceOptions) {
        if (!options.host && !options.id && !options.mac) {
            throw new Error('Either host, id or mac must be set!');
        }

        this.options = Object.assign({}, options);
        this.state = parseState({}, '', {});
        this.events = new NodePyATVDeviceEvents(this.state, this, this.options);

        // @todo basic validation
    }

    /**
     * Add an event listener. Will start the event subscription with the
     * Apple TV as long as there are listeners for any event registered.
     * @param event
     * @param listener
     * @category Event
     */
    addListener(
        event: string | symbol,
        listener: (event: NodePyATVDeviceEvent) => void,
    ): this {
        this.events.addListener(event, listener);
        return this;
    }

    /**
     * Removes the state node-pyatv cached for this device.
     *
     * @category State
     */
    clearState(): void {
        this.applyState(parseState({}, '', {}));
    }

    /**
     * Send the "down" command
     * @category Control
     */
    async down(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.down);
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
     * Returns the album of the current playing media
     * @param options
     * @category State
     */
    async getAlbum(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        const state = await this.getState(options);
        return state.album;
    }

    /**
     * Returns the currently used app
     * @param options
     * @category State
     */
    async getApp(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        const state = await this.getState(options);
        return state.app;
    }

    /**
     * Returns the id of the currently used app
     * @param options
     * @category State
     */
    async getAppId(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        const state = await this.getState(options);
        return state.appId;
    }

    /**
     * Returns the artist of the current playing media
     * @param options
     * @category State
     */
    async getArtist(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        const state = await this.getState(options);
        return state.artist;
    }

    /**
     * Returns the app specific content identifier
     * @param options
     * @category State
     */
    async getContentIdentifier(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        return this.getState(options).then((state) => state.contentIdentifier);
    }

    /**
     * Get the date and time when the state was last updated.
     * @param options
     * @category State
     */
    async getDateTime(
        options: NodePyATVGetStateOptions = {},
    ): Promise<Date | null> {
        const state = await this.getState(options);
        return state.dateTime;
    }

    /**
     * Get the state of this device (e.g. playing, etc.)
     * @param options
     * @category State
     */
    async getDeviceState(
        options: NodePyATVGetStateOptions = {},
    ): Promise<NodePyATVDeviceState | null> {
        const state = await this.getState(options);
        return state.deviceState;
    }

    /**
     * Returns the episode number.
     * Probably only set [if MRP is used](https://pyatv.dev/development/metadata/#currently-playing).
     * @param options
     * @category State
     */
    async getEpisodeNumber(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | number> {
        return this.getState(options).then((state) => state.episodeNumber);
    }

    /**
     * Returns the current focus state of the device
     * @param options
     * @category State
     */
    async getFocusState(
        options: NodePyATVGetStateOptions = {},
    ): Promise<NodePyATVFocusState | null> {
        return this.getState(options).then((state) => state.focusState);
    }

    /**
     * Returns the genre of the current playing media
     * @param options
     * @category State
     */
    async getGenre(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        const state = await this.getState(options);
        return state.genre;
    }

    /**
     * Get the hash of the current media
     * @param options
     * @category State
     */
    async getHash(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        const state = await this.getState(options);
        return state.hash;
    }

    /**
     * Returns the iTunes Store identifier if available.
     * Requires pyatv >= 0.16.0
     * @param options
     * @category State
     * @alias getiTunesStoreIdentifier
     */
    async getITunesStoreIdentifier(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | number> {
        return this.getState(options).then(
            (state) => state.iTunesStoreIdentifier,
        );
    }

    async getiTunesStoreIdentifier(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | number> {
        return this.getITunesStoreIdentifier(options);
    }

    /**
     * Get max number of listeners allowed
     * @category Event
     */
    getMaxListeners(): number {
        return this.events.getMaxListeners();
    }

    /**
     * Get the media type of the current media
     * @param options
     * @category State
     */
    async getMediaType(
        options: NodePyATVGetStateOptions = {},
    ): Promise<NodePyATVMediaType | null> {
        const state = await this.getState(options);
        return state.mediaType;
    }

    /**
     * Returns the current output devices of the device
     * @param options
     * @category State
     */
    async getOutputDevices(
        options: NodePyATVGetStateOptions = {},
    ): Promise<Array<{ identifier: string; name: string }> | null> {
        return this.getState(options).then((state) => state.outputDevices);
    }

    /**
     * Returns the title of the current playing media
     * @param options
     * @category State
     */
    async getPosition(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | number> {
        const state = await this.getState(options);
        return state.position;
    }

    /**
     * Returns the current power state (= is it on or off, see [[NodePyATVPowerState]]) of the device.
     * @param options
     * @category State
     */
    async getPowerState(
        options: NodePyATVGetStateOptions = {},
    ): Promise<NodePyATVPowerState | null> {
        return this.getState(options).then((state) => state.powerState);
    }

    /**
     * Returns the repeat state
     * @param options
     * @category State
     */
    async getRepeat(
        options: NodePyATVGetStateOptions = {},
    ): Promise<NodePyATVRepeatState | null> {
        const state = await this.getState(options);
        return state.repeat;
    }

    /**
     * Returns the season number.
     * Probably only set [if MRP is used](https://pyatv.dev/development/metadata/#currently-playing).
     * @param options
     * @category State
     */
    async getSeasonNumber(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | number> {
        return this.getState(options).then((state) => state.seasonNumber);
    }
    /**
     * Returns the season name.
     * Probably only set [if MRP is used](https://pyatv.dev/development/metadata/#currently-playing).
     * @param options
     * @category State
     */
    async getSeriesName(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        return this.getState(options).then((state) => state.seriesName);
    }

    /**
     * Returns the shuffle state
     * @param options
     * @category State
     */
    async getShuffle(
        options: NodePyATVGetStateOptions = {},
    ): Promise<NodePyATVShuffleState | null> {
        const state = await this.getState(options);
        return state.shuffle;
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
    async getState(
        options: NodePyATVGetStateOptions = {},
    ): Promise<NodePyATVState> {
        if (
            this.state?.dateTime &&
            new Date().getTime() - this.state.dateTime.getTime() <
                (options.maxAge || 5000)
        ) {
            let position = null;
            if (this.state.position && this.state.dateTime) {
                position = Math.round(
                    this.state.position +
                        (new Date().getTime() - this.state.dateTime.getTime()) /
                            1000,
                );
            }

            return Object.assign({}, this.state, { position });
        }

        const id = addRequestId();

        try {
            const parameters = getParameters(this.options);

            const result = await request(
                id,
                NodePyATVExecutableType.atvscript,
                [...parameters, 'playing'],
                this.options,
            );
            const newState = parseState(result, id, this.options);

            this.applyState(newState);
            return newState;
        } finally {
            removeRequestId(id);
        }
    }

    /**
     * Returns the title of the current playing media
     * @param options
     * @category State
     */
    async getTitle(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | string> {
        const state = await this.getState(options);
        return state.title;
    }

    /**
     * Returns the media length of the current playing media
     * @param options
     * @category State
     */
    async getTotalTime(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | number> {
        const state = await this.getState(options);
        return state.totalTime;
    }

    /**
     * Returns the current volume of the device in percent (0 - 100)
     * @param options
     * @category State
     */
    async getVolume(
        options: NodePyATVGetStateOptions = {},
    ): Promise<null | number> {
        return this.getState(options).then((state) => state.volume);
    }

    /**
     * Send the "home" command
     * @category Control
     */
    async home(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.home);
    }

    /**
     * Send the "homeHold" command
     * @category Control
     */
    async homeHold(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.homeHold);
    }

    /**
     * Launch an application. Probably requires `companionCredentials`, see
     * https://pyatv.dev/documentation/atvremote/#apps for more details.
     * @param id App identifier, e.g. `com.netflix.Netflix`
     */
    async launchApp(id: string): Promise<void> {
        await this._pressKeyWithRemote('launch_app=' + id);
    }

    /**
     * Send the "left" command
     * @category Control
     */
    async left(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.left);
    }

    /**
     * Returns the list of installed apps on the Apple TV. Probably requires `companionCredentials`,
     * see https://pyatv.dev/documentation/atvremote/#apps for more details.
     */
    async listApps(): Promise<NodePyATVApp[]> {
        const id = addRequestId();
        const parameters = getParameters(this.options);

        const result = await request(
            id,
            NodePyATVExecutableType.atvremote,
            [...parameters, 'app_list'],
            this.options,
        );
        if (typeof result !== 'string' || !result.startsWith('App: ')) {
            throw new Error('Unexpected atvremote response: ' + result);
        }

        removeRequestId(id);
        const regex = /(.+) \(([^)]+)\)$/i;
        const items = result
            .substring(5)
            .split(', App: ')
            .map((i) => {
                const m = i.match(regex);
                if (m !== null) {
                    return {
                        id: m[2],
                        launch: () => this.launchApp(m[2]),
                        name: m[1],
                    };
                }
            }) as Array<NodePyATVApp | undefined>;

        return items.filter(Boolean) as NodePyATVApp[];
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    listeners(event: string | symbol): Function[] {
        return this.events.listeners(event);
    }

    /**
     * Send the "menu" command
     * @category Control
     */
    async menu(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.menu);
    }

    /**
     * Send the "next" command
     * @category Control
     */
    async next(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.next);
    }

    /**
     * Remove an event listener. Will stop the event subscription with the
     * Apple TV if this was the last event listener.
     * @param event
     * @param listener
     * @category Event
     */
    off(
        event: string | symbol,
        listener: (event: Error | NodePyATVDeviceEvent) => void,
    ): this {
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
    on(
        event: string | symbol,
        listener: (event: Error | NodePyATVDeviceEvent) => void,
    ): this {
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
    once(
        event: string | symbol,
        listener: (event: Error | NodePyATVDeviceEvent) => void,
    ): this {
        this.events.once(event, listener);
        return this;
    }

    /**
     * Send the "pause" command
     * @category Control
     */
    async pause(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.pause);
    }

    /**
     * Send the "play" command
     * @category Control
     */
    async play(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.play);
    }

    /**
     * Send the "playPause" command
     * @category Control
     */
    async playPause(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.playPause);
    }

    /**
     * @param event
     * @param listener
     * @category Event
     */
    prependListener(
        event: string | symbol,
        listener: (event: Error | NodePyATVDeviceEvent) => void,
    ): this {
        this.events.prependListener(event, listener);
        return this;
    }

    /**
     * @param event
     * @param listener
     * @category Event
     */
    prependOnceListener(
        event: string | symbol,
        listener: (event: Error | NodePyATVDeviceEvent) => void,
    ): this {
        this.events.prependOnceListener(event, listener);
        return this;
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
        const internalKeyEntry = Object.entries(NodePyATVInternalKeys).find(
            ([k]) => key === k,
        );

        if (!internalKeyEntry) {
            throw new Error(`Unsupported key value ${key}!`);
        }

        const internalKey = internalKeyEntry[1];
        if ([NodePyATVKeys.turnOff, NodePyATVKeys.turnOn].includes(key)) {
            await this._pressKeyWithRemote(internalKey);
        } else {
            await this._pressKeyWithScript(internalKey);
        }
    }

    /**
     * Send the "previous" command
     * @category Control
     */
    async previous(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.previous);
    }

    /**
     * @param event
     * @category Event
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
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
    removeListener(
        event: string | symbol,
        listener: (event: NodePyATVDeviceEvent) => void,
    ): this {
        this.events.removeListener(event, listener);
        return this;
    }

    /**
     * Send the "right" command
     * @category Control
     */
    async right(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.right);
    }

    /**
     * Send the "select" command
     * @category Control
     */
    async select(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.select);
    }

    /**
     * @param n
     * @category Event
     */
    setMaxListeners(n: number): this {
        this.events.setMaxListeners(n);
        return this;
    }

    /**
     * Send the "skipBackward" command
     * @category Control
     */
    async skipBackward(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.skipBackward);
    }

    /**
     * Send the "skipForward" command
     * @category Control
     */
    async skipForward(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.skipForward);
    }

    /**
     * Send the "stop" command
     * @category Control
     */
    async stop(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.stop);
    }

    /**
     * Send the "suspend" command
     * @category Control
     * @deprecated
     */
    async suspend(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.suspend);
    }

    /**
     * Returns an object with `name`, `host`, `mac`, `id` and `protocol`.
     * Can be used to initiate a new device instance.
     *
     * @category Basic
     */
    toJSON(): Pick<
        NodePyATVDeviceOptions,
        'host' | 'id' | 'mac' | 'name' | 'protocol'
    > {
        return {
            host: this.host,
            id: this.id,
            mac: this.mac,
            name: this.name,
            protocol: this.protocol,
        };
    }

    /**
     * Send the "topMenu" command
     * @category Control
     */
    async topMenu(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.topMenu);
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
     * Send the "turn_off" command
     * @category Control
     */
    async turnOff(): Promise<void> {
        await this._pressKeyWithRemote(NodePyATVInternalKeys.turnOff);
    }

    /**
     * Send the "turn_on" command
     * @category Control
     */
    async turnOn(): Promise<void> {
        await this._pressKeyWithRemote(NodePyATVInternalKeys.turnOn);
    }

    /**
     * Send the "up" command
     * @category Control
     */
    async up(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.up);
    }

    /**
     * Send the "volumeDown" command
     * @category Control
     */
    async volumeDown(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.volumeDown);
    }

    /**
     * Send the "volumeUp" command
     * @category Control
     */
    async volumeUp(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.volumeUp);
    }

    /**
     * Send the "wakeup" command
     * @category Control
     * @deprecated
     */
    async wakeup(): Promise<void> {
        await this._pressKeyWithScript(NodePyATVInternalKeys.wakeup);
    }

    private async _pressKeyWithRemote(key: NodePyATVInternalKeys | string) {
        const id = addRequestId();
        const parameters = getParameters(this.options);

        await request(
            id,
            NodePyATVExecutableType.atvremote,
            [...parameters, key],
            this.options,
        );
        removeRequestId(id);
    }

    private async _pressKeyWithScript(key: NodePyATVInternalKeys | string) {
        const id = addRequestId();
        const parameters = getParameters(this.options);

        const result = await request(
            id,
            NodePyATVExecutableType.atvscript,
            [...parameters, key],
            this.options,
        );
        if (typeof result !== 'object' || result.result !== 'success') {
            throw new Error(
                `Unable to parse pyatv response: ${JSON.stringify(result, null, '  ')}`,
            );
        }

        removeRequestId(id);
    }

    private applyState(newState: NodePyATVState): void {
        this.events.applyStateAndEmitEvents(newState);
    }
}
