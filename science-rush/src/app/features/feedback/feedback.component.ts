import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../profile/services/profile.service'
import { SoundService } from '@core/services/sound.service'; // Assuming you have this from previous context

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent {
  
  rating: number = 0;
  selectedCategory: string = 'general';
  message: string = '';
  isSubmitting = false;
  submitted = false;

  categories = [
    { id: 'general', label: 'General' },
    { id: 'bug', label: 'Bug Report' },
    { id: 'feature', label: 'Feature Request' },
    { id: 'content', label: 'Content Issue' }
  ];

  emojis = [
    { score: 1, icon: '😫', label: 'Terrible' },
    { score: 2, icon: '😕', label: 'Bad' },
    { score: 3, icon: '😐', label: 'Okay' },
    { score: 4, icon: '🙂', label: 'Good' },
    { score: 5, icon: '🤩', label: 'Amazing' }
  ];

  constructor(
    private router: Router, 
    private profileService: ProfileService,
    private sound: SoundService
  ) {}

  goBack() {
    this.sound.play('click');
    this.router.navigate(['/dashboard/profile']);
  }

  setRating(score: number) {
    this.sound.play('click');
    this.rating = score;
  }

  setCategory(id: string) {
    this.selectedCategory = id;
  }

  onSubmit() {
    if (this.rating === 0 || !this.message.trim()) return;

    this.isSubmitting = true;
    this.sound.play('click');

    this.profileService.submitFeedback(this.selectedCategory, this.rating, this.message)
      .subscribe(() => {
        this.sound.play('success');
        this.isSubmitting = false;
        this.submitted = true;
        
        // Auto redirect after success
        setTimeout(() => this.goBack(), 2000);
      });
  }
}