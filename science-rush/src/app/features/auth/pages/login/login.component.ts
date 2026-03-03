import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { MascotComponent } from '@shared/components/mascot/mascot.component';
import { PopupComponent } from '@shared/components/popup/popup.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonComponent, MascotComponent, PopupComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;

  // Popup State
  popup = {
    isVisible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  };

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.showPopup('Missing Info', 'Please enter both email and password.', 'error');
      return;
    }

    this.isLoading = true;

    this.auth.login(this.loginForm.value).subscribe({
    
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Invalid email or password.';
        this.showPopup('Login Failed', msg, 'error');
      }
    });
  }

  showPopup(title: string, message: string, type: 'success' | 'error') {
    this.popup = { isVisible: true, title, message, type };
  }

  onPopupClose() {
    this.popup.isVisible = false;
  }
}