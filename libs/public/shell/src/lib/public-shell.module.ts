import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { UserHasDataGuard } from '@dsg/shared/feature/app-state';
import { publicShellRoutes } from './shell.routes';

@NgModule({
  exports: [BrowserModule, BrowserAnimationsModule, HttpClientModule, RouterModule],
  imports: [CommonModule, RouterModule.forRoot(publicShellRoutes, { initialNavigation: 'enabledBlocking' })],
  providers: [UserHasDataGuard],
})
export class PublicShellModule {}
