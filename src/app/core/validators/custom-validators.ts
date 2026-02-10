import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators for form validation
 */
export class CustomValidators {

  /**
   * Validator to check if password and confirmPassword fields match
   * @returns ValidationErrors if passwords don't match, null otherwise
   */
  static passwordMatch(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');

      if (!password || !confirmPassword) {
        return null;
      }

      if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        confirmPassword.setErrors(null);
        return null;
      }
    };
  }

  /**
   * Validator for password strength
   * Password must contain at least 8 characters, one uppercase, one lowercase, one number
   * @returns ValidationErrors if password is weak, null otherwise
   */
  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasMinLength = value.length >= 8;

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasMinLength;

      if (!passwordValid) {
        return {
          passwordStrength: {
            hasUpperCase,
            hasLowerCase,
            hasNumeric,
            hasMinLength
          }
        };
      }

      return null;
    };
  }

  /**
   * Validator to check if email domain is allowed
   * @param allowedDomains Array of allowed email domains
   * @returns ValidationErrors if domain is not allowed, null otherwise
   */
  static emailDomain(allowedDomains: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value;

      if (!email) {
        return null;
      }

      const domain = email.substring(email.lastIndexOf('@') + 1);

      if (allowedDomains.indexOf(domain.toLowerCase()) === -1) {
        return { emailDomain: { allowedDomains } };
      }

      return null;
    };
  }

  /**
   * Validator to check for whitespace
   * @returns ValidationErrors if value contains only whitespace, null otherwise
   */
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isWhitespace = (control.value || '').trim().length === 0;
      return isWhitespace ? { whitespace: true } : null;
    };
  }

  /**
   * Validator for name fields (only letters, spaces, hyphens)
   * @returns ValidationErrors if name is invalid, null otherwise
   */
  static validName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const namePattern = /^[a-zA-Z\s\-']+$/;

      if (!namePattern.test(value)) {
        return { invalidName: true };
      }

      return null;
    };
  }
}
