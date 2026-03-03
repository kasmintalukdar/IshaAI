import { Component } from '@angular/core';

@Component({
  selector: 'app-user-pro-banner',
  standalone: false,
  templateUrl: './user-pro-banner.component.html',
  styleUrl: './user-pro-banner.component.scss'
})
export class UserProBannerComponent {
  // 1. The Switch
  showUpgradeModal = false;

  // 2. Helper methods
  openModal() {
    this.showUpgradeModal = true;
  }

  closeModal() {
    this.showUpgradeModal = false;
  }
}
