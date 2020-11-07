import {ChildProcess, SpawnOptions} from 'child_process';
import {MockChildProcess} from 'spawn-mock';

export enum NodePyATVRequestType {
    ATVREMOTE,
    ATVSCRIPT
}

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


export interface NodePyATVInstanceOptions {
    atvremotePath?: string;
    atvscriptPath?: string;
    debug?: true | ((msg: string) => void);
    noColors?: true;
    spawn?: (command: string, args: Array<string>, options: SpawnOptions) => (ChildProcess | MockChildProcess);
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
}

export interface NodePyATVFindAndInstanceOptions extends NodePyATVInstanceOptions, NodePyATVFindOptions {

}

export interface NodePyATVDeviceOptions extends NodePyATVInstanceOptions, NodePyATVFindOptions {
    host: string;
    name: string;
}

export interface NodePyATVGetStatusOptions {
    maxAge?: number;
}
