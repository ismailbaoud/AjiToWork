import { Routes } from "@angular/router";
import { RegisterComponent } from "./features/auth/components/register/register.component";
import { LoginComponent } from "./features/auth/components/login/login.component";
import { LandingPageComponent } from "./features/landing/components/landing-page/landing-page.component";
import { ProfileEditComponent } from "./features/profile/components/profile-edit/profile-edit.component";
import { ChangePasswordComponent } from "./features/profile/components/change-password/change-password.component";
import { DeleteAccountComponent } from "./features/profile/components/delete-account/delete-account.component";
import { JobDetailsComponent } from "./features/jobs/components/job-details/job-details.component";
import { ApplicationsListComponent } from "./features/applications/components/applications-list/applications-list.component";
import { FavoritesListComponent } from "./features/favorites/components/favorites-list/favorites-list.component";
import { guestGuard } from "./core/guards/guest.guard";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  { path: "", component: LandingPageComponent },
  {
    path: "auth",
    canActivateChild: [guestGuard],
    children: [
      { path: "login", component: LoginComponent },
      { path: "register", component: RegisterComponent },
    ],
  },
  {
    path: "profile",
    canActivateChild: [authGuard],
    children: [
      { path: "edit", component: ProfileEditComponent },
      { path: "change-password", component: ChangePasswordComponent },
      { path: "delete-account", component: DeleteAccountComponent },
    ],
  },
  {
    path: "jobs",
    children: [{ path: ":id", component: JobDetailsComponent }],
  },
  {
    path: "applications",
    component: ApplicationsListComponent,
    canActivate: [authGuard],
  },
  {
    path: "favorites",
    component: FavoritesListComponent,
    canActivate: [authGuard],
  },
];
