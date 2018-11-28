import { DygraphDevModule } from './dygraph-dev.module';
import { DygraphDevComponent } from './dygraph-dev.component';

describe('DygraphDevModule', () => {
  let dygraphDevModule: DygraphDevModule;

  beforeEach(() => {
    dygraphDevModule = new DygraphDevModule();
  });

  it('should create an instance', () => {
    expect(dygraphDevModule).toBeTruthy();
  });
});
