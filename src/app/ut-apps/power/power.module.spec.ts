import { PowerModule } from './power.module';

describe('PowerModule', () => {
  let powerModule: PowerModule;

  beforeEach(() => {
    powerModule = new PowerModule();
  });

  it('should create an instance', () => {
    expect(powerModule).toBeTruthy();
  });
});
