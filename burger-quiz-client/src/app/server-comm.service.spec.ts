import { TestBed } from '@angular/core/testing';

import { ServerCommService } from './server-comm.service';

describe('ServerCommService', () => {
  let service: ServerCommService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerCommService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
