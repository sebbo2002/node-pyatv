import {SpawnOptions} from 'child_process';
import {EventEmitter} from 'events';

export function createFakeSpawn(callback: ((cp: FakeChildProcessController) => void)): (
    command: string,
    args: ReadonlyArray<string>,
    options: SpawnOptions
) => FakeChildProcess {
    return (command: string, args: ReadonlyArray<string>, options: SpawnOptions) => new FakeChildProcess(
        command,
        args,
        options,
        callback
    );
}

export class FakeChildProcessStdIn extends EventEmitter {
    write (data: string) {
        this.emit('data', Buffer.from(data));
    }
}

export class FakeChildProcess extends EventEmitter {
    cmd: string;
    args: ReadonlyArray<string>;
    timeout: NodeJS.Timeout | undefined;
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: FakeChildProcessStdIn;

    constructor(command: string, args: ReadonlyArray<string>, options: SpawnOptions, callback: (cp: FakeChildProcessController) => void) {
        super();

        this.cmd = command;
        this.args = args;
        this.timeout = setTimeout(() => {
            console.error(new Error(`FakeSpawn: Timeout for ${this.cmd} ${this.args.join(' ')}!`));
        }, 5000);

        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
        this.stdin = new FakeChildProcessStdIn();

        const controller = new FakeChildProcessController(this);
        setTimeout(() => callback(controller), 0);
    }
}

export class FakeChildProcessController {
    _cp: FakeChildProcess;
    _code: number | null;

    constructor(cp: FakeChildProcess) {
        this._cp = cp;
        this._code = null;
    }

    cmd(): string {
        return this._cp.cmd;
    }

    stdout(content: string | Record<string, unknown>): this {
        this._cp.stdout.emit('data', typeof content === 'string' ? content : JSON.stringify(content));
        return this;
    }

    stderr(content: string): this {
        this._cp.stderr.emit('data', content);
        return this;
    }

    // eslint-disable-next-line
    onStdIn(listener: (...args: any[]) => void): this {
        this._cp.stdin.on('data', listener);
        return this;
    }

    error(error: Error): this {
        this._cp.emit('error', error);
        return this;
    }

    code(exitCode: number): this {
        this._code = exitCode;
        return this;
    }

    end(content?: string | Record<string, unknown>): this {
        if (content !== undefined) {
            this.stdout(content);
        }

        this._cp.emit('close', this._code || 0);
        if(this._cp.timeout !== undefined) {
            clearTimeout(this._cp.timeout);
            this._cp.timeout = undefined;
        }

        return this;
    }
}
