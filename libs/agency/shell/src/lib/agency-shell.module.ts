import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { agencyShellRoutes } from './shell.routes';

@NgModule({
  exports: [RouterModule],
  imports: [CommonModule, RouterModule.forRoot(agencyShellRoutes, { initialNavigation: 'enabledBlocking' })],
})
export class AgencyShellModule {}
