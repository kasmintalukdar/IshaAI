import { Input, Output, Component, EventEmitter, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';

export interface PremiumPlan {
  _id?: string;
  slug: string;
  name: string;           // DB uses 'name', not 'title'
  subtitle: string;
  price: number;          // DB sends a Number (e.g., 99), not a string
  duration_days: number;  // Needed to calculate 'mo' or 'yr'
  features: string[];
  description?: string;   // DB sends 'description'
  
  // Nested object for style
  style: {
    gradient: string;
  };
}

@Component({
  selector: 'app-premium-promo-card',
  imports: [NgIf, CommonModule],
  templateUrl: './premium-promo-card.component.html',
  styleUrl: './premium-promo-card.component.scss',
  standalone: true
})
export class PremiumPromoCardComponent {

  @Input() plan!: PremiumPlan; 

  @Output() onUpgrade = new EventEmitter<void>();

  
}
