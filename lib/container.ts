
import { register, CreatorFn } from './loader';
import { ILoader, IMutex, IContainer } from './interfaces';
import { __global, Mutex, UnintializedMutexError } from './mutex';

type Scaffold<T, U extends keyof T = keyof T> = Record<U, ILoader<T, U>>;

const __loader_lock: { current: IContainer<any> | null } = { current: null };

export class Container<T extends {}, U extends keyof T = keyof T> implements IContainer<T, U> {

	private state: IMutex<T>;

	private scaffold: Scaffold<T, U>;

	constructor(assemble: Record<U, CreatorFn<T[U]>>) {
		this.state = new Mutex();
		this.scaffold = Object.keys(assemble).reduce((acc, k) => ({ ...acc, [k]: register<T, U>(assemble[k]) }), {}) as Scaffold<T, U>;
	}

	async load() {
		if (__loader_lock.current)
			throw new Error('Cannot load serveral containers in parallel');

		__loader_lock.current = this;

		const temporary: Partial<T> = {};
			
		for (const [key, loader] of Object.entries<ILoader<T, U>>(this.scaffold)) {
			temporary[key] = await loader.load(key as U, this);

			this.state.current = temporary as T;
		}

		__loader_lock.current = null;
	}

	get cradle(): T {
		return this.state.current;
	}

	use(name: U): T[U] {
		return this.cradle[name];
	}
}

export const use = <T extends {}, U extends keyof T = keyof T>(name: U): T[U] => {
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