import { Component, OnDestroy, signal } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../services/auth.service";
import { UserLogin } from "../../models/user.model";
import { ROUTES } from "../../../../core/constants/routes";
import { NotificationService } from "../../../../core/services/notification.service";

/**
 * Login component for user authentication
 */
@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Create and configure the login form
   */
  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    const credentials: UserLogin = this.loginForm.value;

    this.authService
      .login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.notificationService.success(`Welcome back, ${user.firstName}!`);
          this.router.navigate([ROUTES.HOME]);
        },
        error: (error: string) => {
          this.isLoading.set(false);
          this.handleLoginError(error);
        },
      });
  }

  /**
   * Handle login errors and display appropriate messages
   */
  private handleLoginError(error: string): void {
    if (error.includes("User not found")) {
      this.loginForm.controls["email"].setErrors({ notFound: true });
      this.notificationService.error(
        "No account found with this email address",
      );
    } else if (error.includes("Invalid password")) {
      this.loginForm.controls["password"].setErrors({ invalid: true });
      this.notificationService.error("Incorrect password. Please try again");
    } else {
      this.notificationService.error(error || "Login failed. Please try again");
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  /**
   * Navigate to register page
   */
  navigateToRegister(event: Event): void {
    event.preventDefault();
    this.router.navigate([ROUTES.AUTH.REGISTER]);
  }

  /**
   * Check if a form field has an error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.touched && field.hasError(errorType));
  }

  /**
   * Get error message for a form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (!field || !field.touched || !field.errors) {
      return "";
    }

    if (field.hasError("required")) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (field.hasError("email")) {
      return "Please enter a valid email address";
    }

    if (field.hasError("minLength")) {
      return "Password must be at least 8 characters";
    }

    if (field.hasError("notFound")) {
      return "No account found with this email";
    }

    if (field.hasError("invalid")) {
      return "Incorrect password";
    }

    return "Invalid input";
  }

  /**
   * Get user-friendly field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      email: "Email",
      password: "Password",
    };
    return labels[fieldName] || fieldName;
  }
}
