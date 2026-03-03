import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- Required for *ngIf
import { ButtonComponent } from '../../../../shared/components/button/button.component'; // <--- Import Button

@Component({
  selector: 'app-feedback-sheet',
  standalone: true, // <--- Ensure True
  imports: [CommonModule, ButtonComponent], // <--- ADD ButtonComponent HERE
  templateUrl: './feedback-sheet.component.html',
  styleUrls: ['./feedback-sheet.component.scss']
})
export class FeedbackSheetComponent {
  @Input() isCorrect: boolean = false;
  @Input() correctAnswerText: string = '';
  @Input() explanation: string = '';
  
  @Output() nextClick = new EventEmitter<void>();

  onNext() {
    this.nextClick.emit();
  }
}