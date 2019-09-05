
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
	});

	await container.load();

	expect(container.use('foo')).toHaveProperty('bar', 'bar');
	expect(container.use('baz')).toHaveProperty('bal', 'bar2');
});