import { NoirModule } from './noir.module';

describe('NoirModule', () => {
  let noirModule: NoirModule;

  beforeEach(() => {
    noirModule = new NoirModule();
  });

  it('should create an instance', () => {
    expect(noirModule).toBeTruthy();
  });
});
