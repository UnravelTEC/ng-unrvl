import { AdcModule } from './adc.module';

describe('AdcModule', () => {
  let adcModule: AdcModule;

  beforeEach(() => {
    adcModule = new AdcModule();
  });

  it('should create an instance', () => {
    expect(adcModule).toBeTruthy();
  });
});
