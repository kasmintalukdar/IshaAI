import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent {
  @Input() isVisible = false;
  @Input() title = 'Notification';
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() actionLabel = 'OK';
  
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}