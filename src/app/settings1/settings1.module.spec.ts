import { Settings1Module } from './settings1.module';

describe('Settings1Module', () => {
  let settings1Module: Settings1Module;

  beforeEach(() => {
    settings1Module = new Settings1Module();
  });

  it('should create an instance', () => {
    expect(settings1Module).toBeTruthy();
  });
});
