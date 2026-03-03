import { TestBed } from '@angular/core/testing';

import { IshaaV2Service } from './ishaa-v2.service';

describe('IshaaV2Service', () => {
  let service: IshaaV2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IshaaV2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
