import { UtSettingsModule } from './ut-settings.module';

describe('UtSettingsModule', () => {
  let utSettingsModule: UtSettingsModule;

  beforeEach(() => {
    utSettingsModule = new UtSettingsModule();
  });

  it('should create an instance', () => {
    expect(utSettingsModule).toBeTruthy();
  });
});
