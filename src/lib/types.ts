import {ChildProcess, SpawnOptions} from 'child_process';
import {FakeChildProcess} from './fake-spawn';

export enum NodePyATVExecutableType {
    atvremote = 'atvremote',
    atvscript = 'atvscript',
}

export enum NodePyATVProtocol {
    dmap = 'dmap',
    mrp = 'mrp',
    airplay = 'airplay',
    mdns = 'mdns',
}

export enum NodePyATVMediaType {
    music = 'music',
    tv = 'tv',
    video = 'video',
    unknown = 'unknown'
}

export enum NodePyATVDeviceState {
    idle = 'idle',
    loading = 'loading',
    paused = 'paused',
    playing = 'playing',
    seeking = 'seeking',
    stopped = 'stopped'
}

export enum NodePyATVRepeatState {
    all = 'all',
    track = 'track',
    off = 'off'
}

export enum NodePyATVShuffleState {
    albums = 'albums',
    songs = 'songs',
    off = 'off'
}

export enum NodePyATVPowerState {
    on = 'on',
    off = 'off'
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
    up = 'up',
    volumeDown = 'volumeDown',
    volumeUp = 'volumeUp',
    wakeup = 'wakeup'
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
    up = 'up',
    volumeDown = 'volume_down',
    volumeUp = 'volume_up',
    wakeup = 'wakeup',
    turnOff = 'turn_off',
    turnOn = 'turn_on'
}

export enum NodePyATVListenerState {
    stopped,
    starting,
    started,
    stopping
}


export type NodePyATVStateIndex = keyof NodePyATVState;

export type NodePyATVEventValueType = (string | number | NodePyATVMediaType | NodePyATVDeviceState |
    NodePyATVShuffleState | NodePyATVRepeatState);


export interface NodePyATVInstanceOptions {
    atvremotePath?: string;
    atvscriptPath?: string;
    debug?: true | ((msg: string) => void);
    noColors?: true;
    spawn?: (command: string, args: Array<string>, options: SpawnOptions) => (ChildProcess | FakeChildProcess);
}

export interface NodePyATVVersionResponse {
    pyatv: string | null;
    module: string | null;
}

export interface NodePyATVFindOptions {
    host?: string;
    hosts?: string[];
    id?: string;
    protocol?: NodePyATVProtocol;
    dmapCredentials?: string;
    mrpCredentials?: string;
    airplayCredentials?: string;
    companionCredentials?: string;
    raopCredentials?: string;
}

export interface NodePyATVFindAndInstanceOptions extends NodePyATVInstanceOptions, NodePyATVFindOptions {

}

export interface NodePyATVDeviceOptions extends NodePyATVFindAndInstanceOptions {
    host: string;
    name: string;
}

export interface NodePyATVGetStateOptions {
    maxAge?: number;
}

/**
 * @internal
 */
export interface NodePyATVInternalState {
    result?: string | unknown,
    datetime?: string | unknown,
    hash?: string | unknown,
    media_type?: string | unknown,
    device_state?: string | unknown,
    title?: string | unknown,
    artist?: string | unknown,
    album?: string | unknown,
    genre?: string | unknown,
    total_time?: number | unknown,
    position?: 1 | unknown,
    shuffle?: string | unknown,
    repeat?: string | unknown,
    app?: string | unknown,
    app_id?: string | unknown,
    power_state?: string | unknown,
    push_updates?: string | unknown,
    exception?: string | unknown,
    stacktrace?: string | unknown,
    connection?: string | unknown
}

export interface NodePyATVState {
    dateTime: Date | null;
    hash: string | null;
    mediaType: NodePyATVMediaType | null,
    deviceState: NodePyATVDeviceState | null,
    title: string | null,
    artist: string | null,
    album: string | null,
    genre: string | null,
    totalTime: number | null,
    position: number | null,
    shuffle: NodePyATVShuffleState | null,
    repeat: NodePyATVRepeatState | null,
    app: string | null,
    appId: string | null,
    powerState: NodePyATVPowerState | null
}
