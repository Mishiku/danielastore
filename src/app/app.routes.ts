import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from './auth.service';
import { AdminComponent } from './admin.component';
import { HomeComponent } from './home.component';
import { LoginComponent } from './login.component';
import { CheckoutComponent } from './checkout.component';

const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAdmin ? true : inject(Router).createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];
