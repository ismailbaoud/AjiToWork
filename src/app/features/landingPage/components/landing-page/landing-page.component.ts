import { Component, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../../auth/services/auth.service";
import { AuthUser } from "../../../auth/models/user.model";
import { ROUTES } from "../../../../core/constants/routes";

/**
 * Landing page component - main homepage of the application
 */
@Component({
  selector: "app-landing-page",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./landing-page.component.html",
  styleUrl: "./landing-page.component.css",
})
export class LandingPageComponent implements OnDestroy {
  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = signal<boolean>(false);

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
   * Handle user logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate([ROUTES.AUTH.LOGIN]);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get current user's first name for display
   */
  getUserFirstName(): string {
    return this.currentUser()?.firstName || "";
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.router.navigate([ROUTES.AUTH.LOGIN]);
  }

  /**
   * Navigate to register page
   */
  navigateToRegister(): void {
    this.router.navigate([ROUTES.AUTH.REGISTER]);
  }

  /**
   * Handle job search submission
   * TODO: Implement job search functionality
   */
  onSearch(keyword?: string, location?: string): void {
    // TODO: Implement search logic
    console.log("Search:", { keyword, location });
  }
}
