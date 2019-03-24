import { TemperaturesModule } from './temperatures.module';

describe('TemperaturesModule', () => {
  let temperaturesModule: TemperaturesModule;

  beforeEach(() => {
    temperaturesModule = new TemperaturesModule();
  });

  it('should create an instance', () => {
    expect(temperaturesModule).toBeTruthy();
  });
});
