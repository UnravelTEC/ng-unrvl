import { Sps30Module } from './sps30.module';

describe('Sps30Module', () => {
  let sps30Module: Sps30Module;

  beforeEach(() => {
    sps30Module = new Sps30Module();
  });

  it('should create an instance', () => {
    expect(sps30Module).toBeTruthy();
  });
});
