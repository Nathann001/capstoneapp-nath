import { Routes } from '@angular/router';
import { HomeComponentComponent } from './home-component/home-component.component';
import { CertificateComponent } from './certificate/certificate.component';
import { CertificateDownloadComponent } from './certficate-download/certficate-download.component';
import { RegisterComponent } from './register/register.component';
import { EmpYearComponent } from './certificate_types/emp-year/emp-year.component';
import { AccountComponent } from './account/account.component';
import { AttendanceComponent } from './certificate_types/attendance/attendance.component';
import { PeerAwardComponent } from './certificate_types/peer-award/peer-award.component';
import { VibesAwardComponent } from './certificate_types/vibes-award/vibes-award.component';
import { PunctualityComponent } from './certificate_types/punctuality/punctuality.component';
import { ExemplaryComponent } from './certificate_types/exemplary/exemplary.component';
import { InitiativeComponent } from './certificate_types/initiative/initiative.component';
import { LeadershipComponent } from './certificate_types/leadership/leadership.component';
import { OutstandingComponent } from './certificate_types/outstanding/outstanding.component';
import { CompletionComponent } from './certificate_types/completion/completion.component';
import { ImportComponent } from './certificate_types/import/import.component';
import { GuestSpeakComponent } from './certificate_types/guest-speak/guest-speak.component';
import { InternCocComponent } from './certificate_types/intern-coc/intern-coc.component';
import { PendingComponent } from './pending/pending.component';
import { InternsCertComponent } from './interns-cert/interns-cert.component';
import { BestOjtComponent } from './certificate_types/best-ojt/best-ojt.component';
import { CosSalaryComponent } from './certificate_types/cos-salary/cos-salary.component';
import { CompanyDocsComponent } from './company-docs/company-docs.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { CoeComponent } from './certificate_types/coe/coe.component';
import { AdminComponent } from './admin/admin.component';
import { OtpVerificationComponent } from './otpverify/otpverify.component'
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { HomeStaffComponent } from './home-staff/home-staff.component';

export const routes: Routes = [
    { path: 'certificates', component: CertificateComponent },
    { path: '', component: HomeComponentComponent },
    {
      path: 'login',
      loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    { path: 'approved', component: CertificateDownloadComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'otpverify', component: OtpVerificationComponent },
    { path: 'downloads', component: CertificateDownloadComponent },
    { path: 'empyear', component: EmpYearComponent },
    { path: 'account-settings', component: AccountComponent },
    { path: 'attendance', component: AttendanceComponent },
    { path: 'peer-award', component: PeerAwardComponent },
    { path: 'vibes-award', component: VibesAwardComponent },
    { path: 'punctuality', component: PunctualityComponent },
    { path: 'exemplary', component: ExemplaryComponent },
    { path: 'initiative', component: InitiativeComponent },
    { path: 'leadership', component: LeadershipComponent },
    { path: 'outstanding', component: OutstandingComponent },
    { path: 'completion', component: CompletionComponent },
    { path: 'import', component: ImportComponent },
    { path: 'guest-speak', component: GuestSpeakComponent },
    { path: 'intern-coc', component: InternCocComponent },
    { path: 'account', component: AccountComponent },
    { path: 'pending', component: PendingComponent },
    { path: 'intern-certs', component: InternsCertComponent },
    { path: 'best-projects', component: BestOjtComponent },
    { path: 'cos-salary', component: CosSalaryComponent },
    { path: 'company-documents', component: CompanyDocsComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'coe-with-salary', component: CoeComponent },
    { path: 'admin', component: AdminComponent },
    { path: 'edit-profile', component: EditProfileComponent },
    { path: 'home-staff', component: HomeStaffComponent}
];
