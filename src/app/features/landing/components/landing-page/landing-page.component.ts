import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { Store } from "@ngrx/store";
import { AuthService } from "../../../auth/services/auth.service";
import { AuthUser } from "../../../auth/models/user.model";
import { ROUTES } from "../../../../core/constants/routes";
import { JobService } from "../../../jobs/services/job.service";
import {
  Job,
  JobSearchFilters,
  JobWithUserData,
  JobSearchResponse,
} from "../../../jobs/models/job.model";
import { JobCardComponent } from "../../../jobs/components/job-card/job-card.component";
import { NotificationService } from "../../../../core/services/notification.service";
import * as FavoritesActions from "../../../favorites/store/favorites.actions";

/**
 * Landing page component - main homepage of the application
 */
@Component({
  selector: "app-landing-page",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, JobCardComponent],
  templateUrl: "./landing-page.component.html",
  styleUrl: "./landing-page.component.css",
})
export class LandingPageComponent implements OnInit, OnDestroy {
  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = signal<boolean>(false);

  // Jobs state
  jobs = signal<JobWithUserData[]>([]);
  isLoadingJobs = signal<boolean>(false);
  currentFilters = signal<JobSearchFilters>({});
  totalJobs = signal<number>(0);

  // Pagination state
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  itemsPerPage = 12;

  // Featured jobs
  featuredJobs = signal<Job[]>([]);

  // Categories with dynamic job counts
  categories = signal<any[]>([]);

  // Math for template
  Math = Math;

