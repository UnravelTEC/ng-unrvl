import { PressureGraphModule } from './pressure-graph.module';

describe('PressureGraphModule', () => {
  let pressureGraphModule: PressureGraphModule;

  beforeEach(() => {
    pressureGraphModule = new PressureGraphModule();
  });

  it('should create an instance', () => {
    expect(pressureGraphModule).toBeTruthy();
  });
});
