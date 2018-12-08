import { TestBed, inject } from '@angular/core/testing';

import { HelperFunctionsService } from './helper-functions.service';

describe('HelperFunctionsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HelperFunctionsService]
    });
  });

  it('should be created', inject([HelperFunctionsService], (service: HelperFunctionsService) => {
    expect(service).toBeTruthy();
  }));
});
