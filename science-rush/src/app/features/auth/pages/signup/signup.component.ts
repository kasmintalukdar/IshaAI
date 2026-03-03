// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { AuthService } from '@core/services/auth.service';
// import { ButtonComponent } from '@shared/components/button/button.component';
// import { MascotComponent } from '@shared/components/mascot/mascot.component';
// import { PopupComponent } from '@shared/components/popup/popup.component';

// @Component({
//   selector: 'app-signup',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, MascotComponent, PopupComponent],
//   templateUrl: './signup.component.html',
//   styleUrls: ['./signup.component.scss']
// })
// export class SignupComponent {
//   signupForm: FormGroup;
//   isLoading = false;

//   // Popup State
//   popup = {
//     isVisible: false,
//     title: '',
//     message: '',
//     type: 'info' as 'success' | 'error' | 'info'
//   };

//   constructor(
//     private fb: FormBuilder,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     this.signupForm = this.fb.group({
//       fullName: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(6)]],
//       stream: ['Science', Validators.required],
//       district: ['', Validators.required]
//     });
//   }

//  onSignup() {
//     if (this.signupForm.invalid) return;
//     this.isLoading = true;

//     // Use a clean payload object
//     const payload = {
//       ...this.signupForm.value,
//       userId: this.signupForm.value.username // Map username to userId if backend expects it
//     };

//     this.authService.signup(payload).subscribe({
//       // ✅ FIX: Add ': any' type definition
//       next: (res: any) => {
//         this.isLoading = false;
//         this.router.navigate(['/dashboard']);
//       },
//       // ✅ FIX: Add ': any' type definition
//       error: (err: any) => {
//         this.isLoading = false;
//         // safely access error message
//         const msg = err.error?.message || 'Signup failed. Please try again.';
//         this.showPopup('Error', msg, 'error');
//       }
//     });
//   }
//   showPopup(title: string, message: string, type: 'success' | 'error') {
//     this.popup = { isVisible: true, title, message, type };
//   }

//   onPopupClose() {
//     this.popup.isVisible = false;
//     if (this.popup.type === 'success') {
//       this.router.navigate(['/dashboard']);
//     }
//   }
// }



import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { MascotComponent } from '@shared/components/mascot/mascot.component';
import { PopupComponent } from '@shared/components/popup/popup.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, MascotComponent, PopupComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;

  popup = {
    isVisible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      stream: ['Science', Validators.required],
      district: ['', Validators.required]
    });
  }

  onSignup() {
    if (this.signupForm.invalid) return;
    this.isLoading = true;


    // 🟢 FIX THE PAYLOAD
    const formValue = this.signupForm.value;
    
    const payload = {
      name: formValue.fullName, // 👈 Map 'fullName' to 'name' for backend
      email: formValue.email,
      password: formValue.password,
      stream: formValue.stream,
      district: formValue.district,
      // userId: formValue.username // ❌ REMOVE THIS (It was undefined)

    };

    this.authService.signup(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // Show success popup before navigating
        this.showPopup('Success', 'Account created successfully!', 'success');
      },
      error: (err: any) => {
        this.isLoading = false;

        console.error('Signup Error:', err); // Debugging
        const msg = err.error?.message || 'Signup failed. Please try again.';
        this.showPopup('Error', msg, 'error');
      }
    });
  }

  showPopup(title: string, message: string, type: 'success' | 'error') {
    this.popup = { isVisible: true, title, message, type };
  }

  onPopupClose() {
    this.popup.isVisible = false;
    if (this.popup.type === 'success') {
      this.router.navigate(['/dashboard']);
    }
  }
}