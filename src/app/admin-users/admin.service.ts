import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';



export interface User {
  id: number;
  email: string;
  full_name?: string;
  address?: string;
  contact_no?: string;
  role: number;
  created_at?: string;
}



@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:4000/api/admin';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // make sure token is stored after login
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, { headers: this.getAuthHeaders() });
  }

  createUser(data: { email: string; password: string; role: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-user`, data, { headers: this.getAuthHeaders() });
  }

updateUser(id: number, data: any) {
  return this.http.put(`${this.apiUrl}/users/${id}`, data, { headers: this.getAuthHeaders() });
}

// AdminService
updateUserPassword(userId: number, newPassword: string) {
  const token = localStorage.getItem('token');
  return this.http.put(
    `${this.apiUrl}/users/${userId}/password`,
    { newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}


  deleteUser(id: number) {
  return this.http.delete(`${this.apiUrl}/users/${id}`, { headers: this.getAuthHeaders() });
}

}
