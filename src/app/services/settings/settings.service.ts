import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

export interface AppSettings { notificationEmails: string[]; }

const apiBaseUrl = `${environment.apiBaseUrl}/api`;

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private readonly http: HttpClient, private readonly auth: AuthService) {}

  private get headers() { return { Authorization: 'Bearer ' + (this.auth.token ?? '') }; }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${apiBaseUrl}/settings`, { headers: this.headers });
  }

  updateSettings(notificationEmails: string[]): Observable<AppSettings> {
    return this.http.put<AppSettings>(`${apiBaseUrl}/settings`, { notificationEmails }, { headers: this.headers });
  }
}
