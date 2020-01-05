
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
	}

	const { use, register } = typed<Deps>();

	const container: IContainer<Deps> = new Container<Deps>({
		bar: register<'bar'>(() => ({ baz: use('foo').bar }), ['foo']),
		baz: async () => ({ bal: use('bar').baz + '2' }),
		foo: register<'foo'>(() => ({ bar: 'bar' }), []),
	}, { baz: ['bar'] });

	await container.load();

	expect(container.use('foo')).toHaveProperty('bar', 'bar');
	expect(container.use('baz')).toHaveProperty('bal', 'bar2');
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