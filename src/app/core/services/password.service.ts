import { Injectable } from '@angular/core';
import * as bcrypt from 'bcryptjs';

/**
 * Service for password hashing and verification
 *
 * @note In production, password hashing should be done server-side.
 * This implementation is for development with json-server mock backend.
 */
@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  private readonly SALT_ROUNDS = 10;

  constructor() { }

  /**
   * Hash a plain text password
   * @param password Plain text password
   * @returns Promise<string> Hashed password
   *
   * @example
   * const hashed = await this.passwordService.hashPassword('myPassword123');
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param plainPassword Plain text password to verify
   * @param hashedPassword Hashed password to compare against
   * @returns Promise<boolean> True if passwords match, false otherwise
   *
   * @example
   * const isValid = await this.passwordService.verifyPassword('myPassword123', hashedPassword);
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Check if a string is already hashed (bcrypt format)
   * @param password String to check
   * @returns boolean True if string appears to be a bcrypt hash
   */
  isHashed(password: string): boolean {
    // Bcrypt hashes start with $2a$, $2b$, or $2y$
    const bcryptPattern = /^\$2[aby]\$\d{2}\$/;
    return bcryptPattern.test(password);
  }

  /**
   * Validate password strength
   * @param password Password to validate
   * @returns Object with validation result and messages
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a random salt (for advanced use cases)
   * @param rounds Number of salt rounds (default: 10)
   * @returns Promise<string> Generated salt
   */
  async generateSalt(rounds: number = this.SALT_ROUNDS): Promise<string> {
    return await bcrypt.genSalt(rounds);
  }

  /**
   * Get the number of rounds used in a bcrypt hash
   * @param hash Bcrypt hash string
   * @returns number Number of rounds, or 0 if invalid
   */
  getRounds(hash: string): number {
    try {
      return bcrypt.getRounds(hash);
    } catch (error) {
      return 0;
    }
  }
}
