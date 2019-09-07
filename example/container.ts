
import { Container } from '../index';

import { createServiceA, createServiceB } from './service';
import { IContainer } from './interfaces';

const container = new Container<IContainer>({
	ServiceB: createServiceB,
	ServiceA: createServiceA,
});


container.load()
	.then(() => {
		console.log(container.use('ServiceA').foo());
	});
