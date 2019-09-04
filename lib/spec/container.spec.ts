
import { register } from '../loader';
import { Container, use } from '../container';

test('basic', async () => {
	type Deps = {
		foo: string;
		baz: string;
	}

	const container = new Container<Deps>({
		foo: () => 'bar',
		baz: async () => use<Deps>('foo') + '2',
	});

	await container.load();

	expect(container.use('foo')).toBe('bar');
	expect(container.use('baz')).toBe('bar2');
});