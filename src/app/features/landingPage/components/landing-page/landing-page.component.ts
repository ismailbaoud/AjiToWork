import { AuthService } from './../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {

  constructor(private authService:AuthService){}

  searchKeyword: string = '';
  searchLocation: string = '';

  onSearch() {}
  
  logout() {
    this.authService.logout();
  }

  isLoged() :boolean{
    return this.authService.isLoged();
  }
}
