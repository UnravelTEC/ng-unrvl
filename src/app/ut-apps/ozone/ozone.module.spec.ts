import { OzoneModule } from './ozone.module';

describe('OzoneModule', () => {
  let ozoneModule: OzoneModule;

  beforeEach(() => {
    ozoneModule = new OzoneModule();
  });

  it('should create an instance', () => {
    expect(ozoneModule).toBeTruthy();
  });
});
