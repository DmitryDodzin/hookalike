

export interface IContainer<T> {

	load(): Promise<void>;

	use<U extends keyof T>(name: U): T[U];
}

export interface IMutex<T> {
	current: T;

	clear(): void;
}

export interface ILoader<T, U extends keyof T = keyof T> {
	load(name: U, container: IContainer<T>): Promise<T[U]>;
}

export type GlobalMutex = { name: string; container: IContainer<any> }