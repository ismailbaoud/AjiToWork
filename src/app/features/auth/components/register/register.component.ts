import { Router } from '@angular/router';
import { routes } from './../../../../app.routes';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, signal } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models/user.model';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = ''

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  register() {
    if (!(this.registerForm.controls['password'].value == this.registerForm.controls['confirmPassword'].value)) {
      this.registerForm.markAllAsTouched();
      return;
    }
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    if (this.registerForm.valid) {
      const user: User = this.registerForm.value;
      this.authService.register(user).subscribe({
        next: res => {
          console.log('User registered', res);
          this.router.navigate(['/auth/login'])
        }
        ,
        error: err => console.error(err)
      });
    } else {
      console.warn('Form is invalid');
    }
  }

  checkEmailAndRegister() {
    const email = this.registerForm.controls['email'].value;

    this.authService.login(email).subscribe({
      next: (res) => {
        const existingEmail = res.values().next().value?.email;

        if (existingEmail) {
          this.registerForm.controls['email'].setErrors({ duplicate: true });
          this.registerForm.markAllAsTouched();
          return;
        }


        this.register();
      },
      error: (err) => console.log(err)
    });


  }

  showPassword = false;
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loginRederect(event: Event) {
    event.preventDefault()
    this.router.navigate(['/auth/login'])
  }
}
