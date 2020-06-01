import { TestBed } from '@angular/core/testing';

import { LiteComService } from './lite-com.service';

describe('LiteComService', () => {
  let service: LiteComService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiteComService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
