import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormRendererComponent, FormTransactionService } from '@dsg/shared/feature/form-nuv';
import {
  INuverialBreadCrumb,
  NuverialBreadcrumbComponent,
  NuverialButtonComponent,
  NuverialIconComponent,
  NuverialSpinnerComponent,
} from '@dsg/shared/ui/nuverial';
import { of, switchMap } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormRendererComponent, NuverialBreadcrumbComponent, NuverialSpinnerComponent, NuverialIconComponent, NuverialButtonComponent],
  selector: 'dsg-confirmation',
  standalone: true,
  styleUrls: ['./confirmation.component.scss'],
  templateUrl: './confirmation.component.html',
})
export class ConfirmationComponent {
  public breadCrumbs: INuverialBreadCrumb[] = [{ label: 'Dashboard', navigationPath: '/dashboard' }];
  public externalTransactionId$ = this._formTransactionService.transaction$.pipe(
    switchMap(transactionModel => {
      return of(transactionModel.externalId);
    }),
  );

  public navigateToDashboard() {
    this._router.navigate(['/dashboard']);
  }

  constructor(private readonly _router: Router, private readonly _formTransactionService: FormTransactionService) {}
}
