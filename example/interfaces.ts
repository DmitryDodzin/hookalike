
export interface IServiceA {
	foo(): string;
}

export interface IServiceB {
	bar(): string;
}

export interface IContainer {
	ServiceA: IServiceA;
	ServiceB: IServiceB;
}