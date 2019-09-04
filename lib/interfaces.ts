

export interface IContainer<T extends {}, U extends keyof T = keyof T> {

	load(): Promise<void>;

	use(name: U): T[U];
}

export interface IMutex<T> {
	current: T;

	clear(): void;
}

export interface ILoader<T extends {}, U extends keyof T = keyof T> {
	load(name: U, container: IContainer<T>): Promise<T[U]>;
}

export type GlobalMutex = { name: string; container: IContainer<any> }