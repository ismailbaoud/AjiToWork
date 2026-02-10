import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {


  baseUrl = 'http://localhost:5000/users'

  constructor(private http: HttpClient, private router: Router) { }

  register(user: User) {
    return this.http.post(this.baseUrl, user);
  }

  login(email: string) {
    const params = new HttpParams().set('email', email);
    const user = this.http.get<User[]>(this.baseUrl, { params });
    localStorage.setItem('authenticated', JSON.stringify(true));
    return user;
  }


  public isLoged() : boolean{
    if(localStorage.getItem('authenticated')) {
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem('authenticated');
    this.router.navigate(['/auth/login']);
  }
  
}

