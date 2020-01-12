
import { UnintializedMutexError } from '../mutex';
import { Container, typed } from '../container';
import { IContainer } from '../interfaces';

test('basic', async () => {
	type Deps = {
		foo: { bar: string };
		baz: { bal: string };
	}

	const { use } = typed<Deps>();

	const container: IContainer<Deps> = new Container<Deps>({
		foo: () => ({ bar: 'bar' }),
		baz: async () => {
			const foo = use('foo');
			return { bal: foo.bar + '2' };
		}
	}, { baz: ['foo'] });

	await container.load();

	expect(container.use('foo')).toHaveProperty('bar', 'bar');
	expect(container.use('baz')).toHaveProperty('bal', 'bar2');
});

test('deep', async () => {
	type Deps = {
		foo: { bar: string };
		bar: { baz: string };
		baz: { bal: string };
	};

	const { use, register } = typed<Deps>();

	const container: IContainer<Deps> = new Container<Deps>({
		bar: register<'bar'>(() => ({ baz: use('foo').bar }), ['foo']),
		baz: async () => ({ bal: use('bar').baz + '2' }),
		foo: register(register<'foo'>(() => ({ bar: 'bar' }), [])),
	}, { baz: ['bar'] });

	await container.load();

	expect(container.use('foo')).toHaveProperty('bar', 'bar');
	expect(container.use('baz')).toHaveProperty('bal', 'bar2');
});

test('deep2', async () => {
	type Deps = {
		foo: string;
		bar: string;
		baz: string;
		foo2: string;
		bar2: string;
		baz2: string;
	};

	const { use, register } = typed<Deps>();

	const container: IContainer<Deps> = new Container<Deps>({
		foo: () => 'foo',
		bar: () => use('foo'),
		baz: () => use('bar'),
		foo2: () => use('bar2') + use('baz2'),
		bar2: () => use('bar'),
		baz2: () => use('baz'),
	}, { 
		bar: ['foo'],
		baz: ['bar'],
		foo2: ['bar2', 'baz2'],
		bar2: ['bar'],
		baz2: ['baz'],
	});

	await container.load();

	expect(container.use('baz')).toEqual('foo');
	expect(container.use('foo2')).toEqual('foofoo');
});

test('multiple', async () => {
	type Deps = {
		foo: { bar: string };
		baz: { bal: string };
	}

	const { use } = typed<Deps>();

	const container: IContainer<Deps> = new Container<Deps>({
		foo: () => ({ bar: 'bar' }),
		baz: async () => {
			const foo = use('foo');
			return { bal: foo.bar + '2' };
		}
	}, { baz: ['foo'] });

	const container2: IContainer<Deps> = new Container<Deps>({
		foo: () => ({ bar: 'bar2' }),
		baz: async () => {
			const foo = use('foo');
			return { bal: foo.bar + '2' };
		}
	}, { baz: ['foo'] });

	await Promise.all([
		container.load(),
		container2.load()
	]);

	expect(container.use('foo')).toHaveProperty('bar', 'bar');
	expect(container.use('baz')).toHaveProperty('bal', 'bar2');
});

test('use error out of context', () => {
	type Deps = {
		foo: string;
	};

	const { use } = typed<Deps>();

	expect(() => use('foo')).toThrow('Global Mutex uninitialized');
});


test('use error not in ready', () => {
	type Deps = {
		foo: string;
	};

	const container = new Container<Deps>({
		foo: () => 'bar',
	});

	expect(() => container.use('foo')).toThrow('Cannot load foo mutex not created, call container.init to create the context');
});