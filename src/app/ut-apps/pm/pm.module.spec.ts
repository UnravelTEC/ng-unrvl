import { PmModule } from './pm.module';

describe('PmModule', () => {
  let pmModule: PmModule;

  beforeEach(() => {
    pmModule = new PmModule();
  });

  it('should create an instance', () => {
    expect(pmModule).toBeTruthy();
  });
});
