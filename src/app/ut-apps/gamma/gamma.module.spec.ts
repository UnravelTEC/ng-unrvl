import { GammaModule } from './gamma.module';

describe('GammaModule', () => {
  let gammaModule: GammaModule;

  beforeEach(() => {
    gammaModule = new GammaModule();
  });

  it('should create an instance', () => {
    expect(gammaModule).toBeTruthy();
  });
});
