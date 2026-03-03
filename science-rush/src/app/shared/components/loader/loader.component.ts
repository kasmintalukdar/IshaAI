import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true, // ✅ Vital for importing into other modules
  imports: [CommonModule], // ✅ Required for *ngIf and [ngClass]
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {
  /**
   * Optional text to display below the spinner
   * Usage: <app-loader message="Analyzing..."></app-loader>
   */
  @Input() message: string = '';

  /**
   * Controls the size of the spinner
   * Usage: <app-loader size="small"></app-loader>
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
}