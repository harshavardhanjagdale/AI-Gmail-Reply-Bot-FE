import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface AuthLoginResponse {
  url: string;
}

interface UserProfileResponse {
  name?: string;
  email?: string;
  picture?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERID_KEY = 'userId';

  constructor(private http: HttpClient) {}

  loginWithGoogle(): Observable<void> {
    return this.http.get<AuthLoginResponse>(`${environment.backendUrl}/auth/login`).pipe(
      map(response => response.url),
      tap(url => {
        window.location.href = url;
      }),
      map(() => void 0)
    );
  }

  setUserId(userId: string): void {
    localStorage.setItem(this.USERID_KEY, userId);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USERID_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.USERID_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getUserId();
  }

  getUserProfile(userId: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${environment.backendUrl}/auth/profile/${userId}`);
  }
}
