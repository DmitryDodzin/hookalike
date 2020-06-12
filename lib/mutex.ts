import { EventEmitter } from 'events';
import type { IMutex, ILocked, IContainer, GlobalMutex, OwnedResouce } from './interfaces';

export class UnintializedMutexError extends Error {
	static code = 'hl-um';
	public code: string;

	constructor(message: string) {
		super(message);
		this.code = UnintializedMutexError.code;
	}
}

export class Mutex<T> implements IMutex<T> {
	private state: T | undefined;

	constructor(value?: T) {
		this.state = value;
	}

	get current(): T {
		if (typeof this.state === 'undefined') {
			throw new UnintializedMutexError('Mutex uninitialized');
		}

		return this.state;
	}

	set current(value) {
		this.state = value;
	}

	clear() {
		this.state = undefined;
	}
}

export class Locked<T> implements ILocked<T> {
	private value: T;
	private locker: Mutex<Promise<null> | null>;
	private events: EventEmitter;

	constructor(mutex: T){
		this.value = mutex;
		this.locker = new Mutex(null);
		this.events = new EventEmitter();
	}

	async lock(): Promise<OwnedResouce<T>> {
		while(this.locker.current) {
			await this.locker.current;
		}

		this.locker.current = new Promise((resolve, reject) => {
			this.events.on('release', () => {
				this.locker.current = null;
				resolve(null);
			});
		});

		return [this.value, { release: () => this.events.emit('release') }];
	}
}

export const __global = new Mutex<GlobalMutex>();
