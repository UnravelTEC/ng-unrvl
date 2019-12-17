import { VifModule } from './vif.module';

describe('VifModule', () => {
  let vifModule: VifModule;

  beforeEach(() => {
    vifModule = new VifModule();
  });

  it('should create an instance', () => {
    expect(vifModule).toBeTruthy();
  });
});
