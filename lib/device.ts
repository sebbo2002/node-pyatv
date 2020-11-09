'use strict';

import {
    NodePyATVDeviceOptions,
    NodePyATVDeviceState,
    NodePyATVExecutableType,
    NodePyATVGetStateOptions,
    NodePyATVInternalKeys, NodePyATVKeys,
    NodePyATVMediaType,
    NodePyATVProtocol,
    NodePyATVRepeatState,
    NodePyATVShuffleState,
    NodePyATVState
} from './types';
import {addRequestId, getParamters, parseState, removeRequestId, request} from './tools';

export default class NodePyATVDevice {
    private readonly options: NodePyATVDeviceOptions;
    private state: NodePyATVState | undefined;

    constructor(options: NodePyATVDeviceOptions) {
        this.options = Object.assign({}, options);
        this.clearState();

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
        if (typeof debug === 'function') {
            this.options.debug = debug;
        }
        else {
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
        const parameters = getParamters(this.options);

        const result = await request(id, NodePyATVExecutableType.atvscript, [...parameters, 'playing'], this.options);
        const newState = parseState(result, id, this.options);
        this.applyState(newState);

        removeRequestId(id);
        return newState;
    }

    clearState(): void {
        this.applyState(parseState({}, '', {}));
    }

    private applyState(newState: NodePyATVState): void {
        // @todo events, etc.
        this.state = Object.assign(this.state || {}, newState);
    }

    async getDateTime(options: NodePyATVGetStateOptions = {}): Promise<Date | null> {
        const state = await this.getState(options);
        return state.dateTime;
    }

    async getHash(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.hash;
    }

    async getMediaType(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVMediaType | null> {
        const state = await this.getState(options);
        return state.mediaType;
    }

    async getDeviceState(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVDeviceState | null> {
        const state = await this.getState(options);
        return state.deviceState;
    }

    async getTitle(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.title;
    }

    async getArtist(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.artist;
    }

    async getAlbum(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.album;
    }

    async getGenre(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.genre;
    }

    async getTotalTime(options: NodePyATVGetStateOptions = {}): Promise<number | null> {
        const state = await this.getState(options);
        return state.totalTime;
    }

    async getPosition(options: NodePyATVGetStateOptions = {}): Promise<number | null> {
        const state = await this.getState(options);
        return state.position;
    }

    async getShuffle(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVShuffleState | null> {
        const state = await this.getState(options);
        return state.shuffle;
    }

    async getRepeat(options: NodePyATVGetStateOptions = {}): Promise<NodePyATVRepeatState | null> {
        const state = await this.getState(options);
        return state.repeat;
    }

    async getApp(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.app;
    }

    async getAppId(options: NodePyATVGetStateOptions = {}): Promise<string | null> {
        const state = await this.getState(options);
        return state.appId;
    }

    private async _pressKey(key: NodePyATVInternalKeys) {
        const id = addRequestId();
        const parameters = getParamters(this.options);

        const result = await request(id, NodePyATVExecutableType.atvscript, [...parameters, key], this.options);
        if (typeof result !== 'object' || result.result !== 'success') {
            throw new Error(`Unable to parse pyatv response: ${JSON.stringify(result, null, '  ')}`);
        }

        removeRequestId(id);
    }

    async pressKey(key: NodePyATVKeys): Promise<void> {
        const internalKeyEntry = Object.entries(NodePyATVInternalKeys)
            .find(([k]) => key === k);

        if(!internalKeyEntry) {
            throw new Error(`Unsupported key value ${key}!`);
        }

        const internalKey = internalKeyEntry[1];
        await this._pressKey(internalKey);
    }

    async down(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.down);
    }

    async home(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.home);
    }

    async homeHold(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.homeHold);
    }

    async left(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.left);
    }

    async menu(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.menu);
    }

    async next(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.next);
    }

    async pause(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.pause);
    }

    async play(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.play);
    }

    async playPause(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.playPause);
    }

    async previous(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.previous);
    }

    async right(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.right);
    }

    async select(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.select);
    }

    async skipBackward(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.skipBackward);
    }

    async skipForward(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.skipForward);
    }

    async stop(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.stop);
    }

    async suspend(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.suspend);
    }

    async topMenu(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.topMenu);
    }

    async up(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.up);
    }

    async volumeDown(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.volumeDown);
    }

    async volumeUp(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.volumeUp);
    }

    async wakeup(): Promise<void> {
        await this._pressKey(NodePyATVInternalKeys.wakeup);
    }
}
