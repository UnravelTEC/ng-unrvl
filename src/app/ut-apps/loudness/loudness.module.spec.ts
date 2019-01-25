import { LoudnessModule } from './loudness.module';

describe('LoudnessModule', () => {
  let loudnessModule: LoudnessModule;

  beforeEach(() => {
    loudnessModule = new LoudnessModule();
  });

  it('should create an instance', () => {
    expect(loudnessModule).toBeTruthy();
  });
});
