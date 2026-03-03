import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProfileService, userProfileInfo } from '../../services/profile.service';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  standalone: false
})
export class EditProfileModalComponent {
  @Input() user: userProfileInfo | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ name: string; image: File | null }>();

  newName: string = '';
  previewImage: string | null = null;
  selectedFile: File | null = null;
  isClosing = false;

  constructor() {}

  ngOnInit() {
    if (this.user) {
      this.newName = this.user.name;
      this.previewImage = this.user.avatar || 'assets/images/mascots/neutral.svg';
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => (this.previewImage = e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  closeModal() {
    this.isClosing = true;
    setTimeout(() => {
      this.close.emit();
      this.isClosing = false;
    }, 300); // Wait for slide-down animation
  }

  onSave() {
    this.save.emit({
      name: this.newName,
      image: this.selectedFile
    });
    this.closeModal();
  }
}