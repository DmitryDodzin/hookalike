
import { __global } from './mutex';
import { ILoader } from './interfaces';

export type CreatorFn<T> = () => T | Promise<T>;

export class Loader<T, U extends keyof T = keyof T> implements ILoader<T, U> {

	private creator: CreatorFn<T[U]>;

	constructor(creator: CreatorFn<T[U]>) {
		this.creator = creator;
	}

	async load(name, container) {
		__global.current = { name, container };
		const value = await this.creator();
		__global.clear();

		return value;
	}
}

export const register = <T extends {}, U extends keyof T = keyof T>(creator: CreatorFn<T[U]> | ILoader<T, U>) =>  typeof creator === 'function' ? new Loader<T, U>(creator) : creator;
