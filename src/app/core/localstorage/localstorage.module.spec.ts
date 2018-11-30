import { LocalStorageModule } from './localstorage.module';

describe('LocalStorageModule', () => {
  let localStorageModule: LocalStorageModule;

  beforeEach(() => {
    localStorageModule = new LocalStorageModule();
  });

  it('should create an instance', () => {
    expect(localStorageModule).toBeTruthy();
  });
});
