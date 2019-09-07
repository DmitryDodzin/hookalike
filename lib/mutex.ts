import { IMutex, IContainer, GlobalMutex } from './interfaces';

export class UnintializedMutexError extends Error {
	static code = 'hl-um';
	code = UnintializedMutexError.code;
}

export class Mutex<T> implements IMutex<T> {
	private state: T | undefined;

	constructor(value?: T) {
		this.state = value;
	}

	get current(): T {
		if (typeof this.state === 'undefined') 
			throw new UnintializedMutexError('Mutex uninitialized');

		return this.state;
	}

	set current(value) {
		this.state = value;
	}

	clear() {
		this.state = undefined;
	}
}

export const __global = new Mutex<GlobalMutex>();
