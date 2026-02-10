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
import { UserRegistration } from "../../models/user.model";
import { ROUTES } from "../../../../core/constants/routes";
import { NotificationService } from "../../../../core/services/notification.service";
import { CustomValidators } from "../../../../core/validators/custom-validators";

/**
 * Register component for user registration
 */
@Component({
  selector: "app-register",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
})
export class RegisterComponent implements OnDestroy {
  registerForm: FormGroup;
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isCheckingEmail = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this.registerForm = this.createRegisterForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Create and configure the register form with validators
   */
  private createRegisterForm(): FormGroup {
    return this.fb.group(
      {
        firstName: [
          "",
          [
            Validators.required,
            CustomValidators.noWhitespace(),
            CustomValidators.validName(),
          ],
        ],
        lastName: [
          "",
          [
            Validators.required,
            CustomValidators.noWhitespace(),
            CustomValidators.validName(),
          ],
        ],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(8)]],
        confirmPassword: ["", [Validators.required]],
      },
      {
        validators: [CustomValidators.passwordMatch()],
      },
    );
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.isLoading()) {
      return;
    }

    this.checkEmailAndRegister();
  }

  /**
   * Check if email exists before registering
   */
  private checkEmailAndRegister(): void {
    const email = this.registerForm.get("email")?.value;

    if (!email) {
      return;
    }

    this.isCheckingEmail.set(true);

    this.authService
      .checkEmailExists(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          this.isCheckingEmail.set(false);

          if (exists) {
            this.registerForm.controls["email"].setErrors({ duplicate: true });
            this.registerForm.markAllAsTouched();
            this.notificationService.error(
              "This email is already registered. Please login instead.",
            );
            return;
          }

          this.register();
        },
        error: (error) => {
          this.isCheckingEmail.set(false);
          this.notificationService.error(
            "Failed to check email. Please try again.",
          );
        },
      });
  }

  /**
   * Register the user
   */
  private register(): void {
    this.isLoading.set(true);

    const userRegistration: UserRegistration = this.registerForm.value;

    this.authService
      .register(userRegistration)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.notificationService.success(
            "Account created successfully! Please login.",
          );
          this.router.navigate([ROUTES.AUTH.LOGIN]);
        },
        error: (error: string) => {
          this.isLoading.set(false);
          this.notificationService.error(
            error || "Registration failed. Please try again.",
          );
        },
      });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(event: Event): void {
    event.preventDefault();
    this.router.navigate([ROUTES.AUTH.LOGIN]);
  }

  /**
   * Check if a form field has an error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.touched && field.hasError(errorType));
  }

  /**
   * Check if form has a specific error
   */
  hasFormError(errorType: string): boolean {
    return !!(
      this.registerForm.touched && this.registerForm.hasError(errorType)
    );
  }

  /**
   * Get error message for a form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

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
      const minLength = field.errors["minLength"].requiredLength;
      return `Password must be at least ${minLength} characters`;
    }

    if (field.hasError("whitespace")) {
      return `${this.getFieldLabel(fieldName)} cannot be empty`;
    }

    if (field.hasError("invalidName")) {
      return `${this.getFieldLabel(fieldName)} can only contain letters, spaces, and hyphens`;
    }

    if (field.hasError("duplicate")) {
      return "This email is already registered";
    }

    if (field.hasError("passwordMismatch")) {
      return "Passwords do not match";
    }

    return "Invalid input";
  }

  /**
   * Get password strength error message
   */
  getPasswordStrengthMessage(): string {
    const field = this.registerForm.get("confirmPassword");

    if (
      field &&
      field.touched &&
      this.registerForm.hasError("passwordMismatch")
    ) {
      return "Passwords do not match";
    }

    return "";
  }

  /**
   * Get user-friendly field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Check if submit button should be disabled
   */
  isSubmitDisabled(): boolean {
    return (
      this.registerForm.invalid || this.isLoading() || this.isCheckingEmail()
    );
  }
}
