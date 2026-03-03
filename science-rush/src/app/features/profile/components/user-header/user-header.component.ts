import { Component, OnInit } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ProfileService, userProfileInfo } from '../../services/profile.service';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.css'],
  standalone: false
})
export class UserHeaderComponent implements OnInit{

  profileInfo$!: Observable<userProfileInfo | null>

  showEditModal = false;

  showSettings = false;

  showLogoutModal = false;

  defaultAvatar = 'assets/images/mascots/happy.svg';
  
  imgLoadError = false;

  constructor(private service: ProfileService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
      this.profileInfo$ = this.service.getUserInfo()
      this.profileInfo$.subscribe(data => console.log(data))
  }

  handleImageError(event: any) {
    // If the image fails to load, force it to the default
    event.target.src = this.defaultAvatar;

    
    
    // Prevent infinite loop if the default image is also missing
    event.target.onerror = null; 
  }

  loadProfile() {
    this.profileInfo$ = this.service.getUserInfo().pipe(
      tap(() => this.imgLoadError = false)
    );
  }

  openEditModal() {
    this.showEditModal = true;
  }

  handleSaveProfile(event: { name: string; image: File | null }) {
    console.log('Uploading...', event);

    this.service.updateProfile(event.name, event.image).subscribe({
      next: (response) => {
        console.log('Success:', response);
        this.showEditModal = false; // Close modal
        this.loadProfile(); // 🔄 Refresh data to show new image instantly

        const currentUser = this.auth.getUser();

        if (currentUser) {
       
          const updatedUser = { ...currentUser };

    
          updatedUser.name = event.name;

          const newAvatar = response?.data?.user?.avatar || response?.data?.avatar || response?.avatar;
          
          if (newAvatar) {

            (updatedUser as any).avatar = newAvatar;
          }

        
          this.auth.updateUserState(updatedUser);
        }


      },
      error: (err) => {
        console.error('Upload Failed', err);

      }
    });

  }

  openSettings() {
    this.showSettings = true;
  }
  

  openEditFromSettings() {
    this.showSettings = false;
    this.openEditModal(); 
  }

  onLogoutClick() {
    this.showLogoutModal = true;
  }

  confirmLogout() {
    this.showLogoutModal = false;
    this.auth.logout();
  }

  cancelLogout() {
    this.showLogoutModal = false;
  }

  goToFeedback() {
    console.log("IJOIJOJOIJ")
    this.router.navigate(['/profile/feedback']);
  }
}
