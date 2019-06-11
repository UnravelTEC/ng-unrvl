import { Scd30Module } from './scd30.module';

describe('Scd30Module', () => {
  let scd30Module: Scd30Module;

  beforeEach(() => {
    scd30Module = new Scd30Module();
  });

  it('should create an instance', () => {
    expect(scd30Module).toBeTruthy();
  });
});
