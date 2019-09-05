
import { register, CreatorFn } from './loader';
import { ILoader, IMutex, IContainer } from './interfaces';
import { __global, Mutex, UnintializedMutexError } from './mutex';

type Scaffold<T, U extends keyof T> = Record<U, ILoader<T, U>>;

const __loader_lock: { current: IContainer<unknown> | null } = { current: null };

export class Container<T> implements IContainer<T> {

	private state: IMutex<T>;

	private scaffold: Scaffold<T, keyof T>;

	constructor(assemble: Record<keyof T, CreatorFn<T[keyof T]> | ILoader<T, keyof T>>) {
		this.state = new Mutex();
		this.scaffold = Object.keys(assemble).reduce((acc, k) => ({ ...acc, [k]: register(assemble[k]) }), {}) as Scaffold<T, keyof T>;
	}

	async load() {
		if (__loader_lock.current)
			throw new Error('Cannot load serveral containers in parallel');

		__loader_lock.current = this;

		const temporary: Partial<T> = {};
			
		for (const [key, loader] of Object.entries<ILoader<T, keyof T>>(this.scaffold)) {
			temporary[key] = await loader.load(key as keyof T, this);

			this.state.current = temporary as T;
		}

		__loader_lock.current = null;
	}

	get cradle(): T {
		return this.state.current;
	}

	use<K extends keyof T>(name: K): T[K] {
		return this.cradle[name];
	}
}

export const use = <T>(name: string): T => {
	const { name: useKey, container } = __global.current;
	try {
		return container.use(name);
	} catch (e) {
		if (e instanceof UnintializedMutexError) {
			throw new UnintializedMutexError(`Reorder deps, failed to get '${name}' in '${useKey}'`);
		}
		throw e;
	}
}

export const typed = <T>() => ({
	use: <U extends keyof T>(name: U): T[U] => use(name as string),
	register: <U extends keyof T>(creator: CreatorFn<T[U]> | ILoader<T, U>, deps?: Omit<keyof T, U>[]): ILoader<T, U> => register<T, U>(creator, deps)
})