
import { typed } from '../index';
import { IContainer, IServiceA, IServiceB } from './interfaces';

const { use } = typed<IContainer>();

export const createServiceA = (): IServiceA => {

	const serviceB = use('ServiceB');

	return {
		foo: () => serviceB.bar() + '2000',
	};
}


export const createServiceB = async (): Promise<IServiceB> => {
	return {
		bar: () => 'baz'
	};
}