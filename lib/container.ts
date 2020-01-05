
import { register, CreatorFn } from './loader';
import { ILoader, IMutex, ILocked, IContainer } from './interfaces';
import { __global, Mutex, Locked, UnintializedMutexError } from './mutex';

type Scaffold<T, U extends keyof T> = Record<U, ILoader<T, U>>;

const __loader_lock: ILocked<typeof __global> = new Locked(__global);

const deepIncludes = <T, U extends keyof T>(scaffold: Scaffold<T, U>, source: U, target: U, checked: Set<U> = new Set()): boolean => {	
	const newDeps = scaffold[target].requirements.filter(dep => !checked.has(dep as U)) as U[];

	if(newDeps.length > 0) {
		return newDeps.includes(source) || newDeps.some(dep => deepIncludes(scaffold, source, dep as U, new Set(Array.from(checked).concat(newDeps))));
	}

	return false;
}

export class Container<T> implements IContainer<T> {

	private _state: IMutex<T>;

	private _scaffold: Scaffold<T, keyof T>;

	constructor(assemble: Record<keyof T, CreatorFn<T[keyof T]> | ILoader<T, keyof T>>, requirements: { [P in keyof T]?: Omit<keyof T, P>[] } = {}) {
		this._state = new Mutex();
		this._scaffold = Object.keys(assemble).reduce((acc, k) => ({ ...acc, [k]: typeof assemble[k] === 'function' ? register(assemble[k], requirements[k]) : assemble[k] }), {}) as Scaffold<T, keyof T>;
	}

	async load() {
		const [, lock] = await __loader_lock.lock();

		try {
			const temporary: Partial<T> = {};

			const toLoad = Object.keys(this._scaffold)
				.sort((keyA, keyB) => {
					if(deepIncludes(this._scaffold, keyA as keyof T, keyB as keyof T)){
						return -1;
					}

					if(deepIncludes(this._scaffold, keyB as keyof T, keyA as keyof T)) {
						return 1;
					}
					return 0; 
				});
				
			for (const key of toLoad) {
				temporary[key] = await this._scaffold[key].load(key as keyof T, this);

				this._state.current = temporary as T;
			}
		} finally {
			lock.release();
		}
	}

	get cradle(): T {
		return this._state.current;
	}

	use<K extends keyof T>(name: K): T[K] {
		try {
			return this.cradle[name];
		} catch (e) {
			if (e.code === UnintializedMutexError.code) {
				throw new UnintializedMutexError(`Cannot load ${name} mutex not created, call container.init to create the context`);
			}
			throw e;
		}
	}
}

export const use = <T>(name: string): T => {
	const { name: useKey, container } = __global.current;
	try {
		return container.use(name);
	} catch (e) {
		if (e.code === UnintializedMutexError.code) {
			throw new UnintializedMutexError(`Reorder requirements, failed to get '${name}' in '${useKey}'`);
		}
		throw e;
	}
}

export const typed = <T>() => ({
	use: <U extends keyof T>(name: U): T[U] => use(name as string),
	register: <U extends keyof T>(creator: CreatorFn<T[U]> | ILoader<T, U>, requirements?: Omit<keyof T, U>[]): ILoader<T, U> => register<T, U>(creator, requirements)
})