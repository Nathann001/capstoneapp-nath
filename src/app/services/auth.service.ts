import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface User {
  id?: number;
  email?: string;
  contact?: string;
  phone?: string;
  password: string;
  role: number;
  detailsCompleted?: boolean;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://drtbackend-2cw3.onrender.com/api/auth';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token ?? ''}`);
  }

  // --- Auth methods ---
 register(data: { contact: string; password: string }): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
    .pipe(catchError(this.handleError));
}
  login(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(catchError(this.handleError));
  }

  verifyOtp(data: { email?: string; phone?: string; otp: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-otp`, data)
      .pipe(catchError(this.handleError));
  }

 resendOtp(contact: string): Observable<any> {
  const payload = contact.includes('@') ? { email: contact } : { phone: contact };

  // ✅ Remove the extra '/api/auth'
  return this.http.post<any>(
    `${this.apiUrl}/resend-otp`,
    payload
  ).pipe(catchError(this.handleError));
}

  // --- User requests ---
  getMyRequests(): Observable<any> {
    const baseUrl = this.apiUrl.replace('/auth', '');
    return this.http.get(`${baseUrl}/my/requests`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  getRequestHistory(requestId: number): Observable<any[]> {
    const baseUrl = this.apiUrl.replace('/auth', '');
    return this.http.get<any[]>(`${baseUrl}/my/requests/${requestId}/history`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  downloadRequestFile(requestId: number): Observable<Blob> {
    const baseUrl = this.apiUrl.replace('/auth', '');
    return this.http.get(`${baseUrl}/my/requests/${requestId}/download`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // --- Error handler ---
  private handleError(error: HttpErrorResponse) {
    const errorMsg = error.error?.message || 'An unknown error occurred!';
    return throwError(() => new Error(errorMsg));
  }
}
