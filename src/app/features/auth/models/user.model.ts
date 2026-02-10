/**
 * User Models for Authentication
 */

/**
 * Base User interface representing a registered user
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * User registration data transfer object
 */
export interface UserRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * User login credentials
 */
export interface UserLogin {
  email: string;
  password: string;
}

/**
 * Authenticated user data (without sensitive info)
 */
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  user: AuthUser;
  token?: string;
}
