import { UtDashboardModule } from './ut-dashboard.module';

describe('UtDashboardModule', () => {
  let utDashboardModule: UtDashboardModule;

  beforeEach(() => {
    utDashboardModule = new UtDashboardModule();
  });

  it('should create an instance', () => {
    expect(utDashboardModule).toBeTruthy();
  });
});
