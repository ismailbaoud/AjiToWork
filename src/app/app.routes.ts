import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { LandingPageComponent } from './features/landingPage/components/landing-page/landing-page.component';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
    { path: '' , component: LandingPageComponent},
    { path: 'auth' , canActivateChild: [guestGuard],
        children : [
            {path: 'login', component: LoginComponent},
            {path: 'register', component: RegisterComponent}
        ]
    },
];
