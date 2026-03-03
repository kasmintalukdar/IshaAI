import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- Required

@Component({
  selector: 'app-progress-bar',
  standalone: true, // <--- MUST BE TRUE
  imports: [CommonModule], // <--- MUST INCLUDE CommonModule
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent {
  @Input() value: number = 0;
  @Input() color: string = '#58cc02';
}