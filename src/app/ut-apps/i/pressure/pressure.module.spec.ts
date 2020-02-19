import { PressureModule } from './pressure.module';

describe('PressureModule', () => {
  let pressureModule: PressureModule;

  beforeEach(() => {
    pressureModule = new PressureModule();
  });

  it('should create an instance', () => {
    expect(pressureModule).toBeTruthy();
  });
});
