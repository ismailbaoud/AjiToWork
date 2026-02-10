import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { Observable, throwError, BehaviorSubject, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import {
  User,
  UserLogin,
  UserRegistration,
  AuthUser,
} from "../models/user.model";
import { environment } from "../../../../environments/environment";
import { STORAGE_KEYS } from "../../../core/constants/storage-keys";
import { StorageService } from "../../../core/services/storage.service";

/**
 * Authentication service for managing user authentication state
 */
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}${environment.apiEndpoints.users}`;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
  ) {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from storage on service creation
   */
  private initializeAuthState(): void {
    const isAuthenticated = this.storageService.getItem<boolean>(
      STORAGE_KEYS.AUTHENTICATED,
    );
    const userData = this.storageService.getItem<AuthUser>(
      STORAGE_KEYS.USER_DATA,
    );

    if (isAuthenticated && userData) {
      this.currentUserSubject.next(userData);
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Register a new user
   * @param userRegistration User registration data
   * @returns Observable of created user
   */
  register(userRegistration: UserRegistration): Observable<User> {
    this.isLoading.set(true);

    const user: Omit<User, "id"> = {
      firstName: userRegistration.firstName,
      lastName: userRegistration.lastName,
      email: userRegistration.email,
      password: userRegistration.password,
    };

    return this.http.post<User>(this.baseUrl, user).pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => this.handleError(error));
      }),
    );
  }

  /**
   * Login user with credentials
   * @param credentials User login credentials
   * @returns Observable of authenticated user
   */
  login(credentials: UserLogin): Observable<AuthUser> {
    this.isLoading.set(true);

    const params = new HttpParams().set("email", credentials.email);

    return this.http.get<User[]>(this.baseUrl, { params }).pipe(
      map((users) => {
        if (!users || users.length === 0) {
          throw new Error("User not found");
        }

        const user = users[0];

        if (user.password !== credentials.password) {
          throw new Error("Invalid password");
        }

        const authUser: AuthUser = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        };

        this.setAuthState(authUser);
        this.isLoading.set(false);

        return authUser;
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => this.handleError(error));
      }),
    );
  }

  /**
   * Check if email already exists in the system
   * @param email Email to check
   * @returns Observable<boolean> true if email exists, false otherwise
   */
  checkEmailExists(email: string): Observable<boolean> {
    const params = new HttpParams().set("email", email);

    return this.http.get<User[]>(this.baseUrl, { params }).pipe(
      map((users) => users.length > 0),
      catchError(() => of(false)),
    );
  }

  /**
   * Logout current user and clear auth state
   */
  logout(): void {
    this.clearAuthState();
  }

  /**
   * Check if user is currently logged in
   * @returns true if authenticated, false otherwise
   */
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get current authenticated user
   * @returns Current user or null
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Set authentication state after successful login
   * @param user Authenticated user data
   */
  private setAuthState(user: AuthUser): void {
    this.storageService.setItem(STORAGE_KEYS.AUTHENTICATED, true);
    this.storageService.setItem(STORAGE_KEYS.USER_DATA, user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Clear authentication state on logout
   */
  private clearAuthState(): void {
    this.storageService.removeItem(STORAGE_KEYS.AUTHENTICATED);
    this.storageService.removeItem(STORAGE_KEYS.USER_DATA);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Handle HTTP errors and return user-friendly messages
   * @param error HTTP error
   * @returns Error message string
   */
  private handleError(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (error.error instanceof ErrorEvent) {
      return `Network error: ${error.error.message}`;
    }

    if (error.status === 0) {
      return "Unable to connect to server. Please check your internet connection.";
    }

    if (error.status === 404) {
      return "Service not found. Please try again later.";
    }

    if (error.status >= 500) {
      return "Server error. Please try again later.";
    }

    return "An unexpected error occurred. Please try again.";
  }
}
