import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- Import CommonModule

@Component({
  selector: 'app-button',
  standalone: true, // <--- MUST BE TRUE
  imports: [CommonModule], // <--- MUST INCLUDE CommonModule
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  // ... inputs/outputs ...
  @Input() type: 'primary' | 'secondary' | 'danger' | 'outline' = 'primary';
  @Input() label: string = 'Button';
  @Input() disabled: boolean = false;
  @Input() fullWidth: boolean = true;
  
  @Output() btnClick = new EventEmitter<void>();

  onClick() {
    if (!this.disabled) {
      this.btnClick.emit();
    }
  }
}