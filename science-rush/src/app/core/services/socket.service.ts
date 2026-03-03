import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActiveUsersData {
  count: number;
}

export interface NotificationData {
  type: string;
  message: string;
  totalXp?: number;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    // 1. Calculate Base URL (http://localhost:3000)
    const baseUrl = environment.apiUrl.replace('/api/v1', '');

    // 2. Connect WITHOUT manual token
    this.socket = io(baseUrl, {
      transports: ['websocket'],
      withCredentials: true, // <--- Browser automatically sends the 'jwt' cookie
    });
  }

  joinChapter(chapterId: string) {
    this.socket.emit('join_chapter', { chapterId });
  }

  leaveChapter(chapterId: string) {
    this.socket.emit('leave_chapter', { chapterId });
  }

  onActiveUsers(): Observable<ActiveUsersData> {
    return new Observable((observer) => {
      this.socket.on('active_users', (data: ActiveUsersData) => {
        observer.next(data);
      });
    });
  }

  onNotification(): Observable<NotificationData> {
    return new Observable((observer) => {
      this.socket.on('notification', (data: NotificationData) => {
        observer.next(data);
      });
    });
  }

  onMapUpdate(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('map_updated', (data: any) => {
        console.log('⚡ Magic Update Received:', data);
        observer.next(data);
      });
    });
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
}
