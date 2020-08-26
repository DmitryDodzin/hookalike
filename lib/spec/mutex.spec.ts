import { Mutex } from '../mutex';

describe('mutex', () => {
  
  it('init', () => {
    const mutex = new Mutex<null>();
    
    expect(mutex).toBeDefined();
  });
  
});
