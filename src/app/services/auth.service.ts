import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';

export interface User {
  id?: number;
  contact?: string;
  phone?: string;
  password: string;
  role: number;
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
  private apiUrl = 'http://localhost:4000/api/auth';
  private getAuthHeaders(): HttpHeaders | undefined {
  const token = localStorage.getItem('token');
  if (token) {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
  return undefined;
}

  constructor(private http: HttpClient) {}

    verifyOtp(data: { email?: string; phone?: string; otp: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-otp`, data)
      .pipe(catchError(this.handleError));
  }

  resendOtp(contact: string) {
  const payload = contact.includes('@') ? { email: contact } : { phone: contact };
  return this.http.post<any>(`${this.apiUrl}/resend-otp`, payload)
    .pipe(catchError(this.handleError));
}



  register(data: { contact: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  login(data: { contact: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMsg = 'An unknown error occurred!';
    if (error.error && error.error.message) {
      errorMsg = error.error.message;
    }
    return throwError(() => new Error(errorMsg));
  }

  getMyRequests(): Observable<any> {
  return this.http.get('http://localhost:4000/api/my/requests', {
    headers: this.getAuthHeaders()
  }).pipe(
    catchError(this.handleError)
  );
}

getRequestHistory(requestId: number) {
  return this.http.get<any[]>(`http://localhost:4000/api/my/requests/${requestId}/history`, {
    headers: this.getAuthHeaders()
  }).pipe(catchError(this.handleError));
}

downloadRequestFile(requestId: number) {
  return this.http.get(`http://localhost:4000/api/my/requests/${requestId}/download`, {
    headers: this.getAuthHeaders(),
    responseType: 'blob'
  }).pipe(catchError(this.handleError));
}


}

