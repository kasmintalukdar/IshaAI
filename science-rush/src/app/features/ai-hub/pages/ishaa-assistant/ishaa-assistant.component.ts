// // // import { Component } from '@angular/core';

// // // @Component({
// // //   selector: 'app-ishaa-assistant',
// // //   imports: [],
// // //   templateUrl: './ishaa-assistant.component.html',
// // //   styleUrl: './ishaa-assistant.component.scss'
// // // })
// // // export class IshaaAssistantComponent {

// // // }


// // import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
// // import { IshaaV2Service } from 'src/app/core/services/ishaa-v2.service';

// // interface ChatMessage {
// //   role: 'user' | 'ishaa';
// //   text: string;
// //   isTyping?: boolean;
// // }

// // @Component({
// //   selector: 'app-ishaa-assistant',
// //   templateUrl: './ishaa-assistant.component.html',
// //   styleUrls: ['./ishaa-assistant.component.scss']
// // })
// // export class IshaaAssistantComponent implements OnInit {
// //   @ViewChild('chatContainer') chatContainer!: ElementRef;
  
// //   messages: ChatMessage[] = [
// //     { role: 'ishaa', text: 'Hello! I am Ishaa, your next-generation AI tutor. What shall we explore today?' }
// //   ];
// //   userInput: string = '';
// //   isProcessing: boolean = false;

// //   constructor(private ishaaService: IshaaV2Service) {}

// //   ngOnInit() {
// //     // Optional: Wake up the server
// //     this.ishaaService.checkHealth().subscribe(
// //       res => console.log('Ishaa V2 is Online:', res),
// //       err => console.error('Ishaa V2 is Offline:', err)
// //     );
// //   }

// //   sendMessage() {
// //     if (!this.userInput.trim()) return;

// //     const query = this.userInput;
// //     this.messages.push({ role: 'user', text: query });
// //     this.userInput = '';
// //     this.isProcessing = true;
    
// //     // Add a temporary typing indicator
// //     this.messages.push({ role: 'ishaa', text: '', isTyping: true });
// //     this.scrollToBottom();

// //     // Call your backend
// //     this.ishaaService.askQuestion(query).subscribe({
// //       next: (response) => {
// //         // Remove typing indicator
// //         this.messages.pop(); 
// //         // Assuming your Python backend returns { "answer": "..." }
// //         this.messages.push({ role: 'ishaa', text: response.answer || response.message || JSON.stringify(response) });
// //         this.isProcessing = false;
// //         this.scrollToBottom();
// //       },
// //       error: (err) => {
// //         this.messages.pop();
// //         this.messages.push({ role: 'ishaa', text: 'Oops! My circuits got tangled. Please try again.' });
// //         this.isProcessing = false;
// //         this.scrollToBottom();
// //       }
// //     });
// //   }

// //   scrollToBottom() {
// //     setTimeout(() => {
// //       try {
// //         this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
// //       } catch(err) { }
// //     }, 100);
// //   }
// // }



// import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
// import { IshaaV2Service } from 'src/app/core/services/ishaa-v2.service';

// interface ChatMessage {
//   role: 'user' | 'ishaa';
//   text: string;
//   isTyping?: boolean;
// }

// @Component({
//   selector: 'app-ishaa-assistant',
//   templateUrl: './ishaa-assistant.component.html',
//   styleUrls: ['./ishaa-assistant.component.scss']
// })
// export class IshaaAssistantComponent implements OnInit {

//   @ViewChild('chatContainer') chatContainer!: ElementRef;

//   messages: ChatMessage[] = [
//     {
//       role: 'ishaa',
//       text: 'Hello! I am Ishaa, your next-generation AI tutor. What shall we explore today?'
//     }
//   ];

//   userInput: string = '';
//   isProcessing: boolean = false;

//   constructor(private ishaaService: IshaaV2Service) {}

//   ngOnInit(): void {
//     this.ishaaService.checkHealth().subscribe({
//       next: (res) => console.log('Ishaa V2 Online:', res),
//       error: (err) => console.error('Ishaa V2 Offline:', err)
//     });
//   }

//   sendMessage(): void {
//     if (!this.userInput.trim()) return;

//     const query = this.userInput;

//     this.messages.push({ role: 'user', text: query });
//     this.userInput = '';
//     this.isProcessing = true;

//     this.messages.push({ role: 'ishaa', text: '', isTyping: true });
//     this.scrollToBottom();

//     this.ishaaService.askQuestion(query).subscribe({
//       next: (response: any) => {
//         this.messages.pop();
//         this.messages.push({
//           role: 'ishaa',
//           text: response.answer || response.message || 'No response received.'
//         });
//         this.isProcessing = false;
//         this.scrollToBottom();
//       },
//       error: () => {
//         this.messages.pop();
//         this.messages.push({
//           role: 'ishaa',
//           text: 'Oops! My circuits got tangled. Please try again.'
//         });
//         this.isProcessing = false;
//         this.scrollToBottom();
//       }
//     });
//   }

//   scrollToBottom(): void {
//     setTimeout(() => {
//       if (this.chatContainer) {
//         this.chatContainer.nativeElement.scrollTop =
//           this.chatContainer.nativeElement.scrollHeight;
//       }
//     }, 100);
//   }
// }


import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IshaaV2Service } from 'src/app/core/services/ishaa-v2.service';

interface ChatMessage {
  role: 'user' | 'ishaa';
  text: string;
  isTyping?: boolean;
}

@Component({
  selector: 'app-ishaa-assistant',
  standalone: true, // <-- This allows us to import modules directly into the component
  imports: [CommonModule, FormsModule], // <-- Fixes *ngFor, *ngIf, ngClass, and ngModel errors
  templateUrl: './ishaa-assistant.component.html',
  styleUrls: ['./ishaa-assistant.component.scss']
})
export class IshaaAssistantComponent implements OnInit {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  
  messages: ChatMessage[] = [
    { role: 'ishaa', text: 'Hello! I am Ishaa, your next-generation AI tutor. What shall we explore today?' }
  ];
  userInput: string = '';
  isProcessing: boolean = false;

  constructor(private ishaaService: IshaaV2Service) {}

  ngOnInit() {
    this.ishaaService.checkHealth().subscribe(
      res => console.log('Ishaa V2 is Online:', res),
      err => console.error('Ishaa V2 is Offline:', err)
    );
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const query = this.userInput;
    this.messages.push({ role: 'user', text: query });
    this.userInput = '';
    this.isProcessing = true;
    
    // Add a temporary typing indicator
    this.messages.push({ role: 'ishaa', text: '', isTyping: true });
    this.scrollToBottom();

    // Pass the all-zeroes ID first, then the user's message!
this.ishaaService.askQuestion("000000000000000000000000", query).subscribe({
      next: (response) => {
        // Remove typing indicator
        this.messages.pop(); 
        
        // Handle different possible backend response formats gracefully
        const aiText = response.answer || response.message || response.reply || JSON.stringify(response);
        this.messages.push({ role: 'ishaa', text: aiText });
        
        this.isProcessing = false;
        this.scrollToBottom();
      },
      error: (err) => {
        this.messages.pop();
        this.messages.push({ role: 'ishaa', text: 'Oops! My circuits got tangled. Please try again.' });
        this.isProcessing = false;
        this.scrollToBottom();
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      try {
        if (this.chatContainer) {
          this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
        }
      } catch(err) { }
    }, 100);
  }
}