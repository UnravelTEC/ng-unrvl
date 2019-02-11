import { VocModule } from './voc.module';

describe('VocModule', () => {
  let vocModule: VocModule;

  beforeEach(() => {
    vocModule = new VocModule();
  });

  it('should create an instance', () => {
    expect(vocModule).toBeTruthy();
  });
});
