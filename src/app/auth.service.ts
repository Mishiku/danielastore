import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export type UserRole = 'user' | 'admin';
export interface CurrentUser { id: number; email: string; role: UserRole; }
interface LoginResponse { token: string; user: CurrentUser; }

const apiBaseUrl = `${environment.apiBaseUrl}/api`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userKey = 'daniela_user';
  private readonly tokenKey = 'daniela_token';

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${apiBaseUrl}/auth/login`, { email, password }).pipe(
      tap(({ token, user }) => {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
      })
    );
  }

  get user(): CurrentUser | null {
    const storedUser = localStorage.getItem(this.userKey);
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as CurrentUser;
    } catch {
      this.logout();
      return null;
    }
  }

  get token(): string | null { return localStorage.getItem(this.tokenKey); }
  get isAdmin(): boolean { return this.user?.role === 'admin'; }
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
