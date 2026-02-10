import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.min(8)]]
    })
  }

  onSubmit() {
    const { email, password } = this.loginForm.value;

    this.authService.login(email).subscribe({
      next: (users) => {
        console.log(users);
        
        if (!users || users.length === 0) {
          this.loginForm.controls['email'].setErrors({ notFound: true });
          return;
        }

        const user = users[0];

        if (user.password === password) {
          this.router.navigate(['/']);

        } else {
          this.loginForm.controls['password'].setErrors({ invalid: true });
        }
      },
      error: (err) => console.error(err)
    });
  }

  registerRedirect(event: Event) {
    event.preventDefault();
    this.router.navigate(['/auth/register'])
  }

  showPassword: boolean = false;
  togglePasswordVisibility() {
    if (this.showPassword) {
      this.showPassword = false;
    } else {
      this.showPassword = true;
    }
  }
  isLoading: boolean = false;
}
