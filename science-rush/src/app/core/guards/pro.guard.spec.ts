import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { proGuard } from './pro.guard';

describe('proGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => proGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
