import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiService {
  // 1. Manage the Upgrade Modal State globally
  private showUpgradeModalSubject = new BehaviorSubject<boolean>(false);
  showUpgradeModal$ = this.showUpgradeModalSubject.asObservable();

  openUpgradeModal() {
    this.showUpgradeModalSubject.next(true);
  }

  closeUpgradeModal() {
    this.showUpgradeModalSubject.next(false);
  }
}