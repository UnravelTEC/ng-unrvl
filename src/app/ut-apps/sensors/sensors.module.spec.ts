import { SensorsModule } from './sensors.module';

describe('SensorsModule', () => {
  let sensorsModule: SensorsModule;

  beforeEach(() => {
    sensorsModule = new SensorsModule();
  });

  it('should create an instance', () => {
    expect(sensorsModule).toBeTruthy();
  });
});
