import { TestBed, inject } from '@angular/core/testing';

import { UtFetchdataService } from './ut-fetchdata.service';

describe('UtFetchdataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UtFetchdataService]
    });
  });

  it('should be created', inject([UtFetchdataService], (service: UtFetchdataService) => {
    expect(service).toBeTruthy();
  }));
});
