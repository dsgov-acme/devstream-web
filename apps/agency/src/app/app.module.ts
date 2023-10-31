import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AgencyShellModule } from '@dsg/agency/shell';
import { SharedFeatureAuthenticationModule } from '@dsg/shared/feature/authentication';
import { SharedUtilsEnvironmentModule } from '@dsg/shared/utils/environment';
import { SharedUtilsLoggingModule } from '@dsg/shared/utils/logging';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatSnackBarModule,
    AgencyShellModule,
    SharedUtilsEnvironmentModule.forRoot(environment),
    SharedUtilsLoggingModule.useConsoleLoggingAdapter(),
    SharedFeatureAuthenticationModule.useFirebaseAuthenticationAdapter(environment),
    AngularFireModule.initializeApp(environment.authenticationConfiguration.firebaseConfiguration.firebase),
  ],
})
export class AppModule {}
