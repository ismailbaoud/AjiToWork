import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../../features/auth/services/auth.service";
import { ROUTES } from "../constants/routes";

/**
 * Guest guard to protect auth routes from authenticated users
 * Redirects to home page if user is already authenticated
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    router.navigate([ROUTES.HOME]);
    return false;
  }

  return true;
};
