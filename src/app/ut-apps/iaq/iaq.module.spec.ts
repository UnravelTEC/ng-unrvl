import { IaqModule } from './iaq.module';

describe('IaqModule', () => {
  let iaqModule: IaqModule;

  beforeEach(() => {
    iaqModule = new IaqModule();
  });

  it('should create an instance', () => {
    expect(iaqModule).toBeTruthy();
  });
});
