import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonValidatorComponent } from '../../../components/json-validator/json-validator.component';


import { AdminService } from '@core/services/admin.service'; 

@Component({
  selector: 'app-chapter-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JsonValidatorComponent],
  templateUrl: './chapter-wizard.component.html',
  styleUrls: ['./chapter-wizard.component.scss']
})
export class ChapterWizardComponent {
  step = 1;
  chapterForm: FormGroup;
  uploadedQuestions: any[] = [];
  isSubmitting = false; 

  
  streams = ['Science', 'Commerce', 'Arts'];
  subjects = ['Physics', 'Chemistry', 'Maths', 'Biology'];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService 
  ) {
    this.chapterForm = this.fb.group({
      stream: ['', Validators.required],
      subjectId: ['', Validators.required], 
      
      name: ['', Validators.required],
      orderIndex: [1, [Validators.required, Validators.min(1)]],
      type: ['NORMAL', Validators.required]
    });
  }

  // ... (nextStep and onJsonValid methods remain the same) ...
  nextStep() {
    if (this.step === 1 && this.chapterForm.valid) this.step++;
    else this.chapterForm.markAllAsTouched();
  }

  onJsonValid(data: any[]) {
    this.uploadedQuestions = data;
    this.step = 3;
  }

  submitChapter() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const payload = {
      metadata: this.chapterForm.value,
      questions: this.uploadedQuestions
    };
    
    console.log(' Sending Payload:', payload);

    //  CALL THE BACKEND
    this.adminService.publishChapter(payload).subscribe({
      next: (res) => {
        console.log(' Success:', res);
        alert('Chapter Published Successfully!');
        this.resetForm();
      },
      error: (err) => {
        console.error(' Error:', err);
        alert(`Failed: ${err.error?.message || 'Server Error'}`);
        this.isSubmitting = false;
      }
    });
  }

  resetForm() {
    this.step = 1;
    this.isSubmitting = false;
    this.chapterForm.reset({ orderIndex: 1, type: 'NORMAL' });
    this.uploadedQuestions = [];
  }
}