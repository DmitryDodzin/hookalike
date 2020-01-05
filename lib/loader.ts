
import { __global } from './mutex';
import { ILoader } from './interfaces';

export type CreatorFn<T> = () => T | Promise<T>;

export class Loader<T, U extends keyof T = keyof T> implements ILoader<T, U> {

	private readonly _creator: CreatorFn<T[U]>;

	private readonly _requirements: Omit<keyof T, U>[];

	constructor(creator: CreatorFn<T[U]>, requirements?: Omit<keyof T, U>[]) {
		this._creator = creator;
		this._requirements = requirements || [];
	}

	get requirements() {
		return this._requirements;
	}

	async load(name, container) {
		__global.current = { name, container };
		const value = await this._creator();
		__global.clear();

		return value;
	}
}

export const register = <T extends {}, U extends keyof T = keyof T>(creator: CreatorFn<T[U]> | ILoader<T, U>, deps?: Omit<keyof T, U>[]): ILoader<T, U> =>  typeof creator === 'function' ? new Loader<T, U>(creator, deps) : creator;
