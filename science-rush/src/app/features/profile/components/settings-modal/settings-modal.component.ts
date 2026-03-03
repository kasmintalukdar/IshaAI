import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() openEdit = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  constructor(private router: Router) {}

  // 🟢 Navigate to the feedback page
  navigateToFeedback() {
    this.close.emit(); // Close modal first
    this.router.navigate(['/profile/feedback']);
  }
}