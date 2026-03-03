import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- Required for *ngIf

@Component({
  selector: 'app-json-validator',
  standalone: true, // <--- ENABLE STANDALONE
  imports: [CommonModule], // <--- IMPORT MODULES
  template: `
    <div class="drop-zone" 
         (dragover)="onDragOver($event)" 
         (drop)="onDrop($event)"
         [class.valid]="isValid === true"
         [class.invalid]="isValid === false">
      
      <div *ngIf="isValid === null">
        <h3>📂 Drag & Drop Questions JSON</h3>
        <p>or click to upload</p>
        <input type="file" (change)="onFileSelected($event)" accept=".json">
      </div>

      <div *ngIf="isValid === true" class="success-state">
        <h3>✅ Ready to Upload</h3>
        <p>{{ questionCount }} Questions Found</p>
      </div>

      <div *ngIf="isValid === false" class="error-state">
        <h3>⚠️ Invalid File</h3>
        <p>{{ errorMessage }}</p>
        <button (click)="reset()">Try Again</button>
      </div>
    </div>
  `,
  styles: [`
    .drop-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      background: white;
      transition: all 0.3s;
      position: relative;
      cursor: pointer;
      
      &.valid { border-color: #22c55e; background: #f0fdf4; }
      &.invalid { border-color: #ef4444; background: #fef2f2; }
      
      input { position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor: pointer; }
      
      button {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }
    }
    .success-state h3 { color: #16a34a; }
    .error-state h3 { color: #dc2626; }
  `]
})
export class JsonValidatorComponent {
  @Output() fileValid = new EventEmitter<any>();
  
  isValid: boolean | null = null;
  errorMessage = '';
  questionCount = 0;

  onDragOver(e: Event) { e.preventDefault(); }

  onDrop(e: any) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    this.processFile(file);
  }

  onFileSelected(e: any) {
    const file = e.target.files[0];
    this.processFile(file);
  }

  private processFile(file: File) {
    if (file.type !== 'application/json') {
      this.fail('Only JSON files allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const json = JSON.parse(e.target.result);
        this.validateSchema(json);
      } catch (err) {
        this.fail('Invalid JSON syntax');
      }
    };
    reader.readAsText(file);
  }

  private validateSchema(data: any[]) {
    if (!Array.isArray(data)) {
      this.fail('Root must be an array of questions');
      return;
    }

    // Basic validation loop
    for (const [i, q] of data.entries()) {
      if (!q.text || !q.type || !q.difficulty) { // Basic checks
        this.fail(`Question #${i + 1} missing text, type, or difficulty`);
        return;
      }
    }

    // Success!
    this.isValid = true;
    this.questionCount = data.length;
    this.fileValid.emit(data);
  }

  private fail(msg: string) {
    this.isValid = false;
    this.errorMessage = msg;
  }

  reset() {
    this.isValid = null;
    this.errorMessage = '';
  }
}