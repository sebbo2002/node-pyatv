import { ChildProcess, type SpawnOptions } from 'child_process';

import type NodePyATVDevice from './device.js';

import { FakeChildProcess } from './fake-spawn.js';

export enum NodePyATVDeviceState {
    idle = 'idle',
    loading = 'loading',
    paused = 'paused',
    playing = 'playing',
    seeking = 'seeking',
    stopped = 'stopped',
}

export enum NodePyATVExecutableType {
    atvremote = 'atvremote',
    atvscript = 'atvscript',
}

export enum NodePyATVFocusState {
    // @deprecated Please use `NodePyATVFocusState.focused` instead
    focued = 'focused',

    // Doublicate enum value due to typo, will be removed in next breaking change
    // @todo remove in next breaking change
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    focused = 'focused',

    unfocused = 'unfocused',
}

/**
 * @internal
 */
export enum NodePyATVInternalKeys {
    down = 'down',
    home = 'home',
    homeHold = 'home_hold',
    left = 'left',
    menu = 'menu',
    next = 'next',
    pause = 'pause',
    play = 'play',
    playPause = 'play_pause',
    previous = 'previous',
    right = 'right',
    select = 'select',
    skipBackward = 'skip_backward',
    skipForward = 'skip_forward',
    stop = 'stop',
    suspend = 'suspend',
    topMenu = 'top_menu',
    turnOff = 'turn_off',
    turnOn = 'turn_on',
    up = 'up',
    volumeDown = 'volume_down',
    volumeUp = 'volume_up',
    wakeup = 'wakeup',
}

export enum NodePyATVKeys {
    down = 'down',
    home = 'home',
    homeHold = 'homeHold',
    left = 'left',
    menu = 'menu',
    next = 'next',
    pause = 'pause',
    play = 'play',
    playPause = 'playPause',
    previous = 'previous',
    right = 'right',
    select = 'select',
    skipBackward = 'skipBackward',
    skipForward = 'skipForward',
    stop = 'stop',
    suspend = 'suspend',
    topMenu = 'topMenu',
    turnOff = 'turnOff',
    turnOn = 'turnOn',
    up = 'up',
    volumeDown = 'volumeDown',
    volumeUp = 'volumeUp',
    wakeup = 'wakeup',
}

export enum NodePyATVListenerState {
    stopped,
    starting,
    started,
    stopping,
}

export enum NodePyATVMediaType {
    music = 'music',
    tv = 'tv',
    unknown = 'unknown',
    video = 'video',
}

export enum NodePyATVPowerState {
    off = 'off',
    on = 'on',
}

export enum NodePyATVProtocol {
    airplay = 'airplay',
    dmap = 'dmap',
    mdns = 'mdns',
    mrp = 'mrp',
}

export enum NodePyATVRepeatState {
    all = 'all',
    off = 'off',
    track = 'track',
}

export enum NodePyATVShuffleState {
    albums = 'albums',
    off = 'off',
    songs = 'songs',
}

export interface NodePyATVApp {
    id: string;
    launch: () => Promise<void>;
    name: string;
}

export interface NodePyATVDeviceOptions
    extends NodePyATVFindAndInstanceOptions {
    allIDs?: string[];
    host?: string;
    mac?: string;
    model?: string;
    modelName?: string;
    name: string;
    os?: string;
    services?: NodePyATVService[];
    version?: string;
}

export type NodePyATVEventValueType =
    | NodePyATVDeviceState
    | NodePyATVMediaType
    | NodePyATVRepeatState
    | NodePyATVShuffleState
    | number
    | string;

export interface NodePyATVFindAndInstanceOptions
    extends NodePyATVFindOptions,
        NodePyATVInstanceOptions {}

export interface NodePyATVFindOptions {
    airplayCredentials?: string;
    companionCredentials?: string;
    dmapCredentials?: string;
    host?: string;
    hosts?: string[];
    id?: string;
    mrpCredentials?: string;
    protocol?: NodePyATVProtocol;
    raopCredentials?: string;
}

export interface NodePyATVFindResponseObject {
    devices: NodePyATVDevice[];
    errors: Record<string, unknown>[];
}

export interface NodePyATVGetStateOptions {
    maxAge?: number;
}

export interface NodePyATVInstanceOptions {
    atvremotePath?: string;
    atvscriptPath?: string;
    debug?: ((msg: string) => void) | true;
    noColors?: true;
    spawn?: (
        command: string,
        args: Array<string>,
        options: SpawnOptions,
    ) => ChildProcess | FakeChildProcess;
}

/**
 * @internal
 */
export interface NodePyATVInternalScanDevice {
    address: string;
    all_identifiers: string[];
    device_info?: {
        mac: null | string;
        model: string;
        model_str: string;
        operating_system: string;
        version: string;
    };
    identifier: string;
    name: string;
    services?: NodePyATVService[];
}

/**
 * @internal
 */
export interface NodePyATVInternalState {
    album?: string | unknown;
    app?: string | unknown;
    app_id?: string | unknown;
    artist?: string | unknown;
    connection?: string | unknown;
    content_identifier?: null | string;
    datetime?: string | unknown;
    device_state?: string | unknown;
    episode_number?: null | number;
    exception?: string | unknown;
    focus_state?: string | unknown;
    genre?: string | unknown;
    hash?: string | unknown;
    itunes_store_identifier?: null | number;
    media_type?: string | unknown;
    output_devices?: Array<{ identifier: string; name: string }> | null;
    position?: 1 | unknown;
    power_state?: string | unknown;
    push_updates?: string | unknown;
    repeat?: string | unknown;
    result?: string | unknown;
    season_number?: null | number;
    series_name?: null | string;
    shuffle?: string | unknown;
    stacktrace?: string | unknown;
    title?: string | unknown;
    total_time?: number | unknown;
    volume?: number | unknown;
}

export interface NodePyATVRequestOptions extends NodePyATVInstanceOptions {
    allowMultipleResponses?: boolean;
}

export interface NodePyATVService {
    port: number;
    protocol: NodePyATVProtocol;
}

export interface NodePyATVState {
    album: null | string;
    app: null | string;
    appId: null | string;
    artist: null | string;
    contentIdentifier: null | string;
    dateTime: Date | null;
    deviceState: NodePyATVDeviceState | null;
    episodeNumber: null | number;
    focusState: NodePyATVFocusState | null;
    genre: null | string;
    hash: null | string;
    iTunesStoreIdentifier: null | number;
    mediaType: NodePyATVMediaType | null;
    outputDevices: Array<{ identifier: string; name: string }> | null;
    position: null | number;
    powerState: NodePyATVPowerState | null;
    repeat: NodePyATVRepeatState | null;
    seasonNumber: null | number;
    seriesName: null | string;
    shuffle: NodePyATVShuffleState | null;
    title: null | string;
    totalTime: null | number;
    volume: null | number;
}

export type NodePyATVStateIndex = keyof NodePyATVState;

export interface NodePyATVVersionResponse {
    module: null | string;
    pyatv: null | string;
}
