import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-premium-lock',
  templateUrl: './premium-lock.component.html',
  styleUrls: ['./premium-lock.component.scss'],
  standalone: false
})
export class PremiumLockComponent implements OnInit {
  
  @Input() locked: boolean | null = null; 
  @Input() title = 'Premium Feature';
  @Output() unlock = new EventEmitter<void>();

  constructor(public auth: AuthService) {} 

  ngOnInit() {
    // Auto-check logic
    if (this.locked === null) {
      this.auth.isPro$.subscribe(isPro => {
        this.locked = !isPro; 
      });
    }
  }

  onUnlock() {
    console.log('Unlock button clicked!'); // Check your console to verify
    this.unlock.emit();
  }
}