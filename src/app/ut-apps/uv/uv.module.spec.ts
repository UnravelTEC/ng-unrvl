import { UvModule } from './uv.module';

describe('UvModule', () => {
  let uvModule: UvModule;

  beforeEach(() => {
    uvModule = new UvModule();
  });

  it('should create an instance', () => {
    expect(uvModule).toBeTruthy();
  });
});
