import { WeihnachtsvorlesungModule } from './weihnachtsvorlesung.module';

describe('WeihnachtsvorlesungModule', () => {
  let weihnachtsvorlesungModule: WeihnachtsvorlesungModule;

  beforeEach(() => {
    weihnachtsvorlesungModule = new WeihnachtsvorlesungModule();
  });

  it('should create an instance', () => {
    expect(weihnachtsvorlesungModule).toBeTruthy();
  });
});
