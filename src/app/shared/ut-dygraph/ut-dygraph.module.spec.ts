import { UtDygraphModule } from './ut-dygraph.module';

describe('UtDygraphModule', () => {
  let utDygraphModule: UtDygraphModule;

  beforeEach(() => {
    utDygraphModule = new UtDygraphModule();
  });

  it('should create an instance', () => {
    expect(utDygraphModule).toBeTruthy();
  });
});