  // Hero search filters
  heroKeyword = "";
  heroLocation = "";
  heroJobType: string = "";
  heroExperience: string = "";
  heroRemote: boolean | undefined = undefined;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private jobService: JobService,
    private notificationService: NotificationService,
    private store: Store,
  ) {
    this.initializeAuthState();
  }

  ngOnInit(): void {
    this.loadJobs({}, 1);
    this.loadFeaturedJobs();
    this.loadCategories();
    // Load favorites into store
    if (this.isAuthenticated()) {
      this.store.dispatch(FavoritesActions.loadFavorites());
    }
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
        // Load favorites when user logs in
        if (isAuth) {
          this.store.dispatch(FavoritesActions.loadFavorites());
        }
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
   * Navigate to profile page
   */
  navigateToProfile(): void {
    this.router.navigate(["/profile/edit"]);
  }

  /**
   * Handle job search from search component
   */
  onSearch(filters: JobSearchFilters): void {
    this.currentFilters.set(filters);
    this.currentPage.set(1); // Reset to first page on new search
    this.loadJobs(filters, 1);
  }

  /**
   * Clear search filters
   */
  onClearFilters(): void {
    this.currentFilters.set({});
    this.currentPage.set(1);
    this.loadJobs({}, 1);
  }

  /**
   * Load jobs with filters and pagination
   */
  private loadJobs(filters: JobSearchFilters, page: number = 1): void {
    this.isLoadingJobs.set(true);

    this.jobService
      .searchJobs({ ...filters, limit: this.itemsPerPage, page })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JobSearchResponse) => {
          const enrichedJobs = response.jobs.map((job) => ({
            ...job,
            isSaved: this.jobService.isJobSaved(job.id),
            hasApplied: this.jobService.hasAppliedToJob(job.id),
          }));
          this.jobs.set(enrichedJobs);
          this.totalJobs.set(response.total);
          this.totalPages.set(response.totalPages);
          this.currentPage.set(response.page);
          this.isLoadingJobs.set(false);

          // Scroll to results section
          this.scrollToResults();
        },
        error: (error) => {
          console.error("Error loading jobs:", error);
          this.notificationService.showError(
            "Failed to load jobs. Please try again.",
          );
          this.isLoadingJobs.set(false);
        },
      });
  }

  /**
   * Load featured jobs
   */
  private loadFeaturedJobs(): void {
    this.jobService
      .searchJobs({ limit: 20 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const featured = response.jobs
            .filter((job) => job.isFeatured)
            .slice(0, 6);
          this.featuredJobs.set(featured);
        },
        error: (error) => {
          console.error("Error loading featured jobs:", error);
        },
      });
  }

  /**
   * Load categories with dynamic job counts
   */
  private loadCategories(): void {
    this.jobService
      .getAllJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jobs) => {
          // Count jobs per category
          const categoryCounts: { [key: string]: number } = {};
          jobs.forEach((job) => {
            if (job.category) {
              categoryCounts[job.category] =
                (categoryCounts[job.category] || 0) + 1;
            }
          });

          // Create category objects
          const categoryMap: {
            [key: string]: { icon: string; color: string };
          } = {
            Technology: { icon: "code", color: "blue" },
            Design: { icon: "palette", color: "emerald" },
            Marketing: { icon: "campaign", color: "orange" },
            Finance: { icon: "finance_chip", color: "purple" },
            Sales: { icon: "trending_up", color: "green" },
            Engineering: { icon: "engineering", color: "indigo" },
            "Customer Support": { icon: "support_agent", color: "pink" },
            Operations: { icon: "settings", color: "amber" },
          };

          this.categories.set(
            Object.entries(categoryCounts)
              .map(([name, count]) => ({
                name,
                count,
                icon: categoryMap[name]?.icon || "work",
                color: categoryMap[name]?.color || "gray",
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 8),
          );
        },
        error: (error) => {
          console.error("Error loading categories:", error);
        },
      });
  }

  /**
   * Handle save job
   */
  onSaveJob(jobId: string): void {
    if (!this.isAuthenticated()) {
      this.router.navigate([ROUTES.AUTH.LOGIN], {
        queryParams: { returnUrl: "/jobs" },
      });
      return;
    }

    // Dispatch NgRx action to add favorite
    this.store.dispatch(FavoritesActions.addFavorite({ jobId }));
    this.updateJobInList(jobId, { isSaved: true });
  }

  /**
   * Handle unsave job
   */
  onUnsaveJob(jobId: string): void {
    // Dispatch NgRx action to remove favorite
    this.store.dispatch(FavoritesActions.removeFavorite({ jobId }));
    this.updateJobInList(jobId, { isSaved: false });
  }

  /**
   * Handle apply to job
   */
  onApplyToJob(jobId: string): void {
    if (!this.isAuthenticated()) {
      this.router.navigate([ROUTES.AUTH.LOGIN], {
        queryParams: { returnUrl: `/jobs/${jobId}` },
      });
      return;
    }

    // Navigate to job details where they can complete application
    this.router.navigate(["/jobs", jobId]);
  }

  /**
   * Update job in list after action
   */
  private updateJobInList(
    jobId: string,
    updates: Partial<JobWithUserData>,
  ): void {
    const currentJobs = this.jobs();
    const updatedJobs = currentJobs.map((job) =>
      job.id === jobId ? { ...job, ...updates } : job,
    );
    this.jobs.set(updatedJobs);
  }

  /**
   * Quick search from hero section
   */
  quickSearch(keyword?: string, location?: string): void {
    const filters: JobSearchFilters = {};
    if (keyword) filters.keyword = keyword;
    if (location) filters.location = location;
    this.onSearch(filters);
  }

  /**
   * Scroll to results section
   */
  private scrollToResults(): void {
    setTimeout(() => {
      const resultsSection = document.getElementById("job-results");
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }

  /**
   * Hero search with all filters
   */
  heroSearch(): void {
    const filters: JobSearchFilters = {};

    if (this.heroKeyword) {
      filters.keyword = this.heroKeyword;
    }

    if (this.heroLocation) {
      filters.location = this.heroLocation;
    }

    if (this.heroJobType) {
      filters.type = this.heroJobType as any;
    }

    if (this.heroExperience) {
      filters.experience = this.heroExperience as any;
    }

    if (this.heroRemote !== undefined) {
      filters.isRemote = this.heroRemote;
    }

    this.onSearch(filters);
  }

  /**
   * Toggle hero remote filter
   */
  toggleHeroRemote(): void {
    if (this.heroRemote === undefined) {
      this.heroRemote = true;
    } else if (this.heroRemote === true) {
      this.heroRemote = false;
    } else {
      this.heroRemote = undefined;
    }
    this.heroSearch();
  }

  /**
   * Check if hero has any filters
   */
  hasHeroFilters(): boolean {
    return !!(
      this.heroKeyword ||
      this.heroLocation ||
      this.heroJobType ||
      this.heroExperience ||
      this.heroRemote !== undefined
    );
  }

  /**
   * Clear all hero filters
   */
  clearHeroFilters(): void {
    this.heroKeyword = "";
    this.heroLocation = "";
    this.heroJobType = "";
    this.heroExperience = "";
    this.heroRemote = undefined;
    this.onClearFilters();
  }

  /**
   * Navigate to job details page
   */
  navigateToJobDetails(jobId: string): void {
    this.router.navigate(["/jobs", jobId]);
  }

  /**
   * Handle save job from featured section
   */
  onSaveJobFromFeatured(event: Event, jobId: string): void {
    event.stopPropagation();

    if (!this.isAuthenticated()) {
      this.router.navigate([ROUTES.AUTH.LOGIN], {
        queryParams: { returnUrl: `/jobs/${jobId}` },
      });
      return;
    }

    if (this.isJobSavedById(jobId)) {
      this.onUnsaveJob(jobId);
    } else {
      this.onSaveJob(jobId);
    }
  }

  /**
   * Check if job is saved by ID
   */
  isJobSavedById(jobId: string): boolean {
    return this.jobService.isJobSaved(jobId);
  }

  /**
   * Get relative time from date string
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInDays > 30) {
      return date.toLocaleDateString();
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.loadJobs(this.currentFilters(), page);
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Get array of page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();

    if (total <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Add pages around current
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < total - 1) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  }

  /**
   * Search by category
   */
  searchByCategory(category: string): void {
    const filters: JobSearchFilters = { category };
    this.onSearch(filters);
  }
}
