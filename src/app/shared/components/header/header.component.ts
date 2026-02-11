import { Component, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../../features/auth/services/auth.service";
import { AuthUser } from "../../../features/auth/models/user.model";
import { ROUTES } from "../../../core/constants/routes";

/**
 * Shared header component with navigation and authentication state
 */
@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
})
export class HeaderComponent implements OnDestroy {
  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = signal<boolean>(false);
  showUserMenu = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.initializeAuthState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize authentication state from service
   */
  private initializeAuthState(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser.set(user);
      });

    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuth) => {
        this.isAuthenticated.set(isAuth);
      });
  }

  /**
   * Toggle user menu dropdown
   */
  toggleUserMenu(): void {
    this.showUserMenu.update((value) => !value);
  }

  /**
   * Close user menu
   */
  closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  /**
   * Handle user logout
   */
  logout(): void {
    this.authService.logout();
    this.closeUserMenu();
    this.router.navigate([ROUTES.AUTH.LOGIN]);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get current user's first name
   */
  getUserFirstName(): string {
    return this.currentUser()?.firstName || "";
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * Navigate to profile
   */
  navigateToProfile(): void {
    this.closeUserMenu();
    this.router.navigate(["/profile/edit"]);
  }

  /**
   * Navigate to login
   */
  navigateToLogin(): void {
    this.router.navigate([ROUTES.AUTH.LOGIN]);
  }

  /**
   * Navigate to register
   */
  navigateToRegister(): void {
    this.router.navigate([ROUTES.AUTH.REGISTER]);
  }

  /**
   * Navigate to home
   */
  navigateToHome(): void {
    this.router.navigate([ROUTES.HOME]);
  }
}
