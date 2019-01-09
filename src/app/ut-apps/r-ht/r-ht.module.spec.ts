import { RHTModule } from './r-ht.module';

describe('RHTModule', () => {
  let rHTModule: RHTModule;

  beforeEach(() => {
    rHTModule = new RHTModule();
  });

  it('should create an instance', () => {
    expect(rHTModule).toBeTruthy();
  });
});
