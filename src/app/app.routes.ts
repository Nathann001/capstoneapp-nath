import { Routes } from '@angular/router';
import { HomeComponentComponent } from './home-component/home-component.component';
import { CertificateDownloadComponent } from './certficate-download/certficate-download.component';
import { RegisterComponent } from './register/register.component';
import { BirthComponent } from './certificate_types/birth/birth.component';
import { AccountComponent } from './account/account.component';
import { PendingComponent } from './pending/pending.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { OtpVerificationComponent } from './otpverify/otpverify.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { HomeStaffComponent } from './home-staff/home-staff.component';
import { RequestDetailComponent } from './request-detail/request-detail.component';
import { ProcessRequestComponent } from './process-request/process-request.component';
import { AdminComponent } from './admin/admin.component';
import { MyRequestsComponent } from './my-requests/my-requests.component';
import { authGuard } from './auth.guard';
import { ArchivesComponent } from './archives/archives.component';
import { DeathComponent } from './certificate_types/death/death.component';
import { MarriageComponent } from './certificate_types/marriage/marriage.component';

export const routes: Routes = [
    { path: '', component: HomeComponentComponent },
    {
      path: 'login',
      loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    { path: 'approved', component: CertificateDownloadComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'otpverify', component: OtpVerificationComponent },
    { path: 'downloads', component: CertificateDownloadComponent },
    { path: 'birth', component: BirthComponent },
    { path: 'account-settings', component: AccountComponent },
    { path: 'request-detail/:id', component: RequestDetailComponent },
    { path: 'account', component: AccountComponent },
    { path: 'pending', component: PendingComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'admin-users', component: AdminUsersComponent, canActivate: [authGuard] },
    { path: 'edit-profile', component: EditProfileComponent, canActivate: [authGuard] },
    { path: 'home-staff', component: HomeStaffComponent, canActivate: [authGuard] },
    { path: 'process-request/:id', component: ProcessRequestComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
    { path: 'my-requests', component: MyRequestsComponent, canActivate: [authGuard] },
    { path: 'archives', component: ArchivesComponent },
    { path: 'death', component: DeathComponent },
    { path: 'marriage', component: MarriageComponent }
];
